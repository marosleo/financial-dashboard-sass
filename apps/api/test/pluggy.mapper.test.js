const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  getCategoryAppearance,
  mapPluggyAccount,
  mapPluggyTransaction,
} = require("../dist/modules/pluggy/pluggy.mapper.js");

test("maps bank accounts without changing their balance", () => {
  const result = mapPluggyAccount({
    id: "bank-account",
    type: "BANK",
    subtype: "CHECKING_ACCOUNT",
    name: "Checking",
    marketingName: "Everyday account",
    balance: 1500.25,
    currencyCode: "BRL",
  });

  assert.deepEqual(result, {
    pluggyAccountId: "bank-account",
    name: "Everyday account",
    type: "CHECKING",
    balance: 1500.25,
    currency: "BRL",
  });
});

test("maps credit card balances as liabilities", () => {
  const result = mapPluggyAccount({
    id: "credit-account",
    type: "CREDIT",
    subtype: "CREDIT_CARD",
    name: "Credit card",
    marketingName: null,
    balance: 420.5,
    currencyCode: "BRL",
  });

  assert.equal(result.type, "CREDIT_CARD");
  assert.equal(result.balance, -420.5);
});

test("normalizes Pluggy debits as negative expenses", () => {
  const result = mapPluggyTransaction({
    id: "debit-transaction",
    type: "DEBIT",
    amount: 89.9,
    date: new Date("2026-07-18T12:00:00.000Z"),
    description: "CARD PURCHASE",
    descriptionRaw: "Coffee shop",
    merchant: { name: "Coffee", category: "Restaurants" },
    category: null,
    categoryId: null,
    providerId: "provider-debit",
    status: "POSTED",
  });

  assert.equal(result.type, "EXPENSE");
  assert.equal(result.amount, -89.9);
  assert.equal(result.description, "Coffee shop");
  assert.equal(result.merchantName, "Coffee");
  assert.equal(result.categoryName, "Restaurants");
});

test("normalizes Pluggy credits as positive income", () => {
  const result = mapPluggyTransaction({
    id: "credit-transaction",
    type: "CREDIT",
    amount: -250,
    date: new Date("2026-07-18T12:00:00.000Z"),
    description: "Refund",
    descriptionRaw: null,
    merchant: undefined,
    category: "Refunds",
    categoryId: "refunds",
    providerId: null,
    status: "PENDING",
  });

  assert.equal(result.type, "INCOME");
  assert.equal(result.amount, 250);
  assert.equal(result.status, "PENDING");
});

test("generates stable category appearance", () => {
  assert.deepEqual(
    getCategoryAppearance("Restaurants"),
    getCategoryAppearance("Restaurants"),
  );
});
