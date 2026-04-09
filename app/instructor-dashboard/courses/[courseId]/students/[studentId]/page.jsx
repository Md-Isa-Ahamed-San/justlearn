import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { db } from "@/lib/prisma";
import { ArrowLeft, Award, CheckCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ForceCompleteButton from "./_components/ForceCompleteButton";

export const dynamic = "force-dynamic";

async function getStudentCourseData(courseId, studentId) {
  const [course, courseProgress, quizSubmissions, lessonProgress] =
    await Promise.all([
      db.course.findUnique({
        where: { id: courseId },
        include: {
          weeks: {
            include: {
              lessons: { select: { id: true, title: true, active: true } },
              // Use the correct join table — no direct "quizzes" relation on Week
              weekQuiz: {
                include: {
                  quiz: { select: { id: true, title: true } },
                },
              },
            },
            orderBy: { order: "asc" },
          },
        },
      }),
      db.courseProgress.findFirst({
        where: { courseId, userId: studentId },
      }),
      db.quizSubmission.findMany({
        where: { courseId, userId: studentId },
        // score and maxScore are the correct field names in QuizSubmission
        include: { quiz: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
      }),
      db.lessonProgress.findMany({
        where: {
          userId: studentId,
          lesson: { week: { courseId } },
        },
        include: { lesson: { select: { title: true } } },
      }),
    ]);

  return { course, courseProgress, quizSubmissions, lessonProgress };
}

async function getStudentBasicInfo(studentId) {
  return db.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, email: true, image: true, student: true },
  });
}

export default async function StudentMarksPage({ params }) {
  const { courseId, studentId } = await params;

  const [student, { course, courseProgress, quizSubmissions, lessonProgress }] =
    await Promise.all([
      getStudentBasicInfo(studentId),
      getStudentCourseData(courseId, studentId),
    ]);

  if (!course || !student) notFound();

  const totalLessons = course.weeks.reduce(
    (acc, w) => acc + w.lessons.length,
    0
  );
  // Count unique quizzes across all weeks via the join table
  const allQuizIds = new Set(
    course.weeks.flatMap((w) => w.weekQuiz.map((wq) => wq.quizId))
  );
  const totalQuizzes = allQuizIds.size;

  const completedLessons = lessonProgress.filter(
    (lp) => lp.status === "completed"
  ).length;
  const completedQuizzes = quizSubmissions.length;
  const overallProgress =
    totalLessons + totalQuizzes > 0
      ? Math.round(
          ((completedLessons + completedQuizzes) /
            (totalLessons + totalQuizzes)) *
            100
        )
      : 0;

  // Use correct field names: score and maxScore
  const quizScores = quizSubmissions.map((s) => {
    const max = s.maxScore || 0;
    const score = s.score ?? 0;
    const pct = max > 0 ? Math.round((score / max) * 100) : 0;
    return { ...s, max, pct };
  });

  const avgScore =
    quizScores.length > 0
      ? Math.round(
          quizScores.reduce((a, s) => a + s.pct, 0) / quizScores.length
        )
      : null;

  return (
    <div className="p-6 space-y-6">
      {/* Back button */}
      <Link
        href={`/instructor-dashboard/courses/${courseId}/allJoinedStudents`}
      >
        <Button variant="ghost" size="sm" className="gap-2 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to Students
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-4">
            {student.image && (
            <img
                src={student.image}
                alt={student.name}
                className="w-14 h-14 rounded-full object-cover border"
            />
            )}
            <div>
            <h1 className="text-2xl font-bold">{student.name}</h1>
            <p className="text-muted-foreground text-sm">{student.email}</p>
            {student.student?.idNumber && (
                <p className="text-xs text-muted-foreground">
                ID: {student.student.idNumber}
                </p>
            )}
            </div>
        </div>

        <ForceCompleteButton 
            userId={studentId} 
            courseId={courseId} 
            isCompleted={courseProgress?.progress === 100} 
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Overall Progress</p>
            <p className="text-2xl font-bold">{overallProgress}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Lessons Done</p>
            <p className="text-2xl font-bold">
              {completedLessons}/{totalLessons}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Quizzes Attempted</p>
            <p className="text-2xl font-bold">
              {completedQuizzes}/{totalQuizzes}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg Quiz Score</p>
            <p className="text-2xl font-bold">
              {avgScore !== null ? `${avgScore}%` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>Course Progress</span>
          <span className="text-muted-foreground">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-3" />
      </div>

      {/* Quiz Marks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="w-4 h-4" />
            Quiz Score History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {quizScores.length > 0 ? (
            <div className="space-y-2">
              {quizScores.map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between text-sm bg-muted/40 rounded-md px-4 py-2"
                >
                  <div>
                    <p className="font-medium">{submission.quiz?.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </p>
                    {submission.violationCount > 0 && (
                      <p className="text-xs text-orange-500">
                        ⚠ {submission.violationCount} violation(s) flagged
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span>
                      {submission.totalScore}/{submission.max}
                    </span>
                    <Badge
                      className={
                        submission.pct >= 50
                          ? "bg-green-100 text-green-700 text-xs"
                          : "bg-red-100 text-red-700 text-xs"
                      }
                    >
                      {submission.pct}% —{" "}
                      {submission.pct >= 50 ? "Pass" : "Fail"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No quiz submissions yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lesson Completion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="w-4 h-4" />
            Lesson Completion
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lessonProgress.length > 0 ? (
            <div className="space-y-1">
              {lessonProgress.map((lp) => (
                <div
                  key={lp.id}
                  className="flex items-center justify-between text-sm py-1.5 border-b last:border-0"
                >
                  <span>{lp.lesson?.title}</span>
                  <Badge
                    className={
                      lp.status === "completed"
                        ? "bg-green-100 text-green-700 text-xs"
                        : "bg-yellow-100 text-yellow-700 text-xs"
                    }
                  >
                    {lp.status === "completed" ? "✓ Completed" : "In Progress"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No lessons started yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
