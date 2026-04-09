import { db } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const REVALIDATE_TIME = 300;

// ===== COURSE FUNCTIONS =====

// ✅ Get All Courses (Cached)
export const getCourseList = unstable_cache(
    async () => {
      try {
        const courses = await db.course.findMany({
          include: {
            category: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                instructor: {
                  select: {
                    id: true,
                    designation: true,
                    bio: true,
                    department: true,
                  },
                },
              },
            },
          },
        });

        return courses;
      } catch (error) {
        console.error("❌ Error fetching course list:", error);
        throw error;
      }
    },
    () => ["all-courses"],
    {
      revalidate: REVALIDATE_TIME,
    }
);

// ✅ Get Course Details by ID
export const getCourseDetailsById = async (id) => {
  try {
    const course = await db.course.findUnique({
      where: { id },
      include: {
        category: true,
        user: {
          include: {
            instructor: true,
          },
        },
        weeks: {
          include: {
            lessons: {
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
        testimonials: {
          include: {
            user: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    // If you need to fetch quizzes for each week, you'll need to do it separately
    if (course && course.weeks) {
      for (const week of course.weeks) {
        // Fetch weekQuiz join records for this week to get quiz IDs
        const weekQuizzes = await db.weekQuiz.findMany({
          where: { weekId: week.id },
          select: { quizId: true }
        });
        
        const quizIds = weekQuizzes.map(wq => wq.quizId);

        if (quizIds.length > 0) {
          week.quizzes = await db.quiz.findMany({
            where: {
              id: {
                in: quizIds,
              },
            },
            orderBy: { createdAt: "asc" },
          });
        } else {
          week.quizzes = [];
        }
      }
    }

    return course;
  } catch (error) {
    console.error(`Error fetching course ${id}:`, error);
    throw error;
  }
};

// ✅ Get Courses by Category
export const getCoursesByCategory = async (categoryId) => {
  try {
    if (!categoryId) {
      throw new Error("Category ID is required to fetch courses.");
    }

    const courses = await db.course.findMany({
      where: {
        categoryId: categoryId,
        active: true,
      },
      include: {
        category: true,
        user: {
          include: {
            instructor: true,
          },
        },
        weeks: {
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                duration: true,
                order: true,
              },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            testimonials: true,
            courseProgress: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return courses;
  } catch (error) {
    console.error(
        `Error fetching courses for category ${categoryId}:`,
        error.message
    );
    throw new Error(
        `Failed to retrieve courses for category. Details: ${error.message}`
    );
  }
};

// ✅ Get Instructor Courses
export const getInstructorCourses = async (userId) => {
  try {
    if (!userId) {
      console.error("❌ No userId provided");
      return [];
    }

    const courses = await db.course.findMany({
      where: {
        userId: userId,
      },
      include: {
        category: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
            instructor: {
              select: {
                id: true,
                designation: true,
                bio: true,
                department: true,
              },
            },
          },
        },
        weeks: {
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                duration: true,
                order: true,
              },
              orderBy: {
                order: "asc",
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
        testimonials: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            testimonials: true,
            participations: true, // ✅ Fixed: Use participations for student count
            courseProgress: true, // Keep this for students who have progress
            certificates: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    

    const transformedCourses = courses.map((course) => {
      // Calculate total duration from all lessons in all weeks
      const totalDuration = course.weeks.reduce((total, week) => {
        const weekDuration = week.lessons.reduce((weekTotal, lesson) => {
          return weekTotal + (lesson.duration || 0);
        }, 0);
        return total + weekDuration;
      }, 0);

      // Calculate total lessons across all weeks
      const totalLessons = course.weeks.reduce((total, week) => {
        return total + week.lessons.length;
      }, 0);

      // Use the existing course rating (already calculated/stored)
      const averageRating = course.rating || 0;

      const totalQuizzes = course.weeks.reduce((total, week) => {
        return total + (week.weekQuiz ? week.weekQuiz.length : 0);
      }, 0);
console.log("CoursesPage ~ fetched courses in server action:", {
        course,
        totalDuration,
        totalLessons,
        totalWeeks: course.weeks.length,
        totalQuizzes,
        totalStudents: course._count.participations, // ✅ Fixed: Use participations for enrolled students
        studentsWithProgress: course._count.courseProgress, // Additional info: students who started
        totalTestimonials: course._count.testimonials,
        totalCertificates: course._count.certificates,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      });
      return {
        ...course,
        totalDuration,
        totalLessons,
        totalWeeks: course.weeks.length,
        totalQuizzes,
        totalStudents: course._count.participations, // ✅ Fixed: Use participations for enrolled students
        studentsWithProgress: course._count.courseProgress, // Additional info: students who started
        totalTestimonials: course._count.testimonials,
        totalCertificates: course._count.certificates,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      };
    });

    return transformedCourses;
  } catch (error) {
    console.error(
      `❌ Error fetching courses for instructor ${instructorId}:`,
      error
    );
    return [];
  }
};

// ===== USER ENROLLMENT FUNCTIONS =====

// ✅ Get User's Enrolled Courses
export const getUserEnrolledCourses = async (userId) => {
  try {
    if (!userId) {
      console.error("❌ No userId provided");
      throw new Error("User ID is required");
    }

    const enrolledCourses = await db.participation.findMany({
      where: {
        userId: userId,
      },
      include: {
        course: {
          include: {
            category: {
              select: {
                id: true,
                title: true,
                thumbnail: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                image: true,
                instructor: {
                  select: {
                    id: true,
                    designation: true,
                    bio: true,
                    department: true,
                  },
                },
              },
            },
            weeks: {
              select: {
                id: true,
                title: true,
                order: true,
                weekQuiz: {
                  select: { id: true }
                },
                lessons: {
                  select: {
                    id: true,
                    title: true,
                    duration: true,
                    order: true,
                  },
                  orderBy: {
                    order: "asc",
                  },
                },
              },
              orderBy: {
                order: "asc",
              },
            },
            // ✅ Join CourseProgress to get the real progress % and status
            courseProgress: {
              where: { userId },
              select: {
                status: true,
                progress: true,
                completedLessons: true,
                completedQuizzes: true,
                completionDate: true,
                lastActivityDate: true,
              },
            },
            _count: {
              select: {
                testimonials: true,
                participations: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const transformedCourses = enrolledCourses.map((enrollment) => {
      const course = enrollment.course;

      const totalDuration = course.weeks.reduce((total, week) => {
        const weekDuration = week.lessons.reduce((weekTotal, lesson) => {
          return weekTotal + (lesson.duration || 0);
        }, 0);
        return total + weekDuration;
      }, 0);

      const totalLessons = course.weeks.reduce((total, week) => {
        return total + week.lessons.length;
      }, 0);

      // ✅ Pull the real progress and status from the CourseProgress record
      const progressRecord = course.courseProgress?.[0];

      return {
        enrollmentId: enrollment.id,
        // Real progress % (0–100) from CourseProgress
        progress: progressRecord?.progress ?? 0,
        // Real enrollment status
        enrollmentStatus: progressRecord?.status ?? "not_started",
        enrolledAt: enrollment.createdAt,
        lastUpdated: enrollment.updatedAt,
        course: {
          ...course,
          courseProgress: undefined, // strip from nested object
          totalDuration,
          totalLessons,
          totalWeeks: course.weeks.length,
          totalStudents: course._count.participations,
          totalTestimonials: course._count.testimonials,
        },
      };
    });

    return transformedCourses;
  } catch (error) {
    console.error(
        `❌ Error fetching enrolled courses for user ${userId}:`,
        error
    );
    throw error;
  }
};


// ✅ Get User's Course Enrollment Status
export const getUserCourseEnrollmentStatus = unstable_cache(
    async (userId, courseId) => {
      try {
        if (!userId || !courseId) {
          throw new Error("Both User ID and Course ID are required");
        }

        const enrollment = await db.courseProgress.findFirst({
          where: {
            userId: userId,
            courseId: courseId,
          },
          select: {
            id: true,
            status: true,
            progress: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return {
          isEnrolled: !!enrollment,
          enrollment: enrollment || null,
        };
      } catch (error) {
        console.error(`❌ Error checking enrollment status:`, error);
        throw error;
      }
    },
    (userId, courseId) => [`enrollment-status-${userId}-${courseId}`],
    {
      revalidate: REVALIDATE_TIME,
    }
);

// ===== INSTRUCTOR ANALYTICS FUNCTIONS =====

// ✅ Get Instructor Detailed Stats
export const getInstructorDetailedStats = async (userId) => {
  try {
    if (!userId) {
      console.error("❌ No userId provided");
      throw new Error("User ID is required");
    }

    const courses = await db.course.findMany({
      where: {
        userId: userId,
      },
      select: { id: true },
    });

    const courseIds = courses.map((course) => course.id);
    const courseCount = courseIds.length;

    if (courseCount === 0) {
      return {
        courseCount: 0,
        totalStudents: 0,
        averageRating: 0,
        testimonialCount: 0,
      };
    }

    const courseParticipationStats = await db.participation.groupBy({
      by: ["courseId"],
      where: {
        courseId: { in: courseIds },
      },
      _count: { id: true },
    });

    const totalStudents = courseParticipationStats.reduce(
        (total, item) => total + item._count.id,
        0
    );

    const testimonials = await db.testimonial.findMany({
      where: {
        courseId: { in: courseIds },
        rating: {
          not: null,
          gte: 1,
        },
      },
      select: { rating: true },
    });

    const testimonialCount = testimonials.length;
    const totalRating = testimonials.reduce(
        (sum, t) => sum + (t.rating || 0),
        0
    );
    const averageRating =
        testimonialCount > 0 ? totalRating / testimonialCount : 0;

    return {
      courseCount,
      totalStudents,
      averageRating: parseFloat(averageRating.toFixed(2)),
      testimonialCount,
    };
  } catch (error) {
    console.error(
        `❌ Error fetching stats for user ${userId}:`,
        error
    );
    throw error;
  }
};

// ✅ Get Instructor Analytics
export const getInstructorAnalytics = async (instructorUserId) => {
  try {
    const instructorCourses = await db.course.findMany({
      where: {
        userId: instructorUserId,
      },
      include: {
        weeks: {
          include: {
            lessons: true,
          },
        },
        testimonials: true,
        certificates: true,
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
        participations: {
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
    });

    const instructorQuizzes = await db.quiz.findMany({
      where: {
        createdByUserId: instructorUserId,
      },
      include: {
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
        questions: true,
        weekQuiz: {
          select: {
            weekId: true
          }
        }
      },
    });

    const totalCourses = instructorCourses.length;

    const uniqueStudentIds = new Set();
    instructorCourses.forEach((course) => {
      course.courseProgress.forEach((progress) => {
        uniqueStudentIds.add(progress.userId);
      });
      course.participations.forEach((participation) => {
        uniqueStudentIds.add(participation.userId);
      });
    });
    const totalStudents = uniqueStudentIds.size;

    let totalLessons = 0;
    let totalQuizzes = 0;
    let completedCourses = 0;

    instructorCourses.forEach((course) => {
      course.weeks.forEach((week) => {
        totalLessons += week.lessons.length;
        // Postgres many-to-many: count from the weekQuiz join table
        totalQuizzes += (week.weekQuiz ? week.weekQuiz.length : 0);
      });

      completedCourses += course.courseProgress.filter(
          (progress) => progress.progress === 100
      ).length;
    });

    const totalQuizSubmissions = instructorQuizzes.reduce(
        (sum, quiz) => sum + quiz.submissions.length,
        0
    );

    const allTestimonials = instructorCourses.flatMap(
        (course) => course.testimonials
    );
    const averageRating =
        allTestimonials.length > 0
            ? allTestimonials.reduce(
            (sum, testimonial) => sum + (testimonial.rating || 0),
            0
        ) / allTestimonials.length
            : 0;

    const completionRate =
        totalStudents > 0 ? (completedCourses / totalStudents) * 100 : 0;

    const recentActivity = await db.quizSubmission.findMany({
      where: {
        quiz: {
          createdByUserId: instructorUserId,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        quiz: {
          select: {
            title: true,
            weekQuiz: {
              select: {
                weekId: true
              }
            }
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    const coursePerformance = instructorCourses.map((course) => {
      const courseStudents = course.courseProgress.length;
      const courseCompletions = course.courseProgress.filter(
          (progress) => progress.progress === 100
      ).length;
      const courseRating =
          course.testimonials.length > 0
              ? course.testimonials.reduce(
              (sum, testimonial) => sum + (testimonial.rating || 0),
              0
          ) / course.testimonials.length
              : 0;

      const courseWeekIds = course.weeks.map((week) => week.id);
      const courseQuizzes = instructorQuizzes.filter((quiz) =>
          quiz.weekQuiz && quiz.weekQuiz.some((wq) => courseWeekIds.includes(wq.weekId))
      );

      const courseQuizSubmissions = courseQuizzes.reduce(
          (sum, quiz) => sum + quiz.submissions.length,
          0
      );

      return {
        id: course.id,
        title: course.title,
        students: courseStudents,
        completions: courseCompletions,
        completionRate:
            courseStudents > 0 ? (courseCompletions / courseStudents) * 100 : 0,
        rating: courseRating,
        totalLessons: course.weeks.reduce(
            (sum, week) => sum + week.lessons.length,
            0
        ),
        totalQuizzes: courseQuizzes.length,
        totalQuizSubmissions: courseQuizSubmissions,
      };
    });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyEnrollments = await db.courseProgress.groupBy({
      by: ["createdAt"],
      where: {
        course: {
          userId: instructorUserId,
        },
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      _count: {
        id: true,
      },
    });

    const monthlyQuizSubmissions = await db.quizSubmission.groupBy({
      by: ["createdAt"],
      where: {
        quiz: {
          createdByUserId: instructorUserId,
        },
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      _count: {
        id: true,
      },
    });

    const quizStats = {
      totalQuizzes: instructorQuizzes.length,
      draftQuizzes: instructorQuizzes.filter((q) => q.status === "draft")
          .length,
      publishedQuizzes: instructorQuizzes.filter((q) => q.status === "published")
          .length,
      aiGeneratedQuizzes: instructorQuizzes.filter(
          (q) => q.generationType === "ai_fixed" || q.generationType === "ai_pool"
      ).length,
      manualQuizzes: instructorQuizzes.filter((q) => q.generationType === "manual")
          .length,
      averageQuestionsPerQuiz:
          instructorQuizzes.length > 0
              ? Math.round(
                  instructorQuizzes.reduce(
                      (sum, quiz) => sum + quiz.questions.length,
                      0
                  ) / instructorQuizzes.length
              )
              : 0,
    };

    const completedSubmissions = instructorQuizzes.flatMap((quiz) =>
        quiz.submissions.filter((sub) => sub.status === "completed")
    );
    const averageQuizScore =
        completedSubmissions.length > 0
            ? completedSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0) /
            completedSubmissions.length
            : 0;

    return {
      totalCourses,
      totalStudents,
      totalLessons,
      totalQuizzes,
      totalQuizSubmissions,
      completedCourses,
      averageRating: Math.round(averageRating * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      totalCertificates: instructorCourses.reduce(
          (sum, course) => sum + course.certificates.length,
          0
      ),
      recentActivity,
      coursePerformance,
      monthlyEnrollments,
      monthlyQuizSubmissions,
      totalTestimonials: allTestimonials.length,
      publishedCourses: instructorCourses.filter((course) => course.active)
          .length,
      averageStudentsPerCourse:
          totalCourses > 0 ? Math.round(totalStudents / totalCourses) : 0,
      quizStats,
      averageQuizScore: Math.round(averageQuizScore * 10) / 10,
      totalParticipations: instructorCourses.reduce(
          (sum, course) => sum + course.participations.length,
          0
      ),
    };
  } catch (error) {
    console.error("Error fetching instructor analytics:", error);
    throw new Error("Failed to fetch analytics data");
  }
};

// ===== CATEGORY FUNCTIONS =====

// ✅ Get All Categories
export const getAllCategories = async () => {
  try {
    const categories = await db.category.findMany({
      orderBy: {
        title: "asc",
      },
    });

    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }
};

// ✅ Get Category by ID
export const getCategoryById = async (categoryId) => {
  try {
    if (!categoryId) {
      throw new Error("Category ID is required to fetch category details.");
    }

    const category = await db.category.findUnique({
      where: { id: categoryId },
      include: {
        courses: {
          include: {
            user: {
              include: {
                instructor: true,
              },
            },
            _count: {
              select: {
                testimonials: true,
                courseProgress: true,
              },
            },
          },
        },
      },
    });

    return category;
  } catch (error) {
    console.error(
        `Error fetching category ${categoryId}:`,
        error.message
    );
    throw new Error(
        `Failed to retrieve category details. Details: ${error.message}`
    );
  }
};

// ===== STUDENT FUNCTIONS =====

// ✅ Get Students in Course
export const getStudentsInCourse = async (courseId) => {
  try {
    if (!courseId) {
      throw new Error("Course ID is required to fetch students.");
    }

    const participations = await db.participation.findMany({
      where: {
        courseId: courseId,
      },
      include: {
        user: {
          include: {
            student: true,
            courseProgress: {
              where: {
                courseId: courseId,
              },
            },
          },
        },
      },
    });

    if (!participations) {
      return []; // Return an empty array if no participations found
    }

    // Filter for users who are students and extract student details with progress
    const students = participations
      .map((participation) => {
        const user = participation.user;

        if (user.student) {
          // Get course progress for this specific course
          const courseProgress = user.courseProgress.find(
            (progress) => progress.courseId === courseId
          );

          return {
            userId: user.id,
            name: user.name,
            email: user.email,
            studentDetails: user.student,
            participationData: participation.progress,
            courseProgress: courseProgress
              ? {
                  status: courseProgress.status,
                  progress: courseProgress.progress,
                  totalWeeks: courseProgress.totalWeeks,
                  totalLessons: courseProgress.totalLessons,
                  totalQuizzes: courseProgress.totalQuizzes,
                  completedLessons: courseProgress.completedLessons,
                  completedQuizzes: courseProgress.completedQuizzes,
                  completedWeeks: courseProgress.completedWeeks,
                  lastActivityDate: courseProgress.lastActivityDate,
                  completionDate: courseProgress.completionDate,
                }
              : {
                  status: "not_started",
                  progress: 0,
                  totalWeeks: 0,
                  totalLessons: 0,
                  totalQuizzes: 0,
                  completedLessons: 0,
                  completedQuizzes: 0,
                  completedWeeks: 0,
                  lastActivityDate: null,
                  completionDate: null,
                }, // Default progress if no record exists
          };
        }
        return null;
      })
      .filter((student) => student !== null);

    return students;
  } catch (error) {
    console.error("Error fetching students in course:", error);
    return []; // Return an empty array in case of an error
  }
};

// ✅ Get Student by ID
export const getStudentById = async (studentId) => {
  try {
    if (!studentId) {
      throw new Error("Student ID is required to fetch student details.");
    }

    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    return student;
  } catch (error) {
    console.error(
        `Error fetching student ${studentId}:`,
        error.message
    );
    throw new Error(
        `Failed to retrieve student details. Details: ${error.message}`
    );
  }
};

// ===== QUIZ FUNCTIONS =====

// ✅ Get All Quizzes by Instructor ID
export const getAllQuizzesByInstructorId = async (instructorId) => {
  try {
    if (!instructorId) {
      throw new Error("Instructor ID is required to fetch their quizzes.");
    }

    const quizzes = await db.quiz.findMany({
      where: {
        createdByUserId: instructorId,
      },
      include: {
        questions: {
          select: {
            id: true,
            type: true,
            text: true,
            mark: true,
            order: true,
          },
          orderBy: {
            order: "asc",
          },
        },
        submissions: {
          select: {
            id: true,
            status: true,
            score: true,
            attemptNumber: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            questions: true,
            submissions: true,
          },
        },
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
};

// ✅ Get Quiz by ID
export const getQuizById = async (quizId) => {
  try {
    if (!quizId) {
      throw new Error("Quiz ID is required to fetch quiz details.");
    }

    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            studentAnswers: {
              include: {
                quizSubmission: {
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
          orderBy: {
            order: "asc",
          },
        },
        submissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            studentAnswers: {
              include: {
                question: {
                  select: {
                    id: true,
                    text: true,
                    type: true,
                    mark: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            instructor: {
              select: {
                id: true,
                designation: true,
                department: true,
              },
            },
          },
        },
        _count: {
          select: {
            questions: true,
            submissions: true,
          },
        },
      },
    });

    return quiz;
  } catch (error) {
    console.error(
        `Error fetching quiz ${quizId}:`,
        error.message
    );
    throw new Error(
        `Failed to retrieve quiz details. Details: ${error.message}`
    );
  }
};

// ✅ Get Quiz Submissions by Quiz ID
export const getQuizSubmissionsByQuizId = async (quizId) => {
  try {
    if (!quizId) {
      throw new Error("Quiz ID is required to fetch submissions.");
    }

    const submissions = await db.quizSubmission.findMany({
      where: {
        quizId: quizId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            student: {
              select: {
                id: true,
                idNumber: true,
                session: true,
                department: true,
              },
            },
          },
        },
        studentAnswers: {
          include: {
            question: {
              select: {
                id: true,
                text: true,
                type: true,
                mark: true,
                correctAnswer: true,
              },
            },
          },
        },
        quiz: {
          select: {
            id: true,
            title: true,
            timeLimit: true,
            maxAttempts: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return submissions;
  } catch (error) {
    console.error(
        `Error fetching submissions for quiz ${quizId}:`,
        error.message
    );
    throw new Error(
        `Failed to retrieve quiz submissions. Details: ${error.message}`
    );
  }
};

// ===== WEEK & LESSON FUNCTIONS =====

// ✅ Get Week by ID
export const getWeekById = async (weekId) => {
  try {
    if (!weekId) {
      throw new Error("Week ID is required to fetch week details.");
    }

    const week = await db.week.findUnique({
      where: { id: weekId },
      include: {
        lessons: {
          orderBy: {
            order: "asc",
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            user: {
              select: {
                id: true,
                name: true,
                instructor: {
                  select: {
                    id: true,
                    designation: true,
                    department: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return week;
  } catch (error) {
    console.error(
        `Error fetching week ${weekId}:`,
        error.message
    );
    throw new Error(
        `Failed to retrieve week details. Details: ${error.message}`
    );
  }
};

// ✅ Get Lesson by ID
export const getLessonById = async (lessonId) => {
  try {
    if (!lessonId) {
      throw new Error("Lesson ID is required to fetch lesson details.");
    }

    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: {
        week: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                description: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    instructor: {
                      select: {
                        id: true,
                        designation: true,
                        department: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        watches: {
          select: {
            id: true,
            state: true,
            lastTime: true,
            userId: true,
          },
        },
      },
    });

    return lesson;
  } catch (error) {
    console.error(
        `Error fetching lesson ${lessonId}:`,
        error.message
    );
    throw new Error(
        `Failed to retrieve lesson details. Details: ${error.message}`
    );
  }
};

// ✅ Get User's Watch Progress for a Lesson
export const getUserLessonWatchProgress = unstable_cache(
    async (userId, lessonId) => {
      try {
        if (!userId || !lessonId) {
          throw new Error("Both User ID and Lesson ID are required.");
        }

        const watch = await db.watch.findFirst({
          where: {
            userId: userId,
            lessonId: lessonId,
          },
          select: {
            id: true,
            state: true,
            lastTime: true,
          },
        });

        return watch || null;
      } catch (error) {
        console.error(
            `Error fetching watch progress for user ${userId} and lesson ${lessonId}:`,
            error
        );
        throw error;
      }
    },
    (userId, lessonId) => [`user-lesson-watch-${userId}-${lessonId}`],
    {
      revalidate: REVALIDATE_TIME,
    }
);

// ✅ Get User's Watch Progress for a Week
export const getUserWeekWatchProgress = unstable_cache(
    async (userId, weekId) => {
      try {
        if (!userId || !weekId) {
          throw new Error("Both User ID and Week ID are required.");
        }

        const watches = await db.watch.findMany({
          where: {
            userId: userId,
            weekId: weekId,
          },
          select: {
            id: true,
            state: true,
            lastTime: true,
            lessonId: true,
          },
        });

        // Group watches by lessonId to easily check progress per lesson
        const progressByLesson = watches.reduce((acc, watch) => {
          if (!acc[watch.lessonId]) {
            acc[watch.lessonId] = [];
          }
          acc[watch.lessonId].push({
            state: watch.state,
            lastTime: watch.lastTime,
          });
          return acc;
        }, {});

        return progressByLesson;
      } catch (error) {
        console.error(
            `Error fetching week watch progress for user ${userId} and week ${weekId}:`,
            error
        );
        throw error;
      }
    },
    (userId, weekId) => [`user-week-watch-${userId}-${weekId}`],
    {
      revalidate: REVALIDATE_TIME,
    }
);

// ===== TESTIMONIAL FUNCTIONS =====

// ✅ Get Testimonials for a Course
export const getCourseTestimonials = async (courseId) => {
  try {
    if (!courseId) {
      throw new Error("Course ID is required to fetch testimonials.");
    }

    const testimonials = await db.testimonial.findMany({
      where: {
        courseId: courseId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return testimonials;
  } catch (error) {
    console.error(
        `Error fetching testimonials for course ${courseId}:`,
        error.message
    );
    throw new Error(
        `Failed to retrieve testimonials for the course. Details: ${error.message}`
    );
  }
};

// ===== CERTIFICATE FUNCTIONS =====

// ✅ Get Certificates for a User
export const getUserCertificates = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required to fetch certificates.");
    }

    const certificates = await db.certificate.findMany({
      where: {
        userId: userId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return certificates;
  } catch (error) {
    console.error(
        `Error fetching certificates for user ${userId}:`,
        error.message
    );
    throw new Error(
        `Failed to retrieve certificates for the user. Details: ${error.message}`
    );
  }
};

// ✅ Get Certificate by ID
export const getCertificateById = async (certificateId) => {
  try {
    if (!certificateId) {
      throw new Error("Certificate ID is required to fetch certificate details.");
    }

    const certificate = await db.certificate.findUnique({
      where: { id: certificateId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            user: {
              select: {
                id: true,
                name: true,
                instructor: {
                  select: {
                    id: true,
                    designation: true,
                    department: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return certificate;
  } catch (error) {
    console.error(
        `Error fetching certificate ${certificateId}:`,
        error.message
    );
    throw new Error(
        `Failed to retrieve certificate details. Details: ${error.message}`
    );
  }
};

// ===== LIVE SESSION FUNCTIONS =====

// ✅ Get All Live Sessions
export const getAllLiveSessions = async () => {
  try {
    const liveSessions = await db.live.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            instructor: {
              select: {
                id: true,
                designation: true,
              },
            },
          },
        },
        quiz: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        schedule: "asc",
      },
    });

    return liveSessions;
  } catch (error) {
    console.error("Error fetching all live sessions:", error);
    throw new Error(`Failed to fetch live sessions. Details: ${error.message}`);
  }
};

// ✅ Get Live Session by ID
export const getLiveSessionById = async (sessionId) => {
  try {
    if (!sessionId) {
      throw new Error("Session ID is required to fetch live session details.");
    }

    const liveSession = await db.live.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            instructor: {
              select: {
                id: true,
                designation: true,
                department: true,
              },
            },
          },
        },
        quiz: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    });

    return liveSession;
  } catch (error) {
    console.error(
        `Error fetching live session ${sessionId}:`,
        error.message
    );
    throw new Error(
        `Failed to retrieve live session details. Details: ${error.message}`
    );
  }
};

// ✅ Get Live Sessions by Instructor ID
export const getLiveSessionsByInstructorId = async (instructorUserId) => {
  try {
    if (!instructorUserId) {
      throw new Error("Instructor User ID is required to fetch their live sessions.");
    }

    const liveSessions = await db.live.findMany({
      where: {
        userId: instructorUserId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            instructor: {
              select: {
                id: true,
                designation: true,
              },
            },
          },
        },
        quiz: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        schedule: "asc",
      },
    });

    return liveSessions;
  } catch (error) {
    console.error(
        `Error fetching live sessions for instructor ${instructorUserId}:`,
        error.message
    );
    throw new Error(
        `Failed to retrieve live sessions for the instructor. Details: ${error.message}`
    );
  }
};

// ===== AI GENERATION LOG FUNCTIONS =====

// ✅ Get AI Generation Logs by User ID
export const getAIGenerationLogsByUserId = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required to fetch AI generation logs.");
    }

    const logs = await db.aIGenerationLog.findMany({
      where: {
        requestedByUserId: userId,
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return logs;
  } catch (error) {
    console.error(
        `Error fetching AI generation logs for user ${userId}:`,
        error.message
    );
    throw new Error(
        `Failed to retrieve AI generation logs. Details: ${error.message}`
    );
  }
};

// ✅ Get AI Generation Log by ID
export const getAIGenerationLogById = async (logId) => {
  try {
    if (!logId) {
      throw new Error("Log ID is required to fetch AI generation log details.");
    }

    const log = await db.aIGenerationLog.findUnique({
      where: { id: logId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return log;
  } catch (error) {
    console.error(
        `Error fetching AI generation log ${logId}:`,
        error.message
    );
    throw new Error(
        `Failed to retrieve AI generation log details. Details: ${error.message}`
    );
  }
};

// ===== REPORT FUNCTIONS =====

// ✅ Get Reports by User ID
export const getUserReports = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required to fetch reports.");
    }

    const reports = await db.report.findMany({
      where: {
        userId: userId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return reports;
  } catch (error) {
    console.error(`Error fetching reports for user ${userId}:`, error.message);
    throw new Error(`Failed to retrieve reports. Details: ${error.message}`);
  }
};

// ✅ Get Report by ID
export const getReportById = async (reportId) => {
  try {
    if (!reportId) {
      throw new Error("Report ID is required to fetch report details.");
    }

    const report = await db.report.findUnique({
      where: { id: reportId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
          },
        },
      },
    });

    return report;
  } catch (error) {
    console.error(`Error fetching report ${reportId}:`, error.message);
    throw new Error(`Failed to retrieve report details. Details: ${error.message}`);
  }
};

// ===== PARTICIPATION FUNCTIONS =====

// ✅ Get Participations by User ID
export const getUserParticipations = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required to fetch participations.");
    }

    const participations = await db.participation.findMany({
      where: {
        userId: userId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return participations;
  } catch (error) {
    console.error(
        `Error fetching participations for user ${userId}:`,
        error.message
    );
    throw new Error(`Failed to retrieve participations. Details: ${error.message}`);
  }
};

// ✅ Get Participation by ID
export const getParticipationById = async (participationId) => {
  try {
    if (!participationId) {
      throw new Error("Participation ID is required to fetch participation details.");
    }

    const participation = await db.participation.findUnique({
      where: { id: participationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
          },
        },
      },
    });

    return participation;
  } catch (error) {
    console.error(
        `Error fetching participation ${participationId}:`,
        error.message
    );
    throw new Error(
        `Failed to retrieve participation details. Details: ${error.message}`
    );
  }
};