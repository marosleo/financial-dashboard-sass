"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type {
  PluggyConnectTokenResponse,
  PluggyConnectionSummary,
  PluggyIntegrationStatus,
  PluggySyncResult,
} from "@financial-dashboard/shared";
import { apiRequest } from "../../lib/api";

const PluggyConnect = dynamic(
  () => import("react-pluggy-connect").then((module) => module.PluggyConnect),
  { ssr: false },
);

type WidgetSession = {
  accessToken: string;
  itemId?: string;
};

export function BankConnections({
  integration,
  onChanged,
}: {
  integration: PluggyIntegrationStatus;
  onChanged: () => Promise<void>;
}) {
  const [widget, setWidget] = useState<WidgetSession | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [disconnectCandidate, setDisconnectCandidate] = useState<string | null>(
    null,
  );
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  async function openNewConnection() {
    await runAction("connect", async () => {
      const token = await apiRequest<PluggyConnectTokenResponse>(
        "/api/pluggy/connect-token",
        { method: "POST" },
      );
      setWidget(token);
    });
  }

  async function openConnectionUpdate(connectionId: string) {
    await runAction(`update:${connectionId}`, async () => {
      const token = await apiRequest<PluggyConnectTokenResponse>(
        `/api/pluggy/connections/${connectionId}/connect-token`,
        { method: "POST" },
      );
      setWidget(token);
    });
  }

  async function syncConnection(connectionId: string) {
    await runAction(`sync:${connectionId}`, async () => {
      const result = await apiRequest<PluggySyncResult>(
        `/api/pluggy/connections/${connectionId}/sync`,
        { method: "POST" },
      );
      await onChanged();
      setMessage({
        tone: "success",
        text: `Synced ${result.accountsSynced} accounts and ${result.transactionsSynced} transactions.`,
      });
    });
  }

  async function disconnect(connectionId: string) {
    await runAction(`disconnect:${connectionId}`, async () => {
      await apiRequest(`/api/pluggy/connections/${connectionId}`, {
        method: "DELETE",
      });
      setDisconnectCandidate(null);
      await onChanged();
      setMessage({ tone: "success", text: "Bank connection removed." });
    });
  }

  async function handleWidgetSuccess(data: { item: { id: string } }) {
    await runAction("import", async () => {
      const result = await apiRequest<PluggySyncResult>(
        `/api/pluggy/items/${data.item.id}/sync`,
        { method: "POST" },
      );
      setWidget(null);
      await onChanged();
      setMessage({
        tone: "success",
        text: `Imported ${result.transactionsSynced} transactions from ${result.connection.institution}.`,
      });
    });
  }

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
            : "The bank connection could not be completed.",
      });
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-neutral-950 px-5 py-6 text-white shadow-sm sm:px-7 sm:py-7">
      <div className="pointer-events-none absolute -right-24 -top-32 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.16),_transparent_68%)]" />
      <div className="relative grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-400">
              Open Finance
            </p>
            <StatusPill configured={integration.configured} />
          </div>
          <h2 className="mt-5 max-w-md text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
            Your banks, synchronized in one place.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-neutral-400">
            Pluggy handles bank consent. Accounts and transactions are copied to
            PostgreSQL so this dashboard stays fast and auditable.
          </p>

          <button
            type="button"
            disabled={!integration.configured || activeAction !== null}
            onClick={() => void openNewConnection()}
            className="mt-6 rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
          >
            {activeAction === "connect"
              ? "Preparing Pluggy..."
              : "Connect bank"}
          </button>

          {!integration.configured ? (
            <p className="mt-3 text-xs leading-5 text-amber-200">
              Add PLUGGY_CLIENT_ID and PLUGGY_CLIENT_SECRET to enable real
              connections.
            </p>
          ) : (
            <p className="mt-3 text-xs text-neutral-500">
              {integration.sandboxEnabled
                ? "Sandbox institutions are enabled in development."
                : "Production institutions only."}
            </p>
          )}
        </div>

        <div className="grid gap-3">
          {integration.connections.length === 0 ? (
            <EmptyConnections configured={integration.configured} />
          ) : (
            integration.connections.map((connection) => (
              <ConnectionRow
                key={connection.id}
                connection={connection}
                activeAction={activeAction}
                disconnectCandidate={disconnectCandidate}
                onCancelDisconnect={() => setDisconnectCandidate(null)}
                onDisconnect={() => void disconnect(connection.id)}
                onRequestDisconnect={() =>
                  setDisconnectCandidate(connection.id)
                }
                onSync={() => void syncConnection(connection.id)}
                onUpdate={() => void openConnectionUpdate(connection.id)}
              />
            ))
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1 text-xs text-neutral-500">
            <span>
              Webhook{" "}
              {integration.webhookConfigured ? "active" : "not configured"}
            </span>
            <span>{integration.connections.length} connected institutions</span>
          </div>
        </div>
      </div>

      {message ? (
        <div
          className={`relative mt-5 rounded-2xl border px-4 py-3 text-sm ${
            message.tone === "success"
              ? "border-emerald-800 bg-emerald-950 text-emerald-100"
              : "border-red-800 bg-red-950 text-red-100"
          }`}
        >
          {message.text}
        </div>
      ) : null}

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
          onError={(error) => {
            setMessage({ tone: "error", text: error.message });
          }}
          onLoadError={(error) => {
            setWidget(null);
            setMessage({ tone: "error", text: error.message });
          }}
          onSuccess={handleWidgetSuccess}
        />
      ) : null}
    </section>
  );
}

