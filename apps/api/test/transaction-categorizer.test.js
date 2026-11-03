const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  inferTransactionCategory,
} = require("../dist/common/categorization/transaction-categorizer.js");

test("translates a provider category into the canonical taxonomy", () => {
  const result = inferTransactionCategory({
    type: "EXPENSE",
    providerCategory: "Food and restaurants",
    merchantName: "Restaurant",
    description: "Card purchase",
  });

  assert.deepEqual(result, {
    name: "Alimentação",
    source: "PROVIDER",
    confidence: 0.7,
  });
});

test("categorizes income when the provider omits a category", () => {
  const result = inferTransactionCategory({
    type: "INCOME",
    providerCategory: null,
    merchantName: null,
    description: "Monthly salary",
  });

  assert.deepEqual(result, {
    name: "Receitas",
    source: "HEURISTIC",
    confidence: 0.9,
  });
});

test("categorizes an expense from merchant and description", () => {
  const result = inferTransactionCategory({
    type: "EXPENSE",
    providerCategory: null,
    merchantName: "Uber",
    description: "Trip",
  });

  assert.equal(result.name, "Transporte");
  assert.equal(result.source, "HEURISTIC");
});

test("uses a visible fallback instead of leaving a transaction uncategorized", () => {
  const result = inferTransactionCategory({
    type: "EXPENSE",
    providerCategory: null,
    merchantName: null,
    description: "Unrecognized purchase",
  });

  assert.equal(result.name, "Outros");
  assert.equal(result.source, "HEURISTIC");
});
