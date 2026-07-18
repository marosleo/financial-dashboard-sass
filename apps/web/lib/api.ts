import { env } from "./env";

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

export async function apiRequest<TResponse>(
  path: string,
  options: RequestOptions = {},
) {
  const response = await fetch(`${env.apiUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
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
