import {
  BadGatewayException,
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { timingSafeEqual } from "node:crypto";
import type {
  PluggyConnectTokenResponse,
  PluggyDisconnectResponse,
  PluggyIntegrationStatus,
  PluggySyncResult,
  PluggyWebhookResponse,
} from "@financial-dashboard/shared";
import { AuthContextService } from "../../common/auth/auth-context.service";
import { AppConfigService } from "../../config/app-config.service";
import type { PluggyWebhookDto } from "./dto/pluggy-webhook.dto";
import { PluggyClientService } from "./pluggy-client.service";
import { PluggySyncService } from "./pluggy-sync.service";

@Injectable()
export class PluggyService {
  private readonly logger = new Logger(PluggyService.name);

  constructor(
    private readonly auth: AuthContextService,
    private readonly config: AppConfigService,
    private readonly pluggyClient: PluggyClientService,
    private readonly pluggySync: PluggySyncService,
  ) {}

  async getStatus(): Promise<PluggyIntegrationStatus> {
    const user = await this.auth.getUser();

    return {
      configured: this.pluggyClient.isConfigured,
      webhookConfigured: this.pluggyClient.isWebhookConfigured,
      sandboxEnabled: this.config.nodeEnv !== "production",
      connections: await this.pluggySync.listConnections(user.id),
    };
  }

  async createConnectToken(): Promise<PluggyConnectTokenResponse> {
    const user = await this.auth.getUser();
    return this.execute(() => this.pluggyClient.createConnectToken(user.id));
  }

  async createUpdateToken(
    connectionId: string,
  ): Promise<PluggyConnectTokenResponse> {
    const user = await this.auth.getUser();
    const connection = await this.pluggySync.getOwnedConnection(
      user.id,
      connectionId,
    );
    const token = await this.execute(() =>
      this.pluggyClient.createConnectToken(user.id, connection.pluggyItemId),
    );

    return { ...token, itemId: connection.pluggyItemId };
  }

  async syncItem(itemId: string): Promise<PluggySyncResult> {
    const user = await this.auth.getUser();
    return this.execute(() => this.pluggySync.syncItemForUser(itemId, user.id));
  }

  async syncConnection(connectionId: string): Promise<PluggySyncResult> {
    const user = await this.auth.getUser();
    const connection = await this.pluggySync.getOwnedConnection(
      user.id,
      connectionId,
    );

    return this.execute(() =>
      this.pluggySync.syncItemForUser(connection.pluggyItemId, user.id),
    );
  }

  async disconnect(connectionId: string): Promise<PluggyDisconnectResponse> {
    const user = await this.auth.getUser();
    await this.execute(() => this.pluggySync.disconnect(user.id, connectionId));
    return { success: true };
  }

  async acceptWebhook(
    secret: string | undefined,
    payload: PluggyWebhookDto,
  ): Promise<PluggyWebhookResponse> {
    this.verifyWebhookSecret(secret);
    const duplicate = await this.pluggySync.acceptWebhook(payload);
    return { accepted: true, duplicate };
  }

  private verifyWebhookSecret(providedSecret: string | undefined) {
    if (!this.config.isPluggyWebhookConfigured) {
      throw new ServiceUnavailableException(
        "Pluggy webhook is not configured.",
      );
    }

    const expected = Buffer.from(this.config.pluggyWebhookSecret);
    const provided = Buffer.from(providedSecret ?? "");

    if (
      expected.length !== provided.length ||
      !timingSafeEqual(expected, provided)
    ) {
      throw new UnauthorizedException("Invalid Pluggy webhook secret.");
    }
  }

  private async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const message = getPluggyErrorMessage(error);
      this.logger.error(`Pluggy request failed: ${message}`);
      throw new BadGatewayException(message);
    }
  }
}

function getPluggyErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "statusCode" in error.response &&
    error.response.statusCode === 401
  ) {
    return "Pluggy rejected the configured client credentials.";
  }

  return error instanceof Error
    ? error.message
    : "Pluggy could not complete the request.";
}
