import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { AuthContextService } from "../../common/auth/auth-context.service";
import { mapTransaction } from "../../common/mappers/financial.mapper";
import { PrismaService } from "../../common/prisma/prisma.service";
import { getMerchantKey } from "../../common/categorization/merchant-key";
import type { UpdateTransactionCategoryDto } from "./dto/update-transaction-category.dto";

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthContextService,
  ) {}

  async list(query: PaginationQueryDto) {
    const user = await this.auth.getUser();
    const hasPluggyAccounts =
      (await this.prisma.account.count({
        where: { userId: user.id, pluggyAccountId: { not: null } },
      })) > 0;

    const where: Prisma.TransactionWhereInput = {
      userId: user.id,
      source: hasPluggyAccounts ? "PLUGGY" : undefined,
      type: query.type,
      categoryId: query.categoryId,
      date:
        query.from || query.to
          ? {
              gte: query.from ? new Date(query.from) : undefined,
              lte: query.to ? endOfDay(query.to) : undefined,
            }
          : undefined,
      ...(query.search
        ? {
            OR: [
              { description: { contains: query.search, mode: "insensitive" } },
              { merchantName: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        include: {
          account: true,
          category: true,
        },
        orderBy: { date: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      items: transactions.map(mapTransaction),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  async listCategories() {
    return this.prisma.category.findMany({
      select: { id: true, name: true, color: true, icon: true },
      orderBy: { name: "asc" },
    });
  }

  async updateCategory(
    transactionId: string,
    input: UpdateTransactionCategoryDto,
  ) {
    const user = await this.auth.getUser();
    const [transaction, category] = await Promise.all([
      this.prisma.transaction.findFirst({
        where: { id: transactionId, userId: user.id },
      }),
      this.prisma.category.findUnique({ where: { id: input.categoryId } }),
    ]);

    if (!transaction) {
      throw new NotFoundException("Transaction not found.");
    }
    if (!category) {
      throw new NotFoundException("Category not found.");
    }

    const merchantLabel =
      transaction.merchantName?.trim() || transaction.description.trim();
    const merchantKey = getMerchantKey(
      transaction.merchantName,
      transaction.description,
    );

    let affectedTransactions = 1;
    let ruleCreated = false;

    if (input.applyToMerchant && merchantKey) {
      const existingRule = await this.prisma.categorizationRule.findUnique({
        where: { userId_merchantKey: { userId: user.id, merchantKey } },
      });
      const matches = transaction.merchantName
        ? {
            merchantName: {
              equals: transaction.merchantName,
              mode: "insensitive" as const,
            },
          }
        : {
            description: {
              equals: transaction.description,
              mode: "insensitive" as const,
            },
          };

      const [, updated] = await this.prisma.$transaction([
        this.prisma.categorizationRule.upsert({
          where: { userId_merchantKey: { userId: user.id, merchantKey } },
          create: {
            userId: user.id,
            categoryId: category.id,
            merchantKey,
            merchantLabel,
          },
          update: { categoryId: category.id, merchantLabel },
        }),
        this.prisma.transaction.updateMany({
          where: { userId: user.id, ...matches },
          data: {
            categoryId: category.id,
            categorySource: "RULE",
            categoryConfidence: 1,
          },
        }),
      ]);
      affectedTransactions = updated.count;
      ruleCreated = !existingRule;
    }

    const saved = await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        categoryId: category.id,
        categorySource: "USER",
        categoryConfidence: 1,
      },
      include: { account: true, category: true },
    });

    return {
      transaction: mapTransaction(saved),
      affectedTransactions,
      ruleCreated,
    };
  }

  status() {
    return {
      module: "transactions" as const,
      status: "ok",
    };
  }
}

function endOfDay(value: string) {
  const date = new Date(value);
  date.setUTCHours(23, 59, 59, 999);
  return date;
}
