"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  TransactionPage,
  TransactionType,
} from "@financial-dashboard/shared";
import type { User } from "@supabase/supabase-js";
import {
  ArrowDownwardOutlined,
  ArrowUpwardOutlined,
  SearchOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AppShell } from "../layout/app-shell";
import { apiRequest } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import { appRoutes } from "../../lib/routes";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const date = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function TransactionsClient() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"" | TransactionType>("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<TransactionPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session?.user) {
        window.location.replace(appRoutes.login);
        return;
      }
      setUser(data.session.user);
      setAuthReady(true);
    });
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!authReady) return;
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [authReady, searchInput]);

  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), pageSize: "15" });
    if (search) params.set("search", search);
    if (type) params.set("type", type);
    setLoading(true);
    setError(null);
    void apiRequest<TransactionPage>(`/api/transactions?${params.toString()}`)
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((requestError) => {
        if (!cancelled)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Não foi possível carregar as transações.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authReady, page, reloadKey, search, type]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace(appRoutes.login);
  }

  const userName = String(
    user?.user_metadata.name ??
      user?.user_metadata.full_name ??
      user?.email?.split("@")[0] ??
      "Sua conta",
  );
  return (
    <AppShell
      userName={userName}
      userEmail={user?.email ?? ""}
      onLogout={() => void logout()}
    >
      <Stack spacing={3} sx={{ maxWidth: 1180, mx: "auto" }}>
        <Box>
          <Typography variant="h4">Transações</Typography>
          <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
            Consulte e filtre todas as suas movimentações.
          </Typography>
        </Box>

        <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "minmax(0,1fr) 180px" },
              gap: 1.5,
            }}
          >
            <TextField
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              size="small"
              placeholder="Buscar estabelecimento ou descrição"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <FormControl size="small">
              <Select
                value={type}
                displayEmpty
                onChange={(event) => {
                  setType(event.target.value as "" | TransactionType);
                  setPage(1);
                }}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="INCOME">Entradas</MenuItem>
                <MenuItem value="EXPENSE">Saídas</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {error ? (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                onClick={() => setReloadKey((current) => current + 1)}
              >
                Tentar novamente
              </Button>
            }
          >
            {error}
          </Alert>
        ) : null}

        <Paper sx={{ overflow: "hidden" }}>
          <Box
            sx={{
              px: { xs: 2, sm: 3 },
              py: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography sx={{ fontWeight: 700 }}>Movimentações</Typography>
            <Chip
              size="small"
              variant="outlined"
              label={
                result
                  ? `${result.total} ${result.total === 1 ? "registro" : "registros"}`
                  : "Carregando"
              }
            />
          </Box>
          <Divider />
          {loading ? <TransactionSkeleton /> : null}
          {!loading && result?.items.length === 0 ? (
            <Box sx={{ py: 10, px: 2, textAlign: "center" }}>
              <Typography sx={{ fontWeight: 650 }}>
                Nenhuma transação encontrada
              </Typography>
              <Typography
                sx={{ fontSize: 13, color: "text.secondary", mt: 0.5 }}
              >
                Ajuste os filtros ou sincronize uma conta.
              </Typography>
            </Box>
          ) : null}
          {!loading
            ? result?.items.map((transaction, index) => (
                <Box key={transaction.id}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: { xs: 1.25, sm: 2 },
                      px: { xs: 2, sm: 3 },
                      py: 1.75,
                    }}
                  >
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        flexShrink: 0,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 2,
                        bgcolor:
                          transaction.type === "INCOME"
                            ? "rgba(66,199,122,.12)"
                            : "action.hover",
                        color:
                          transaction.type === "INCOME"
                            ? "success.main"
                            : "text.secondary",
                      }}
                    >
                      {transaction.type === "INCOME" ? (
                        <ArrowUpwardOutlined fontSize="small" />
                      ) : (
                        <ArrowDownwardOutlined fontSize="small" />
                      )}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography noWrap sx={{ fontSize: 14, fontWeight: 650 }}>
                        {transaction.merchantName ?? transaction.description}
                      </Typography>
                      <Typography
                        noWrap
                        sx={{ fontSize: 11.5, color: "text.secondary" }}
                      >
                        {transaction.category?.name ?? "Sem categoria"} ·{" "}
                        {transaction.account.name} ·{" "}
                        {date.format(new Date(transaction.date))}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontSize: 14,
                        fontWeight: 750,
                        color:
                          transaction.type === "INCOME"
                            ? "success.main"
                            : "text.primary",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {transaction.type === "INCOME" ? "+" : "−"}
                      {currency.format(Math.abs(transaction.amount))}
                    </Typography>
                  </Box>
                  {index < result.items.length - 1 ? <Divider /> : null}
                </Box>
              ))
            : null}
        </Paper>

        {result && result.totalPages > 1 ? (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Pagination
              count={result.totalPages}
              page={result.page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        ) : null}
      </Stack>
    </AppShell>
  );
}

function TransactionSkeleton() {
  return (
    <Stack divider={<Divider flexItem />}>
      {Array.from({ length: 7 }, (_, index) => (
        <Box
          key={index}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            px: 3,
            py: 1.75,
          }}
        >
          <Skeleton variant="rounded" width={38} height={38} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="38%" />
            <Skeleton width="62%" />
          </Box>
          <CircularProgress size={16} />
        </Box>
      ))}
    </Stack>
  );
}
