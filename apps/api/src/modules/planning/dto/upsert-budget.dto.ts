import { Type } from "class-transformer";
import { IsNumber, Max, Min } from "class-validator";

export class UpsertBudgetDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(9999999999)
  monthlyLimit!: number;
}
