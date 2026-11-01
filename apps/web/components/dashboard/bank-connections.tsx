"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type {
  PluggyConnectTokenResponse,
  PluggyConnectionSummary,
  PluggyIntegrationStatus,
  PluggySyncResult,
} from "@financial-dashboard/shared";
import {
  AccountBalanceOutlined,
  AddOutlined,
  DeleteOutlined,
  RefreshOutlined,
  SyncOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { apiRequest } from "../../lib/api";

const PluggyConnect = dynamic(
  () => import("react-pluggy-connect").then((module) => module.PluggyConnect),
  { ssr: false },
);

type WidgetSession = { accessToken: string; itemId?: string };

export function BankConnections({
  integration,
  onChanged,
  readOnly = false,
}: {
  integration: PluggyIntegrationStatus;
  onChanged: () => Promise<void>;
  readOnly?: boolean;
}) {
  const [widget, setWidget] = useState<WidgetSession | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [disconnectCandidate, setDisconnectCandidate] =
    useState<PluggyConnectionSummary | null>(null);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  async function runAction(action: string, operation: () => Promise<void>) {
    setActiveAction(action);
    setMessage(null);
    try {
      await operation();
    } catch (error) {
      setMessage({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Não foi possível concluir a conexão bancária.",
      });
    } finally {
      setActiveAction(null);
    }
  }

  function openNewConnection() {
    void runAction("connect", async () => {
      setWidget(
        await apiRequest<PluggyConnectTokenResponse>(
          "/api/pluggy/connect-token",
          { method: "POST" },
        ),
      );
    });
  }

  function openConnectionUpdate(connectionId: string) {
    void runAction(`update:${connectionId}`, async () => {
      setWidget(
        await apiRequest<PluggyConnectTokenResponse>(
          `/api/pluggy/connections/${connectionId}/connect-token`,
          { method: "POST" },
        ),
      );
    });
  }

  function syncConnection(connectionId: string) {
    void runAction(`sync:${connectionId}`, async () => {
      const result = await apiRequest<PluggySyncResult>(
        `/api/pluggy/connections/${connectionId}/sync`,
        { method: "POST" },
      );
      await onChanged();
      setMessage({
        tone: "success",
        text: `${result.accountsSynced} contas e ${result.transactionsSynced} transações sincronizadas.`,
      });
    });
  }

  function disconnect() {
    if (!disconnectCandidate) return;
    const connection = disconnectCandidate;
    void runAction(`disconnect:${connection.id}`, async () => {
      await apiRequest(`/api/pluggy/connections/${connection.id}`, {
        method: "DELETE",
      });
      setDisconnectCandidate(null);
      await onChanged();
      setMessage({ tone: "success", text: "Conexão bancária removida." });
    });
  }

  function handleWidgetSuccess(data: { item: { id: string } }) {
    void runAction("import", async () => {
      const result = await apiRequest<PluggySyncResult>(
        `/api/pluggy/items/${data.item.id}/sync`,
        { method: "POST" },
      );
      setWidget(null);
      await onChanged();
      setMessage({
        tone: "success",
        text: `${result.transactionsSynced} transações importadas de ${result.connection.institution}.`,
      });
    });
  }

  const busy = activeAction !== null;
  return (
    <Stack spacing={1.5}>
      <Paper
        sx={{
          p: 2.25,
          display: "flex",
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 2,
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              display: "grid",
              placeItems: "center",
              borderRadius: 2.5,
              bgcolor: "primary.main",
              color: "primary.contrastText",
            }}
          >
            <AccountBalanceOutlined />
          </Box>
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography sx={{ fontWeight: 700 }}>Open Finance</Typography>
              <Chip
                size="small"
                color={integration.configured ? "success" : "warning"}
                label={
                  readOnly
                    ? "Dados fictícios"
                    : integration.configured
                      ? "Disponível"
                      : "Configuração pendente"
                }
              />
            </Stack>
            <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.3 }}>
              {integration.connections.length === 0
                ? "Conecte suas contas para consolidar saldos e transações."
                : `${integration.connections.length} ${integration.connections.length === 1 ? "instituição conectada" : "instituições conectadas"}`}
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="contained"
          startIcon={
            activeAction === "connect" ? (
              <CircularProgress size={15} />
            ) : (
              <AddOutlined />
            )
          }
          disabled={readOnly || !integration.configured || busy}
          onClick={openNewConnection}
        >
          Conectar instituição
        </Button>
      </Paper>

      {integration.connections.length > 0 ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2,1fr)" },
            gap: 1.5,
          }}
        >
          {integration.connections.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              busy={busy}
              activeAction={activeAction}
              onSync={() => syncConnection(connection.id)}
              onUpdate={() => openConnectionUpdate(connection.id)}
              onRemove={() => setDisconnectCandidate(connection)}
              readOnly={readOnly}
            />
          ))}
        </Box>
      ) : null}

      {message ? (
        <Alert severity={message.tone} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      ) : null}

      <Dialog
        open={Boolean(disconnectCandidate)}
        onClose={() => setDisconnectCandidate(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Remover conexão?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            As contas e transações importadas de{" "}
            {disconnectCandidate?.institution} serão removidas do Nexo.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisconnectCandidate(null)}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            disabled={busy}
            onClick={disconnect}
          >
            Remover
          </Button>
        </DialogActions>
      </Dialog>

      {widget ? (
        <PluggyConnect
          key={`${widget.accessToken}:${widget.itemId ?? "new"}`}
          connectToken={widget.accessToken}
          updateItem={widget.itemId}
          includeSandbox={integration.sandboxEnabled}
          countries={["BR"]}
          products={["ACCOUNTS", "TRANSACTIONS"]}
          language="pt"
          theme="light"
          onClose={() => setWidget(null)}
          onError={(error) =>
            setMessage({ tone: "error", text: error.message })
          }
          onLoadError={(error) => {
            setWidget(null);
            setMessage({ tone: "error", text: error.message });
          }}
          onSuccess={handleWidgetSuccess}
        />
      ) : null}
    </Stack>
  );
}

