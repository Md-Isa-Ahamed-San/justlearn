const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { instructor: true, student: true, courses: true }
  });

  for (const user of users) {
    console.log(`User: ${user.email}, Role: ${user.role}, Courses: ${user.courses.length}, HasInstructorProfile: ${!!user.instructor}, InstructorId: ${user.instructor?.id}`);
  }
}
main().finally(() => prisma.$disconnect());
