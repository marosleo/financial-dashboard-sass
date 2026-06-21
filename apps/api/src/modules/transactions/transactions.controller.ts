import { Controller, Get, Query } from "@nestjs/common";
import { API_ROUTES } from "../../common/constants/api-routes";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { TransactionsService } from "./transactions.service";

@Controller(API_ROUTES.transactions)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.transactionsService.list(query);
  }

  @Get("status")
  status() {
    return this.transactionsService.status()
  }
}


