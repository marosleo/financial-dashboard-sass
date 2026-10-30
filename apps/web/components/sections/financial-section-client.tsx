"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  DashboardOverview,
  FinancialInsight,
  PluggyIntegrationStatus,
} from "@financial-dashboard/shared";
import type { User } from "@supabase/supabase-js";
import {
  AccountBalanceWalletOutlined,
  AutoAwesomeOutlined,
  CategoryOutlined,
  DarkModeOutlined,
  LightModeOutlined,
  LockOutlined,
  PersonOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
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
import { apiRequest, friendlyRequestError } from "../../lib/api";
import { appRoutes } from "../../lib/routes";
import { supabase } from "../../lib/supabase";
import { AppShell } from "../layout/app-shell";
import { useColorMode } from "../theme/app-theme-provider";
import { BankConnections } from "../dashboard/bank-connections";

export type FinancialSection =
  | "accounts"
  | "categories"
  | "insights"
  | "settings";

type LoadState =
  | { status: "loading" }
  | {
      status: "loaded";
      data: DashboardOverview | null;
      integration: PluggyIntegrationStatus | null;
    }
  | { status: "error"; message: string };

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const sectionCopy: Record<
  FinancialSection,
  { title: string; description: string }
> = {
  accounts: {
    title: "Contas",
    description:
      "Gerencie suas instituições e acompanhe os saldos consolidados.",
  },
  categories: {
    title: "Categorias",
    description: "Entenda como suas despesas estão distribuídas neste mês.",
  },
  insights: {
    title: "Insights",
    description: "Análises dos seus hábitos financeiros e fluxo mensal.",
  },
  settings: {
    title: "Configurações",
    description: "Gerencie sua conta e as preferências de aparência.",
  },
};

export function FinancialSectionClient({
  section,
}: {
  section: FinancialSection;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session?.user) {
          window.location.replace(appRoutes.login);
          return;
        }
        if (cancelled) return;
        setUser(sessionData.session.user);

        if (section === "settings") {
          setState({ status: "loaded", data: null, integration: null });
          return;
        }

        const result = await fetchFinancialData();
        if (!cancelled) setState({ status: "loaded", ...result });
      } catch (error) {
        if (!cancelled) {
          setState({ status: "error", message: errorMessage(error) });
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [section]);

  async function refresh() {
    const result = await fetchFinancialData();
    setState({ status: "loaded", ...result });
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace(appRoutes.login);
  }

  const userName = getUserName(user);
  const copy = sectionCopy[section];

  return (
    <AppShell
      userName={userName}
      userEmail={user?.email ?? ""}
      onLogout={() => void logout()}
    >
      <Stack spacing={3} sx={{ maxWidth: 1180, mx: "auto" }}>
        <Box>
          <Typography variant="h4">{copy.title}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {copy.description}
          </Typography>
        </Box>

        {state.status === "loading" ? <SectionSkeleton /> : null}
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
          <SectionContent
            section={section}
            data={state.data}
            integration={state.integration}
            user={user}
            onChanged={refresh}
          />
        ) : null}
      </Stack>
    </AppShell>
  );
}

function SectionContent({
  section,
  data,
  integration,
  user,
  onChanged,
}: {
  section: FinancialSection;
  data: DashboardOverview | null;
  integration: PluggyIntegrationStatus | null;
  user: User | null;
  onChanged: () => Promise<void>;
}) {
  if (section === "settings") return <SettingsContent user={user} />;
  if (!data || !integration) return null;
  if (section === "accounts") {
    return (
      <AccountsContent
        data={data}
        integration={integration}
        onChanged={onChanged}
      />
    );
  }
  if (section === "categories") {
    return <CategoriesContent data={data} />;
  }
  return <InsightsContent insights={data.insights} onChanged={onChanged} />;
}

