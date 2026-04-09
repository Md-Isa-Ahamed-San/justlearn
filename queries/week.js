import { db } from "@/lib/prisma";


export async function getWeekDetailsByIds(courseId, weekId) {
    try {
        if (!courseId || !weekId) {
            throw new Error("Both Course ID and Week ID are required to fetch week details.");
        }

        const weekDetails = await db.week.findFirst({
            where: {
                id: weekId,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        thumbnail: true,
                        active: true,
                        code: true,
                        visibility: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                // Include all lessons in this week
                lessons: {
                    orderBy: {
                        order: "asc",
                    },
                    include: {
                        // Include watch records for each lesson
                        watches: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                },

                watches: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                        //     },
                        // },
                    },
                },
                weekQuiz: {
                    include: {
                        quiz: true,
                    },
                },
            },
        });

        if (!weekDetails) {
            throw new Error(`Week with ID ${weekId} not found in course ${courseId}.`);
        }

        // Populate quizIds from weekQuiz relation
        if (weekDetails.weekQuiz) {
            weekDetails.quizIds = weekDetails.weekQuiz.map((wq) => wq.quizId);
        } else {
            weekDetails.quizIds = [];
        }

    // console.log("wwwwDetails in functtion: ",weekDetails)
        return weekDetails;
    } catch (error) {
        console.error(
            `Error fetching week details for courseId ${courseId} and weekId ${weekId} using Prisma:`,
            error.message
        );

        throw new Error(
            `Failed to retrieve week details. Details: ${error.message}`
        );
    }
}





