import { Injectable } from "@nestjs/common";
import type { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { DEMO_USER_EMAIL } from "../../common/demo/demo-user";
import { mapTransaction } from "../../common/mappers/financial.mapper";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationQueryDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { email: DEMO_USER_EMAIL },
    });
    const hasPluggyAccounts =
      (await this.prisma.account.count({
        where: { userId: user.id, pluggyAccountId: { not: null } },
      })) > 0;

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId: user.id,
        source: hasPluggyAccounts ? "PLUGGY" : undefined,
      },
      include: {
        account: true,
        category: true,
      },
      orderBy: { date: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });

    return transactions.map(mapTransaction);
  }

  status() {
    return {
      module: "transactions" as const,
      status: "ok",
    };
  }
}