function AccountsContent({
  data,
  integration,
  onChanged,
}: {
  data: DashboardOverview;
  integration: PluggyIntegrationStatus;
  onChanged: () => Promise<void>;
}) {
  const total = useMemo(
    () => data.accounts.reduce((sum, account) => sum + account.balance, 0),
    [data.accounts],
  );

  return (
    <Stack spacing={2.5}>
      <BankConnections integration={integration} onChanged={onChanged} />
      <Paper sx={{ overflow: "hidden" }}>
        <Box sx={{ px: 3, py: 2.5 }}>
          <Typography variant="h6">Saldos por conta</Typography>
          <Typography sx={{ mt: 0.4, fontSize: 12, color: "text.secondary" }}>
            {data.accounts.length}{" "}
            {data.accounts.length === 1
              ? "conta conectada"
              : "contas conectadas"}
          </Typography>
        </Box>
        <Divider />
        {data.accounts.length === 0 ? (
          <EmptyState text="Conecte sua primeira instituição para visualizar os saldos." />
        ) : (
          <Stack divider={<Divider flexItem />}>
            {data.accounts.map((account) => (
              <Box
                key={account.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: 3,
                  py: 2,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                  }}
                >
                  <AccountBalanceWalletOutlined />
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontWeight: 700 }}>
                    {account.name}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    {account.institution} · {accountTypeLabel(account.type)}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 750, whiteSpace: "nowrap" }}>
                  {currency.format(account.balance)}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
        <Divider />
        <Box
          sx={{
            px: 3,
            py: 2.25,
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Typography color="text.secondary">Patrimônio consolidado</Typography>
          <Typography sx={{ fontWeight: 800 }}>
            {currency.format(total)}
          </Typography>
        </Box>
      </Paper>
    </Stack>
  );
}

function CategoriesContent({ data }: { data: DashboardOverview }) {
  const total = data.spendingByCategory.reduce(
    (sum, category) => sum + category.amount,
    0,
  );

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "280px minmax(0,1fr)" },
        gap: 2.5,
      }}
    >
      <Paper sx={{ p: 3, alignSelf: "start" }}>
        <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}>
          <CategoryOutlined />
        </Avatar>
        <Typography sx={{ mt: 2, color: "text.secondary", fontSize: 13 }}>
          Total categorizado
        </Typography>
        <Typography variant="h4" sx={{ mt: 0.5 }}>
          {currency.format(total)}
        </Typography>
        <Typography sx={{ mt: 1, color: "text.secondary", fontSize: 12 }}>
          {data.spendingByCategory.length}{" "}
          {data.spendingByCategory.length === 1 ? "categoria" : "categorias"}
        </Typography>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Distribuição das despesas</Typography>
        <Typography sx={{ mt: 0.4, fontSize: 12, color: "text.secondary" }}>
          Participação de cada categoria nas saídas deste mês
        </Typography>
        {data.spendingByCategory.length === 0 ? (
          <EmptyState text="As categorias aparecerão após a sincronização das transações." />
        ) : (
          <Stack spacing={2.75} sx={{ mt: 3 }}>
            {data.spendingByCategory.map((category) => (
              <Box key={category.categoryId}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    mb: 1,
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.25}
                    sx={{ alignItems: "center" }}
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: category.color,
                      }}
                    />
                    <Typography sx={{ fontWeight: 650 }}>
                      {category.categoryName}
                    </Typography>
                  </Stack>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography sx={{ fontWeight: 700 }}>
                      {currency.format(category.amount)}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                      {Math.round(category.percentage)}%
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(category.percentage, 100)}
                  sx={{
                    height: 7,
                    borderRadius: 4,
                    "& .MuiLinearProgress-bar": { bgcolor: category.color },
                  }}
                />
              </Box>
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}

