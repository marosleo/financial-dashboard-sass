export type ApiHealthResponse = {
  status: "ok";
  timestamp: string;
  uptimeSeconds: number;
};

export type ApiReadinessResponse = {
  status: "ok" | "degraded";
  timestamp: string;
  checks: {
    database: {
      status: "up" | "down";
      latencyMs: number;
    };
    webhookQueue: {
      status: "up" | "degraded" | "unknown";
      pending: number;
      processing: number;
      failed: number;
      oldestPendingSeconds: number | null;
    };
  };
};
