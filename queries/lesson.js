import { db } from "@/lib/prisma";

export async function getCompletedLessons(userId) {
    try {
        if (!userId) {
            throw new Error("User ID is required to fetch completed lessons.");
        }

        const completedLessons = await db.lessonProgress.findMany({
            where: {
                userId: userId,
                status: "completed"
            },
            select: {
                lessonId: true,
                completedAt: true,
                timeSpent: true
            },
            orderBy: {
                completedAt: "desc"
            }
        });

        // Return just the lesson IDs as an array (matching the expected format)
        return completedLessons.map(progress => progress.lessonId);
    } catch (error) {
        console.error(
            `Error fetching completed lessons for user ${userId} using Prisma:`,
            error.message
        );

        throw new Error(
            `Failed to retrieve completed lessons for user. Details: ${error.message}`
        );
    }
}

// Alternative: Get detailed completion info if needed
export async function getCompletedLessonsWithDetails(userId) {
    try {
        if (!userId) {
            throw new Error("User ID is required to fetch completed lessons.");
        }

        const completedLessons = await db.lessonProgress.findMany({
            where: {
                userId: userId,
                status: "completed"
            },
            include: {
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        weekId: true,
                        order: true
                    }
                }
            },
            orderBy: {
                completedAt: "desc"
            }
        });

        return completedLessons;
    } catch (error) {
        console.error(
            `Error fetching completed lessons with details for user ${userId} using Prisma:`,
            error.message
        );

        throw new Error(
            `Failed to retrieve completed lessons with details for user. Details: ${error.message}`
        );
    }
}

import { unstable_cache } from "next/cache";

// Get completion status for a specific course
export const getCompletedLessonsByCourse = unstable_cache(
    async (userId, courseId) => {
        try {
            if (!userId || !courseId) {
                throw new Error("User ID and Course ID are required to fetch completed lessons.");
            }

            const completedLessons = await db.lessonProgress.findMany({
                where: {
                    userId: userId,
                    status: "completed",
                    lesson: {
                        week: {
                            courseId: courseId
                        }
                    }
                },
                select: {
                    lessonId: true,
                    completedAt: true,
                    timeSpent: true
                },
                orderBy: {
                    completedAt: "desc"
                }
            });

            return completedLessons.map(progress => progress.lessonId);
        } catch (error) {
            console.error(
                `Error fetching completed lessons for user ${userId} and course ${courseId} using Prisma:`,
                error.message
            );

            throw new Error(
                `Failed to retrieve completed lessons for user and course. Details: ${error.message}`
            );
        }
    },
    (userId, courseId) => ["completed-lessons", userId, courseId],
    {
        tags: ["completed-lessons"],
        revalidate: 3600, // 1 hour
    }
);



export async function markLessonIncomplete(userId, lessonId) {
    try {
        if (!userId || !lessonId) {
            throw new Error("User ID and Lesson ID are required to mark lesson as incomplete.");
        }

        // Update existing lesson progress to not_started or delete the record
        const lessonProgress = await db.lessonProgress.upsert({
            where: {
                userId_lessonId: {
                    userId: userId,
                    lessonId: lessonId
                }
            },
            update: {
                status: "not_started",
                completedAt: null,
                updatedAt: new Date()
            },
            create: {
                userId: userId,
                lessonId: lessonId,
                status: "not_started",
                completedAt: null,
                timeSpent: 0
            }
        });

        return lessonProgress;
    } catch (error) {
        console.error(
            `Error marking lesson ${lessonId} as incomplete for user ${userId} using Prisma:`,
            error.message
        );

        throw new Error(
            `Failed to mark lesson as incomplete. Details: ${error.message}`
        );
    }
}

// Alternative: Delete progress record entirely when marking incomplete
export async function markLessonIncompleteWithDelete(userId, lessonId) {
    try {
        if (!userId || !lessonId) {
            throw new Error("User ID and Lesson ID are required to mark lesson as incomplete.");
        }

        // Delete the lesson progress record entirely
        const deletedProgress = await db.lessonProgress.deleteMany({
            where: {
                userId: userId,
                lessonId: lessonId
            }
        });

        return deletedProgress;
    } catch (error) {
        console.error(
            `Error deleting lesson progress ${lessonId} for user ${userId} using Prisma:`,
            error.message
        );

        throw new Error(
            `Failed to delete lesson progress. Details: ${error.message}`
        );
    }
}

// Update lesson progress with time spent
export async function updateLessonProgress(userId, lessonId, timeSpent, status = "in_progress") {
    try {
        if (!userId || !lessonId) {
            throw new Error("User ID and Lesson ID are required to update lesson progress.");
        }

        const lessonProgress = await db.lessonProgress.upsert({
            where: {
                userId_lessonId: {
                    userId: userId,
                    lessonId: lessonId
                }
            },
            update: {
                status: status,
                timeSpent: timeSpent,
                updatedAt: new Date(),
                // Only set completedAt if status is completed
                ...(status === "completed" && { completedAt: new Date() })
            },
            create: {
                userId: userId,
                lessonId: lessonId,
                status: status,
                timeSpent: timeSpent,
                ...(status === "completed" && { completedAt: new Date() })
            }
        });

        return lessonProgress;
    } catch (error) {
        console.error(
            `Error updating lesson progress ${lessonId} for user ${userId} using Prisma:`,
            error.message
        );

        throw new Error(
            `Failed to update lesson progress. Details: ${error.message}`
        );
    }
}