export const dynamic = 'force-dynamic';
import { updateQuizBasicInfo } from "@/queries/quizzes";
import { NextResponse } from "next/server";


export async function PATCH(request, { params }) {
    try {
        const { quizId } = params;
        const updateData = await request.json();
        console.log("updatedData: ",updateData)

        if (!quizId) {
            return NextResponse.json(
                {
                    error: "Bad Request",
                    message: "Quiz ID is required"
                },
                { status: 400 }
            );
        }


        if (!updateData || Object.keys(updateData).length === 0) {
            return NextResponse.json(
                {
                    error: "Bad Request",
                    message: "Update data is required"
                },
                { status: 400 }
            );
        }


        const updatedQuiz = await updateQuizBasicInfo(quizId, updateData);


        return NextResponse.json(
            {
                success: true,
                message: "Quiz updated successfully",
                data: updatedQuiz
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("API Error updating quiz:", error.message);


        if (error.message.includes("Quiz not found")) {
            return NextResponse.json(
                {
                    error: "Not Found",
                    message: error.message
                },
                { status: 404 }
            );
        }

        if (error.message.includes("already exists")) {
            return NextResponse.json(
                {
                    error: "Conflict",
                    message: error.message
                },
                { status: 409 }
            );
        }

        if (error.message.includes("required") ||
            error.message.includes("must be") ||
            error.message.includes("cannot be empty") ||
            error.message.includes("less than")) {
            return NextResponse.json(
                {
                    error: "Validation Error",
                    message: error.message
                },
                { status: 400 }
            );
        }


        return NextResponse.json(
            {
                error: "Internal Server Error",
                message: "An unexpected error occurred while updating the quiz"
            },
            { status: 500 }
        );
    }
}

