"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AuthSession,
  DashboardOverview,
  FinancialInsight,
  MonthlyTrend,
  PluggyIntegrationStatus,
  SpendingByCategory,
  TransactionSummary,
} from "@financial-dashboard/shared";
import { BankConnections } from "./bank-connections";
import { apiRequest } from "../../lib/api";
import { clearAuthSession, getAuthSession } from "../../lib/auth";
import { appRoutes } from "../../lib/routes";

type LoadState =
  | { status: "loading" }
  | {
      status: "loaded";
      data: DashboardOverview;
      integration: PluggyIntegrationStatus;
    }
  | { status: "error"; message: string };

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

export function DashboardClient() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    let cancelled = false;
    const currentSession = getAuthSession();

    if (!currentSession) {
      router.replace(appRoutes.login);
      return undefined;
    }

    setSession(currentSession);

    async function loadDashboard() {
      try {
        const result = await fetchDashboard();
        if (!cancelled) {
          setState({ status: "loaded", ...result });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message:
              error instanceof Error ? error.message : "Unable to load data.",
          });
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleLogout() {
    clearAuthSession();
    setSession(null);

    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace(appRoutes.login);
    }
  }

  async function refreshDashboard() {
    const result = await fetchDashboard();
    setState({ status: "loaded", ...result });
  }

  if (state.status === "loading") {
    return <DashboardFrame body={<Skeleton />} session={session} />;
  }

  if (state.status === "error") {
    return (
      <DashboardFrame
        session={session}
        onLogout={handleLogout}
        body={
          <section className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-950">
            <p className="text-xs font-medium uppercase tracking-[0.22em]">
              Connection error
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
              Dashboard unavailable
            </h2>
            <p className="mt-2 text-sm leading-6 text-red-800">
              {state.message}
            </p>
          </section>
        }
      />
    );
  }

  return (
    <DashboardFrame
      body={
        <DashboardContent
          data={state.data}
          integration={state.integration}
          onIntegrationChanged={refreshDashboard}
        />
      }
      session={session}
      onLogout={handleLogout}
    />
  );
}

function DashboardFrame({
  body,
  session,
  onLogout,
}: {
  body: React.ReactNode;
  session: AuthSession | null;
  onLogout?: () => void;
}) {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-6 border-b border-neutral-200 pb-8 pt-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-500">
              Financial OS
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.055em] text-neutral-950 sm:text-6xl">
              Clean view of your money.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-500">
              Open Finance connections, local PostgreSQL persistence, and an
              interface focused on signal over noise.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-full border border-neutral-200 bg-white px-3 py-2 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-950 text-xs font-semibold text-white">
                {session?.user.initials ?? "--"}
              </div>
              <div className="pr-1">
                <p className="text-sm font-medium">
                  {session?.user.name ?? "Loading profile"}
                </p>
                <p className="text-xs text-neutral-500">
                  {session?.user.email ?? "Checking session"}
                </p>
              </div>
            </div>
            {onLogout ? (
              <button
                type="button"
                onClick={onLogout}
                className="rounded-full border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-100"
              >
                Logout
              </button>
            ) : null}
          </div>
        </header>
        {body}
      </div>
    </main>
  );
}

function DashboardContent({
  data,
  integration,
  onIntegrationChanged,
}: {
  data: DashboardOverview;
  integration: PluggyIntegrationStatus;
  onIntegrationChanged: () => Promise<void>;
}) {
  return (
    <>
      <BankConnections
        integration={integration}
        onChanged={onIntegrationChanged}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Balance" value={formatCurrency(data.totalBalance)} />
        <Metric label="Income" value={formatCurrency(data.monthlyIncome)} />
        <Metric label="Expenses" value={formatCurrency(data.monthlyExpenses)} />
        <Metric label="Net" value={formatCurrency(data.monthlyNet)} highlight />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card title="Cash flow" caption="Last six months">
          <TrendChart trends={data.monthlyTrends} />
        </Card>
        <Card title="Categories" caption="Current month expenses">
          <CategoryList categories={data.spendingByCategory} />
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
        <Card title="Accounts" caption="Connected products">
          <AccountList accounts={data.accounts} />
        </Card>
        <Card title="Recent activity" caption="Latest transactions">
          <TransactionList transactions={data.recentTransactions} />
        </Card>
      </section>

      <Card title="Insights" caption="Seeded analysis layer">
        <div className="grid gap-3 md:grid-cols-3">
          {data.insights.map((insight) => (
            <Insight key={insight.id} insight={insight} />
          ))}
        </div>
      </Card>
    </>
  );
}

function Metric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <article
      className={`rounded-3xl border p-5 shadow-sm ${
        highlight
          ? "border-neutral-950 bg-neutral-950 text-white"
          : "border-neutral-200 bg-white text-neutral-950"
      }`}
    >
      <p
        className={
          highlight ? "text-sm text-neutral-400" : "text-sm text-neutral-500"
        }
      >
        {label}
      </p>
      <p className="mt-4 text-2xl font-semibold tracking-[-0.04em]">{value}</p>
    </article>
  );
}

