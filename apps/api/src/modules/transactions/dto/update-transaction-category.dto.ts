import { IsBoolean, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateTransactionCategoryDto {
  @IsString()
  @MinLength(1)
  categoryId!: string;

  @IsOptional()
  @IsBoolean()
  applyToMerchant = true;
}
