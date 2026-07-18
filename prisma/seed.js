const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const user = {
  name: "Leonardo Maros",
  email: "leo@example.com",
};

const categories = [
  { name: "Groceries", color: "#2F6F4E", icon: "basket" },
  { name: "Restaurants", color: "#B85C38", icon: "utensils" },
  { name: "Transport", color: "#365C8D", icon: "car" },
  { name: "Subscriptions", color: "#6C4A7F", icon: "repeat" },
  { name: "Housing", color: "#8A6A32", icon: "home" },
  { name: "Health", color: "#A33A3A", icon: "heart" },
  { name: "Income", color: "#1F7A5C", icon: "wallet" },
  { name: "Shopping", color: "#8B4E6F", icon: "bag" },
  { name: "Education", color: "#4F6F8F", icon: "book" },
];

const transactionTemplates = [
  ["Salary", "SoftExpert", 9200, "INCOME", "Income"],
  ["Freelance project", "Independent client", 1800, "INCOME", "Income"],
  ["Rent", "Apartment", -2100, "EXPENSE", "Housing"],
  ["Condominium", "Building admin", -520, "EXPENSE", "Housing"],
  ["Nubank card payment", "Nubank", -1450, "EXPENSE", "Shopping"],
  ["Grocery run", "Angeloni", -420, "EXPENSE", "Groceries"],
  ["Lunch", "Office restaurant", -54, "EXPENSE", "Restaurants"],
  ["Dinner", "Burger place", -92, "EXPENSE", "Restaurants"],
  ["Uber", "Uber", -38, "EXPENSE", "Transport"],
  ["Fuel", "Shell", -260, "EXPENSE", "Transport"],
  ["Netflix", "Netflix", -55.9, "EXPENSE", "Subscriptions"],
  ["Spotify", "Spotify", -21.9, "EXPENSE", "Subscriptions"],
  ["Gym", "Smart Fit", -119.9, "EXPENSE", "Health"],
  ["Pharmacy", "Panvel", -86.4, "EXPENSE", "Health"],
  ["Course", "Frontend Masters", -190, "EXPENSE", "Education"],
  ["Books", "Amazon", -132, "EXPENSE", "Education"],
];

function dateFor(monthOffset, day) {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthOffset, day, 12),
  );
}

async function main() {
  await prisma.pluggyWebhookEvent.deleteMany();
  await prisma.insight.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.bankConnection.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const createdUser = await prisma.user.create({ data: user });

  const createdCategories = {};
  for (const category of categories) {
    createdCategories[category.name] = await prisma.category.create({
      data: category,
    });
  }

  const checking = await prisma.account.create({
    data: {
      userId: createdUser.id,
      institution: "Nubank",
      name: "Nubank Checking",
      type: "CHECKING",
      balance: 8420.75,
    },
  });

  const credit = await prisma.account.create({
    data: {
      userId: createdUser.id,
      institution: "Nubank",
      name: "Nubank Credit Card",
      type: "CREDIT_CARD",
      balance: -1840.3,
    },
  });

  const investment = await prisma.account.create({
    data: {
      userId: createdUser.id,
      institution: "NuInvest",
      name: "Emergency Reserve",
      type: "INVESTMENT",
      balance: 22500,
    },
  });

  for (let monthOffset = 0; monthOffset < 6; monthOffset += 1) {
    for (let index = 0; index < transactionTemplates.length; index += 1) {
      const [description, merchantName, baseAmount, type, categoryName] =
        transactionTemplates[index];
      const variation =
        type === "INCOME" ? 1 : 1 + ((monthOffset + index) % 5) * 0.035;
      const amount = Number((baseAmount * variation).toFixed(2));
      const account =
        type === "INCOME" || categoryName === "Housing" ? checking : credit;

      await prisma.transaction.create({
        data: {
          userId: createdUser.id,
          accountId: account.id,
          categoryId: createdCategories[categoryName].id,
          description,
          merchantName,
          amount,
          type,
          date: dateFor(monthOffset, (index % 24) + 1),
        },
      });
    }
  }

  await prisma.transaction.create({
    data: {
      userId: createdUser.id,
      accountId: investment.id,
      categoryId: createdCategories.Income.id,
      description: "Investment yield",
      merchantName: "NuInvest",
      amount: 185.42,
      type: "INCOME",
      date: dateFor(0, 26),
    },
  });

  await prisma.insight.createMany({
    data: [
      {
        userId: createdUser.id,
        title: "Restaurant spending is trending up",
        summary:
          "Dining expenses are 14% above your six-month average. Review weekend spending before the next card cycle closes.",
        severity: "WARNING",
        period: "current-month",
      },
      {
        userId: createdUser.id,
        title: "Emergency reserve is healthy",
        summary:
          "Your reserve covers roughly three months of recurring fixed expenses based on current seed data.",
        severity: "POSITIVE",
        period: "current-month",
      },
      {
        userId: createdUser.id,
        title: "Subscriptions are stable",
        summary:
          "Recurring subscriptions stayed within the expected range. No duplicated recurring charges were detected.",
        severity: "INFO",
        period: "current-month",
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
