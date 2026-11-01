const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  isPublicRequest,
} = require("../dist/common/auth/public-request.js");

test("allows health checks using the original URL", () => {
  assert.equal(
    isPublicRequest({
      method: "GET",
      path: "/health/ready",
      originalUrl: "/api/health/ready",
    }),
    true,
  );
});

test("allows health checks with query parameters", () => {
  assert.equal(
    isPublicRequest({
      method: "GET",
      path: "/api/health?source=render",
    }),
    true,
  );
});

test("keeps protected API routes private", () => {
  assert.equal(
    isPublicRequest({ method: "GET", path: "/api/dashboard" }),
    false,
  );
  assert.equal(
    isPublicRequest({ method: "POST", path: "/api/health/ready" }),
    false,
  );
});

test("allows Pluggy webhook requests", () => {
  assert.equal(
    isPublicRequest({ method: "POST", path: "/api/pluggy/webhooks" }),
    true,
  );
});
