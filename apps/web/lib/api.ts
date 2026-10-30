import { env } from "./env";
import { getSupabaseAccessToken } from "./supabase";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
  cache?: RequestCache;
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function friendlyRequestError(
  error: unknown,
  fallback = "Não foi possível concluir a operação.",
) {
  if (!(error instanceof Error)) return fallback;
  if (/failed to fetch|networkerror|load failed/i.test(error.message)) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
  }
  if (error instanceof ApiError && error.status === 401) {
    return "Sua sessão expirou. Entre novamente para continuar.";
  }
  return error.message || fallback;
}

export async function apiRequest<TResponse>(
  path: string,
  options: RequestOptions = {},
) {
  const accessToken = await getSupabaseAccessToken();
  const response = await fetch(`${env.apiUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: options.cache ?? "no-store",
  });

  if (!response.ok) {
    throw new ApiError(response.status, await getErrorMessage(response));
  }

  return (await response.json()) as TResponse;
}

async function getErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as {
      message?: string | string[];
      error?: string;
    };

    if (Array.isArray(body.message)) {
      return body.message.join(" ");
    }

    return body.message ?? body.error ?? `Request failed (${response.status}).`;
  } catch {
    return `Request failed (${response.status}).`;
  }
}
