import { getInstructorCourses } from "@/queries/courses";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "cmmg91nao0001hhpkqp1nbf7r";

    const courses = await getInstructorCourses(userId);
    return NextResponse.json({ success: true, userId, courses });
  } catch (error) {
    return NextResponse.json({ error: error.message, stack: error.stack });
  }
}
