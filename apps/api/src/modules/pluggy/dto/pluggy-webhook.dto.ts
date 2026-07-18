import { IsArray, IsIn, IsObject, IsOptional, IsString } from "class-validator";
import { WEBHOOK_EVENTS } from "pluggy-sdk";

export class PluggyWebhookDto {
  @IsString()
  @IsIn(WEBHOOK_EVENTS)
  event!: string;

  @IsString()
  eventId!: string;

  @IsOptional()
  @IsString()
  itemId?: string;

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsString()
  clientUserId?: string;

  @IsOptional()
  @IsString()
  triggeredBy?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  transactionIds?: string[];

  @IsOptional()
  @IsString()
  transactionsCreatedAtFrom?: string;

  @IsOptional()
  @IsString()
  createdTransactionsLink?: string;

  @IsOptional()
  @IsObject()
  error?: Record<string, unknown>;
}
