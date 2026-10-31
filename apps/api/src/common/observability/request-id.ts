import { randomUUID } from "node:crypto";

const safeRequestId = /^[a-zA-Z0-9._-]{1,128}$/;

export function resolveRequestId(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && safeRequestId.test(candidate) ? candidate : randomUUID();
}
