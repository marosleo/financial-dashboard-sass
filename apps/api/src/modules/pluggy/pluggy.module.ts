import { Module } from "@nestjs/common";
import { PluggyClientService } from "./pluggy-client.service";
import { PluggyController } from "./pluggy.controller";
import { PluggyService } from "./pluggy.service";
import { PluggySyncService } from "./pluggy-sync.service";

@Module({
  controllers: [PluggyController],
  providers: [PluggyClientService, PluggySyncService, PluggyService],
})
export class PluggyModule {}
