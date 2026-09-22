"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  DashboardOverview,
  FinancialInsight,
  MonthlyTrend,
  PluggyIntegrationStatus,
  SpendingByCategory,
  TransactionSummary,
} from "@financial-dashboard/shared";
import {
  AccountBalanceWalletOutlined,
  AddOutlined,
  ArrowForwardOutlined,
  AutoAwesomeOutlined,
  RestaurantOutlined,
  ShoppingBagOutlined,
  TrendingDownOutlined,
  TrendingUpOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import type { User } from "@supabase/supabase-js";
import { AppShell } from "../layout/app-shell";
import { BankConnections } from "./bank-connections";
import { apiRequest } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import { appRoutes } from "../../lib/routes";

type LoadState =
  | { status: "loading" }
  | {
      status: "loaded";
      data: DashboardOverview;
      integration: PluggyIntegrationStatus;
    }
  | { status: "error"; message: string };

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const compactCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});
const shortDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});
const currentMonth = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
}).format(new Date());

export function DashboardClient() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session?.user) {
          window.location.replace(appRoutes.login);
          return;
        }
        if (!cancelled) setUser(sessionData.session.user);
        const result = await fetchDashboard();
        if (!cancelled) setState({ status: "loaded", ...result });
      } catch (error) {
        if (!cancelled)
          setState({ status: "error", message: errorMessage(error) });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function refreshDashboard() {
    const result = await fetchDashboard();
    setState({ status: "loaded", ...result });
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace(appRoutes.login);
  }

  const name = getUserName(user);
  return (
    <AppShell
      userName={name}
      userEmail={user?.email ?? ""}
      onLogout={() => void logout()}
    >
      {state.status === "loading" ? <DashboardSkeleton /> : null}
      {state.status === "error" ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          }
        >
          {state.message}
        </Alert>
      ) : null}
      {state.status === "loaded" ? (
        <DashboardContent
          data={state.data}
          integration={state.integration}
          userName={name}
          onChanged={refreshDashboard}
        />
      ) : null}
    </AppShell>
  );
}

function DashboardContent({
  data,
  integration,
  userName,
  onChanged,
}: {
  data: DashboardOverview;
  integration: PluggyIntegrationStatus;
  userName: string;
  onChanged: () => Promise<void>;
}) {
  return (
    <Stack spacing={3.5} sx={{ maxWidth: 1440, mx: "auto" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Box>
          <Typography variant="h4">Olá, {firstName(userName)}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Aqui está o resumo da sua vida financeira.
          </Typography>
        </Box>
        <Chip
          label={capitalize(currentMonth)}
          variant="outlined"
          sx={{ px: 1, height: 38 }}
        />
      </Box>

      <BankConnections integration={integration} onChanged={onChanged} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.15fr 1.85fr" },
          gap: 2.5,
        }}
      >
        <BalanceCard data={data} />
        <CashFlowCard trends={data.monthlyTrends} />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1.3fr" },
          gap: 2.5,
        }}
      >
        <CategoryCard categories={data.spendingByCategory} />
        <RecentTransactions transactions={data.recentTransactions} />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1.3fr" },
          gap: 2.5,
        }}
      >
        <AccountsCard accounts={data.accounts} />
        <InsightsCard insights={data.insights} onGenerated={onChanged} />
      </Box>
    </Stack>
  );
}

