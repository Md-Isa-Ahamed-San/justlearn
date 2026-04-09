export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";

import { db } from "../../../lib/prisma";
import { createQuiz } from "../../../queries/quizzes";

export async function POST(req) {
  try {
    const body = await req.json();
    const { title, description,instructorId,generationType } = body;

    if (!title || !description || !generationType) {
      return NextResponse.json(
        { message: "Title , description and Generation Type are required" },
        { status: 400 }
      );
    }
    // console.log("gggggggggggggggg: ",title,description,instructorId,generationType)

    const newQuiz = await createQuiz(title,description,instructorId,generationType)

    return NextResponse.json(newQuiz, { status: 201 });
  } catch (error) {
    console.error("[QUIZ_POST_API_ERROR]", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "A quiz with similar unique details already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
