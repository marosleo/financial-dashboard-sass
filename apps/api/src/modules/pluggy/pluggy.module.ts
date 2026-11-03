import { Module } from "@nestjs/common";
import { InsightsModule } from "../insights/insights.module";
import { PluggyClientService } from "./pluggy-client.service";
import { PluggyController } from "./pluggy.controller";
import { PluggyService } from "./pluggy.service";
import { PluggySyncService } from "./pluggy-sync.service";
import { PluggyWebhookQueueService } from "./pluggy-webhook-queue.service";

@Module({
  imports: [InsightsModule],
  controllers: [PluggyController],
  providers: [
    PluggyClientService,
    PluggySyncService,
    PluggyWebhookQueueService,
    PluggyService,
  ],
})
export class PluggyModule {}
