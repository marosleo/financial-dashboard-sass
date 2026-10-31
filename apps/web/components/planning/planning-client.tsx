"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  BudgetProgress,
  BudgetUpdate,
  PlanningOverview,
  ProjectionConfidence,
} from "@financial-dashboard/shared";
import {
  CalendarMonthOutlined,
  CheckCircleOutlined,
  EventRepeatOutlined,
  InsightsOutlined,
  SavingsOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { apiRequest, friendlyRequestError } from "../../lib/api";
import { appRoutes } from "../../lib/routes";
import {
  type AppIdentity,
  endAppSession,
  getAppIdentity,
} from "../../lib/session";
import { AppShell } from "../layout/app-shell";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; data: PlanningOverview }
  | { status: "error"; message: string };

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const monthLabel = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const shortDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

export function PlanningClient() {
  const router = useRouter();
  const [identity, setIdentity] = useState<AppIdentity | null>(null);
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const currentIdentity = await getAppIdentity();
        if (!currentIdentity) {
          window.location.replace(appRoutes.login);
          return;
        }
        const data = await apiRequest<PlanningOverview>("/api/planning");
        if (!cancelled) {
          setIdentity(currentIdentity);
          setState({ status: "loaded", data });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message: friendlyRequestError(
              error,
              "Não foi possível carregar seu planejamento.",
            ),
          });
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refresh() {
    const data = await apiRequest<PlanningOverview>("/api/planning");
    setState({ status: "loaded", data });
  }

  async function logout() {
    await endAppSession(identity);
    router.replace(appRoutes.login);
  }

  return (
    <AppShell
      userName={identity?.name ?? "Sua conta"}
      userEmail={identity?.email ?? ""}
      onLogout={() => void logout()}
      demoMode={identity?.isDemo}
    >
      <Stack spacing={3} sx={{ maxWidth: 1180, mx: "auto" }}>
        <Box>
          <Typography variant="h4">Planejamento</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Antecipe o fechamento do mês e mantenha seus limites sob controle.
          </Typography>
        </Box>

        {state.status === "loading" ? <PlanningSkeleton /> : null}
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
          <PlanningContent
            data={state.data}
            readOnly={Boolean(identity?.isDemo)}
            onChanged={refresh}
          />
        ) : null}
      </Stack>
    </AppShell>
  );
}

function PlanningContent({
  data,
  readOnly,
  onChanged,
}: {
  data: PlanningOverview;
  readOnly: boolean;
  onChanged: () => Promise<void>;
}) {
  const periodDate = new Date(`${data.period}-01T12:00:00.000Z`);
  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
      >
        <Chip
          icon={<CalendarMonthOutlined />}
          label={capitalize(monthLabel.format(periodDate))}
          variant="outlined"
        />
        <Typography variant="caption" color="text.secondary">
          Atualizado em {shortDate.format(new Date(data.generatedAt))}
        </Typography>
      </Stack>

      <ProjectionPanel data={data} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.25fr 0.75fr" },
          gap: 2.5,
          alignItems: "start",
        }}
      >
        <BudgetsPanel
          budgets={data.budgets}
          readOnly={readOnly}
          onChanged={onChanged}
        />
        <RecurrencesPanel data={data} />
      </Box>
    </Stack>
  );
}

function ProjectionPanel({ data }: { data: PlanningOverview }) {
  const projection = data.projection;
  const positive = projection.projectedNet >= 0;
  return (
    <Paper sx={{ p: { xs: 2.5, sm: 3 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between" }}
      >
        <Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <InsightsOutlined color="primary" />
            <Typography variant="h6">Projeção do mês</Typography>
          </Stack>
          <Typography color="text.secondary" sx={{ mt: 0.75, fontSize: 13 }}>
            Saldo estimado no fechamento
          </Typography>
          <Typography
            sx={{
              mt: 1,
              fontSize: { xs: 32, sm: 40 },
              fontWeight: 760,
              letterSpacing: "-0.04em",
              color: positive ? "success.main" : "error.main",
            }}
          >
            {currency.format(projection.projectedNet)}
          </Typography>
        </Box>
        <ConfidenceChip confidence={projection.confidence} />
      </Stack>

      <Divider sx={{ my: 2.5 }} />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          gap: 2,
        }}
      >
        <Metric label="Entradas até agora" value={projection.currentIncome} />
        <Metric label="Saídas até agora" value={projection.currentExpenses} />
        <Metric
          label="Entradas projetadas"
          value={projection.projectedIncome}
        />
        <Metric
          label="Saídas projetadas"
          value={projection.projectedExpenses}
        />
      </Box>
      <Alert severity="info" icon={false} sx={{ mt: 2.5 }}>
        <Typography sx={{ fontSize: 12 }}>{projection.methodology}</Typography>
      </Alert>
    </Paper>
  );
}

function BudgetsPanel({
  budgets,
  readOnly,
  onChanged,
}: {
  budgets: BudgetProgress[];
  readOnly: boolean;
  onChanged: () => Promise<void>;
}) {
  if (budgets.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Orçamentos por categoria</Typography>
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Seus limites aparecerão quando houver despesas categorizadas.
        </Typography>
      </Paper>
    );
  }
  return (
    <Paper sx={{ overflow: "hidden" }}>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <SavingsOutlined color="primary" />
          <Typography variant="h6">Orçamentos por categoria</Typography>
        </Stack>
        <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 13 }}>
          Compare o realizado com o limite mensal definido.
        </Typography>
      </Box>
      <Divider />
      <Stack divider={<Divider flexItem />}>
        {budgets.map((budget) => (
          <BudgetRow
            key={budget.categoryId}
            budget={budget}
            readOnly={readOnly}
            onChanged={onChanged}
          />
        ))}
      </Stack>
    </Paper>
  );
}

