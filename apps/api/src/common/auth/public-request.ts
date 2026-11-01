const PUBLIC_HEALTH_PATHS = new Set(["/api/health", "/api/health/ready"]);
const PLUGGY_WEBHOOK_PATH = "/api/pluggy/webhooks";

type PublicRequest = {
  method?: string;
  path: string;
  originalUrl?: string;
};

function getRequestPath(request: PublicRequest) {
  return (request.originalUrl ?? request.path).split("?", 1)[0];
}

export function isPublicRequest(request: PublicRequest) {
  const path = getRequestPath(request);

  return (
    (request.method === "GET" && PUBLIC_HEALTH_PATHS.has(path)) ||
    path === PLUGGY_WEBHOOK_PATH
  );
}
