const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const photos = await prisma.photo.findMany();
  console.log("Photos in database:", JSON.stringify(photos, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
