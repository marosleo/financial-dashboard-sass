const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  calculateProjection,
  detectRecurringExpenses,
} = require("../dist/modules/planning/planning-calculator.js");

function expense(date, merchantName, amount) {
  return {
    amount: -amount,
    type: "EXPENSE",
    date: new Date(`${date}T12:00:00.000Z`),
    description: merchantName,
    merchantName,
    category: { id: "housing", name: "Moradia", color: "#8b7cf6" },
  };
}

test("detects stable expenses repeated across at least three months", () => {
  const transactions = [
    expense("2026-07-08", "Imobiliária Joinville", 2100),
    expense("2026-08-08", "Imobiliária Joinville", 2100),
    expense("2026-09-09", "Imobiliária Joinville", 2150),
    expense("2026-07-15", "Viagem", 100),
    expense("2026-08-15", "Viagem", 600),
    expense("2026-09-15", "Viagem", 120),
  ];

  const result = detectRecurringExpenses(
    transactions,
    new Date("2026-10-05T12:00:00.000Z"),
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].merchantKey, "imobiliaria-joinville");
  assert.equal(result[0].averageAmount, 2116.67);
  assert.equal(result[0].monthsObserved, 3);
  assert.equal(result[0].nextExpectedDate.slice(0, 10), "2026-10-08");
});

test("moves the next recurrence to the following month after it occurred", () => {
  const transactions = [
    expense("2026-08-08", "Streaming", 99),
    expense("2026-09-08", "Streaming", 99),
    expense("2026-10-08", "Streaming", 99),
  ];

  const [result] = detectRecurringExpenses(
    transactions,
    new Date("2026-10-05T12:00:00.000Z"),
  );

  assert.equal(result.nextExpectedDate.slice(0, 10), "2026-11-08");
});

test("blends current spending pace with historical monthly averages", () => {
  const transactions = [
    expense("2026-08-10", "Mercado", 1000),
    expense("2026-09-10", "Mercado", 1200),
    expense("2026-10-10", "Mercado", 500),
    {
      ...expense("2026-09-05", "Empresa", 7000),
      type: "INCOME",
      amount: 7000,
    },
  ];

  const result = calculateProjection(
    transactions,
    new Date("2026-10-15T12:00:00.000Z"),
  );

  assert.equal(result.currentExpenses, 500);
  assert.equal(result.historicalExpenseAverage, 1100);
  assert.equal(result.projectedIncome, 3500);
  assert.equal(result.confidence, "MEDIUM");
  assert.ok(result.projectedExpenses > result.currentExpenses);
});
