import { db } from "../lib/prisma";

export async function checkUserParticipation(userId, courseId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!courseId) {
    throw new Error("Course ID is required");
  }

  try {
    // Check if user is already joined to the course
    const participation = await db.participation.findFirst({
      where: {
        userId: userId,
        courseId: courseId,
      },
    });

    return {
      isJoined: participation !== null,
      participationId: participation?.id || null,
    };
  } catch (error) {
    console.error("Error checking participation:", error);
    throw error;
  }
}
export async function joinCourseWithCode({ classCode, courseId, userId }) {
  try {
    // 1. Find the course by class code and courseId
    const course = await prisma.course.findFirst({
      where: {
        code: classCode,
        id: courseId,
      },
    });
    if (!course) {
      return {
        success: false,
        message: "Invalid class code or course not found",
        error: "COURSE_NOT_FOUND",
      };
    }

    // 2. Verify the user exists and get their role
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        isActive: true,
      },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found or inactive",
        error: "USER_NOT_FOUND",
      };
    }

    // 3. Check if user is already enrolled
    const existingParticipation = await prisma.participation.findFirst({
      where: {
        userId: userId,
        courseId: courseId,
      },
    });

    if (existingParticipation) {
      return {
        success: false,
        message: "You are already enrolled in this course",
        error: "ALREADY_ENROLLED",
      };
    }

    // 4. Check if user is trying to join their own course (instructor)
    if (course.userId === userId) {
      return {
        success: false,
        message: "You cannot join your own course as a participant",
        error: "SELF_ENROLLMENT_NOT_ALLOWED",
      };
    }

    if (course.visibility === "private") {
      return {
        success: false,
        message: "This is a private course. Please check your class code.",
        error: "PRIVATE_COURSE_ACCESS_DENIED",
      };
    }

    // 6. Create the participation record
    const participation = await prisma.participation.create({
      data: {
        userId,
        courseId,
        // Initialize progress with default values or remove if not needed
        progress: 0, // Assuming progress is a number, adjust based on your schema
      },
    });

    return {
      success: true,
      message: "Successfully joined the course",
      data: {
        participationId: participation.id,
        courseId,
        userId,
      },
    };
  } catch (error) {
    console.error("Join course error:", error);

    if (error.code === "P2002") {
      // Prisma unique constraint violation
      return {
        success: false,
        message: "You are already enrolled in this course",
        error: "DUPLICATE_ENROLLMENT",
      };
    }

    if (error.code === "P2025") {
      // Record not found
      return {
        success: false,
        message: "Course or user not found",
        error: "RECORD_NOT_FOUND",
      };
    }

    return {
      success: false,
      message: "Failed to join course due to server error",
      error: "SERVER_ERROR",
    };
  }
}
