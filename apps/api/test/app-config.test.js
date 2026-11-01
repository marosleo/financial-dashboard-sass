const assert = require("node:assert/strict");
const { test } = require("node:test");
const { appConfig } = require("../dist/config/app-config.js");

test("controls Pluggy sandbox connectors independently from NODE_ENV", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousSandboxEnabled = process.env.PLUGGY_SANDBOX_ENABLED;

  try {
    process.env.NODE_ENV = "production";
    process.env.PLUGGY_SANDBOX_ENABLED = "true";
    assert.equal(appConfig().app.pluggySandboxEnabled, true);

    process.env.NODE_ENV = "development";
    process.env.PLUGGY_SANDBOX_ENABLED = "false";
    assert.equal(appConfig().app.pluggySandboxEnabled, false);
  } finally {
    restoreEnv("NODE_ENV", previousNodeEnv);
    restoreEnv("PLUGGY_SANDBOX_ENABLED", previousSandboxEnabled);
  }
});

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
