import { Injectable } from "@nestjs/common";
import type {
  CategorySpendingReport,
  DashboardOverview,
} from "@financial-dashboard/shared";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuthContextService } from "../../common/auth/auth-context.service";
import {
  mapAccount,
  mapInsight,
  mapTransaction,
} from "../../common/mappers/financial.mapper";
import {
  buildAvailablePeriods,
  buildMonthlyTrends,
  buildSpendingByCategory,
  getPeriodBounds,
} from "./dashboard-calculator";

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthContextService,
  ) {}

  async getOverview(): Promise<DashboardOverview> {
    const user = await this.auth.getUser();

    const now = new Date();
    const currentMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const nextMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );
    const sixMonthsAgo = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1),
    );
    const hasPluggyAccounts =
      (await this.prisma.account.count({
        where: { userId: user.id, pluggyAccountId: { not: null } },
      })) > 0;
    const accountSource = hasPluggyAccounts
      ? { pluggyAccountId: { not: null } }
      : {};
    const transactionSource = hasPluggyAccounts
      ? { source: "PLUGGY" as const }
      : {};

    const [
      accounts,
      currentMonthTransactions,
      recentTransactions,
      trendTransactions,
      insights,
    ] = await Promise.all([
      this.prisma.account.findMany({
        where: { userId: user.id, ...accountSource },
        orderBy: { balance: "desc" },
      }),
      this.prisma.transaction.findMany({
        where: {
          userId: user.id,
          ...transactionSource,
          status: "POSTED",
          date: {
            gte: currentMonthStart,
            lt: nextMonthStart,
          },
        },
        include: {
          account: true,
          category: true,
        },
        orderBy: { date: "desc" },
      }),
      this.prisma.transaction.findMany({
        where: { userId: user.id, ...transactionSource },
        include: {
          account: true,
          category: true,
        },
        orderBy: { date: "desc" },
        take: 8,
      }),
      this.prisma.transaction.findMany({
        where: {
          userId: user.id,
          ...transactionSource,
          status: "POSTED",
          date: {
            gte: sixMonthsAgo,
          },
        },
        orderBy: { date: "asc" },
      }),
      this.prisma.insight.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
    ]);

    const monthlyIncome = sumByType(currentMonthTransactions, "INCOME");
    const monthlyExpenses = Math.abs(
      sumByType(currentMonthTransactions, "EXPENSE"),
    );

    return {
      totalBalance: accounts.reduce(
        (total, account) => total + account.balance.toNumber(),
        0,
      ),
      monthlyIncome,
      monthlyExpenses,
      monthlyNet: monthlyIncome - monthlyExpenses,
      accounts: accounts.map(mapAccount),
      recentTransactions: recentTransactions.map(mapTransaction),
      spendingByCategory: buildSpendingByCategory(currentMonthTransactions),
      monthlyTrends: buildMonthlyTrends(trendTransactions),
      insights: insights.map(mapInsight),
    };
  }

  async getCategoryReport(period?: string): Promise<CategorySpendingReport> {
    const user = await this.auth.getUser();
    const hasPluggyAccounts =
      (await this.prisma.account.count({
        where: { userId: user.id, pluggyAccountId: { not: null } },
      })) > 0;
    const transactionSource = hasPluggyAccounts
      ? { source: "PLUGGY" as const }
      : {};
    const baseWhere = {
      userId: user.id,
      ...transactionSource,
      status: "POSTED" as const,
      type: "EXPENSE" as const,
    };
    const [earliestExpense, latestExpense] = await Promise.all([
      this.prisma.transaction.findFirst({
        where: baseWhere,
        orderBy: { date: "asc" },
        select: { date: true },
      }),
      this.prisma.transaction.findFirst({
        where: baseWhere,
        orderBy: { date: "desc" },
        select: { date: true },
      }),
    ]);
    const fallbackPeriod = new Date().toISOString().slice(0, 7);
    const selectedPeriod =
      period ?? latestExpense?.date.toISOString().slice(0, 7) ?? fallbackPeriod;
    const { start, end } = getPeriodBounds(selectedPeriod);
    const transactions = await this.prisma.transaction.findMany({
      where: { ...baseWhere, date: { gte: start, lt: end } },
      include: { category: true },
      orderBy: { date: "desc" },
    });
    const availablePeriods = buildAvailablePeriods(
      earliestExpense?.date ?? null,
      latestExpense?.date ?? null,
      fallbackPeriod,
    );

    if (!availablePeriods.includes(selectedPeriod)) {
      availablePeriods.push(selectedPeriod);
      availablePeriods.sort((a, b) => b.localeCompare(a));
    }

    return {
      period: selectedPeriod,
      availablePeriods,
      spendingByCategory: buildSpendingByCategory(transactions),
    };
  }
}

function sumByType(
  transactions: Array<{ amount: { toNumber(): number }; type: string }>,
  type: string,
) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.amount.toNumber(), 0);
}
