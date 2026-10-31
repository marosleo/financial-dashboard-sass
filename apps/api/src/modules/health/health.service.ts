import { Injectable } from "@nestjs/common";
import type {
  ApiHealthResponse,
  ApiReadinessResponse,
} from "@financial-dashboard/shared";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getStatus(): ApiHealthResponse {
    return {
      status: "ok" as const,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  async getReadiness(): Promise<ApiReadinessResponse> {
    const startedAt = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const databaseLatency = Date.now() - startedAt;
      const [groups, oldestPending] = await Promise.all([
        this.prisma.pluggyWebhookEvent.groupBy({
          by: ["status"],
          where: { status: { in: ["PENDING", "PROCESSING", "FAILED"] } },
          _count: { _all: true },
        }),
        this.prisma.pluggyWebhookEvent.findFirst({
          where: { status: "PENDING" },
          orderBy: { createdAt: "asc" },
          select: { createdAt: true },
        }),
      ]);
      const counts = new Map(
        groups.map((group) => [group.status, group._count._all]),
      );
      const failed = counts.get("FAILED") ?? 0;
      const oldestPendingSeconds = oldestPending
        ? Math.max(
            0,
            Math.round((Date.now() - oldestPending.createdAt.getTime()) / 1000),
          )
        : null;
      const queueDegraded =
        failed > 0 ||
        (oldestPendingSeconds !== null && oldestPendingSeconds > 300);

      return {
        status: queueDegraded ? "degraded" : "ok",
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: "up", latencyMs: databaseLatency },
          webhookQueue: {
            status: queueDegraded ? "degraded" : "up",
            pending: counts.get("PENDING") ?? 0,
            processing: counts.get("PROCESSING") ?? 0,
            failed,
            oldestPendingSeconds,
          },
        },
      };
    } catch {
      return {
        status: "degraded",
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: "down", latencyMs: Date.now() - startedAt },
          webhookQueue: {
            status: "unknown",
            pending: 0,
            processing: 0,
            failed: 0,
            oldestPendingSeconds: null,
          },
        },
      };
    }
  }
}
