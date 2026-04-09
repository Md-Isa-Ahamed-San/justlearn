import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getLoggedInUser } from "@/lib/loggedin-user";
import { db } from "@/lib/prisma";
import {
    ArrowRight,
    CheckCircle,
    ClipboardList,
    Clock,
    PlayCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getUsersProgress(userId) {
  const courses = await db.course.findMany({
    where: {
      courseProgress: { some: { userId } },
    },
    include: {
      courseProgress: { where: { userId } },
      weeks: {
        include: {
          lessons: true,
          weekQuiz: {
            include: {
              quiz: {
                include: {
                  submissions: {
                    where: { userId },
                    orderBy: { createdAt: "desc" },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
      user: true,
    },
  });
  return courses;
}

export default async function AccountProgressPage() {
  const user = await getLoggedInUser();
  if (!user) redirect("/login");

  const courses = await getUsersProgress(user.id);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Progress</h1>
        <p className="text-muted-foreground">
          Track your learning journey across all courses.
        </p>
      </div>

      <div className="space-y-4">
        {courses.length > 0 ? (
          courses.map((course) => {
            const progress = course.courseProgress[0];

            const totalLessons = course.weeks.reduce(
              (acc, week) => acc + week.lessons.length,
              0
            );
            const totalQuizzes = course.weeks.reduce(
              (acc, week) => acc + (week.weekQuiz?.length || 0),
              0
            );
            const totalItems = totalLessons + totalQuizzes;

            const completedLessons = progress?.completedLessons || 0;
            const completedQuizzes = progress?.completedQuizzes || 0;
            const completedItems = completedLessons + completedQuizzes;

            const percent =
              totalItems > 0
                ? Math.round((completedItems / totalItems) * 100)
                : 0;
            const lastActivity = progress?.lastActivityDate
              ? new Date(progress.lastActivityDate).toLocaleDateString()
              : "Never";

            // Gather all quiz submissions for this course
            const quizScores = course.weeks.flatMap((week) =>
              (week.weekQuiz || [])
                .map(wq => wq.quiz)
                .filter((quiz) => quiz && quiz.submissions?.length > 0)
                .map((quiz) => {
                  const submission = quiz.submissions[0];
                  const maxScore = submission?.maxScore || 100;
                  const score = submission?.score ?? 0;
                  const pct =
                    maxScore > 0
                      ? Math.round((score / maxScore) * 100)
                      : 0;
                  return {
                    quizId: quiz.id,
                    quizTitle: quiz.title,
                    score,
                    maxScore,
                    pct,
                    submittedAt: submission?.createdAt,
                    passed: pct >= 50,
                  };
                })
            );

            return (
              <Card key={course.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Course Thumbnail */}
                    <div className="w-full md:w-64 h-40 flex-shrink-0">
                      <Image
                        src={course.thumbnail || "/placeholder-course.jpg"}
                        alt={course.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>

                    {/* Course Details */}
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-xl">
                            {course.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Instructor: {course.user?.name}
                          </p>
                        </div>
                        {progress?.status === "completed" ? (
                          <Badge
                            variant="success"
                            className="bg-green-100 text-green-700"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" /> Completed
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {progress?.status === "in_progress"
                              ? "In Progress"
                              : "Not Started"}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{percent}% Complete</span>
                          <span className="text-muted-foreground">
                            {completedItems}/{totalItems} Items
                          </span>
                        </div>
                        <Progress value={percent} className="h-2" />
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <PlayCircle className="w-4 h-4" />
                          {totalLessons} Lessons
                        </div>
                        <div className="flex items-center gap-1">
                          <ClipboardList className="w-4 h-4" />
                          {completedQuizzes}/{totalQuizzes} Quizzes done
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Last active: {lastActivity}
                        </div>
                      </div>

                      {/* Quiz Score History */}
                      {quizScores.length > 0 && (
                        <Accordion type="single" collapsible>
                          <AccordionItem value="quizzes" className="border rounded-lg px-3">
                            <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                              📊 Quiz Score History ({quizScores.length} submitted)
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pb-2">
                                {quizScores.map((q) => (
                                  <div
                                    key={q.quizId}
                                    className="flex items-center justify-between text-sm bg-muted/40 rounded-md px-3 py-2"
                                  >
                                    <span className="font-medium truncate max-w-[200px]">
                                      {q.quizTitle}
                                    </span>
                                    <div className="flex items-center gap-3 shrink-0">
                                      <span className="text-muted-foreground">
                                        {q.score}/{q.maxScore}
                                      </span>
                                      <Badge
                                        className={
                                          q.passed
                                            ? "bg-green-100 text-green-700 text-xs"
                                            : "bg-red-100 text-red-700 text-xs"
                                        }
                                      >
                                        {q.pct}% — {q.passed ? "Pass" : "Fail"}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                      <div className="pt-2">
                        <Link href={`/courses/${course.id}`}>
                          <Button variant="default" className="gap-2">
                            {progress?.status === "completed"
                              ? "Review Course"
                              : "Continue Learning"}
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <h3 className="text-lg font-medium">No courses found</h3>
            <p className="text-muted-foreground mb-4">
              You haven&apos;t enrolled in any courses yet.
            </p>
            <Link href="/courses">
              <Button>Browse Courses</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
