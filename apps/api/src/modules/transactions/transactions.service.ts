import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { AuthContextService } from "../../common/auth/auth-context.service";
import { mapTransaction } from "../../common/mappers/financial.mapper";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class TransactionsService {
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

    const where: Prisma.TransactionWhereInput = {
      userId: user.id,
      source: hasPluggyAccounts ? "PLUGGY" : undefined,
      type: query.type,
      categoryId: query.categoryId,
      date:
        query.from || query.to
          ? {
              gte: query.from ? new Date(query.from) : undefined,
              lte: query.to ? endOfDay(query.to) : undefined,
            }
          : undefined,
      ...(query.search
        ? {
            OR: [
              { description: { contains: query.search, mode: "insensitive" } },
              { merchantName: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        include: {
          account: true,
          category: true,
        },
        orderBy: { date: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      items: transactions.map(mapTransaction),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  status() {
    return {
      module: "transactions" as const,
      status: "ok",
    };
  }
}

function endOfDay(value: string) {
  const date = new Date(value);
  date.setUTCHours(23, 59, 59, 999);
  return date;
}
