import { db } from "@/lib/prisma";

export async function deleteQuestionById(questionId) {
    try {
        if (!questionId) {
            throw new Error("Question ID is required to delete the question.");
        }

        // First check if the question exists
        const existingQuestion = await db.question.findUnique({
            where: {
                id: questionId,
            }
        });

        if (!existingQuestion) {
            throw new Error(`Question not found with ID: ${questionId}`);
        }

        // Optional: Add business logic checks
        // For example, prevent deletion if question has responses
        // if (existingQuestion._count.responses > 0) {
        //   throw new Error("Question cannot be deleted as it has active responses.");
        // }

        // Delete the question (this will cascade delete related answers if configured)
        const deletedQuestion = await db.question.delete({
            where: {
                id: questionId,
            },
        });

        return deletedQuestion;
    } catch (error) {
        console.error(
            `Error deleting question with ID ${questionId} using Prisma:`,
            error.message
        );

        // Re-throw the error to be handled by the API route
        throw new Error(
            `Failed to delete question. Details: ${error.message}`
        );
    }
}