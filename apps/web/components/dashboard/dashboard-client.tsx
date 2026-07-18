"use client";

import { useEffect, useState } from "react";
import type {
  DashboardOverview,
  FinancialInsight,
  MonthlyTrend,
  SpendingByCategory,
  TransactionSummary,
} from "@financial-dashboard/shared";
import { apiRequest } from "../../lib/api";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; data: DashboardOverview }
  | { status: "error"; message: string };

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  year: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

export function DashboardClient() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const data = await apiRequest<DashboardOverview>("/api/dashboard");
        if (!cancelled) {
          setState({ status: "loaded", data });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Unable to load dashboard data.",
          });
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return <DashboardShell body={<DashboardSkeleton />} />;
  }

  if (state.status === "error") {
    return (
      <DashboardShell
        body={
          <section className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-red-900">
            <p className="text-sm font-semibold uppercase tracking-[0.24em]">
              API unavailable
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              The dashboard could not load.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6">{state.message}</p>
          </section>
        }
      />
    );
  }

  return <DashboardShell body={<DashboardContent data={state.data} />} />;
}

function DashboardShell({ body }: { body: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#F3EFE4] text-[#1E2A24]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-6 md:px-10 md:py-10">
        <header className="overflow-hidden rounded-[2rem] border border-[#D8CCB5] bg-[#20352B] p-8 text-[#F7F1E3] shadow-[0_24px_80px_rgba(32,53,43,0.18)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#C9B47E]">
                Open Finance MVP
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
                Financial clarity from connected data.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#E7DDC8]">
                A portfolio-ready dashboard with seeded banking data, real API
                routes, Prisma persistence, and space for Pluggy and AI insights.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-[#E7DDC8]">Current stage</p>
              <p className="mt-1 text-2xl font-semibold">MVP running</p>
            </div>
          </div>
        </header>
        {body}
      </div>
    </main>
  );
}

function DashboardContent({ data }: { data: DashboardOverview }) {
  return (
    <>
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total balance" value={formatCurrency(data.totalBalance)} />
        <MetricCard label="Income this month" value={formatCurrency(data.monthlyIncome)} />
        <MetricCard label="Expenses this month" value={formatCurrency(data.monthlyExpenses)} />
        <MetricCard label="Net result" value={formatCurrency(data.monthlyNet)} emphasis />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Monthly trend" subtitle="Income, expenses, and net result">
          <TrendChart trends={data.monthlyTrends} />
        </Panel>
        <Panel title="Spending by category" subtitle="Current month distribution">
          <CategoryBreakdown categories={data.spendingByCategory} />
        </Panel>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Accounts" subtitle="Balances across connected products">
          <div className="grid gap-3">
            {data.accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-2xl bg-[#F7F1E8] p-4"
              >
                <div>
                  <p className="font-semibold">{account.name}</p>
                  <p className="text-sm text-stone-500">
                    {account.institution} · {formatAccountType(account.type)}
                  </p>
                </div>
                <p className="font-semibold">{formatCurrency(account.balance)}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Recent transactions" subtitle="Latest imported movements">
          <TransactionList transactions={data.recentTransactions} />
        </Panel>
      </section>

      <Panel title="AI-style insights" subtitle="Seeded insights generated from portfolio data">
        <div className="grid gap-4 md:grid-cols-3">
          {data.insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </Panel>
    </>
  );
}

function MetricCard({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <article
      className={`rounded-[1.5rem] border p-5 shadow-sm ${
        emphasis
          ? "border-[#20352B] bg-[#20352B] text-[#F7F1E3]"
          : "border-[#DED3BD] bg-white"
      }`}
    >
      <p className={`text-sm ${emphasis ? "text-[#D9C796]" : "text-stone-500"}`}>
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
    </article>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-[#DED3BD] bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">{title}</h2>
        <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function TrendChart({ trends }: { trends: MonthlyTrend[] }) {
  const maxValue = Math.max(...trends.map((trend) => Math.max(trend.income, trend.expenses)), 1);

  return (
    <div className="grid gap-4">
      {trends.map((trend) => (
        <div key={trend.month} className="grid gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">
              {monthFormatter.format(new Date(`${trend.month}-02T12:00:00.000Z`))}
            </span>
            <span className={trend.net >= 0 ? "text-emerald-700" : "text-red-700"}>
              {formatCurrency(trend.net)}
            </span>
          </div>
          <div className="grid gap-1">
            <Bar label="Income" value={trend.income} maxValue={maxValue} color="#2F6F4E" />
            <Bar label="Expenses" value={trend.expenses} maxValue={maxValue} color="#B85C38" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Bar({
  label,
  value,
  maxValue,
  color,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}) {
  return (
    <div className="grid grid-cols-[5rem_1fr_6rem] items-center gap-3 text-xs text-stone-500">
      <span>{label}</span>
      <div className="h-2 rounded-full bg-stone-100">
        <div
          className="h-2 rounded-full"
          style={{ width: `${Math.max((value / maxValue) * 100, 4)}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-right">{formatCurrency(value)}</span>
    </div>
  );
}

function CategoryBreakdown({ categories }: { categories: SpendingByCategory[] }) {
  return (
    <div className="grid gap-3">
      {categories.map((category) => (
        <div key={category.categoryId} className="rounded-2xl bg-[#F7F1E8] p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <p className="font-semibold">{category.categoryName}</p>
            </div>
            <p className="text-sm text-stone-500">{category.percentage}%</p>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${category.percentage}%`,
                backgroundColor: category.color,
              }}
            />
          </div>
          <p className="mt-2 text-sm text-stone-600">{formatCurrency(category.amount)}</p>
        </div>
      ))}
    </div>
  );
}

function TransactionList({ transactions }: { transactions: TransactionSummary[] }) {
  return (
    <div className="grid gap-3">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between gap-4 rounded-2xl bg-[#F7F1E8] p-4"
        >
          <div>
            <p className="font-semibold">{transaction.description}</p>
            <p className="text-sm text-stone-500">
              {transaction.category?.name ?? "Uncategorized"} ·{" "}
              {dateFormatter.format(new Date(transaction.date))}
            </p>
          </div>
          <p
            className={`font-semibold ${
              transaction.type === "INCOME" ? "text-emerald-700" : "text-stone-900"
            }`}
          >
            {formatCurrency(transaction.amount)}
          </p>
        </div>
      ))}
    </div>
  );
}

function InsightCard({ insight }: { insight: FinancialInsight }) {
  const colors = {
    INFO: "border-blue-200 bg-blue-50 text-blue-950",
    WARNING: "border-amber-200 bg-amber-50 text-amber-950",
    POSITIVE: "border-emerald-200 bg-emerald-50 text-emerald-950",
  };

  return (
    <article className={`rounded-3xl border p-5 ${colors[insight.severity]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em]">
        {insight.severity.toLowerCase()}
      </p>
      <h3 className="mt-3 text-lg font-semibold">{insight.title}</h3>
      <p className="mt-2 text-sm leading-6 opacity-80">{insight.summary}</p>
    </article>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-32 animate-pulse rounded-[1.5rem] bg-white/70" />
        ))}
      </section>
      <div className="h-96 animate-pulse rounded-[2rem] bg-white/70" />
    </div>
  );
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatAccountType(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}
