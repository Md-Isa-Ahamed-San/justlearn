"use server";

import { getLoggedInUser } from "@/lib/loggedin-user";
import { db } from "@/lib/prisma";
import { revalidatePath } from 'next/cache';
import { checkBadgesAfterLesson } from "./badges";
import { updateCourseProgressAfterQuizOrLesson } from "./quiz";
// !MARK: createLesson
export async function createLesson(data) {
    try {
        const loggedinUser = await getLoggedInUser();

        if (!loggedinUser?.id) {
            return {
                success: false,
                error: "User not authenticated"
            };
        }

        // Validate required fields
        if (!data.weekId || !data.courseId || !data.title || !data.description) {
            return {
                success: false,
                error: "Week ID, Course ID, Title, and Description are required"
            };
        }

        // Validate that the week exists and belongs to the course
        const week = await db.week.findFirst({
            where: {
                id: data.weekId,
                courseId: data.courseId,
            },
        });

        if (!week) {
            return {
                success: false,
                error: "Week not found or doesn't belong to the specified course"
            };
        }

        // Validate that the course belongs to the logged-in user
        const course = await db.course.findFirst({
            where: {
                id: data.courseId,
                userId: loggedinUser.id,
            },
        });

        if (!course) {
            return {
                success: false,
                error: "Course not found or you don't have permission to modify it"
            };
        }

        // Ensure order is a valid number
        const orderNumber = parseInt(data.order, 10);
        if (isNaN(orderNumber)) {
            return {
                success: false,
                error: "Order must be a valid number"
            };
        }

        // Create the lesson
        const newLesson = await db.lesson.create({
            data: {
                title: data.title,
                description: data.description,
                videoUrl: data.videoUrl || null,
                weekId: data.weekId,
                order: orderNumber,
                duration: data.duration || 0,
                access: data.access || "public",
                active: data.active !== undefined ? data.active : true,
                attachments: data.attachments || null,
            },
            include: {
                week: {
                    select: {
                        id: true,
                        title: true,
                        courseId: true,
                    },
                },
            },
        });

        // Revalidate relevant paths
        revalidatePath(`/instructor-dashboard/courses/${data.courseId}/week/${data.weekId}`);
        revalidatePath(`/instructor-dashboard/courses/${data.courseId}`);

        return {
            success: true,
            lesson: newLesson,
            message: "Lesson created successfully"
        };

    } catch (error) {
        console.error("Error creating lesson:", error);
        return {
            success: false,
            error: `Failed to create lesson: ${error.message}`
        };
    }
}
// !!MARK: updateLesson
export async function updateLesson(data, lessonId, courseId, weekId) {
    try {
        const loggedinUser = await getLoggedInUser();

        if (!loggedinUser?.id) {
            return {
                success: false,
                error: "User not authenticated"
            };
        }

        if (!lessonId) {
            return {
                success: false,
                error: "Lesson ID needed."
            };
        }

        // Validate that the lesson exists and get course/week info for revalidation
        const existingLesson = await db.lesson.findFirst({
            where: {
                id: lessonId,
            },
            include: {
                week: {
                    select: {
                        id: true,
                        title: true,
                        courseId: true,
                    },
                },
            },
        });

        if (!existingLesson) {
            return {
                success: false,
                error: "Lesson not found."
            };
        }

        // Prepare update data - only include fields that are provided
        const updateData = {};

        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl || null;
        if (data.duration !== undefined) updateData.duration = data.duration;
        if (data.access !== undefined) updateData.access = data.access;
        if (data.active !== undefined) updateData.active = data.active;

        // Handle attachments with validation
        if (data.attachments !== undefined) {
            // Validate attachments structure
            if (Array.isArray(data.attachments)) {
                const validAttachments = data.attachments.filter(attachment => {
                    return attachment &&
                        typeof attachment === 'object' &&
                        attachment.name &&
                        attachment.url &&
                        attachment.type;
                });

                // Validate URLs in attachments
                for (const attachment of validAttachments) {
                    try {
                        new URL(attachment.url);
                    } catch (error) {
                        return {
                            success: false,
                            error: `Invalid URL in attachment: ${attachment.name}`
                        };
                    }
                }

                updateData.attachments = validAttachments;
            } else {
                return {
                    success: false,
                    error: "Attachments must be an array"
                };
            }
        }

        if (data.order !== undefined) {
            const orderNumber = parseInt(data.order, 10);
            if (isNaN(orderNumber)) {
                return {
                    success: false,
                    error: "Order must be a valid number"
                };
            }
            updateData.order = orderNumber;
        }

        // Check if there's any data to update
        if (Object.keys(updateData).length === 0) {
            return {
                success: false,
                error: "No valid data provided for update"
            };
        }

        // Update the lesson using the lessonId parameter
        const updatedLesson = await db.lesson.update({
            where: {
                id: lessonId,
            },
            data: updateData,
            include: {
                week: {
                    select: {
                        id: true,
                        title: true,
                        courseId: true,
                    },
                },
            },
        });
console.log("updatedLesson: ",updatedLesson)

        // Revalidate relevant paths
        revalidatePath(`/instructor-dashboard/courses/${courseId}/week/${weekId}`);
        revalidatePath(`/instructor-dashboard/courses/${courseId}`);
        revalidatePath(`/instructor-dashboard/courses/${courseId}/week/${weekId}/lesson/${lessonId}`);

        return {
            success: true,
            lesson: updatedLesson,
            message: "Lesson updated successfully"
        };

    } catch (error) {
        console.error("Error updating lesson:", error);
        return {
            success: false,
            error: `Failed to update lesson: ${error.message}`
        };
    }
}
// !!MARK: deleteLesson
export async function deleteLesson(data) {
    try {
        const loggedinUser = await getLoggedInUser();

        if (!loggedinUser?.id) {
            return {
                success: false,
                error: "User not authenticated"
            };
        }

        // Validate required fields
        if (!data.lessonId || !data.weekId || !data.courseId) {
            return {
                success: false,
                error: "Lesson ID, Week ID, and Course ID are required"
            };
        }

        // Validate that the lesson exists and belongs to the correct week/course
        const existingLesson = await db.lesson.findFirst({
            where: {
                id: data.lessonId,
                weekId: data.weekId,
                week: {
                    courseId: data.courseId,
                    course: {
                        userId: loggedinUser.id,
                    },
                },
            },
        });

        if (!existingLesson) {
            return {
                success: false,
                error: "Lesson not found or you don't have permission to delete it"
            };
        }

        // Delete the lesson
        await db.lesson.delete({
            where: {
                id: data.lessonId,
            },
        });

        // Revalidate relevant paths
        revalidatePath(`/instructor-dashboard/courses/${data.courseId}/week/${data.weekId}`);
        revalidatePath(`/instructor-dashboard/courses/${data.courseId}`);

        return {
            success: true,
            message: "Lesson deleted successfully"
        };

    } catch (error) {
        console.error("Error deleting lesson:", error);
        return {
            success: false,
            error: `Failed to delete lesson: ${error.message}`
        };
    }
}
// !!MARK: reorderLessons
export async function reorderLessons(data) {
    try {
        const loggedinUser = await getLoggedInUser();

        if (!loggedinUser?.id) {
            return {
                success: false,
                error: "User not authenticated"
            };
        }

        // Validate required fields
        if (!data.courseId || !data.weekId || !data.lessons || !Array.isArray(data.lessons)) {
            return {
                success: false,
                error: "Course ID, Week ID, and lessons array are required"
            };
        }

        // Validate that the week exists and belongs to the user's course
        const week = await db.week.findFirst({
            where: {
                id: data.weekId,
                courseId: data.courseId,
                course: {
                    userId: loggedinUser.id,
                },
            },
        });

        if (!week) {
            return {
                success: false,
                error: "Week not found or you don't have permission to modify it"
            };
        }

        // Validate that all lessons belong to the week
        const lessonIds = data.lessons.map(lesson => lesson.id);
        const existingLessons = await db.lesson.findMany({
            where: {
                id: { in: lessonIds },
                weekId: data.weekId,
            },
            select: { id: true },
        });

        if (existingLessons.length !== lessonIds.length) {
            return {
                success: false,
                error: "Some lessons don't belong to the specified week"
            };
        }

        // Update lessons in a transaction
        const updatePromises = data.lessons.map(lesson => {
            const orderNumber = parseInt(lesson.order, 10);
            if (isNaN(orderNumber)) {
                throw new Error(`Invalid order for lesson ${lesson.id}: ${lesson.order}`);
            }

            return db.lesson.update({
                where: { id: lesson.id },
                data: { order: orderNumber },
            });
        });

        await db.$transaction(updatePromises);

        // Revalidate relevant paths
        revalidatePath(`/instructor-dashboard/courses/${data.courseId}/week/${data.weekId}`);
        revalidatePath(`/instructor-dashboard/courses/${data.courseId}`);

        return {
            success: true,
            message: "Lessons reordered successfully"
        };

    } catch (error) {
        console.error("Error reordering lessons:", error);
        return {
            success: false,
            error: `Failed to reorder lessons: ${error.message}`
        };
    }
}




