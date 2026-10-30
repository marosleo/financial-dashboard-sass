import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { API_ROUTES } from "../../common/constants/api-routes";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { TransactionsService } from "./transactions.service";
import { UpdateTransactionCategoryDto } from "./dto/update-transaction-category.dto";

@Controller(API_ROUTES.transactions)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.transactionsService.list(query);
  }

  @Get("categories")
  listCategories() {
    return this.transactionsService.listCategories();
  }

  @Patch(":transactionId/category")
  updateCategory(
    @Param("transactionId") transactionId: string,
    @Body() body: UpdateTransactionCategoryDto,
  ) {
    return this.transactionsService.updateCategory(transactionId, body);
  }

  @Get("status")
  status() {
    return this.transactionsService.status();
  }
}
