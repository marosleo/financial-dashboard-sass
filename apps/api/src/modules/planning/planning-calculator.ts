import type {
  MonthlyProjection,
  ProjectionConfidence,
  RecurringExpense,
} from "@financial-dashboard/shared";
import { getMerchantKey } from "../../common/categorization/merchant-key";

export type PlanningTransaction = {
  amount: number;
  type: "INCOME" | "EXPENSE";
  date: Date;
  description: string;
  merchantName: string | null;
  category: { id: string; name: string; color: string } | null;
};

export function detectRecurringExpenses(
  transactions: PlanningTransaction[],
  now: Date,
): RecurringExpense[] {
  const grouped = new Map<string, PlanningTransaction[]>();

  for (const transaction of transactions) {
    if (transaction.type !== "EXPENSE") continue;
    const label = transaction.merchantName ?? transaction.description;
    const key = getMerchantKey(label, transaction.description);
    if (!key) continue;
    const current = grouped.get(key) ?? [];
    current.push(transaction);
    grouped.set(key, current);
  }

  return Array.from(grouped.entries())
    .map(([key, entries]) => buildRecurrence(key, entries, now))
    .filter((recurrence): recurrence is RecurringExpense => recurrence !== null)
    .sort((a, b) => b.averageAmount - a.averageAmount)
    .slice(0, 8);
}

export function calculateProjection(
  transactions: PlanningTransaction[],
  now: Date,
): MonthlyProjection {
  const currentPeriod = periodOf(now);
  const current = transactions.filter(
    (transaction) => periodOf(transaction.date) === currentPeriod,
  );
  const historical = transactions.filter(
    (transaction) => periodOf(transaction.date) !== currentPeriod,
  );
  const currentIncome = sum(current, "INCOME");
  const currentExpenses = sum(current, "EXPENSE");
  const historicalPeriods = Array.from(
    new Set(historical.map((transaction) => periodOf(transaction.date))),
  );
  const historicalExpenseAverage = averageMonthly(
    historical,
    historicalPeriods,
    "EXPENSE",
  );
  const historicalIncomeAverage = averageMonthly(
    historical,
    historicalPeriods,
    "INCOME",
  );
  const daysInMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const elapsedRatio = Math.max(0.2, now.getUTCDate() / daysInMonth);
  const pacedExpenses = currentExpenses / elapsedRatio;
  const projectedExpenses = Math.max(
    currentExpenses,
    historicalExpenseAverage > 0
      ? pacedExpenses * 0.6 + historicalExpenseAverage * 0.4
      : pacedExpenses,
  );
  const projectedIncome = Math.max(currentIncome, historicalIncomeAverage);
  const confidence = projectionConfidence(
    historicalPeriods.length,
    now.getUTCDate(),
  );

  return {
    currentIncome: money(currentIncome),
    currentExpenses: money(currentExpenses),
    projectedIncome: money(projectedIncome),
    projectedExpenses: money(projectedExpenses),
    projectedNet: money(projectedIncome - projectedExpenses),
    historicalExpenseAverage: money(historicalExpenseAverage),
    confidence,
    methodology:
      "Combina o ritmo de gastos do mês (60%) com a média dos meses anteriores (40%); receitas usam o maior valor entre o realizado e a média histórica.",
  };
}

function buildRecurrence(
  key: string,
  entries: PlanningTransaction[],
  now: Date,
): RecurringExpense | null {
  const months = new Set(entries.map((entry) => periodOf(entry.date)));
  if (entries.length < 3 || months.size < 3) return null;

  const amounts = entries.map((entry) => Math.abs(entry.amount));
  const averageAmount = average(amounts);
  const deviation = Math.sqrt(
    average(amounts.map((amount) => (amount - averageAmount) ** 2)),
  );
  if (averageAmount === 0 || deviation / averageAmount > 0.25) return null;

  const averageDay = Math.round(
    average(entries.map((entry) => entry.date.getUTCDate())),
  );
  const expected = nextOccurrence(now, averageDay, months.has(periodOf(now)));
  const latest = entries.reduce((candidate, entry) =>
    entry.date > candidate.date ? entry : candidate,
  );

  return {
    merchantKey: key,
    merchantName: latest.merchantName ?? latest.description,
    averageAmount: money(averageAmount),
    occurrences: entries.length,
    monthsObserved: months.size,
    nextExpectedDate: expected.toISOString(),
    category: latest.category,
  };
}

function nextOccurrence(
  now: Date,
  expectedDay: number,
  alreadyOccurredThisMonth: boolean,
) {
  const thisMonthLastDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const thisMonthDay = Math.min(expectedDay, thisMonthLastDay);
  if (!alreadyOccurredThisMonth && now.getUTCDate() <= thisMonthDay) {
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), thisMonthDay, 12),
    );
  }
  const nextMonthLastDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 0),
  ).getUTCDate();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
      Math.min(expectedDay, nextMonthLastDay),
      12,
    ),
  );
}

function projectionConfidence(
  historicalMonths: number,
  elapsedDay: number,
): ProjectionConfidence {
  if (historicalMonths >= 4 && elapsedDay >= 10) return "HIGH";
  if (historicalMonths >= 2 && elapsedDay >= 5) return "MEDIUM";
  return "LOW";
}

function averageMonthly(
  transactions: PlanningTransaction[],
  periods: string[],
  type: PlanningTransaction["type"],
) {
  if (periods.length === 0) return 0;
  return (
    periods.reduce(
      (total, period) =>
        total +
        sum(
          transactions.filter(
            (transaction) => periodOf(transaction.date) === period,
          ),
          type,
        ),
      0,
    ) / periods.length
  );
}

function sum(
  transactions: PlanningTransaction[],
  type: PlanningTransaction["type"],
) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
}

function periodOf(date: Date) {
  return date.toISOString().slice(0, 7);
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function money(value: number) {
  return Number(value.toFixed(2));
}