export async function toggleLessonProgress(userId, lessonId, courseId, isCompleted) {
    try {
        if (isCompleted) {
            await markLessonIncomplete(userId, lessonId);
        } else {
            await markLessonComplete(userId, lessonId);
        }

        // Revalidate the course page to update the UI
        revalidatePath(`/courses/${courseId}`);

        return { success: true };
    } catch (error) {
        console.error('Error updating lesson progress:', error);
        return { success: false, error: error.message };
    }
}

export async function markLessonComplete({userId, lessonId,courseId}) {
    try {
        if (!userId || !lessonId) {
            return {
                success: false,
                error: "User ID and Lesson ID are required to mark lesson as complete."
            };
        }

        // Verify that the lesson exists
        const lesson = await db.lesson.findUnique({
            where: { id: lessonId }
        });

        if (!lesson) {
            return {
                success: false,
                error: `Lesson with ID ${lessonId} not found.`
            };
        }

        // Use upsert to create or update the lesson progress
        const lessonProgress = await db.lessonProgress.upsert({
            where: {
                userId_lessonId: {
                    userId: userId,
                    lessonId: lessonId
                }
            },
            update: {
                status: "completed",
                completedAt: new Date(),
                updatedAt: new Date()
            },
            create: {
                userId: userId,
                lessonId: lessonId,
                status: "completed",
                completedAt: new Date(),
                timeSpent: 0
            }
        });
        let accomplished = "lesson"
        await updateCourseProgressAfterQuizOrLesson(userId, courseId, accomplished);
        
        // Award points for lesson completion (Inline logic for now)
        try {
            await db.user.update({
                where: { id: userId },
                data: { points: { increment: 10 } }
            });
        } catch (e) {
            console.error("Failed to award points for lesson:", e);
        }

        // Check and award badges after lesson completion
        await checkBadgesAfterLesson(userId);

        // Revalidate the course page to update the UI
        revalidatePath(`/courses/${courseId}`);
        revalidatePath('/account/progress');
        revalidatePath('/student-dashboard');

        return {
            success: true,
            data: lessonProgress,
            message: "Lesson marked as complete successfully"
        };

    } catch (error) {
        console.error(
            `Error marking lesson ${lessonId} as complete for user ${userId} using Prisma:`,
            error.message
        );

        return {
            success: false,
            error: `Failed to mark lesson as complete. Details: ${error.message}`
        };
    }
    }