function BalanceCard({ data }: { data: DashboardOverview }) {
  return (
    <Paper
      sx={{ p: 3, overflow: "hidden", position: "relative", minHeight: 260 }}
    >
      <Box
        sx={{
          position: "absolute",
          width: 220,
          height: 220,
          right: -90,
          top: -90,
          borderRadius: "50%",
          bgcolor: "primary.main",
          opacity: 0.08,
        }}
      />
      <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
        Patrimônio disponível
      </Typography>
      <Typography
        sx={{
          mt: 1.5,
          fontSize: { xs: 34, sm: 42 },
          fontWeight: 750,
          letterSpacing: "-0.045em",
        }}
      >
        {currency.format(data.totalBalance)}
      </Typography>
      <Chip
        icon={
          data.monthlyNet >= 0 ? (
            <TrendingUpOutlined />
          ) : (
            <TrendingDownOutlined />
          )
        }
        color={data.monthlyNet >= 0 ? "success" : "error"}
        label={`${data.monthlyNet >= 0 ? "+" : ""}${currency.format(data.monthlyNet)} neste mês`}
        size="small"
        sx={{ mt: 1.5 }}
      />
      <Divider sx={{ my: 2.5 }} />
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <Box>
          <Typography sx={{ color: "text.secondary", fontSize: 12 }}>
            Entradas
          </Typography>
          <Typography sx={{ fontWeight: 650, mt: 0.5 }}>
            {currency.format(data.monthlyIncome)}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ color: "text.secondary", fontSize: 12 }}>
            Saídas
          </Typography>
          <Typography sx={{ fontWeight: 650, mt: 0.5 }}>
            {currency.format(data.monthlyExpenses)}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

