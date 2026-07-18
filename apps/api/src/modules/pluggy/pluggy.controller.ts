import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";
import { API_ROUTES } from "../../common/constants/api-routes";
import { PluggyWebhookDto } from "./dto/pluggy-webhook.dto";
import { PluggyService } from "./pluggy.service";

@Controller(API_ROUTES.pluggy)
export class PluggyController {
  constructor(private readonly pluggyService: PluggyService) {}

  @Get("status")
  getStatus() {
    return this.pluggyService.getStatus();
  }

  @Post("connect-token")
  createConnectToken() {
    return this.pluggyService.createConnectToken();
  }

  @Post("connections/:connectionId/connect-token")
  createUpdateToken(@Param("connectionId") connectionId: string) {
    return this.pluggyService.createUpdateToken(connectionId);
  }

  @Post("items/:itemId/sync")
  syncItem(@Param("itemId", ParseUUIDPipe) itemId: string) {
    return this.pluggyService.syncItem(itemId);
  }

  @Post("connections/:connectionId/sync")
  syncConnection(@Param("connectionId") connectionId: string) {
    return this.pluggyService.syncConnection(connectionId);
  }

  @Delete("connections/:connectionId")
  disconnect(@Param("connectionId") connectionId: string) {
    return this.pluggyService.disconnect(connectionId);
  }

  @Post("webhooks")
  @HttpCode(HttpStatus.ACCEPTED)
  acceptWebhook(
    @Headers("x-pluggy-webhook-secret") secret: string | undefined,
    @Body() payload: PluggyWebhookDto,
  ) {
    return this.pluggyService.acceptWebhook(secret, payload);
  }
}