// !!MARK: Comments System
export async function addComment(lessonId, content, parentId = null) {
    try {
        // Ensure user is authenticated
        const user = await getLoggedInUser();
        if (!user) throw new Error("Unauthorized");

        const comment = await db.comment.create({
            data: {
                content,
                lessonId,
                userId: user.id,
                parentId: parentId || null
            },
            include: {
                user: { select: { id: true, name: true, image: true } }
            }
        });
        
        revalidatePath(`/courses/${lessonId}`);
        return { success: true, comment };
    } catch (error) {
        console.error("Error adding comment:", error);
        return { success: false, error: error.message };
    }
}

export async function getLessonComments(lessonId) {
    try {
        const comments = await db.comment.findMany({
            where: { lessonId, parentId: null },
            include: {
                user: { select: { id: true, name: true, image: true } },
                children: {
                    include: {
                        user: { select: { id: true, name: true, image: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, comments };
    } catch (error) {
        console.error("Error fetching comments:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteComment(commentId) {
    try {
        const user = await getLoggedInUser();
        if (!user) throw new Error("Unauthorized");

        const comment = await db.comment.findUnique({ where: { id: commentId } });
        if (!comment || comment.userId !== user.id) throw new Error("Forbidden");

        await db.comment.delete({ where: { id: commentId } });
        return { success: true };
    } catch (error) {
        console.error("Error deleting comment:", error);
        return { success: false, error: error.message };
    }
}