function InsightsContent({
  insights,
  onChanged,
}: {
  insights: FinancialInsight[];
  onChanged: () => Promise<void>;
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
      await onChanged();
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
    <Stack spacing={2.5}>
      <Paper
        sx={{
          p: 3,
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Avatar
            sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}
          >
            <AutoAwesomeOutlined />
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 700 }}>Análise financeira</Typography>
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
              Use suas transações mais recentes para atualizar as observações.
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="contained"
          disabled={generating}
          onClick={() => void generate()}
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
      </Paper>

      {message ? <Alert severity={message.tone}>{message.text}</Alert> : null}

      {insights.length === 0 ? (
        <Paper>
          <EmptyState text="Sincronize suas transações e gere a primeira análise." />
        </Paper>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          {insights.map((insight) => (
            <Paper key={insight.id} sx={{ p: 3, minHeight: 210 }}>
              <Chip
                size="small"
                color={
                  insight.severity === "POSITIVE"
                    ? "success"
                    : insight.severity === "WARNING"
                      ? "warning"
                      : "default"
                }
                label={severityLabel(insight.severity)}
              />
              <Typography variant="h6" sx={{ mt: 2.5 }}>
                {insight.title}
              </Typography>
              <Typography
                sx={{
                  mt: 1,
                  fontSize: 13,
                  lineHeight: 1.65,
                  color: "text.secondary",
                }}
              >
                {insight.summary}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}
    </Stack>
  );
}

function SettingsContent({ user }: { user: User | null }) {
  const colorMode = useColorMode();
  const name = getUserName(user);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))" },
        gap: 2.5,
      }}
    >
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Avatar sx={{ width: 48, height: 48 }}>{initials(name)}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6">{name}</Typography>
            <Typography noWrap sx={{ fontSize: 13, color: "text.secondary" }}>
              {user?.email}
            </Typography>
          </Box>
        </Stack>
        <Divider sx={{ my: 2.5 }} />
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <PersonOutlined color="action" />
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 650 }}>
              Conta Nexo
            </Typography>
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
              Perfil autenticado pelo Supabase
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Aparência</Typography>
        <Typography sx={{ mt: 0.5, fontSize: 12, color: "text.secondary" }}>
          O tema escolhido fica salvo neste navegador.
        </Typography>
        <Button
          variant="outlined"
          fullWidth
          onClick={colorMode.toggle}
          startIcon={
            colorMode.mode === "dark" ? (
              <LightModeOutlined />
            ) : (
              <DarkModeOutlined />
            )
          }
          sx={{ mt: 2.5, justifyContent: "flex-start" }}
        >
          {colorMode.mode === "dark" ? "Usar modo claro" : "Usar modo escuro"}
        </Button>
      </Paper>

      <Paper sx={{ p: 3, gridColumn: { md: "1 / -1" } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <LockOutlined color="action" />
          <Box>
            <Typography sx={{ fontWeight: 700 }}>
              Privacidade e segurança
            </Typography>
            <Typography sx={{ mt: 0.4, fontSize: 12, color: "text.secondary" }}>
              Seus dados financeiros são associados somente à sua conta. O Nexo
              não armazena credenciais bancárias.
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Box sx={{ py: 8, px: 3, textAlign: "center", color: "text.secondary" }}>
      <Typography sx={{ fontSize: 13 }}>{text}</Typography>
    </Box>
  );
}

function SectionSkeleton() {
  return (
    <Stack spacing={2}>
      <Skeleton variant="rounded" height={104} />
      <Skeleton variant="rounded" height={320} />
    </Stack>
  );
}

async function fetchFinancialData() {
  const [data, integration] = await Promise.all([
    apiRequest<DashboardOverview>("/api/dashboard"),
    apiRequest<PluggyIntegrationStatus>("/api/pluggy/status"),
  ]);
  return { data, integration };
}

function getUserName(user: User | null) {
  return String(
    user?.user_metadata.name ??
      user?.user_metadata.full_name ??
      user?.email?.split("@")[0] ??
      "Sua conta",
  );
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "NX"
  );
}

function accountTypeLabel(type: DashboardOverview["accounts"][number]["type"]) {
  return (
    {
      CHECKING: "Conta corrente",
      CREDIT_CARD: "Cartão de crédito",
      SAVINGS: "Poupança",
      INVESTMENT: "Investimentos",
    } as const
  )[type];
}

function severityLabel(severity: FinancialInsight["severity"]) {
  if (severity === "POSITIVE") return "Positivo";
  if (severity === "WARNING") return "Atenção";
  return "Informação";
}

function errorMessage(error: unknown) {
  return friendlyRequestError(error, "Não foi possível carregar esta seção.");
}
