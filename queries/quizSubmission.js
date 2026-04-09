import { db } from "@/lib/prisma";

export async function getCourseQuizzesOverview(courseId, instructorId) {
  try {
    // Verify instructor has access to this course
    const courseAccess = await db.course.findFirst({
      where: {
        id: courseId,
        userId: instructorId
      }
    });

    if (!courseAccess) {
      throw new Error('Unauthorized: Instructor does not have access to this course');
    }

    // Get course with weeks and weekQuiz relations
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        weeks: {
          orderBy: { order: 'asc' },
          include: {
            weekQuiz: true // Fetch join table entries
          }
        }
      }
    });

    if (!course) {
      throw new Error('Course not found');
    }

    // Extract all quiz IDs from all weeks using the join table
    const allQuizIds = course.weeks.reduce((acc, week) => {
      if (week.weekQuiz && week.weekQuiz.length > 0) {
        acc.push(...week.weekQuiz.map(wq => wq.quizId));
      }
      return acc;
    }, []);

    console.log("🚀 ~ getCourseQuizzesOverview ~ allQuizIds:", allQuizIds);

    // Get all quizzes by their IDs
    const quizzes = await db.quiz.findMany({
      where: {
        id: { in: allQuizIds }
      },
      include: {
        _count: {
          select: {
            submissions: {
              where: {
                courseId: courseId
              }
            }
          }
        }
      }
    });

    console.log("🚀 ~ getCourseQuizzesOverview ~ quizzes:", quizzes);

    // Get all quiz submissions for these quizzes in this course with user details
    const quizSubmissions = await db.quizSubmission.findMany({
      where: {
        quizId: { in: allQuizIds },
        courseId: courseId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            student: {
              select: {
                idNumber: true,
                session: true,
                department: true
              }
            }
          }
        },
        quiz: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log("🚀 ~ getCourseQuizzesOverview ~ quizSubmissions:", quizSubmissions);

    // Get unique students who have submitted quizzes for this course
    const uniqueStudentIds = [...new Set(quizSubmissions.map(sub => sub.userId))];
    const totalStudentsWithSubmissions = uniqueStudentIds.length;

    // Process weeks with quizzes
    const weeklyQuizzes = course.weeks.map(week => {
      const weekQuizIds = week.weekQuiz ? week.weekQuiz.map(wq => wq.quizId) : [];
      // Get quizzes for this specific week
      const weekQuizzes = quizzes.filter(quiz => 
        weekQuizIds.includes(quiz.id)
      );

      const processedQuizzes = weekQuizzes.map(quiz => {
        // Get submissions for this specific quiz
        const quizSpecificSubmissions = quizSubmissions.filter(sub => sub.quizId === quiz.id);
        
        const completionPercentage = totalStudentsWithSubmissions > 0 
          ? Math.round((quiz._count.submissions / totalStudentsWithSubmissions) * 100)
          : 0;

        return {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          status: quiz.status,
          timeLimit: quiz.timeLimit,
          maxAttempts: quiz.maxAttempts,
          securityLevel: quiz.securityLevel,
          totalSubmissions: quiz._count.submissions,
          completionPercentage: `${completionPercentage}%`,
          createdAt: quiz.createdAt,
          submissions: quizSpecificSubmissions.map(sub => ({
            id: sub.id,
            score: sub.score,
            attemptNumber: sub.attemptNumber,
            timeSpent: sub.timeSpent,
            submissionReason: sub.submissionReason,
            createdAt: sub.createdAt,
            student: {
              id: sub.user.id,
              name: sub.user.name,
              email: sub.user.email,
              idNumber: sub.user.student?.idNumber,
              session: sub.user.student?.session,
              department: sub.user.student?.department
            }
          }))
        };
      });

      return {
        week: {
          id: week.id,
          title: week.title,
          description: week.description,
          order: week.order,
          status: week.status
        },
        quizzes: processedQuizzes,
        totalQuizzes: processedQuizzes.length
      };
    });

    // Filter out weeks with no quizzes
    const weeksWithQuizzes = weeklyQuizzes.filter(week => week.totalQuizzes > 0);

    // Calculate overall statistics
    const totalQuizSubmissions = quizSubmissions.length;
    const averageScore = quizSubmissions.length > 0 
      ? quizSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0) / quizSubmissions.length 
      : 0;

    return {
      courseInfo: {
        id: course.id,
        title: course.title,
        code: course.code,
        description: course.description
      },
      weeklyQuizzes: weeksWithQuizzes,
      summary: {
        totalWeeks: weeksWithQuizzes.length,
        totalQuizzes: allQuizIds.length,
        totalStudents: totalStudentsWithSubmissions,
        totalSubmissions: totalQuizSubmissions,
        averageScore: Math.round(averageScore * 100) / 100
      },
      allSubmissions: quizSubmissions.map(sub => ({
        id: sub.id,
        quizTitle: sub.quiz.title,
        score: sub.score,
        attemptNumber: sub.attemptNumber,
        timeSpent: sub.timeSpent,
        submissionReason: sub.submissionReason,
        createdAt: sub.createdAt,
        student: {
          id: sub.user.id,
          name: sub.user.name,
          email: sub.user.email,
          idNumber: sub.user.student?.idNumber,
          session: sub.user.student?.session,
          department: sub.user.student?.department
        }
      }))
    };

  } catch (error) {
    console.error('Error fetching course quizzes overview:', error);
    throw new Error(`Failed to fetch course quizzes overview: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Function 2: Get detailed quiz submissions for a specific quiz
export async function getQuizSubmissionDetails(quizId, instructorId) {
  try {
    // Get quiz with submissions and verify instructor access
    const quiz = await db.quiz.findFirst({
      where: {
        id: quizId,
        createdByUserId: instructorId
      },
      include: {
        submissions: {
          include: {
            user: {
              include: {
                student: true
              }
            }
          },
          orderBy: [
            { userId: 'asc' },
            { attemptNumber: 'desc' } // Get latest attempt first
          ]
        },
        questions: {
          select: { id: true }
        }
      }
    });

    if (!quiz) {
      throw new Error('Quiz not found or access denied');
    }

    // Get unique submissions (latest attempt per student)
    const uniqueSubmissions = quiz.submissions.reduce((acc, submission) => {
      const existingSubmission = acc.find(s => s.userId === submission.userId);
      if (!existingSubmission || submission.attemptNumber > existingSubmission.attemptNumber) {
        if (existingSubmission) {
          acc.splice(acc.indexOf(existingSubmission), 1);
        }
        acc.push(submission);
      }
      return acc;
    }, []);

    // Calculate overall statistics
    const scores = uniqueSubmissions
      .map(s => s.score)
      .filter(score => score !== null);
    
    const timeSpents = uniqueSubmissions
      .map(s => s.timeSpent)
      .filter(time => time !== null);

    const completedSubmissions = uniqueSubmissions.filter(s => s.endTime !== null);
    
    const flaggedSubmissions = uniqueSubmissions.filter(submission => {
      const violations = submission.violations || {};
      return submission.warningCount > 0 || 
             submission.disconnectionCount > 2 ||
             submission.totalOfflineCount > 3 ||
             Object.values(violations).some(count => count > 0);
    });

    // Calculate statistics
    const overallStats = {
      totalSubmissions: uniqueSubmissions.length,
      completedSubmissions: completedSubmissions.length,
      completionPercentage: uniqueSubmissions.length > 0 
        ? `${Math.round((completedSubmissions.length / uniqueSubmissions.length) * 100)}%`
        : '0%',
      averageScore: scores.length > 0 
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 
        : 0,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
      averageTimeSpent: timeSpents.length > 0 
        ? Math.round((timeSpents.reduce((a, b) => a + b, 0) / timeSpents.length) / 60 * 100) / 100 
        : 0, // Convert to minutes
      flaggedSubmissions: flaggedSubmissions.length,
      flaggedPercentage: uniqueSubmissions.length > 0 
        ? `${Math.round((flaggedSubmissions.length / uniqueSubmissions.length) * 100)}%`
        : '0%'
    };

    // Format student submissions
    const studentSubmissions = uniqueSubmissions.map(submission => {
      const timeSpentMinutes = submission.timeSpent 
        ? Math.round(submission.timeSpent / 60 * 100) / 100 
        : 0;

      const violations = submission.violations || {};
      const isTimedOut = submission.submissionReason === 'time_expired';
      const isAutoSubmitted = ['auto_submitted', 'tab_switch_auto_submit', 'minimize_auto_submit', 'offline_auto_submit', 'violation_limit_exceeded'].includes(submission.submissionReason);

      return {
        student: {
          name: submission.user.name,
          email: submission.user.email,
          idNumber: submission.user.student?.idNumber || 0
        },
        submission: {
          id: submission.id,
          score: submission.score,
          scorePercentage: submission.score && quiz.questions?.length 
            ? `${Math.round((submission.score / quiz.questions.length) * 100)}%`
            : 'N/A',
          timeSpent: timeSpentMinutes,
          timeSpentFormatted: `${Math.floor(timeSpentMinutes)} min`,
          submissionReason: submission.submissionReason,
          attemptNumber: submission.attemptNumber,
          startTime: submission.startTime,
          endTime: submission.endTime,
          isCompleted: submission.endTime !== null,
          isTimedOut: isTimedOut,
          isAutoSubmitted: isAutoSubmitted,
          antiCheating: {
            disconnectionCount: submission.disconnectionCount,
            totalOfflineCount: submission.totalOfflineCount,
            warningCount: submission.warningCount,
            violations: {
              tabSwitches: violations.tabSwitches || 0,
              windowMinimizes: violations.windowMinimizes || 0,
              fullscreenExits: violations.fullscreenExits || 0,
              copyAttempts: violations.copyAttempts || 0,
              rightClicks: violations.rightClicks || 0
            },
            warningMessage: submission.warningMessage,
            isFullscreenSupported: submission.isFullscreenSupported,
            isFlagged: submission.warningCount > 0 || 
                      submission.disconnectionCount > 2 ||
                      submission.totalOfflineCount > 3 ||
                      Object.values(violations).some(count => count > 0)
          }
        }
      };
    });

    // Sort students by score (highest first), then by name
    const sortedSubmissions = studentSubmissions.sort((a, b) => {
      if (b.submission.score !== a.submission.score) {
        return (b.submission.score || 0) - (a.submission.score || 0);
      }
      return a.student.name.localeCompare(b.student.name);
    });

    return {
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        maxAttempts: quiz.maxAttempts,
        securityLevel: quiz.securityLevel,
        enableAntiCheating: quiz.enableAntiCheating,
        status: quiz.status,
        createdAt: quiz.createdAt
      },
      overallStats,
      studentSubmissions: sortedSubmissions
    };

  } catch (error) {
    console.error('Error fetching quiz submission details:', error);
    throw new Error(`Failed to fetch quiz submission details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