function BudgetRow({
  budget,
  readOnly,
  onChanged,
}: {
  budget: BudgetProgress;
  readOnly: boolean;
  onChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(budget.monthlyLimit ?? ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const progress = Math.min(100, budget.percentage ?? 0);

  async function save() {
    const monthlyLimit = Number(value.replace(",", "."));
    if (!Number.isFinite(monthlyLimit) || monthlyLimit < 1) {
      setError("Informe um limite maior que zero.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await apiRequest<BudgetUpdate>(
        `/api/planning/budgets/${budget.categoryId}`,
        { method: "PUT", body: { monthlyLimit } },
      );
      await onChanged();
      setEditing(false);
    } catch (requestError) {
      setError(
        friendlyRequestError(requestError, "Não foi possível salvar o limite."),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ p: { xs: 2.25, sm: 3 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                bgcolor: budget.color,
              }}
            />
            <Typography sx={{ fontWeight: 650 }}>
              {budget.categoryName}
            </Typography>
            <BudgetStatusChip budget={budget} />
          </Stack>
          <Typography color="text.secondary" sx={{ mt: 0.75, fontSize: 13 }}>
            {currency.format(budget.spent)} gastos
            {budget.monthlyLimit
              ? ` de ${currency.format(budget.monthlyLimit)}`
              : " · limite ainda não definido"}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress}
            color={
              budget.status === "EXCEEDED"
                ? "error"
                : budget.status === "ATTENTION"
                  ? "warning"
                  : "primary"
            }
            sx={{ mt: 1.5, height: 7, borderRadius: 8 }}
          />
        </Box>
        {editing ? (
          <Stack spacing={1} sx={{ width: { xs: "100%", sm: 220 } }}>
            <TextField
              label="Limite mensal"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              size="small"
              type="number"
              slotProps={{ htmlInput: { min: 1, step: 0.01 } }}
              error={Boolean(error)}
              helperText={error || "Valor em reais"}
              autoFocus
            />
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="contained"
                onClick={() => void save()}
                disabled={saving}
              >
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button size="small" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Button
            size="small"
            variant="outlined"
            onClick={() => setEditing(true)}
            disabled={readOnly}
          >
            {budget.monthlyLimit ? "Editar limite" : "Definir limite"}
          </Button>
        )}
      </Stack>
    </Box>
  );
}

function RecurrencesPanel({ data }: { data: PlanningOverview }) {
  const total = useMemo(
    () =>
      data.recurringExpenses.reduce(
        (sum, recurrence) => sum + recurrence.averageAmount,
        0,
      ),
    [data.recurringExpenses],
  );
  return (
    <Paper sx={{ overflow: "hidden" }}>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <EventRepeatOutlined color="primary" />
          <Typography variant="h6">Despesas recorrentes</Typography>
        </Stack>
        <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 13 }}>
          {data.recurringExpenses.length > 0
            ? `${currency.format(total)} previstos por ciclo`
            : "Nenhum padrão mensal confirmado ainda."}
        </Typography>
      </Box>
      {data.recurringExpenses.length > 0 ? <Divider /> : null}
      <Stack divider={<Divider flexItem />}>
        {data.recurringExpenses.map((recurrence) => (
          <Box key={recurrence.merchantKey} sx={{ px: 3, py: 2.25 }}>
            <Stack
              direction="row"
              spacing={2}
              sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ fontWeight: 650 }}>
                  {recurrence.merchantName}
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ fontSize: 12, mt: 0.35 }}
                >
                  {recurrence.monthsObserved} meses · próxima em{" "}
                  {shortDate.format(new Date(recurrence.nextExpectedDate))}
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                {currency.format(recurrence.averageAmount)}
              </Typography>
            </Stack>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

function BudgetStatusChip({ budget }: { budget: BudgetProgress }) {
  if (budget.status === "UNSET") return null;
  const configuration = {
    ON_TRACK: { label: "No limite", color: "success" as const },
    ATTENTION: { label: "Atenção", color: "warning" as const },
    EXCEEDED: { label: "Excedido", color: "error" as const },
  }[budget.status];
  return (
    <Chip
      size="small"
      label={configuration.label}
      color={configuration.color}
    />
  );
}

function ConfidenceChip({ confidence }: { confidence: ProjectionConfidence }) {
  const configuration = {
    LOW: { label: "Baixa confiança", color: "warning" as const },
    MEDIUM: { label: "Confiança média", color: "info" as const },
    HIGH: { label: "Alta confiança", color: "success" as const },
  }[confidence];
  return (
    <Chip
      icon={
        confidence === "HIGH" ? (
          <CheckCircleOutlined />
        ) : (
          <WarningAmberOutlined />
        )
      }
      label={configuration.label}
      color={configuration.color}
      variant="outlined"
      sx={{ alignSelf: "flex-start" }}
    />
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Box>
      <Typography color="text.secondary" sx={{ fontSize: 12 }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 0.5, fontWeight: 700 }}>
        {currency.format(value)}
      </Typography>
    </Box>
  );
}

function PlanningSkeleton() {
  return (
    <Stack spacing={2.5}>
      <Skeleton variant="rounded" height={300} />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.25fr 0.75fr" },
          gap: 2.5,
        }}
      >
        <Skeleton variant="rounded" height={420} />
        <Skeleton variant="rounded" height={360} />
      </Box>
    </Stack>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase("pt-BR") + value.slice(1);
}
