const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifySchema() {
    console.log("Verifying Schema...");
    
    try {
        // Check Certificate Model
        const certCount = await prisma.certificate.count();
        console.log(`✅ Certificate Model Accessible (Count: ${certCount})`);

        // Check Comment Model
        const commentCount = await prisma.comment.count();
        console.log(`✅ Comment Model Accessible (Count: ${commentCount})`);

        // Check Live Model
        const liveCount = await prisma.live.count();
        console.log(`✅ Live Model Accessible (Count: ${liveCount})`);

        // Check Badge Model
        const badgeCount = await prisma.badge.count();
        console.log(`✅ Badge Model Accessible (Count: ${badgeCount})`);

        console.log("Schema verification passed!");
    } catch (error) {
        console.error("❌ Schema verification failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

verifySchema();
