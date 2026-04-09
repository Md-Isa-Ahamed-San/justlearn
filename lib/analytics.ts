import { db } from "@/lib/prisma";

export async function getInstructorAnalytics(userId) {
    if (!userId) return null;

    // Get all courses by instructor
    const courses = await db.course.findMany({
        where: { userId },
        include: {
            courseProgress: true,
            weeks: {
                include: {
                    lessons: true,
                    quizzes: true
                }
            }
        }
    });

    const totalCourses = courses.length;
    let totalStudents = 0;
    let totalLessons = 0;
    let totalQuizzes = 0;
    let completedCourses = 0;

    // Calculate aggregated stats
    courses.forEach(course => {
        totalStudents += new Set(course.courseProgress.map(p => p.userId)).size;

        course.weeks.forEach(week => {
            totalLessons += week.lessons.length;
            totalQuizzes += week.quizzes.length;
        });

        completedCourses += course.courseProgress.filter(p => p.status === 'completed').length;
    });

    return {
        totalCourses,
        totalStudents,
        totalLessons,
        totalQuizzes,
        completionRate: totalStudents > 0 ? (completedCourses / totalStudents) * 100 : 0
    };
}