function CashFlowCard({ trends }: { trends: MonthlyTrend[] }) {
  const maximum = Math.max(
    1,
    ...trends.flatMap((trend) => [trend.income, trend.expenses]),
  );
  return (
    <Paper sx={{ p: 3, minHeight: 260 }}>
      <SectionHeader
        title="Fluxo de caixa"
        subtitle="Entradas e saídas dos últimos meses"
      />
      {trends.length === 0 ? (
        <EmptyState text="O histórico aparecerá após a primeira sincronização." />
      ) : (
        <Box
          sx={{
            display: "flex",
            height: 170,
            alignItems: "flex-end",
            gap: { xs: 1.5, sm: 3 },
            mt: 2,
          }}
        >
          {trends.map((trend) => (
            <Box
              key={trend.month}
              sx={{ flex: 1, minWidth: 0, textAlign: "center" }}
            >
              <Box
                sx={{
                  height: 118,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  gap: 0.7,
                }}
              >
                <Bar height={trend.income / maximum} color="primary.main" />
                <Bar height={trend.expenses / maximum} color="text.disabled" />
              </Box>
              <Typography
                sx={{
                  fontSize: 11,
                  color: "text.secondary",
                  mt: 1,
                  textTransform: "capitalize",
                }}
              >
                {new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(
                  new Date(`${trend.month}-02T12:00:00Z`),
                )}
              </Typography>
              <Typography
                sx={{
                  fontSize: 10,
                  color: trend.net >= 0 ? "success.main" : "error.main",
                }}
              >
                {compactCurrency.format(trend.net)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}

function Bar({ height, color }: { height: number; color: string }) {
  return (
    <Box
      sx={{
        width: { xs: 7, sm: 11 },
        height: `${Math.max(height * 100, 4)}%`,
        bgcolor: color,
        borderRadius: "8px 8px 3px 3px",
      }}
    />
  );
}

function CategoryCard({ categories }: { categories: SpendingByCategory[] }) {
  return (
    <Paper id="categories" sx={{ p: 3, scrollMarginTop: 24 }}>
      <SectionHeader
        title="Gastos por categoria"
        subtitle="Distribuição deste mês"
      />
      {categories.length === 0 ? (
        <EmptyState text="Suas categorias aparecerão aqui." />
      ) : (
        <Stack spacing={2.25} sx={{ mt: 2.5 }}>
          {categories.slice(0, 5).map((category) => (
            <Box key={category.categoryId}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 2,
                  mb: 0.8,
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center" }}
                >
                  <Box
                    sx={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      bgcolor: category.color,
                    }}
                  />
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                    {category.categoryName}
                  </Typography>
                </Stack>
                <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                  {currency.format(category.amount)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(category.percentage, 100)}
                sx={{
                  height: 5,
                  borderRadius: 5,
                  "& .MuiLinearProgress-bar": { bgcolor: category.color },
                }}
              />
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

function RecentTransactions({
  transactions,
}: {
  transactions: TransactionSummary[];
}) {
  return (
    <Paper sx={{ p: 3 }}>
      <SectionHeader
        title="Transações recentes"
        subtitle="Últimas movimentações"
        action={
          <Button
            component={Link}
            href="/transactions"
            size="small"
            endIcon={<ArrowForwardOutlined />}
          >
            Ver todas
          </Button>
        }
      />
      {transactions.length === 0 ? (
        <EmptyState text="Nenhuma transação encontrada." />
      ) : (
        <Stack divider={<Divider flexItem />} sx={{ mt: 1.5 }}>
          {transactions.slice(0, 6).map((transaction) => (
            <Box
              key={transaction.id}
              sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.4 }}
            >
              <Box
                sx={{
                  display: "grid",
                  placeItems: "center",
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: "action.hover",
                  color: "text.secondary",
                }}
              >
                {transaction.type === "INCOME" ? (
                  <TrendingUpOutlined fontSize="small" />
                ) : transaction.category?.name
                    .toLowerCase()
                    .includes("aliment") ? (
                  <RestaurantOutlined fontSize="small" />
                ) : (
                  <ShoppingBagOutlined fontSize="small" />
                )}
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography noWrap sx={{ fontSize: 13, fontWeight: 650 }}>
                  {transaction.merchantName ?? transaction.description}
                </Typography>
                <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                  {transaction.category?.name ?? "Sem categoria"} ·{" "}
                  {shortDate.format(new Date(transaction.date))}
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  color:
                    transaction.type === "INCOME"
                      ? "success.main"
                      : "text.primary",
                }}
              >
                {transaction.type === "INCOME" ? "+" : "−"}
                {currency.format(Math.abs(transaction.amount))}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

function AccountsCard({
  accounts,
}: {
  accounts: DashboardOverview["accounts"];
}) {
  const total = useMemo(
    () => accounts.reduce((sum, account) => sum + account.balance, 0),
    [accounts],
  );
  return (
    <Paper id="accounts" sx={{ p: 3, scrollMarginTop: 24 }}>
      <SectionHeader
        title="Minhas contas"
        subtitle={`${accounts.length} ${accounts.length === 1 ? "conta conectada" : "contas conectadas"}`}
      />
      {accounts.length === 0 ? (
        <EmptyState text="Conecte sua primeira conta pelo Open Finance." />
      ) : (
        <Stack divider={<Divider flexItem />} sx={{ mt: 1.5 }}>
          {accounts.map((account) => (
            <Box
              key={account.id}
              sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.7 }}
            >
              <Box
                sx={{
                  display: "grid",
                  placeItems: "center",
                  width: 38,
                  height: 38,
                  borderRadius: 2,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                }}
              >
                <AccountBalanceWalletOutlined fontSize="small" />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 650 }}>
                  {account.name}
                </Typography>
                <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                  {account.institution}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                {currency.format(account.balance)}
              </Typography>
            </Box>
          ))}
          <Box sx={{ display: "flex", justifyContent: "space-between", pt: 2 }}>
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
              Total
            </Typography>
            <Typography sx={{ fontWeight: 750 }}>
              {currency.format(total)}
            </Typography>
          </Box>
        </Stack>
      )}
    </Paper>
  );
}

function InsightsCard({
  insights,
  onGenerated,
}: {
  insights: FinancialInsight[];
  onGenerated: () => Promise<void>;
}) {
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  async function generate() {
    setGenerating(true);
    setMessage(null);
    try {
      await apiRequest("/api/insights/generate", { method: "POST" });
      await onGenerated();
      setMessage({
        tone: "success",
        text: "Análise atualizada com suas transações mais recentes.",
      });
    } catch (error) {
      setMessage({ tone: "error", text: errorMessage(error) });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Paper id="insights" sx={{ p: 3, scrollMarginTop: 24 }}>
      <SectionHeader
        title="Insights para você"
        subtitle="Análises dos seus hábitos financeiros"
        action={
          <Button
            onClick={() => void generate()}
            disabled={generating}
            size="small"
            startIcon={
              generating ? (
                <CircularProgress size={15} />
              ) : (
                <AutoAwesomeOutlined />
              )
            }
          >
            {generating ? "Analisando" : "Atualizar análise"}
          </Button>
        }
      />
      {message ? (
        <Alert severity={message.tone} sx={{ mt: 2 }}>
          {message.text}
        </Alert>
      ) : null}
      {insights.length === 0 ? (
        <EmptyState text="Gere sua primeira análise após sincronizar as transações." />
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3,1fr)" },
            gap: 1.5,
            mt: 2.5,
          }}
        >
          {insights.slice(0, 3).map((insight) => (
            <Insight key={insight.id} insight={insight} />
          ))}
        </Box>
      )}
    </Paper>
  );
}

function Insight({ insight }: { insight: FinancialInsight }) {
  const colors =
    insight.severity === "POSITIVE"
      ? { bg: "rgba(66,199,122,.10)", color: "success.main" }
      : insight.severity === "WARNING"
        ? { bg: "rgba(245,158,11,.10)", color: "warning.main" }
        : { bg: "rgba(118,230,162,.07)", color: "primary.main" };
  return (
    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: colors.bg, minHeight: 150 }}>
      <AutoAwesomeOutlined sx={{ color: colors.color, fontSize: 19 }} />
      <Typography sx={{ fontSize: 13, fontWeight: 700, mt: 1.5 }}>
        {insight.title}
      </Typography>
      <Typography
        sx={{
          fontSize: 12,
          color: "text.secondary",
          lineHeight: 1.55,
          mt: 0.75,
        }}
      >
        {insight.summary}
      </Typography>
    </Box>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 2,
      }}
    >
      <Box>
        <Typography variant="h6" sx={{ fontSize: 17 }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.35 }}>
          {subtitle}
        </Typography>
      </Box>
      {action}
    </Box>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Box
      sx={{
        display: "grid",
        placeItems: "center",
        minHeight: 130,
        mt: 2,
        border: 1,
        borderStyle: "dashed",
        borderColor: "divider",
        borderRadius: 2.5,
        color: "text.secondary",
      }}
    >
      <Stack spacing={1} sx={{ alignItems: "center" }}>
        <AddOutlined />
        <Typography sx={{ fontSize: 13, textAlign: "center", px: 2 }}>
          {text}
        </Typography>
      </Stack>
    </Box>
  );
}

function DashboardSkeleton() {
  return (
    <Stack spacing={3} sx={{ maxWidth: 1440, mx: "auto" }}>
      <Skeleton width={280} height={58} />
      <Skeleton variant="rounded" height={100} />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 2fr" },
          gap: 2.5,
        }}
      >
        <Skeleton variant="rounded" height={260} />
        <Skeleton variant="rounded" height={260} />
      </Box>
      <Skeleton variant="rounded" height={340} />
    </Stack>
  );
}

async function fetchDashboard() {
  const [data, integration] = await Promise.all([
    apiRequest<DashboardOverview>("/api/dashboard"),
    apiRequest<PluggyIntegrationStatus>("/api/pluggy/status"),
  ]);
  return { data, integration };
}

function getUserName(user: User | null) {
  if (!user) return "Sua conta";
  return String(
    user.user_metadata.name ??
      user.user_metadata.full_name ??
      user.email?.split("@")[0] ??
      "Sua conta",
  );
}

function firstName(name: string) {
  return name.split(/\s+/)[0] || "bem-vindo";
}
function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a operação.";
}
