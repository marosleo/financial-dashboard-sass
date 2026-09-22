export type AccountType = "CHECKING" | "CREDIT_CARD" | "SAVINGS" | "INVESTMENT";

export type TransactionType = "INCOME" | "EXPENSE";

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
