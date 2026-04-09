const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.category.findMany();
  console.log(`Found ${cats.length} categories.`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
