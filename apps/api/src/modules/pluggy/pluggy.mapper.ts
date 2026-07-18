import type {
  Account as PluggyAccount,
  Item as PluggyItem,
  Transaction as PluggyTransaction,
} from "pluggy-sdk";
import type {
  AccountType,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";

const categoryColors = [
  "#315c49",
  "#9f5138",
  "#3d6082",
  "#75527f",
  "#8a6a32",
  "#9a4141",
];

export function mapPluggyConnection(item: PluggyItem) {
  return {
    pluggyItemId: item.id,
    connectorId: item.connector.id,
    institution: item.connector.name,
    status: item.status,
    executionStatus: item.executionStatus,
    errorCode: item.error?.code ?? null,
    errorMessage: item.error?.message ?? null,
    consentExpiresAt: item.consentExpiresAt ?? null,
  };
}

export function mapPluggyAccount(account: PluggyAccount) {
  return {
    pluggyAccountId: account.id,
    name: account.marketingName?.trim() || account.name,
    type: mapAccountType(account),
    balance: account.type === "CREDIT" ? -account.balance : account.balance,
    currency: account.currencyCode,
  };
}

export function mapPluggyTransaction(transaction: PluggyTransaction) {
  const type: TransactionType =
    transaction.type === "CREDIT" ? "INCOME" : "EXPENSE";

  return {
    pluggyTransactionId: transaction.id,
    pluggyProviderId: transaction.providerId ?? null,
    description:
      transaction.descriptionRaw?.trim() || transaction.description.trim(),
    merchantName: transaction.merchant?.name ?? null,
    amount:
      type === "INCOME"
        ? Math.abs(transaction.amount)
        : -Math.abs(transaction.amount),
    type,
    status: (transaction.status ?? "POSTED") as TransactionStatus,
    date: new Date(transaction.date),
    categoryName:
      transaction.category ?? transaction.merchant?.category ?? null,
  };
}

export function getCategoryAppearance(name: string) {
  const hash = Array.from(name).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return {
    color: categoryColors[hash % categoryColors.length],
    icon: "tag",
  };
}

function mapAccountType(account: PluggyAccount): AccountType {
  if (account.type === "CREDIT") {
    return "CREDIT_CARD";
  }

  return account.subtype === "SAVINGS_ACCOUNT" ? "SAVINGS" : "CHECKING";
}
