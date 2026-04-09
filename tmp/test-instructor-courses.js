const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'instructor' },
    include: { instructor: true, courses: true }
  });

  for (const user of users) {
    console.log(`User: ${user.email}, ID: ${user.id}`);
    console.log(`Instructor ID: ${user.instructor?.id}`);
    console.log(`Courses count directly from user relation: ${user.courses.length}`);
    
    if (user.instructor) {
      try {
        const courses = await prisma.course.findMany({
          where: { userId: user.id },
          include: {
            category: true,
            weeks: { include: { lessons: true } },
            _count: {
              select: {
                participations: true,
                courseProgress: true,
                testimonials: true,
                certificates: true,
              }
            }
          }
        });
        console.log(`Courses found by instructor query: ${courses.length}`);
        if(courses.length > 0) {
            console.log(`First course ID: ${courses[0].id}`);
        }
      } catch (e) {
        console.error("Error running query:", e);
      }
    }
    console.log("---");
  }
}

main().finally(() => prisma.$disconnect());
