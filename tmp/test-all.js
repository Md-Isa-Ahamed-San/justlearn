const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
  try {
    const users = await prisma.user.findMany({
      include: { instructor: true, student: true, courses: true }
    });
    
    let content = `Total users: ${users.length}\n`;

    for (const user of users) {
      content += `User: ${user.email}, Role: ${user.role}, Courses: ${user.courses.length}, HasInstructorProfile: ${!!user.instructor}, InstructorId: ${user.instructor?.id}\n`;
    }
    
    fs.writeFileSync('tmp/out-db.txt', content);
    console.log("Wrote out-db.txt");
  } catch(e) {
    fs.writeFileSync('tmp/err-db.txt', e.toString());
  }
}
main().finally(() => prisma.$disconnect());
