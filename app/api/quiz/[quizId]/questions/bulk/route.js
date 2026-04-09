export const dynamic = 'force-dynamic';
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request, {params}) {
    try {
        const {quizId} = params;
        const {questions} = await request.json();
        console.log("quizId:", quizId);
        console.log("questions:", questions);
        // Validation
        if (!quizId) {
            return NextResponse.json(
                {success: false, error: "Quiz ID is required"},
                {status: 400}
            );
        }

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return NextResponse.json(
                {success: false, error: "Questions array is required and must not be empty"},
                {status: 400}
            );
        }


        const quiz = await db.quiz.findUnique({
            where: {id: quizId},
        });

        if (!quiz) {
            return NextResponse.json(
                {success: false, error: "Quiz not found"},
                {status: 404}
            );
        }


        if (quiz.status === 'published') {
            return NextResponse.json(
                {success: false, error: "Cannot modify questions in a published quiz"},
                {status: 400}
            );
        }

        // Prepare questions data for bulk insertion
        const questionsData = questions.map((question, index) => ({
            quizId: quizId,
            text: question.text,
            type: question.type,
            mark: question.mark || 1,
            explanation: question.explanation || "",
            image: question.image || null,
            options: question.options || [],
            correctAnswer: question.correctAnswer || "",
            order: question.order !== undefined ? question.order : index,
            isFromPool: question.isFromPool || false,
        }));

        // Validate each question
        for (let i = 0; i < questionsData.length; i++) {
            const question = questionsData[i];

            if (!question.text || question.text.trim() === "") {
                return NextResponse.json(
                    {success: false, error: `Question ${i + 1} text is required`},
                    {status: 400}
                );
            }

            if (!["mcq", "short_answer", "long_answer"].includes(question.type)) {
                return NextResponse.json(
                    {success: false, error: `Question ${i + 1} has invalid type`},
                    {status: 400}
                );
            }

            // Validate MCQ questions have options
            if (question.type === "mcq") {
                if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
                    return NextResponse.json(
                        {success: false, error: `MCQ Question ${i + 1} must have options`},
                        {status: 400}
                    );
                }

                // Check if at least one option is correct
                const hasCorrectOption = question.options.some(option => option.isCorrect);
                if (!hasCorrectOption) {
                    return NextResponse.json(
                        {success: false, error: `MCQ Question ${i + 1} must have at least one correct option`},
                        {status: 400}
                    );
                }
            }
        }

        // Use optimized transaction to ensure all questions are created or none
        const createdQuestions = await db.$transaction(async (prisma) => {
            // Delete existing questions if any (for ai_fixed/ai_pool regeneration)
            await prisma.question.deleteMany({
                where: {quizId: quizId},
            });

            // Create new questions
            await prisma.question.createMany({
                data: questionsData,

            });

            //!TODO: Return the created questions in one query( I HAVE TO CHECK IF I SHOULD RETURN ALL QUESTIONS OR NOT)
            return await prisma.question.findMany({
                where: {quizId: quizId},
                orderBy: {order: "asc"},
            });
        });

        return NextResponse.json({
            success: true,
            message: "Questions created successfully",
            questions: createdQuestions,
            count: createdQuestions.length,
        });

    } catch (error) {
        console.error("Error creating bulk questions:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to create questions",
                details: error.message,
            },
            {status: 500}
        );
    }
}