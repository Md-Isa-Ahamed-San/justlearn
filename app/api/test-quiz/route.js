import { getQuizWithDetails } from "@/queries/quizzes";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const quizId = "cmmhcxkls0001hhfod7cmuywk";
    const quiz = await getQuizWithDetails(quizId);
    
    return NextResponse.json({
      success: true,
      quiz,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
