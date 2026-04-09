export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { joinCourseWithCode } from "../../../queries/participation";

export async function GET(request, { params }) {
  const { id } = params;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  if (!id) {
    return NextResponse.json(
      { error: "Course ID is required" },
      { status: 400 }
    );
  }

  try {
    const participation = await db.participation.findFirst({
      where: {
        userId: userId,
        courseId: courseId,
      },
    });

    return NextResponse.json({
      isJoined: participation !== null,
      participationId: participation?.id || null,
    });
  } catch (error) {
    console.error("Error checking participation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
export async function POST(request) {
  try {
    const body = await request.json();

    const { classCode, courseId, userId } = body;


    if (!classCode || !courseId || !userId) {
      return Response.json(
        {
          success: false,
          message:
            "Missing required fields: classCode, courseId, and userId are required",
          error: "MISSING_REQUIRED_FIELDS",
        },
        { status: 400 }
      );
    }

    const result = await joinCourseWithCode({
      classCode,
      courseId,
      userId,
    });

    if (result.success) {
      return Response.json(result, { status: 200 });
    } else {
      let statusCode = 400;

      switch (result.error) {
        case "COURSE_NOT_FOUND":
        case "USER_NOT_FOUND":
        case "RECORD_NOT_FOUND":
          statusCode = 404;
          break;
        case "ALREADY_ENROLLED":
        case "DUPLICATE_ENROLLMENT":
        case "SELF_ENROLLMENT_NOT_ALLOWED":
          statusCode = 409; // Conflict error code
          break;
        case "PRIVATE_COURSE_ACCESS_DENIED":
          statusCode = 403;
          break;
        case "SERVER_ERROR":
          statusCode = 500;
          break;
        default:
          statusCode = 400;
      }

      return Response.json(result, { status: statusCode });
    }
  } catch (error) {
    console.error("POST /join-course error:", error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return Response.json(
        {
          success: false,
          message: "Invalid JSON in request body",
          error: "INVALID_JSON",
        },
        { status: 400 }
      );
    }

    // Handle other unexpected errors
    return Response.json(
      {
        success: false,
        message: "Internal server error",
        error: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
