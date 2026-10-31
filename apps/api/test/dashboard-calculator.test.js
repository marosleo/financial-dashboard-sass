const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  buildAvailablePeriods,
  buildSpendingByCategory,
  getPeriodBounds,
} = require("../dist/modules/dashboard/dashboard-calculator.js");

test("builds descending month options between the first and latest expense", () => {
  const periods = buildAvailablePeriods(
    new Date("2026-07-10T12:00:00.000Z"),
    new Date("2026-09-20T12:00:00.000Z"),
    "2026-10",
  );

  assert.deepEqual(periods, ["2026-09", "2026-08", "2026-07"]);
});

test("uses the selected calendar month as UTC query boundaries", () => {
  const bounds = getPeriodBounds("2026-12");

  assert.equal(bounds.start.toISOString(), "2026-12-01T00:00:00.000Z");
  assert.equal(bounds.end.toISOString(), "2027-01-01T00:00:00.000Z");
});

test("groups expenses by category and ignores income", () => {
  const decimal = (value) => ({ toNumber: () => value });
  const result = buildSpendingByCategory([
    {
      amount: decimal(-150),
      type: "EXPENSE",
      category: { id: "home", name: "Moradia", color: "#123456" },
    },
    {
      amount: decimal(-50),
      type: "EXPENSE",
      category: null,
    },
    {
      amount: decimal(1000),
      type: "INCOME",
      category: { id: "income", name: "Receitas", color: "#654321" },
    },
  ]);

  assert.equal(result.length, 2);
  assert.equal(result[0].categoryName, "Moradia");
  assert.equal(result[0].percentage, 75);
  assert.equal(result[1].categoryName, "Sem categoria");
});