function Card({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.03em]">{title}</h2>
          <p className="mt-1 text-sm text-neutral-500">{caption}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function TrendChart({ trends }: { trends: MonthlyTrend[] }) {
  if (trends.length === 0) {
    return <EmptyData message="No cash-flow history available yet." />;
  }

  const maxValue = Math.max(
    ...trends.map((trend) => Math.max(trend.income, trend.expenses)),
    1,
  );

  return (
    <div className="flex h-80 items-end gap-3">
      {trends.map((trend) => (
        <div
          key={trend.month}
          className="flex min-w-0 flex-1 flex-col items-center gap-3"
        >
          <div className="flex h-60 w-full items-end justify-center gap-1.5">
            <VerticalBar
              value={trend.income}
              maxValue={maxValue}
              className="bg-neutral-950"
            />
            <VerticalBar
              value={trend.expenses}
              maxValue={maxValue}
              className="bg-neutral-300"
            />
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-neutral-600">
              {monthFormatter.format(
                new Date(`${trend.month}-02T12:00:00.000Z`),
              )}
            </p>
            <p
              className={
                trend.net >= 0
                  ? "text-xs text-emerald-600"
                  : "text-xs text-red-600"
              }
            >
              {formatCompactCurrency(trend.net)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function VerticalBar({
  value,
  maxValue,
  className,
}: {
  value: number;
  maxValue: number;
  className: string;
}) {
  return (
    <div
      className={`w-4 rounded-full ${className}`}
      style={{ height: `${Math.max((value / maxValue) * 100, 5)}%` }}
    />
  );
}

function CategoryList({ categories }: { categories: SpendingByCategory[] }) {
  if (categories.length === 0) {
    return <EmptyData message="No categorized expenses this month." />;
  }

  return (
    <div className="grid gap-4">
      {categories.slice(0, 6).map((category) => (
        <div key={category.categoryId}>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="font-medium">{category.categoryName}</span>
            </div>
            <span className="text-neutral-500">
              {formatCurrency(category.amount)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-neutral-100">
            <div
              className="h-1.5 rounded-full bg-neutral-950"
              style={{ width: `${category.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function AccountList({
  accounts,
}: {
  accounts: DashboardOverview["accounts"];
}) {
  if (accounts.length === 0) {
    return <EmptyData message="Connect a bank to import your accounts." />;
  }

  return (
    <div className="divide-y divide-neutral-100">
      {accounts.map((account) => (
        <div
          key={account.id}
          className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
        >
          <div>
            <p className="font-medium">{account.name}</p>
            <p className="mt-1 text-sm text-neutral-500">
              {account.institution} · {formatAccountType(account.type)}
            </p>
          </div>
          <p className="font-semibold tracking-[-0.02em]">
            {formatCurrency(account.balance)}
          </p>
        </div>
      ))}
    </div>
  );
}

function TransactionList({
  transactions,
}: {
  transactions: TransactionSummary[];
}) {
  if (transactions.length === 0) {
    return <EmptyData message="No transactions available yet." />;
  }

  return (
    <div className="divide-y divide-neutral-100">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{transaction.description}</p>
            <p className="mt-1 text-sm text-neutral-500">
              {transaction.category?.name ?? "Uncategorized"} ·{" "}
              {dateFormatter.format(new Date(transaction.date))}
            </p>
          </div>
          <p
            className={`shrink-0 font-semibold tracking-[-0.02em] ${
              transaction.type === "INCOME"
                ? "text-emerald-600"
                : "text-neutral-950"
            }`}
          >
            {formatCurrency(transaction.amount)}
          </p>
        </div>
      ))}
    </div>
  );
}

function Insight({ insight }: { insight: FinancialInsight }) {
  const tone = {
    INFO: "bg-neutral-50 text-neutral-800",
    WARNING: "bg-amber-50 text-amber-950",
    POSITIVE: "bg-emerald-50 text-emerald-950",
  };

  return (
    <article className={`rounded-2xl p-5 ${tone[insight.severity]}`}>
      <p className="text-xs font-medium uppercase tracking-[0.2em] opacity-60">
        {insight.severity.toLowerCase()}
      </p>
      <h3 className="mt-4 font-semibold tracking-[-0.02em]">{insight.title}</h3>
      <p className="mt-2 text-sm leading-6 opacity-70">{insight.summary}</p>
    </article>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-4">
      <div className="h-72 animate-pulse rounded-[2rem] bg-neutral-950" />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-32 animate-pulse rounded-3xl bg-white" />
        ))}
      </section>
      <div className="h-96 animate-pulse rounded-3xl bg-white" />
    </div>
  );
}

function EmptyData({ message }: { message: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-center text-sm text-neutral-500">
      {message}
    </div>
  );
}

async function fetchDashboard() {
  const [data, integration] = await Promise.all([
    apiRequest<DashboardOverview>("/api/dashboard"),
    apiRequest<PluggyIntegrationStatus>("/api/pluggy/status"),
  ]);

  return { data, integration };
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatAccountType(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}
