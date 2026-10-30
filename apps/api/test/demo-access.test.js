const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  DEMO_HEADER,
  DEMO_HEADER_VALUE,
  isReadOnlyDemoRequest,
} = require("../dist/common/auth/demo-access.js");

function request(method, path, value = DEMO_HEADER_VALUE) {
  return { method, path, headers: { [DEMO_HEADER]: value } };
}

test("allows demo access only to explicitly public read routes", () => {
  assert.equal(isReadOnlyDemoRequest(request("GET", "/api/dashboard")), true);
  assert.equal(
    isReadOnlyDemoRequest(request("GET", "/api/transactions")),
    true,
  );
});

test("rejects writes and non-allowlisted routes in demo mode", () => {
  assert.equal(
    isReadOnlyDemoRequest(request("POST", "/api/insights/generate")),
    false,
  );
  assert.equal(
    isReadOnlyDemoRequest(request("GET", "/api/pluggy/connect-token")),
    false,
  );
  assert.equal(
    isReadOnlyDemoRequest(request("GET", "/api/dashboard", "invalid")),
    false,
  );
});
