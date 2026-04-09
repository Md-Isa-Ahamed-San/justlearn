const { db } = require("./lib/prisma");

const prisma = new PrismaClient();

async function main() {
  try {
    console.error("Attempting to fetch Live sessions...");
    const lives = await db.live.findMany({
      take: 1
    });
    console.error("Successfully fetched Live sessions:", lives);
    process.exit(0);
  } catch (e) {
    console.error("Error fetching Live sessions:", e);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
