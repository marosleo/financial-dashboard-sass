export type PluggyConnectionSummary = {
  id: string;
  institution: string;
  status: string;
  executionStatus: string;
  errorCode: string | null;
  errorMessage: string | null;
  lastSyncedAt: string | null;
  consentExpiresAt: string | null;
  accountsCount: number;
};

export type PluggyIntegrationStatus = {
  configured: boolean;
  webhookConfigured: boolean;
  sandboxEnabled: boolean;
  connections: PluggyConnectionSummary[];
};

export type PluggyConnectTokenResponse = {
  accessToken: string;
  itemId?: string;
};

export type PluggySyncResult = {
  connection: PluggyConnectionSummary;
  accountsSynced: number;
  transactionsSynced: number;
};

export type PluggyDisconnectResponse = {
  success: true;
};

export type PluggyWebhookResponse = {
  accepted: true;
  duplicate: boolean;
};
