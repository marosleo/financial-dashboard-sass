const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

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
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: { color: category.color, icon: category.icon },
      create: category,
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
