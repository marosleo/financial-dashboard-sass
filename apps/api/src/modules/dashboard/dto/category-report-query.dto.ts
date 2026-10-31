import { IsOptional, Matches } from "class-validator";

export class CategoryReportQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: "period must use the YYYY-MM format",
  })
  period?: string;
}
