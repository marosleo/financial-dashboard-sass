import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { PluggyWebhookDto } from "./dto/pluggy-webhook.dto";
import { PluggySyncService } from "./pluggy-sync.service";

export const webhookMaxAttempts = 5;
const workerIntervalMs = 2_000;
const staleLockMs = 2 * 60_000;
const workerBatchSize = 5;

@Injectable()
export class PluggyWebhookQueueService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(PluggyWebhookQueueService.name);
  private timer: ReturnType<typeof setInterval> | undefined;
  private draining = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly pluggySync: PluggySyncService,
  ) {}

  onApplicationBootstrap() {
    this.timer = setInterval(() => void this.drain(), workerIntervalMs);
    this.timer.unref();
    void this.drain();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async accept(payload: PluggyWebhookDto) {
    try {
      await this.prisma.pluggyWebhookEvent.create({
        data: {
          pluggyEventId: payload.eventId,
          event: payload.event,
          itemId: payload.itemId,
          payload: toJson(payload),
        },
      });
      void this.drain();
      return false;
    } catch (error) {
      if (isUniqueConstraintError(error)) return true;
      throw error;
    }
  }

  async drain() {
    if (this.draining) return;
    this.draining = true;
    try {
      const now = new Date();
      const staleBefore = new Date(now.getTime() - staleLockMs);
      const candidates = await this.prisma.pluggyWebhookEvent.findMany({
        where: claimableWhere(now, staleBefore),
        orderBy: { createdAt: "asc" },
        take: workerBatchSize,
        select: { id: true },
      });

      for (const candidate of candidates) {
        const claimed = await this.prisma.pluggyWebhookEvent.updateMany({
          where: { id: candidate.id, ...claimableWhere(now, staleBefore) },
          data: {
            status: "PROCESSING",
            attempts: { increment: 1 },
            lockedAt: now,
            lastAttemptAt: now,
          },
        });
        if (claimed.count === 0) continue;

        const event = await this.prisma.pluggyWebhookEvent.findUniqueOrThrow({
          where: { id: candidate.id },
        });
        await this.process(event);
      }
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          event: "webhook_queue_drain_failed",
          error: getErrorMessage(error),
        }),
      );
    } finally {
      this.draining = false;
    }
  }

  private async process(event: {
    id: string;
    pluggyEventId: string;
    payload: Prisma.JsonValue;
    attempts: number;
  }) {
    try {
      await this.pluggySync.processWebhookPayload(
        event.payload as unknown as PluggyWebhookDto,
      );
      await this.prisma.pluggyWebhookEvent.update({
        where: { id: event.id },
        data: {
          status: "PROCESSED",
          processedAt: new Date(),
          lockedAt: null,
          errorMessage: null,
        },
      });
      this.logger.log(
        JSON.stringify({
          event: "webhook_processed",
          pluggyEventId: event.pluggyEventId,
          attempts: event.attempts,
        }),
      );
    } catch (error) {
      const terminal = event.attempts >= webhookMaxAttempts;
      const message = getErrorMessage(error);
      await this.prisma.pluggyWebhookEvent.update({
        where: { id: event.id },
        data: {
          status: terminal ? "FAILED" : "PENDING",
          nextAttemptAt: new Date(
            Date.now() + webhookRetryDelayMs(event.attempts),
          ),
          lockedAt: null,
          errorMessage: message,
        },
      });
      this.logger.error(
        JSON.stringify({
          event: terminal ? "webhook_dead_lettered" : "webhook_retry_scheduled",
          pluggyEventId: event.pluggyEventId,
          attempts: event.attempts,
          error: message,
        }),
      );
    }
  }
}

export function webhookRetryDelayMs(attempt: number) {
  return Math.min(60_000, 1_000 * 2 ** Math.max(0, attempt - 1));
}

function claimableWhere(now: Date, staleBefore: Date) {
  return {
    attempts: { lt: webhookMaxAttempts },
    OR: [
      { status: "PENDING" as const, nextAttemptAt: { lte: now } },
      { status: "PROCESSING" as const, lockedAt: { lte: staleBefore } },
    ],
  };
}

function toJson(payload: PluggyWebhookDto): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue;
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown Pluggy sync error";
}
