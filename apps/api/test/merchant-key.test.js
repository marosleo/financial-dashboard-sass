const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  getMerchantKey,
} = require("../dist/common/categorization/merchant-key.js");

test("creates a stable merchant key from accents and punctuation", () => {
  assert.equal(
    getMerchantKey("O Fornão - Centro", "ignored"),
    "o-fornao-centro",
  );
});

test("uses the transaction description when merchant is missing", () => {
  assert.equal(
    getMerchantKey(null, "  Monthly Subscription  "),
    "monthly-subscription",
  );
});
