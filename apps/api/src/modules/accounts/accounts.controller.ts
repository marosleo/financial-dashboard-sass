import { Controller, Get, Query } from "@nestjs/common";
import { API_ROUTES } from "../../common/constants/api-routes";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { AccountsService } from "./accounts.service";

@Controller(API_ROUTES.accounts)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.accountsService.list(query);
  }
}
