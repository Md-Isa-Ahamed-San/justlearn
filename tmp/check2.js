const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
  try {
    const cats = await prisma.category.findMany();
    fs.writeFileSync('tmp/db-log.txt', \`Found \${cats.length} categories.\n\`);
    for (const cat of cats) {
      fs.appendFileSync('tmp/db-log.txt', \` - \${cat.title}\n\`);
    }
  } catch (e) {
    fs.writeFileSync('tmp/db-log.txt', e.toString());
  }
}
main().then(() => process.exit(0));
