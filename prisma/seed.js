const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DEMO_USER_ID = "nexo-portfolio-demo";
const categories = [
  { name: "Alimentação", color: "#76e6a2", icon: "restaurant" },
  { name: "Moradia", color: "#8b7cf6", icon: "home" },
  { name: "Transporte", color: "#4aa3df", icon: "directions-car" },
  { name: "Saúde", color: "#ef6b73", icon: "favorite" },
  { name: "Lazer", color: "#f1a65a", icon: "celebration" },
  { name: "Compras", color: "#d978b4", icon: "shopping-bag" },
  { name: "Educação", color: "#56b4b0", icon: "school" },
  { name: "Receitas", color: "#42c77a", icon: "payments" },
];

async function main() {
  const categoryIds = new Map();
  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { name: category.name },
      update: { color: category.color, icon: category.icon },
      create: category,
    });
    categoryIds.set(saved.name, saved.id);
  }

  await seedPortfolioDemo(categoryIds);
}

async function seedPortfolioDemo(categoryIds) {
  await prisma.user.upsert({
    where: { email: "demo@nexo.app" },
    update: { name: "Visitante" },
    create: {
      id: DEMO_USER_ID,
      name: "Visitante",
      email: "demo@nexo.app",
    },
  });

  const nubankConnection = await prisma.bankConnection.upsert({
    where: { pluggyItemId: "demo-nubank-item" },
    update: {
      userId: DEMO_USER_ID,
      institution: "Nubank",
      status: "UPDATED",
      executionStatus: "SUCCESS",
      lastSyncedAt: new Date(),
    },
    create: {
      id: "demo-nubank-connection",
      userId: DEMO_USER_ID,
      pluggyItemId: "demo-nubank-item",
      connectorId: 1,
      institution: "Nubank",
      status: "UPDATED",
      executionStatus: "SUCCESS",
      lastSyncedAt: new Date(),
    },
  });

  const investmentConnection = await prisma.bankConnection.upsert({
    where: { pluggyItemId: "demo-investment-item" },
    update: {
      userId: DEMO_USER_ID,
      institution: "XP Investimentos",
      status: "UPDATED",
      executionStatus: "SUCCESS",
      lastSyncedAt: new Date(),
    },
    create: {
      id: "demo-investment-connection",
      userId: DEMO_USER_ID,
      pluggyItemId: "demo-investment-item",
      connectorId: 2,
      institution: "XP Investimentos",
      status: "UPDATED",
      executionStatus: "SUCCESS",
      lastSyncedAt: new Date(),
    },
  });

  const checkingAccount = await prisma.account.upsert({
    where: { pluggyAccountId: "demo-checking-account" },
    update: {
      userId: DEMO_USER_ID,
      bankConnectionId: nubankConnection.id,
      balance: 8420.75,
    },
    create: {
      id: "demo-checking-account",
      userId: DEMO_USER_ID,
      bankConnectionId: nubankConnection.id,
      pluggyAccountId: "demo-checking-account",
      institution: "Nubank",
      name: "Conta principal",
      type: "CHECKING",
      balance: 8420.75,
    },
  });

  const investmentAccount = await prisma.account.upsert({
    where: { pluggyAccountId: "demo-investment-account" },
    update: {
      userId: DEMO_USER_ID,
      bankConnectionId: investmentConnection.id,
      balance: 12750.3,
    },
    create: {
      id: "demo-investment-account",
      userId: DEMO_USER_ID,
      bankConnectionId: investmentConnection.id,
      pluggyAccountId: "demo-investment-account",
      institution: "XP Investimentos",
      name: "Carteira de investimentos",
      type: "INVESTMENT",
      balance: 12750.3,
    },
  });

  const monthlyTransactions = [
    {
      key: "salary",
      day: 5,
      description: "Salário mensal",
      merchantName: "Empresa Tecnologia SA",
      amount: 7900,
      type: "INCOME",
      category: "Receitas",
      accountId: checkingAccount.id,
    },
    {
      key: "rent",
      day: 8,
      description: "Aluguel residencial",
      merchantName: "Imobiliária Joinville",
      amount: -2100,
      type: "EXPENSE",
      category: "Moradia",
      accountId: checkingAccount.id,
    },
    {
      key: "market",
      day: 12,
      description: "Compras do mês",
      merchantName: "Angeloni",
      amount: -680,
      type: "EXPENSE",
      category: "Alimentação",
      accountId: checkingAccount.id,
    },
    {
      key: "transport",
      day: 16,
      description: "Mobilidade urbana",
      merchantName: "Uber",
      amount: -245,
      type: "EXPENSE",
      category: "Transporte",
      accountId: checkingAccount.id,
    },
    {
      key: "streaming",
      day: 19,
      description: "Assinaturas digitais",
      merchantName: "Streaming Bundle",
      amount: -119.7,
      type: "EXPENSE",
      category: "Lazer",
      accountId: checkingAccount.id,
    },
    {
      key: "restaurant",
      day: 23,
      description: "Restaurante",
      merchantName: "O Fornão",
      amount: -186.4,
      type: "EXPENSE",
      category: "Alimentação",
      accountId: checkingAccount.id,
    },
    {
      key: "income",
      day: 25,
      description: "Rendimento de investimentos",
      merchantName: "XP Investimentos",
      amount: 142.5,
      type: "INCOME",
      category: "Receitas",
      accountId: investmentAccount.id,
    },
  ];

  for (let monthOffset = 0; monthOffset < 6; monthOffset += 1) {
    for (const transaction of monthlyTransactions) {
      const variation = transaction.type === "EXPENSE" ? monthOffset * 7 : 0;
      const amount =
        transaction.amount < 0
          ? transaction.amount - variation
          : transaction.amount;
      const providerId = `demo-${monthOffset}-${transaction.key}`;
      await prisma.transaction.upsert({
        where: { pluggyTransactionId: providerId },
        update: {
          userId: DEMO_USER_ID,
          accountId: transaction.accountId,
          categoryId: categoryIds.get(transaction.category),
          description: transaction.description,
          merchantName: transaction.merchantName,
          amount,
          type: transaction.type,
          status: "POSTED",
          date: dateInMonth(monthOffset, transaction.day),
          source: "PLUGGY",
        },
        create: {
          id: providerId,
          userId: DEMO_USER_ID,
          accountId: transaction.accountId,
          categoryId: categoryIds.get(transaction.category),
          pluggyTransactionId: providerId,
          pluggyProviderId: providerId,
          description: transaction.description,
          merchantName: transaction.merchantName,
          amount,
          type: transaction.type,
          status: "POSTED",
          date: dateInMonth(monthOffset, transaction.day),
          source: "PLUGGY",
        },
      });
    }
  }

  const period = new Date().toISOString().slice(0, 7);
  const insights = [
    {
      id: "demo-insight-cash-flow",
      title: "Fluxo de caixa saudável",
      summary:
        "Suas entradas superaram as saídas no mês. Manter essa margem ajuda a construir uma reserva consistente.",
      severity: "POSITIVE",
    },
    {
      id: "demo-insight-food",
      title: "Alimentação merece atenção",
      summary:
        "Mercado e restaurantes formam a segunda maior categoria de despesas. Um limite semanal pode reduzir variações.",
      severity: "WARNING",
    },
    {
      id: "demo-insight-investments",
      title: "Patrimônio diversificado",
      summary:
        "Parte relevante do patrimônio está investida e já gera rendimentos mensais registrados no fluxo.",
      severity: "INFO",
    },
  ];

  for (const insight of insights) {
    await prisma.insight.upsert({
      where: { id: insight.id },
      update: { ...insight, userId: DEMO_USER_ID, period },
      create: { ...insight, userId: DEMO_USER_ID, period },
    });
  }
}

function dateInMonth(monthOffset, day) {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthOffset, day, 12),
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
