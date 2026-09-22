import { Injectable } from "@nestjs/common";
import type {
  DashboardOverview,
  MonthlyTrend,
  SpendingByCategory,
} from "@financial-dashboard/shared";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuthContextService } from "../../common/auth/auth-context.service";
import {
  mapAccount,
  mapInsight,
  mapTransaction,
} from "../../common/mappers/financial.mapper";

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
}

function sumByType(
  transactions: Array<{ amount: { toNumber(): number }; type: string }>,
  type: string,
) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.amount.toNumber(), 0);
}

function buildSpendingByCategory(
  transactions: Array<{
    amount: { toNumber(): number };
    type: string;
    category: { id: string; name: string; color: string } | null;
  }>,
): SpendingByCategory[] {
  const expenses = transactions.filter(
    (transaction) => transaction.type === "EXPENSE",
  );
  const total = Math.abs(
    expenses.reduce(
      (sum, transaction) => sum + transaction.amount.toNumber(),
      0,
    ),
  );
  const grouped = new Map<string, SpendingByCategory>();

  for (const transaction of expenses) {
    const category = transaction.category;
    const categoryId = category?.id ?? "uncategorized";
    const current = grouped.get(categoryId) ?? {
      categoryId,
      categoryName: category?.name ?? "Uncategorized",
      color: category?.color ?? "#78716c",
      amount: 0,
      percentage: 0,
    };

    current.amount += Math.abs(transaction.amount.toNumber());
    grouped.set(categoryId, current);
  }

  return Array.from(grouped.values())
    .map((category) => ({
      ...category,
      amount: Number(category.amount.toFixed(2)),
      percentage:
        total > 0 ? Number(((category.amount / total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function buildMonthlyTrends(
  transactions: Array<{
    amount: { toNumber(): number };
    type: string;
    date: Date;
  }>,
): MonthlyTrend[] {
  const grouped = new Map<string, MonthlyTrend>();

  for (const transaction of transactions) {
    const month = transaction.date.toISOString().slice(0, 7);
    const current = grouped.get(month) ?? {
      month,
      income: 0,
      expenses: 0,
      net: 0,
    };

    const amount = transaction.amount.toNumber();
    if (transaction.type === "INCOME") {
      current.income += amount;
    } else {
      current.expenses += Math.abs(amount);
    }
    current.net = current.income - current.expenses;
    grouped.set(month, current);
  }

  return Array.from(grouped.values()).map((trend) => ({
    month: trend.month,
    income: Number(trend.income.toFixed(2)),
    expenses: Number(trend.expenses.toFixed(2)),
    net: Number(trend.net.toFixed(2)),
  }));
}
