import { Injectable } from "@nestjs/common";
import type { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { DEMO_USER_EMAIL } from "../../common/demo/demo-user";
import { mapAccount } from "../../common/mappers/financial.mapper";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationQueryDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { email: DEMO_USER_EMAIL },
    });
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
