export const DEMO_HEADER = "x-nexo-demo";
export const DEMO_HEADER_VALUE = "portfolio";

export const DEMO_IDENTITY = {
  id: "nexo-portfolio-demo",
  name: "Visitante",
  email: "demo@nexo.app",
} as const;

const READ_ONLY_DEMO_PATHS = new Set([
  "/api/accounts",
  "/api/auth/me",
  "/api/auth/status",
  "/api/dashboard",
  "/api/dashboard/categories",
  "/api/insights",
  "/api/insights/status",
  "/api/pluggy/status",
  "/api/planning",
  "/api/transactions",
  "/api/transactions/categories",
  "/api/transactions/status",
]);

export function isReadOnlyDemoRequest(request: {
  method?: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
}) {
  return (
    request.method === "GET" &&
    request.headers[DEMO_HEADER] === DEMO_HEADER_VALUE &&
    READ_ONLY_DEMO_PATHS.has(request.path)
  );
}
