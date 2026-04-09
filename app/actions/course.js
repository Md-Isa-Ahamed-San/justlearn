"use server";

// Adjust the import path based on your setup

import { getLoggedInUser } from "@/lib/loggedin-user";
import { db } from "@/lib/prisma";

export async function createCourse(data) {
  try {
    const loggedinUser = await getLoggedInUser();

    if (!loggedinUser?.id) {
      throw new Error("User not authenticated");
    }

    // Ensure categoryId is provided and valid
    if (!data.categoryId) {
      throw new Error("Category ID is required");
    }

    const courseData = {
      title: data.title,
      description: data.description,
      thumbnail: data.thumbnail,
      code: data.code,
      visibility: data.visibility || "private",
      learning: data.learning || [], // JSON array of learning outcomes
      userId: loggedinUser.id, // Using userId instead of instructor
      categoryId: data.categoryId,
      active: data.active ?? false,
      rating: data.rating || 0,
    };

    const course = await db.course.create({
      data: courseData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            title: true,
          },
        },
        weeks:true

      },
    });

    return course;
  } catch (e) {
    console.error("Error creating course:", e);
    throw new Error(`Failed to create course: ${e.message}`);
  }
}

export async function updateCourse(courseId, dataToUpdate) {
  try {
    // Validate courseId
    if (!courseId) {
      throw new Error("Course ID is required");
    }

    // Check if course exists
    const existingCourse = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!existingCourse) {
      throw new Error("Course not found");
    }

    // Prepare update data - only include valid fields
    const updateData = {};

    if (dataToUpdate.title !== undefined) updateData.title = dataToUpdate.title;
    if (dataToUpdate.description !== undefined)
      updateData.description = dataToUpdate.description;
    if (dataToUpdate.thumbnail !== undefined)
      updateData.thumbnail = dataToUpdate.thumbnail;
    if (dataToUpdate.code !== undefined) updateData.code = dataToUpdate.code;
    if (dataToUpdate.visibility !== undefined)
      updateData.visibility = dataToUpdate.visibility;
    if (dataToUpdate.learning !== undefined)
      updateData.learning = dataToUpdate.learning;
    if (dataToUpdate.active !== undefined)
      updateData.active = dataToUpdate.active;
    if (dataToUpdate.rating !== undefined)
      updateData.rating = dataToUpdate.rating;
    if (dataToUpdate.categoryId !== undefined)
      updateData.categoryId = dataToUpdate.categoryId;

    const updatedCourse = await db.course.update({
      where: { id: courseId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return updatedCourse;
  } catch (e) {
    console.error("Error updating course:", e);
    throw new Error(`Failed to update course: ${e.message}`);
  }
}

export async function changeCoursePublishState(courseId) {
  try {
    // Validate courseId
    if (!courseId) {
      throw new Error("Course ID is required");
    }

    // Get current course state
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { id: true, active: true },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    // Toggle active state
    const updatedCourse = await db.course.update({
      where: { id: courseId },
      data: { active: !course.active },
      select: { active: true },
    });

    return updatedCourse.active;
  } catch (err) {
    console.error("Error changing course publish state:", err);
    throw new Error(`Failed to change course publish state: ${err.message}`);
  }
}

export async function deleteCourse(courseId) {
  try {
    // Validate courseId
    if (!courseId) {
      throw new Error("Course ID is required");
    }

    // Check if course exists
    const existingCourse = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!existingCourse) {
      throw new Error("Course not found");
    }

    // Delete the course (this will cascade delete related weeks, lessons, etc. due to onDelete: Cascade)
    await db.course.delete({
      where: { id: courseId },
    });

    return { success: true, message: "Course deleted successfully" };
  } catch (err) {
    console.error("Error deleting course:", err);
    throw new Error(`Failed to delete course: ${err.message}`);
  }
}

// Note: Based on your schema, there's no direct quizSet relationship to Course
// Quizzes are related to Weeks, which are related to Courses
// If you need to associate a quiz with a course, you'll need to work through weeks
export async function updateQuizForCourse(courseId, weekId, quizId) {
  console.log("Updating quiz for course:", { courseId, weekId, quizId });

  try {
    // Validate inputs
    if (!courseId || !weekId || !quizId) {
      throw new Error("Course ID, Week ID, and Quiz ID are required");
    }

    // Verify the week belongs to the course
    const week = await db.week.findUnique({
      where: { id: weekId },
      include: { course: true },
    });

    if (!week || week.courseId !== courseId) {
      throw new Error("Week does not belong to the specified course");
    }

    // Update the quiz to associate it with the week
    const updatedQuiz = await db.quiz.update({
      where: { id: quizId },
      data: { weekId: weekId },
      include: {
        week: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return updatedQuiz;
  } catch (error) {
    console.error("Error updating quiz for course:", error);
    throw new Error(`Failed to update quiz for course: ${error.message}`);
  }
}

// Additional helper function to get course with full details
export async function getCourseWithDetails(courseId) {
  try {
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
        weeks: {
          include: {
            lessons: true,
            weekQuiz: {
              include: {
                quiz: {
                  include: {
                    questions: true,
                    submissions: {
                      include: {
                        user: {
                          select: {
                            id: true,
                            name: true,
                            email: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },

          },
          orderBy: { order: "asc" },
        },
        courseProgress: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        testimonials: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        certificates: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return course;
  } catch (error) {
    console.error("Error getting course details:", error);
    throw new Error(`Failed to get course details: ${error.message}`);
  }
}

// Helper function to get courses by instructor
export async function getCoursesByInstructor(
  instructorUserId,
  includeInactive = false
) {
  try {
    const whereClause = {
      userId: instructorUserId,
    };

    if (!includeInactive) {
      whereClause.active = true;
    }

    const courses = await db.course.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            title: true,
          },
        },
        weeks: {
          select: {
            id: true,
            title: true,
            order: true,
            _count: {
              select: {
                lessons: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            courseProgress: true,
            testimonials: true,
            certificates: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return courses;
  } catch (error) {
    console.error("Error getting courses by instructor:", error);
    throw new Error(`Failed to get instructor courses: ${error.message}`);
  }
}

export async function manuallyCompleteCourse(userId, courseId) {
  try {
    const loggedinUser = await getLoggedInUser();

    if (!loggedinUser?.id || loggedinUser.role !== "instructor") {
      throw new Error("Only instructors can manually complete courses");
    }

    // 1. Get current course structure
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        weeks: {
          include: {
            lessons: true,
            weekQuiz: true,
          }
        }
      }
    });

    if (!course) throw new Error("Course not found");

    const totalLessons = course.weeks.reduce((acc, w) => acc + w.lessons.length, 0);
    const totalQuizzes = course.weeks.reduce((acc, w) => acc + (w.weekQuiz?.length || 0), 0);

    // 2. Update/Create Progress
    const progress = await db.courseProgress.upsert({
      where: {
        userId_courseId: { userId, courseId }
      },
      update: {
        status: "completed",
        progress: 100,
        completedLessons: totalLessons,
        completedQuizzes: totalQuizzes,
        completedWeeks: course.weeks.length,
        completionDate: new Date(),
        lastActivityDate: new Date(),
        isCertified: true,
      },
      create: {
        userId,
        courseId,
        status: "completed",
        progress: 100,
        totalWeeks: course.weeks.length,
        totalLessons,
        totalQuizzes,
        completedLessons: totalLessons,
        completedQuizzes: totalQuizzes,
        completedWeeks: course.weeks.length,
        completionDate: new Date(),
        lastActivityDate: new Date(),
        isCertified: true,
      }
    });

    // 3. Issue Certificate if not exists
    const existingCert = await db.certificate.findFirst({
      where: { userId, courseId }
    });

    if (!existingCert) {
      await db.certificate.create({
        data: {
          userId,
          courseId,
          certificateLink: `/certificates/${userId}/${courseId}`,
          snapshotData: {
            courseTitle: course.title,
            completedAt: new Date(),
            totalWeeks: course.weeks.length,
            totalLessons,
            totalQuizzes
          }
        }
      });
    }

    return { success: true, progress };
  } catch (error) {
    console.error("Manual completion error:", error);
    throw new Error(error.message);
  }
}
