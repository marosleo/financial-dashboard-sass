import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  BudgetProgress,
  BudgetUpdate,
  PlanningOverview,
} from "@financial-dashboard/shared";
import { AuthContextService } from "../../common/auth/auth-context.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  calculateProjection,
  detectRecurringExpenses,
  type PlanningTransaction,
} from "./planning-calculator";

@Injectable()
export class PlanningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthContextService,
  ) {}

  async getOverview(): Promise<PlanningOverview> {
    const user = await this.auth.getUser();
    const now = new Date();
    const currentMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const historyStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1),
    );
    const nextMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );
    const hasPluggyAccounts =
      (await this.prisma.account.count({
        where: { userId: user.id, pluggyAccountId: { not: null } },
      })) > 0;

    const [transactions, categories, budgets] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          userId: user.id,
          ...(hasPluggyAccounts ? { source: "PLUGGY" as const } : {}),
          status: "POSTED",
          date: { gte: historyStart, lt: nextMonthStart },
        },
        include: { category: true },
        orderBy: { date: "asc" },
      }),
      this.prisma.category.findMany({ orderBy: { name: "asc" } }),
      this.prisma.budget.findMany({ where: { userId: user.id } }),
    ]);
    const normalized: PlanningTransaction[] = transactions.map(
      (transaction) => ({
        amount: transaction.amount.toNumber(),
        type: transaction.type,
        date: transaction.date,
        description: transaction.description,
        merchantName: transaction.merchantName,
        category: transaction.category
          ? {
              id: transaction.category.id,
              name: transaction.category.name,
              color: transaction.category.color,
            }
          : null,
      }),
    );

    return {
      period: currentMonthStart.toISOString().slice(0, 7),
      generatedAt: now.toISOString(),
      budgets: buildBudgets(categories, budgets, transactions),
      recurringExpenses: detectRecurringExpenses(normalized, now),
      projection: calculateProjection(normalized, now),
    };
  }

  async upsertBudget(
    categoryId: string,
    monthlyLimit: number,
  ): Promise<BudgetUpdate> {
    const user = await this.auth.getUser();
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) throw new NotFoundException("Category not found.");

    const budget = await this.prisma.budget.upsert({
      where: { userId_categoryId: { userId: user.id, categoryId } },
      update: { monthlyLimit },
      create: { userId: user.id, categoryId, monthlyLimit },
    });
    return {
      categoryId,
      monthlyLimit: budget.monthlyLimit.toNumber(),
    };
  }
}

function buildBudgets(
  categories: Array<{ id: string; name: string; color: string; icon: string }>,
  budgets: Array<{
    categoryId: string;
    monthlyLimit: { toNumber(): number };
  }>,
  transactions: Array<{
    categoryId: string | null;
    amount: { toNumber(): number };
    type: string;
    date: Date;
  }>,
): BudgetProgress[] {
  const now = new Date();
  const currentPeriod = now.toISOString().slice(0, 7);
  const limits = new Map(
    budgets.map((budget) => [
      budget.categoryId,
      budget.monthlyLimit.toNumber(),
    ]),
  );
  const spent = new Map<string, number>();
  const expenseCategories = new Set<string>();
  for (const transaction of transactions) {
    if (transaction.type === "EXPENSE" && transaction.categoryId) {
      expenseCategories.add(transaction.categoryId);
    }
    if (
      transaction.type !== "EXPENSE" ||
      !transaction.categoryId ||
      transaction.date.toISOString().slice(0, 7) !== currentPeriod
    )
      continue;
    spent.set(
      transaction.categoryId,
      (spent.get(transaction.categoryId) ?? 0) +
        Math.abs(transaction.amount.toNumber()),
    );
  }

  return categories
    .filter(
      (category) =>
        category.name.toLocaleLowerCase("pt-BR") !== "receitas" &&
        (expenseCategories.has(category.id) || limits.has(category.id)),
    )
    .map<BudgetProgress>((category) => {
      const monthlyLimit = limits.get(category.id) ?? null;
      const categorySpent = Number((spent.get(category.id) ?? 0).toFixed(2));
      const percentage = monthlyLimit
        ? Number(((categorySpent / monthlyLimit) * 100).toFixed(1))
        : null;
      return {
        categoryId: category.id,
        categoryName: category.name,
        color: category.color,
        icon: category.icon,
        monthlyLimit,
        spent: categorySpent,
        percentage,
        status:
          percentage === null
            ? "UNSET"
            : percentage >= 100
              ? "EXCEEDED"
              : percentage >= 80
                ? "ATTENTION"
                : "ON_TRACK",
      };
    })
    .sort((a, b) => b.spent - a.spent);
}
