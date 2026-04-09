import { db } from "@/lib/prisma";

// import pdfParse from 'pdf-parse';
// import mammoth from 'mammoth';
export async function getAllQuizzesByInstructorId(instructorId) {
  try {
    if (!instructorId) {
      throw new Error("Instructor ID is required to fetch their quizzes.");
    }

    const quizzes = await db.quiz.findMany({
      where: {
        createdByUserId: instructorId,
      },
      include: {
        _count: {
          select: { questions: true }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return quizzes;
  } catch (error) {
    console.error(
      `Error fetching quizzes for instructor ${instructorId} using Prisma:`,
      error.message
    );

    throw new Error(
      `Failed to retrieve quizzes for instructor. Details: ${error.message}`
    );
  }
}
export async function getQuizDetailsById(quizId) {
  if (!quizId) {
    console.warn("getQuizById called without a quizId.");
    return null; // Or throw new Error("Quiz ID is required.");
  }

  try {
    const quiz = await db.quiz.findUnique({
      where: {
        id: quizId,
      },
      include: {
        questions: {
          orderBy: {
            order: "asc",
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!quiz) {
      console.log(`Quiz with ID ${quizId} not found.`);
      return null;
    }

    return quiz;
  } catch (error) {
    console.error(
      `Error fetching quiz with ID ${quizId} using Prisma:`,
      error.message
    );

    throw new Error(`Failed to retrieve quiz. Details: ${error.message}`);
  }
}

export async function getAllQuizSets(excludeUnPublished) {
  // try {
  //     let quizSets = [];
  //     if (excludeUnPublished) {
  //         quizSets = await Quizset.find({active: true}).lean();
  //     } else {
  //         quizSets = await Quizset.find().lean();
  //     }
  //       return replaceMongoIdInArray(quizSets);
  // } catch (e) {
  //     throw new Error(e);
  // }
}
export async function createQuiz(
  title,description,instructorId,generationType
) {
  try {
    const res = await db.quiz.create({
      data: {
        title,
        description,
        createdByUserId: instructorId,
        generationType,
      },
    });
    return res;
  } catch (e) {
    throw new Error(e);
  }
}
export async function updateQuizBasicInfo(quizId, updateData) {
  try {
    console.log(`Updating quiz with ID: ${quizId} with data:`, updateData);
    if (!quizId) {
      throw new Error("Quiz ID is required to update quiz information.");
    }

    // Validate updateData
    if (!updateData || Object.keys(updateData).length === 0) {
      throw new Error("Update data is required.");
    }

    // Validate status if provided
    if (
      updateData.status &&
      !["draft", "published"].includes(updateData.status)
    ) {
      throw new Error("Status must be either 'draft' or 'published'.");
    }

    // Validate title if provided
    if (updateData.title !== undefined) {
      if (typeof updateData.title !== "string") {
        throw new Error("Title must be a string.");
      }
      if (updateData.title.trim().length === 0) {
        throw new Error("Title cannot be empty.");
      }
      if (updateData.title.length > 60) {
        throw new Error("Title must be less than 60 characters.");
      }
    }

    // Validate description if provided
    if (updateData.description !== undefined) {
      if (typeof updateData.description !== "string") {
        throw new Error("Description must be a string.");
      }
      if (updateData.description.length > 200) {
        throw new Error("Description must be less than 200 characters.");
      }
    }

    // Remove generationType from updateData if present (since it's ignored)
    if (updateData.generationType) {
      console.log("generationType field ignored in update operation");
      delete updateData.generationType;
    }

    const updateObject = {
      updatedAt: new Date(),
    };

    // Add fields to update
    if (updateData.title !== undefined) {
      updateObject.title = updateData.title.trim();
    }

    if (updateData.description !== undefined) {
      updateObject.description = updateData.description.trim();
    }

    if (updateData.status !== undefined) {
      updateObject.status = updateData.status;
    }
    
    if (updateData.active !== undefined) {
      updateObject.active = updateData.active;
    }

    if (updateData.timeLimit !== undefined) {
      updateObject.timeLimit = Number(updateData.timeLimit);
    }

    const updatedQuiz = await db.quiz.update({
      where: {
        id: quizId,
      },
      data: updateObject,
    });

    console.log(`Quiz ${quizId} updated successfully:`, updateObject);
    return updatedQuiz;
    
  } catch (error) {
    console.error(`Error updating quiz ${quizId}:`, error.message);

    // Handle Prisma-specific errors
    if (error.code === "P2025") {
      throw new Error("Quiz not found. Please check the quiz ID.");
    }

    if (error.code === "P2002") {
      throw new Error("A quiz with this title already exists.");
    }

    throw new Error(`Failed to update quiz. Details: ${error.message}`);
  }
}

export async function getQuizWithDetails(quizId) {
  try {
    const quiz = await db.quiz.findUnique({
      where: {
        id: quizId,
      },
      // The 'include' block fetches all related data in a single query.
      include: {
        // --- Core Quiz Information ---
        // Fetch the user who created the quiz, but only select necessary fields.
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },

        // --- Question Data ---
        // Fetch all questions associated with this quiz.
        // For 'ai_pool' quizzes, this list represents the entire question pool.
        // For 'manual' and 'ai_fixed', this is the definitive set of questions.
        questions: {
          orderBy: {
            order: 'asc', // Order questions as intended by the creator.
          },
          select: {
            id: true,
            type: true,
            text: true,
            image: true,
            explanation: true,
            options: true,       // For MCQs
            correctAnswer: true, // For all types
            mark: true,
            order: true,
          },
        },

        // --- Contextual Information ---
        // Fetch the weeks this quiz is a part of, and the course for that week.
        // Note: Since weekIds is an array, this relationship needs to be handled
        // by querying the Week model separately if you need the full week objects.
        // A direct include won't work on an array of IDs.
        // Let's fetch the course context differently. See implementation below.
      },
    });

    if (!quiz) {
      console.log(`No quiz found with ID: ${quizId}`);
      return null;
    }

    // --- Fetching Week and Course Context ---
    // Since we're using Postgres many-to-many, we fetch weekQuiz records for this quiz
    const weekQuizzes = await db.weekQuiz.findMany({
      where: { quizId: quiz.id },
      select: { weekId: true }
    });
    
    const weekIds = weekQuizzes.map(wq => wq.weekId);

    const weeks = await db.week.findMany({
      where: {
        id: { in: weekIds },
      },
      select: {
        id: true,
        title: true,
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Combine the results into a single, comprehensive object.
    const quizWithContext = {
      ...quiz,
      weeks: weeks,
    };

    return quizWithContext;

  } catch (error) {
    console.error("Failed to get quiz details:", error);
    // Depending on your error handling strategy, you might throw the error
    // or return null/a custom error object.
    throw new Error("An error occurred while fetching the quiz.");
  }
}

export async function getCompletedQuizIdsByCourse(userId, courseId) {
    try {
        if (!userId || !courseId) {
            throw new Error("User ID and Course ID are required to fetch completed quiz IDs.");
        }

        // First get all week IDs for the course
        const courseWeeks = await db.week.findMany({
            where: {
                courseId: courseId
            },
            select: {
                id: true
            }
        });

        const courseWeekIds = courseWeeks.map(week => week.id);

        if (courseWeekIds.length === 0) {
            return [];
        }

        // Get completed quiz submissions for quizzes that belong to course weeks
        const completedQuizzes = await db.quizSubmission.findMany({
            where: {
                userId: userId,
               
                courseId:courseId
            }
        });

        return completedQuizzes.map(submission => submission.quizId);

    } catch (error) {
        console.error(
            `Error fetching completed quiz IDs for user ${userId} and course ${courseId} using Prisma:`,
            error.message
        );

        throw new Error(
            `Failed to retrieve completed quiz IDs for user and course. Details: ${error.message}`
        );
    }
}


