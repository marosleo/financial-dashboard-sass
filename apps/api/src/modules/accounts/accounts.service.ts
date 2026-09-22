import { Injectable } from "@nestjs/common";
import type { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { AuthContextService } from "../../common/auth/auth-context.service";
import { mapAccount } from "../../common/mappers/financial.mapper";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthContextService,
  ) {}

  async list(query: PaginationQueryDto) {
    const user = await this.auth.getUser();
    const hasPluggyAccounts =
      (await this.prisma.account.count({
        where: { userId: user.id, pluggyAccountId: { not: null } },
      })) > 0;

    const accounts = await this.prisma.account.findMany({
      where: {
        userId: user.id,
        pluggyAccountId: hasPluggyAccounts ? { not: null } : undefined,
      },
      orderBy: { balance: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });

    return accounts.map(mapAccount);
  }
}
