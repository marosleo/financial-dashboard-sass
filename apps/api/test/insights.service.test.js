const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  createFallbackInsights,
} = require("../dist/modules/insights/insights.service.js");

test("creates a useful empty-state insight", () => {
  const result = createFallbackInsights([]);

  assert.equal(result.insights.length, 1);
  assert.equal(result.insights[0].severity, "INFO");
  assert.match(result.insights[0].summary, /Sincronize uma conta/);
});

test("summarizes cash flow and the largest expense category", () => {
  const result = createFallbackInsights([
    {
      date: "2026-09-01",
      description: "Salary",
      amount: 5_000,
      type: "INCOME",
      category: "Receitas",
    },
    {
      date: "2026-09-02",
      description: "Rent",
      amount: -2_000,
      type: "EXPENSE",
      category: "Moradia",
    },
    {
      date: "2026-09-03",
      description: "Market",
      amount: -500,
      type: "EXPENSE",
      category: "Alimentação",
    },
  ]);

  assert.equal(result.insights.length, 3);
  assert.equal(result.insights[0].severity, "POSITIVE");
  assert.match(result.insights[0].summary, /R\$\s?5\.000,00/);
  assert.equal(result.insights[1].title, "Moradia lidera os gastos");
  assert.match(result.insights[1].summary, /80% das saídas/);
});

test("warns when expenses exceed income", () => {
  const result = createFallbackInsights([
    {
      date: "2026-09-01",
      description: "Income",
      amount: 1_000,
      type: "INCOME",
      category: "Receitas",
    },
    {
      date: "2026-09-02",
      description: "Expense",
      amount: -1_500,
      type: "EXPENSE",
      category: "Outros",
    },
  ]);

  assert.equal(result.insights[0].title, "Saídas acima das entradas");
  assert.equal(result.insights[0].severity, "WARNING");
});
