const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function getInstructorCourses(userId) {
  try {
    const courses = await prisma.course.findMany({
      where: { userId: userId },
      include: {
        category: { select: { id: true, title: true, description: true, thumbnail: true } },
        user: {
          select: {
            id: true, name: true, email: true, role: true, image: true,
            instructor: { select: { id: true, designation: true, bio: true, department: true } },
          },
        },
        weeks: {
          include: { lessons: { select: { id: true, title: true, duration: true, order: true }, orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
        testimonials: { include: { user: { select: { id: true, name: true, image: true } } }, orderBy: { createdAt: "desc" } },
        _count: {
          select: { testimonials: true, participations: true, courseProgress: true, certificates: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const transformedCourses = courses.map((course) => {
      const averageRating = course.rating || 0;
      return {
        ...course,
        totalStudents: course._count.participations,
        studentsWithProgress: course._count.courseProgress,
        averageRating: Math.round(averageRating * 10) / 10,
      };
    });

    return transformedCourses;
  } catch (error) {
    throw error;
  }
}

async function main() {
  try {
    const c = await getInstructorCourses('cmmg91nao0001hhpkqp1nbf7r');
    fs.writeFileSync('tmp/out4.txt', 'SUCCESS: ' + JSON.stringify(c, null, 2), 'utf8');
  } catch (err) {
    fs.writeFileSync('tmp/out4.txt', 'ERROR: ' + err.stack, 'utf8');
  }
}

main()
  .catch(e => { fs.writeFileSync('tmp/out4.txt', 'FATAL: ' + e.message, 'utf8'); process.exit(1); })
  .finally(() => prisma.$disconnect());
