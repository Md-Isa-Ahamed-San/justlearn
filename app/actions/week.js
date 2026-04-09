"use server"
import { getLoggedInUser } from "@/lib/loggedin-user";
import { db } from "@/lib/prisma";
import { revalidatePath } from 'next/cache';
export async function createWeek(courseId, data) {
    try {
        const loggedinUser = await getLoggedInUser();

        if (!loggedinUser?.id) {
            throw new Error("User not authenticated");
        }

        // Validate courseId
        if (!courseId) {
            throw new Error("Course ID is required to create a week.");
        }

        // Validate input data
        if (!data.title || !data.description || data.order === undefined) {
            throw new Error("Title, Description, and Order are required for a week.");
        }

        // Ensure the order is a valid number
        const orderNumber = parseInt(data.order, 10);
        if (isNaN(orderNumber)) {
            throw new Error("Order must be a valid number.");
        }

        // Create the week record
        const newWeek = await db.week.create({
            data: {
                title: data.title,
                description: data.description,
                order: orderNumber,
                courseId: courseId,
                status: "draft", // Default status for a new week
            },
            include: {
                course: { // Include course details for context if needed
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        console.log("new week after create: ", newWeek)
        return newWeek;
    } catch (error) {
        console.error("Error creating week:", error);
        // Rethrow the error to be caught by the calling component
        throw new Error(`Failed to create week: ${error.message}`);
    }
}

export async function toggleAddRemoveQuizFromWeek(weekId, quizId) {
    try {
        if (!weekId || !quizId) {
            throw new Error("Week ID and Quiz ID are required");
        }

        // Check if the relation already exists
        const existingWeekQuiz = await db.weekQuiz.findUnique({
            where: {
                weekId_quizId: {
                    weekId: weekId,
                    quizId: quizId
                }
            }
        });

        let action;
        if (existingWeekQuiz) {
            // Relation exists, remove it
            await db.weekQuiz.delete({
                where: {
                    weekId_quizId: {
                        weekId: weekId,
                        quizId: quizId
                    }
                }
            });
            action = 'removed';
        } else {
            // Relation does not exist, add it
            await db.weekQuiz.create({
                data: {
                    weekId: weekId,
                    quizId: quizId
                }
            });
            action = 'added';
        }

        const updatedWeek = await db.week.findUnique({ where: { id: weekId } });

        // Revalidate relevant paths
        revalidatePath('/dashboard/weeks');
        revalidatePath(`/dashboard/weeks/${weekId}`);

        return {
            success: true,
            action,
            updatedWeek,
            message: `Quiz ${action} successfully`,
        };

    } catch (error) {
        console.error(
            `Error toggling quiz ${quizId} for week ${weekId}:`,
            error.message
        );

        return {
            success: false,
            error: error.message,
            message: "Failed to update week quizzes",
        };
    }
}

export async function updateWeek(weekId, data) {
    try {
        // Handle both FormData and regular objects
        const updateFields = data instanceof FormData ? Object.fromEntries(data) : data;

        console.log("updateWeek ~ weekId:", weekId);
        console.log("updateWeek ~ data:", updateFields);

        const allowedFields = [
            "title",
            "description",
            "status", // WeekStatus enum: draft, published
            "order",
            "quizIds", // Array of quiz IDs
        ];

        const updateData = {};
        Object.keys(updateFields).forEach((key) => {
            if (allowedFields.includes(key) && updateFields[key] !== undefined && updateFields[key] !== "") {
                if (key === "quizIds") {
                    try {
                        updateData[key] = Array.isArray(updateFields[key]) ? updateFields[key] : JSON.parse(updateFields[key]);
                    } catch (error) {
                        throw new Error(`Invalid array format for ${key}`);
                    }
                }
                // Handle enum fields (status)
                else if (key === "status") {
                    if (!["draft", "published"].includes(updateFields[key])) {
                        throw new Error(`Invalid status value. Must be 'draft' or 'published'`);
                    }
                    updateData[key] = updateFields[key];
                }
                // Handle number fields (order)
                else if (key === "order") {
                    updateData[key] = parseInt(updateFields[key], 10);
                    if (isNaN(updateData[key])) {
                        throw new Error(`Invalid number format for ${key}`);
                    }
                }
                // Handle rest of the string fields (title, description)
                else {
                    updateData[key] = updateFields[key];
                }
            }
        });

        if (Object.keys(updateData).length === 0) {
            return {
                success: false,
                error: "No valid fields provided for update",
            };
        }

        // Add updatedAt timestamp
        updateData.updatedAt = new Date();

        // Validate status if provided
        if (updateData.status && !["draft", "published"].includes(updateData.status)) {
            return {
                success: false,
                error: "Invalid status value. Must be 'draft' or 'published'",
            };
        }

        // Validate order if provided
        if (updateData.order && updateData.order < 1) {
            return {
                success: false,
                error: "Order must be a positive number starting from 1",
            };
        }

        // Validate quizIds if provided
        if (updateData.quizIds && (!Array.isArray(updateData.quizIds) || updateData.quizIds.some(id => typeof id !== 'string'))) {
            return {
                success: false,
                error: "QuizIds must be an array of valid quiz ID strings",
            };
        }

        // Extract quizIds parameter and remove it from updateData since it's not a field anymore
        const quizIdsToUpdate = updateData.quizIds;
        delete updateData.quizIds;

        // Check if week exists before updating
        const existingWeek = await db.week.findUnique({
            where: { id: weekId },
            include: {
                course: true,
                lessons: true,
            },
        });

        if (!existingWeek) {
            return {
                success: false,
                error: "Week not found",
            };
        }

        // Update the week details
        let updatedWeek = await db.week.update({
            where: { id: weekId },
            data: updateData,
            include: {
                course: {
                    include: {
                        category: true,
                        user: {
                            include: {
                                instructor: true,
                            },
                        },
                    },
                },
                lessons: {
                    orderBy: { order: "asc" },
                },
            },
        });

        // Update the WeekQuiz relation if quizIds was provided
        if (quizIdsToUpdate) {
            // 1. Delete all existing relations for this week
            await db.weekQuiz.deleteMany({
                where: { weekId: weekId }
            });
            
            // 2. Create new relations
            if (quizIdsToUpdate.length > 0) {
                await db.weekQuiz.createMany({
                    data: quizIdsToUpdate.map(quizId => ({
                        weekId: weekId,
                        quizId: quizId
                    })),
                    skipDuplicates: true
                });
            }
        }

        // Revalidate relevant paths
        revalidatePath(`/courses/${existingWeek.courseId}`);
        revalidatePath(`/admin/courses/${existingWeek.courseId}`);
        revalidatePath(`/weeks/${weekId}`);

        return {
            success: true,
            message: "Week updated successfully",
            week: updatedWeek,
            updatedFields: Object.keys(updateData).filter(key => key !== "updatedAt"),
        };

    } catch (error) {
        console.error("Error updating week:", error);

        // Handle specific Prisma errors
        if (error.code === "P2025") {
            return {
                success: false,
                error: "Week not found",
            };
        }

        if (error.code === "P2002") {
            return {
                success: false,
                error: "Duplicate value for unique field",
            };
        }

        if (error.code === "P2003") {
            return {
                success: false,
                error: "Foreign key constraint failed",
            };
        }

        return {
            success: false,
            error: error.message || "Internal server error",
        };
    }
}