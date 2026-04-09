const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'instructor' },
  });
  const usersStr = 'Instructors: ' + JSON.stringify(users.map(u => ({ id: u.id, name: u.name, email: u.email })), null, 2);

  const courses = await prisma.course.findMany({
    select: { id: true, title: true, userId: true }
  });
  const coursesStr = '\nAll Courses: ' + JSON.stringify(courses, null, 2);
  fs.writeFileSync('tmp/out2.txt', usersStr + coursesStr, 'utf8');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
