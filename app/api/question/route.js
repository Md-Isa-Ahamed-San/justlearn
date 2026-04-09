export const dynamic = 'force-dynamic';
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      quizId,
      text,
      type,
      mark,
      explanation,
      options,
      correctAnswer,
      order,
      image
    } = body;
      console.log(" POST ~ image:", image)

    // Validate required fields
    if (!quizId || !text || !type || !mark) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: quizId, text, type, and mark are required",
        },
        { status: 400 }
      );
    }

    // Validate question type
    const validTypes = ["mcq", "short_answer", "long_answer"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          error:
            "Invalid question type. Must be one of: mcq, short_answer, long_answer",
        },
        { status: 400 }
      );
    }

    // Validate MCQ specific fields
    if (type === "mcq") {
      if (!options || !Array.isArray(options) || options.length < 2) {
        return NextResponse.json(
          { error: "MCQ questions must have at least 2 options" },
          { status: 400 }
        );
      }

      const correctOptions = options.filter((option) => option.isCorrect);
      if (correctOptions.length === 0) {
        return NextResponse.json(
          { error: "MCQ questions must have at least one correct option" },
          { status: 400 }
        );
      }
    }

    // Validate answer fields for other question types
    if ((type === "short_answer" || type === "long_answer") && !correctAnswer) {
      return NextResponse.json(
        { error: `${type} questions must have a correctAnswer` },
        { status: 400 }
      );
    }

    // Check if quiz exists
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      select: { id: true },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Get the next order number if not provided
    let questionOrder = order;
    if (questionOrder === undefined || questionOrder === null) {
      const lastQuestion = await db.question.findFirst({
        where: { quizId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      questionOrder = lastQuestion ? lastQuestion.order + 1 : 0;
    }

    // Create the question
    const newQuestion = await db.question.create({
      data: {
        text,
        type,
        image,
        mark: parseInt(mark),
        explanation: explanation || "",
        options: type === "mcq" ? options : null,
        correctAnswer: (type === "short_answer" || type === "long_answer") ? correctAnswer : "",
        order: questionOrder,
        quizId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Question created successfully",
        question: newQuestion,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating question:", error.message);

    // Handle Prisma-specific errors
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A question with this data already exists" },
        { status: 409 }
      );
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Quiz ID does not exist" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create question",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
