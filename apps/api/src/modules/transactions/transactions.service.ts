import { Injectable } from "@nestjs/common";
import type { PaginationQueryDto } from "../../common/dto/pagination-query.dto";

@Injectable()
export class TransactionsService {
  list(query: PaginationQueryDto) {
    return {
      module: "transactions" as const,
      ready: false,
      query,
    };
  }

  status() {
    return {
      module: "transactions" as const,
      status: "ok",
    };
  }
}