function ConnectionRow({
  connection,
  activeAction,
  disconnectCandidate,
  onCancelDisconnect,
  onDisconnect,
  onRequestDisconnect,
  onSync,
  onUpdate,
}: {
  connection: PluggyConnectionSummary;
  activeAction: string | null;
  disconnectCandidate: string | null;
  onCancelDisconnect: () => void;
  onDisconnect: () => void;
  onRequestDisconnect: () => void;
  onSync: () => void;
  onUpdate: () => void;
}) {
  const isBusy = activeAction?.endsWith(connection.id) ?? false;
  const needsAttention =
    connection.status === "LOGIN_ERROR" ||
    connection.status === "OUTDATED" ||
    Boolean(connection.errorCode);
  const isDisconnecting = disconnectCandidate === connection.id;

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                needsAttention ? "bg-amber-300" : "bg-emerald-300"
              }`}
            />
            <p className="truncate font-medium">{connection.institution}</p>
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            {formatConnectionStatus(connection)} · {connection.accountsCount}{" "}
            accounts · {formatLastSync(connection.lastSyncedAt)}
          </p>
          {connection.errorMessage ? (
            <p className="mt-2 text-xs text-amber-200">
              {connection.errorMessage}
            </p>
          ) : null}
        </div>

        {isDisconnecting ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onCancelDisconnect}
              className="rounded-full border border-white/15 px-3 py-2 text-xs text-neutral-300 transition hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={onDisconnect}
              className="rounded-full bg-red-200 px-3 py-2 text-xs font-semibold text-red-950 transition hover:bg-red-100 disabled:opacity-50"
            >
              Confirm removal
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <SmallAction disabled={isBusy} onClick={onSync}>
              Sync
            </SmallAction>
            <SmallAction disabled={isBusy} onClick={onUpdate}>
              Reconnect
            </SmallAction>
            <SmallAction disabled={isBusy} onClick={onRequestDisconnect} muted>
              Remove
            </SmallAction>
          </div>
        )}
      </div>
    </article>
  );
}

function SmallAction({
  children,
  disabled,
  muted = false,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  muted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-xs transition disabled:cursor-wait disabled:opacity-40 ${
        muted
          ? "border-transparent text-neutral-500 hover:text-white"
          : "border-white/15 text-neutral-200 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function StatusPill({ configured }: { configured: boolean }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${
        configured
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          : "border-amber-400/30 bg-amber-400/10 text-amber-200"
      }`}
    >
      {configured ? "Ready" : "Setup required"}
    </span>
  );
}

function EmptyConnections({ configured }: { configured: boolean }) {
  return (
    <div className="flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center">
      <div>
        <p className="text-sm font-medium text-neutral-200">
          {configured
            ? "No bank connected yet"
            : "Pluggy is waiting for credentials"}
        </p>
        <p className="mt-2 max-w-sm text-xs leading-5 text-neutral-500">
          {configured
            ? "Use the sandbox institution first, then connect a real Open Finance account."
            : "The rest of the dashboard continues using seeded demonstration data."}
        </p>
      </div>
    </div>
  );
}

function formatConnectionStatus(connection: PluggyConnectionSummary) {
  if (connection.status === "UPDATED") {
    return "Connected";
  }

  return connection.status
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function formatLastSync(value: string | null) {
  if (!value) {
    return "not synchronized";
  }

  return `synced ${new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))}`;
}