function ConnectionCard({
  connection,
  busy,
  activeAction,
  onSync,
  onUpdate,
  onRemove,
  readOnly,
}: {
  connection: PluggyConnectionSummary;
  busy: boolean;
  activeAction: string | null;
  onSync: () => void;
  onUpdate: () => void;
  onRemove: () => void;
  readOnly: boolean;
}) {
  const needsAttention =
    connection.status === "LOGIN_ERROR" ||
    connection.status === "OUTDATED" ||
    Boolean(connection.errorCode);
  const syncing = activeAction === `sync:${connection.id}`;
  return (
    <Paper sx={{ p: 2, display: "flex", gap: 1.5, alignItems: "center" }}>
      <Box
        sx={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          bgcolor: needsAttention ? "warning.main" : "success.main",
        }}
      />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography noWrap sx={{ fontSize: 13, fontWeight: 700 }}>
          {connection.institution}
        </Typography>
        <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
          {connection.accountsCount}{" "}
          {connection.accountsCount === 1 ? "conta" : "contas"} ·{" "}
          {formatLastSync(connection.lastSyncedAt)}
        </Typography>
        {connection.errorMessage ? (
          <Typography sx={{ fontSize: 11, color: "warning.main", mt: 0.5 }}>
            {connection.errorMessage}
          </Typography>
        ) : null}
      </Box>
      <Stack direction="row" spacing={0.25}>
        <Tooltip title="Sincronizar">
          <span>
            <IconButton
              size="small"
              disabled={busy || readOnly}
              onClick={onSync}
              aria-label="Sincronizar"
            >
              {syncing ? (
                <CircularProgress size={17} />
              ) : (
                <SyncOutlined fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Reconectar">
          <span>
            <IconButton
              size="small"
              disabled={busy || readOnly}
              onClick={onUpdate}
              aria-label="Reconectar"
            >
              <RefreshOutlined fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Remover">
          <span>
            <IconButton
              size="small"
              disabled={busy || readOnly}
              onMouseDown={(event) => event.preventDefault()}
              onClick={onRemove}
              aria-label="Remover"
            >
              <DeleteOutlined fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Paper>
  );
}

function formatLastSync(value: string | null) {
  if (!value) return "ainda não sincronizada";
  return `sincronizado em ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value))}`;
}
