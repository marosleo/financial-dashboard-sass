import type {
  AccountSummary,
  FinancialInsight,
  TransactionSummary,
} from "@financial-dashboard/shared";

type AccountEntity = {
  id: string;
  institution: string;
  name: string;
  type: AccountSummary["type"];
  balance: { toNumber(): number };
  currency: string;
};

type TransactionEntity = {
  id: string;
  description: string;
  merchantName: string | null;
  amount: { toNumber(): number };
  type: TransactionSummary["type"];
  date: Date;
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

type InsightEntity = {
  id: string;
  title: string;
  summary: string;
  severity: FinancialInsight["severity"];
  period: string;
  createdAt: Date;
};

export function mapAccount(account: AccountEntity): AccountSummary {
  return {
    id: account.id,
    institution: account.institution,
    name: account.name,
    type: account.type,
    balance: account.balance.toNumber(),
    currency: account.currency,
  };
}

export function mapTransaction(
  transaction: TransactionEntity,
): TransactionSummary {
  return {
    id: transaction.id,
    description: transaction.description,
    merchantName: transaction.merchantName,
    amount: transaction.amount.toNumber(),
    type: transaction.type,
    date: transaction.date.toISOString(),
    account: {
      id: transaction.account.id,
      name: transaction.account.name,
      institution: transaction.account.institution,
    },
    category: transaction.category,
  };
}

export function mapInsight(insight: InsightEntity): FinancialInsight {
  return {
    id: insight.id,
    title: insight.title,
    summary: insight.summary,
    severity: insight.severity,
    period: insight.period,
    createdAt: insight.createdAt.toISOString(),
  };
}
