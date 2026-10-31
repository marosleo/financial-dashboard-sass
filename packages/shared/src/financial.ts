export type AccountType = "CHECKING" | "CREDIT_CARD" | "SAVINGS" | "INVESTMENT";

export type TransactionType = "INCOME" | "EXPENSE";

export type CategorySource = "PROVIDER" | "RULE" | "USER" | "AI";

export type InsightSeverity = "INFO" | "WARNING" | "POSITIVE";

export type AccountSummary = {
  id: string;
  institution: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
};

export type TransactionSummary = {
  id: string;
  description: string;
  merchantName: string | null;
  amount: number;
  type: TransactionType;
  date: string;
  categorySource: CategorySource;
  categoryConfidence: number | null;
  account: {
    id: string;
    name: string;
    institution: string;
  };
  category: {
    id: string;
    name: string;
    color: string;
    icon: string;
  } | null;
};

export type CategorySummary = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

export type CategorizationUpdate = {
  transaction: TransactionSummary;
  affectedTransactions: number;
  ruleCreated: boolean;
};

export type TransactionPage = {
  items: TransactionSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type InsightGenerationStatus = {
  configured: boolean;
};

export type SpendingByCategory = {
  categoryId: string;
  categoryName: string;
  color: string;
  amount: number;
  percentage: number;
};

export type MonthlyTrend = {
  month: string;
  income: number;
  expenses: number;
  net: number;
};

export type FinancialInsight = {
  id: string;
  title: string;
  summary: string;
  severity: InsightSeverity;
  period: string;
  createdAt: string;
};

export type DashboardOverview = {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyNet: number;
  accounts: AccountSummary[];
  recentTransactions: TransactionSummary[];
  spendingByCategory: SpendingByCategory[];
  monthlyTrends: MonthlyTrend[];
  insights: FinancialInsight[];
};

export type BudgetStatus = "UNSET" | "ON_TRACK" | "ATTENTION" | "EXCEEDED";

export type BudgetProgress = {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  monthlyLimit: number | null;
  spent: number;
  percentage: number | null;
  status: BudgetStatus;
};

export type RecurringExpense = {
  merchantKey: string;
  merchantName: string;
  averageAmount: number;
  occurrences: number;
  monthsObserved: number;
  nextExpectedDate: string;
  category: Pick<CategorySummary, "id" | "name" | "color"> | null;
};

export type ProjectionConfidence = "LOW" | "MEDIUM" | "HIGH";

export type MonthlyProjection = {
  currentIncome: number;
  currentExpenses: number;
  projectedIncome: number;
  projectedExpenses: number;
  projectedNet: number;
  historicalExpenseAverage: number;
  confidence: ProjectionConfidence;
  methodology: string;
};

export type PlanningOverview = {
  period: string;
  generatedAt: string;
  budgets: BudgetProgress[];
  recurringExpenses: RecurringExpense[];
  projection: MonthlyProjection;
};

export type BudgetUpdate = {
  categoryId: string;
  monthlyLimit: number;
};
