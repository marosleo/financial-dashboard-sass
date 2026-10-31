import type {
  MonthlyTrend,
  SpendingByCategory,
} from "@financial-dashboard/shared";

type CategoryTransaction = {
  amount: { toNumber(): number };
  type: string;
  category: { id: string; name: string; color: string } | null;
};

export function buildSpendingByCategory(
  transactions: CategoryTransaction[],
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
      categoryName: category?.name ?? "Sem categoria",
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

export function buildMonthlyTrends(
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

export function getPeriodBounds(period: string) {
  const [year, month] = period.split("-").map(Number);
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

export function buildAvailablePeriods(
  earliestDate: Date | null,
  latestDate: Date | null,
  fallbackPeriod: string,
  limit = 24,
) {
  if (!earliestDate || !latestDate) return [fallbackPeriod];

  const earliest = new Date(
    Date.UTC(earliestDate.getUTCFullYear(), earliestDate.getUTCMonth(), 1),
  );
  const cursor = new Date(
    Date.UTC(latestDate.getUTCFullYear(), latestDate.getUTCMonth(), 1),
  );
  const periods: string[] = [];

  while (cursor >= earliest && periods.length < limit) {
    periods.push(cursor.toISOString().slice(0, 7));
    cursor.setUTCMonth(cursor.getUTCMonth() - 1);
  }

  return periods;
}
