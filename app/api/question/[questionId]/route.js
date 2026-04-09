export const dynamic = 'force-dynamic';
import { deleteQuestionById } from "@/queries/question";
import { NextResponse } from "next/server";

export async function DELETE(request,{params}) {
    try {

        const { questionId } = await params;


        if (!questionId) {
            return NextResponse.json(
                {
                    error: "Bad Request",
                    message: "Question ID is required"
                },
                { status: 400 }
            );
        }


        const deletedQuestion = await deleteQuestionById(questionId);

        return NextResponse.json(
            {
                success: true,
                message: "Question deleted successfully",
                data: deletedQuestion
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("API Error deleting question:", error.message);

        if (error.message.includes("Question not found")) {
            return NextResponse.json(
                {
                    error: "Not Found",
                    message: error.message
                },
                { status: 404 }
            );
        }

        if (error.message.includes("cannot be deleted") ||
            error.message.includes("has active")) {
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
            error.message.includes("invalid")) {
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
                message: "An unexpected error occurred while deleting the question"
            },
            { status: 500 }
        );
    }
}