import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoggedInUser } from "@/lib/loggedin-user";
import { db } from "@/lib/prisma";
import { ArrowLeft, BarChart3, BookOpen, Star, Users } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import InstructorAnalyticsCharts from "./_components/instructor-analytics-charts";

export const dynamic = "force-dynamic";

async function getCourseAnalytics(courseId, instructorUserId) {
  const course = await db.course.findFirst({
    where: { id: courseId, userId: instructorUserId },
    include: {
      _count: { select: { participations: true } },
    },
  });
  if (!course) return null;

  // Enrollments by month (last 6)
  const sixMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 6));
  const enrollments = await db.participation.findMany({
    where: { courseId, createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
  });

  const monthMap = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    monthMap[key] = 0;
  }
  enrollments.forEach(({ createdAt }) => {
    const d = new Date(createdAt);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    if (key in monthMap) monthMap[key]++;
  });
  const enrollmentTrend = Object.entries(monthMap).map(([month, count]) => ({ month, enrollments: count }));

  // Quiz stats
  const quizSubmissions = await db.quizSubmission.findMany({
    where: { courseId },
    include: { quiz: { select: { title: true, totalMarks: true } } },
  });

  const quizScoreMap = {};
  quizSubmissions.forEach((s) => {
    const title = s.quiz?.title || "Unknown";
    const max = s.quiz?.totalMarks || 100;
    if (!quizScoreMap[title]) quizScoreMap[title] = { scores: [], max };
    const pct = max > 0 ? Math.round((s.totalScore / max) * 100) : 0;
    quizScoreMap[title].scores.push(pct);
  });
  const quizAverages = Object.entries(quizScoreMap).map(([name, { scores }]) => ({
    name: name.length > 20 ? name.substring(0, 20) + "…" : name,
    avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }));

  // Completion
  const completedCount = await db.courseProgress.count({
    where: { courseId, status: "completed" },
  });
  const totalStudents = course._count.participations;
  const completionRate = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0;

  // Average quiz score
  const avgScore =
    quizSubmissions.length > 0
      ? Math.round(
          quizSubmissions.reduce((a, s) => {
            const max = s.quiz?.totalMarks || 100;
            return a + (max > 0 ? (s.totalScore / max) * 100 : 0);
          }, 0) / quizSubmissions.length
        )
      : null;

  return {
    course,
    totalStudents,
    completedCount,
    completionRate,
    avgScore,
    enrollmentTrend,
    quizAverages,
    totalSubmissions: quizSubmissions.length,
  };
}

export default async function InstructorCourseAnalyticsPage({ params }) {
  const { courseId } = await params;
  const user = await getLoggedInUser();
  if (!user) redirect("/login");

  const data = await getCourseAnalytics(courseId, user.id);
  if (!data) notFound();

  const { course, totalStudents, completedCount, completionRate, avgScore, enrollmentTrend, quizAverages, totalSubmissions } = data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/instructor-dashboard/courses/${courseId}`}>
            <Button variant="ghost" size="sm" className="gap-2 mb-2">
              <ArrowLeft className="w-4 h-4" /> Back to Course
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">Enrollment & Performance Analytics</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs">Total Students</span>
            </div>
            <p className="text-2xl font-bold">{totalStudents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs">Completions</span>
            </div>
            <p className="text-2xl font-bold">{completedCount}</p>
            <Badge className="mt-1 text-xs bg-green-100 text-green-700">{completionRate}% rate</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs">Quiz Submissions</span>
            </div>
            <p className="text-2xl font-bold">{totalSubmissions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Star className="w-4 h-4" />
              <span className="text-xs">Avg Quiz Score</span>
            </div>
            <p className="text-2xl font-bold">{avgScore !== null ? `${avgScore}%` : "—"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <InstructorAnalyticsCharts
        enrollmentTrend={enrollmentTrend}
        quizAverages={quizAverages}
      />
    </div>
  );
}
