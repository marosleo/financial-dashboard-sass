import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import type {
  Account,
  Item,
  Transaction,
  TransactionCursorFilters,
} from "pluggy-sdk";
import { PluggyClient } from "pluggy-sdk";
import { AppConfigService } from "../../config/app-config.service";

const webhookSecretHeader = "x-pluggy-webhook-secret";

@Injectable()
export class PluggyClientService {
  private client: PluggyClient | null = null;
  private webhookRegistration: Promise<void> | null = null;

  constructor(private readonly config: AppConfigService) {}

  get isConfigured() {
    return this.config.isPluggyConfigured;
  }

  get isWebhookConfigured() {
    return this.config.isPluggyWebhookConfigured;
  }

  async createConnectToken(userId: string, itemId?: string) {
    await this.ensureWebhook();

    return this.getClient().createConnectToken(itemId, {
      clientUserId: userId,
      avoidDuplicates: itemId ? undefined : true,
    });
  }

  fetchItem(itemId: string): Promise<Item> {
    return this.getClient().fetchItem(itemId);
  }

  async fetchAccounts(itemId: string): Promise<Account[]> {
    const response = await this.getClient().fetchAccounts(itemId);
    return response.results;
  }

  fetchTransactions(
    accountId: string,
    options?: Omit<TransactionCursorFilters, "after">,
  ): Promise<Transaction[]> {
    return this.getClient().fetchAllTransactions(accountId, options);
  }

  async deleteItem(itemId: string) {
    try {
      await this.getClient().deleteItem(itemId);
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }
    }
  }

  private getClient() {
    if (!this.config.isPluggyConfigured) {
      throw new ServiceUnavailableException(
        "Pluggy is not configured. Add PLUGGY_CLIENT_ID and PLUGGY_CLIENT_SECRET.",
      );
    }

    this.client ??= new PluggyClient({
      clientId: this.config.pluggyClientId,
      clientSecret: this.config.pluggyClientSecret,
    });

    return this.client;
  }

  private async ensureWebhook() {
    if (!this.config.isPluggyWebhookConfigured) {
      return;
    }

    this.webhookRegistration ??= this.registerWebhook().catch((error) => {
      this.webhookRegistration = null;
      throw error;
    });

    await this.webhookRegistration;
  }

  private async registerWebhook() {
    const client = this.getClient();
    const webhooks = await client.fetchWebhooks();
    const registeredWebhook = webhooks.results.find(
      (webhook) =>
        webhook.event === "all" &&
        webhook.url === this.config.pluggyWebhookUrl &&
        webhook.disabledAt === null,
    );
    const headers = {
      [webhookSecretHeader]: this.config.pluggyWebhookSecret,
    };

    if (registeredWebhook) {
      await client.updateWebhook(registeredWebhook.id, { headers });
    } else {
      await client.createWebhook("all", this.config.pluggyWebhookUrl, headers);
    }
  }
}

function isNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "statusCode" in error.response &&
    error.response.statusCode === 404
  );
}
