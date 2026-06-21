import { Injectable } from "@nestjs/common";
import type { PaginationQueryDto } from "../../common/dto/pagination-query.dto";

@Injectable()
export class AccountsService {
  list(query: PaginationQueryDto) {
    return {
      module: "accounts" as const,
      ready: false,
      query,
    };
  }
}

