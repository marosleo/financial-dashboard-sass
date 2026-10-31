import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  PluggyConnectionSummary,
  PluggySyncResult,
} from "@financial-dashboard/shared";
import type { Item, TransactionCursorFilters } from "pluggy-sdk";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { PluggyWebhookDto } from "./dto/pluggy-webhook.dto";
import { PluggyClientService } from "./pluggy-client.service";
import { getMerchantKey } from "../../common/categorization/merchant-key";
import {
  getCategoryAppearance,
  mapPluggyAccount,
  mapPluggyConnection,
  mapPluggyTransaction,
} from "./pluggy.mapper";

const syncBatchSize = 100;

@Injectable()
export class PluggySyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pluggyClient: PluggyClientService,
  ) {}

  async listConnections(userId: string): Promise<PluggyConnectionSummary[]> {
    const connections = await this.prisma.bankConnection.findMany({
      where: { userId },
      include: { _count: { select: { accounts: true } } },
      orderBy: { createdAt: "desc" },
    });

    return connections.map(mapConnectionSummary);
  }

  async getOwnedConnection(userId: string, connectionId: string) {
    const connection = await this.prisma.bankConnection.findFirst({
      where: { id: connectionId, userId },
    });

    if (!connection) {
      throw new NotFoundException("Bank connection not found.");
    }

    return connection;
  }

  async syncItemForUser(
    itemId: string,
    userId: string,
  ): Promise<PluggySyncResult> {
    const item = await this.pluggyClient.fetchItem(itemId);

    if (item.clientUserId !== userId) {
      throw new ForbiddenException(
        "This Pluggy item does not belong to the current user.",
      );
    }

    return this.syncItem(item, userId);
  }

  async disconnect(userId: string, connectionId: string) {
    const connection = await this.getOwnedConnection(userId, connectionId);
    await this.pluggyClient.deleteItem(connection.pluggyItemId);
    await this.prisma.bankConnection.delete({
      where: { id: connection.id },
    });
  }

  async processWebhookPayload(payload: PluggyWebhookDto) {
    if (payload.event === "item/deleted" && payload.itemId) {
      await this.prisma.bankConnection.deleteMany({
        where: { pluggyItemId: payload.itemId },
      });
      return;
    }

    if (payload.event === "transactions/deleted" && payload.transactionIds) {
      await this.prisma.transaction.deleteMany({
        where: { pluggyTransactionId: { in: payload.transactionIds } },
      });
      return;
    }

    if (
      payload.event === "transactions/updated" &&
      payload.accountId &&
      payload.transactionIds
    ) {
      await this.syncTransactionsByAccount(payload.accountId, {
        ids: payload.transactionIds,
      });
      return;
    }

    if (
      payload.event === "transactions/created" &&
      payload.accountId &&
      payload.transactionsCreatedAtFrom
    ) {
      await this.syncTransactionsByAccount(payload.accountId, {
        createdAtFrom: payload.transactionsCreatedAtFrom,
      });
      return;
    }

    if (!payload.itemId) {
      return;
    }

    const item = await this.pluggyClient.fetchItem(payload.itemId);
    const userId = item.clientUserId;

    if (!userId) {
      throw new Error(`Pluggy item ${item.id} has no clientUserId.`);
    }

    if (payload.event === "item/created" || payload.event === "item/updated") {
      await this.syncItem(item, userId);
      return;
    }

    await this.upsertConnection(item, userId);
  }

  private async syncItem(
    item: Item,
    userId: string,
  ): Promise<PluggySyncResult> {
    await this.assertUserAndItemOwnership(item, userId);
    const connection = await this.upsertConnection(item, userId);

    if (!isItemReady(item)) {
      return {
        connection: await this.getConnectionSummary(connection.id),
        accountsSynced: 0,
        transactionsSynced: 0,
      };
    }

    const pluggyAccounts = await this.pluggyClient.fetchAccounts(item.id);
    let transactionsSynced = 0;

    for (const pluggyAccount of pluggyAccounts) {
      const mappedAccount = mapPluggyAccount(pluggyAccount);
      const existingAccount = await this.prisma.account.findUnique({
        where: { pluggyAccountId: pluggyAccount.id },
      });

      if (existingAccount && existingAccount.userId !== userId) {
        throw new ForbiddenException(
          "A Pluggy account is already associated with another user.",
        );
      }

      const account = await this.prisma.account.upsert({
        where: { pluggyAccountId: pluggyAccount.id },
        create: {
          ...mappedAccount,
          userId,
          bankConnectionId: connection.id,
          institution: item.connector.name,
        },
        update: {
          ...mappedAccount,
          bankConnectionId: connection.id,
          institution: item.connector.name,
        },
      });

      const transactions = await this.pluggyClient.fetchTransactions(
        pluggyAccount.id,
      );
      transactionsSynced += await this.persistTransactions(
        transactions,
        account.id,
        userId,
      );
    }

    await this.prisma.bankConnection.update({
      where: { id: connection.id },
      data: { lastSyncedAt: new Date() },
    });

    return {
      connection: await this.getConnectionSummary(connection.id),
      accountsSynced: pluggyAccounts.length,
      transactionsSynced,
    };
  }

  private async syncTransactionsByAccount(
    pluggyAccountId: string,
    filters: Omit<TransactionCursorFilters, "after">,
  ) {
    const account = await this.prisma.account.findUnique({
      where: { pluggyAccountId },
    });

    if (!account) {
      throw new NotFoundException(
        `Local account for Pluggy account ${pluggyAccountId} was not found.`,
      );
    }

    const transactions = await this.pluggyClient.fetchTransactions(
      pluggyAccountId,
      filters,
    );
    await this.persistTransactions(transactions, account.id, account.userId);

    if (account.bankConnectionId) {
      await this.prisma.bankConnection.update({
        where: { id: account.bankConnectionId },
        data: { lastSyncedAt: new Date() },
      });
    }
  }

  private async persistTransactions(
    transactions: Awaited<ReturnType<PluggyClientService["fetchTransactions"]>>,
    accountId: string,
    userId: string,
  ) {
    const mappedTransactions = transactions.map(mapPluggyTransaction);
    const categoryNames = Array.from(
      new Set(
        mappedTransactions
          .map((transaction) => transaction.categoryName)
          .filter((name): name is string => Boolean(name)),
      ),
    );
    const categoryIds = await this.ensureCategories(categoryNames);
    const merchantKeys = mappedTransactions.map((transaction) =>
      getMerchantKey(transaction.merchantName, transaction.description),
    );
    const pluggyTransactionIds = mappedTransactions.map(
      (transaction) => transaction.pluggyTransactionId,
    );
    const [rules, existingTransactions] = await Promise.all([
      this.prisma.categorizationRule.findMany({
        where: { userId, merchantKey: { in: merchantKeys } },
      }),
      this.prisma.transaction.findMany({
        where: { pluggyTransactionId: { in: pluggyTransactionIds } },
        select: { pluggyTransactionId: true, categorySource: true },
      }),
    ]);
    const rulesByMerchant = new Map(
      rules.map((rule) => [rule.merchantKey, rule]),
    );
    const existingByProviderId = new Map(
      existingTransactions.map((transaction) => [
        transaction.pluggyTransactionId,
        transaction,
      ]),
    );

    const operations = mappedTransactions.map((transaction) => {
      const { categoryName, ...data } = transaction;
      const providerCategoryId = categoryName
        ? (categoryIds.get(categoryName) ?? null)
        : null;
      const merchantKey = getMerchantKey(
        transaction.merchantName,
        transaction.description,
      );
      const rule = rulesByMerchant.get(merchantKey);
      const existing = existingByProviderId.get(
        transaction.pluggyTransactionId,
      );
      const preserveUserChoice = existing?.categorySource === "USER";
      const categoryId = rule?.categoryId ?? providerCategoryId;
      const categorySource = rule ? ("RULE" as const) : ("PROVIDER" as const);
      const categoryConfidence = rule ? 1 : categoryId ? 0.7 : null;

      return this.prisma.transaction.upsert({
        where: { pluggyTransactionId: transaction.pluggyTransactionId },
        create: {
          ...data,
          userId,
          accountId,
          categoryId,
          categorySource,
          categoryConfidence,
          source: "PLUGGY",
        },
        update: {
          ...data,
          accountId,
          categoryId: preserveUserChoice ? undefined : categoryId,
          categorySource: preserveUserChoice ? undefined : categorySource,
          categoryConfidence: preserveUserChoice
            ? undefined
            : categoryConfidence,
          source: "PLUGGY",
        },
      });
    });

    for (let index = 0; index < operations.length; index += syncBatchSize) {
      await this.prisma.$transaction(
        operations.slice(index, index + syncBatchSize),
      );
    }

    return mappedTransactions.length;
  }

  private async ensureCategories(names: string[]) {
    const categories = await this.prisma.category.findMany({
      where: { name: { in: names } },
    });
    const categoryIds = new Map(
      categories.map((category) => [category.name, category.id]),
    );

    for (const name of names) {
      if (categoryIds.has(name)) {
        continue;
      }

      const category = await this.prisma.category.upsert({
        where: { name },
        create: { name, ...getCategoryAppearance(name) },
        update: {},
      });
      categoryIds.set(name, category.id);
    }

    return categoryIds;
  }

  private async assertUserAndItemOwnership(item: Item, userId: string) {
    const [user, existingConnection] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.bankConnection.findUnique({
        where: { pluggyItemId: item.id },
      }),
    ]);

    if (!user) {
      throw new NotFoundException(
        "User associated with Pluggy item not found.",
      );
    }

    if (item.clientUserId !== userId) {
      throw new ForbiddenException(
        "Pluggy item ownership could not be verified.",
      );
    }

    if (existingConnection && existingConnection.userId !== userId) {
      throw new ForbiddenException(
        "Pluggy item is already associated with another user.",
      );
    }
  }

  private upsertConnection(item: Item, userId: string) {
    const data = mapPluggyConnection(item);

    return this.prisma.bankConnection.upsert({
      where: { pluggyItemId: item.id },
      create: { ...data, userId },
      update: data,
    });
  }

  private async getConnectionSummary(connectionId: string) {
    const connection = await this.prisma.bankConnection.findUniqueOrThrow({
      where: { id: connectionId },
      include: { _count: { select: { accounts: true } } },
    });

    return mapConnectionSummary(connection);
  }
}

function isItemReady(item: Item) {
  return (
    item.status === "UPDATED" ||
    item.executionStatus === "SUCCESS" ||
    item.executionStatus === "PARTIAL_SUCCESS"
  );
}

function mapConnectionSummary(connection: {
  id: string;
  institution: string;
  status: string;
  executionStatus: string;
  errorCode: string | null;
  errorMessage: string | null;
  lastSyncedAt: Date | null;
  consentExpiresAt: Date | null;
  _count: { accounts: number };
}): PluggyConnectionSummary {
  return {
    id: connection.id,
    institution: connection.institution,
    status: connection.status,
    executionStatus: connection.executionStatus,
    errorCode: connection.errorCode,
    errorMessage: connection.errorMessage,
    lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null,
    consentExpiresAt: connection.consentExpiresAt?.toISOString() ?? null,
    accountsCount: connection._count.accounts,
  };
}
