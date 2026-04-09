import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/prisma";
import { IconBook2, IconUsers } from "@tabler/icons-react";
import { Suspense } from "react";
import { getCourseList } from "../../../../queries/courses";
import { getAllUsers } from "../../../../queries/users";
import AnalyticsCharts from "./analytics-charts";
import BadgeManagement from "./badge-management";
import CourseManagement from "./course-management";
import UserManagement from "./user-management/user-management";

export const dynamic = 'force-dynamic';

async function getAdminAnalytics() {
  try {
    const [enrollments, topCourses, totalQuizSubmissions] = await Promise.all([
      db.participation.findMany({
        where: {
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
          },
        },
        select: { createdAt: true },
      }),
      db.course.findMany({
        take: 5,
        include: { _count: { select: { participations: true } } },
        orderBy: { participations: { _count: "desc" } },
      }),
      db.quizSubmission.count(),
    ]);

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

    const enrollmentTrend = Object.entries(monthMap).map(([month, enrollments]) => ({ month, enrollments }));
    const topCoursesData = topCourses.map((c) => ({
      name: c.title.length > 18 ? c.title.substring(0, 18) + "…" : c.title,
      students: c._count.participations,
    }));
    const totalEnrollments = enrollments.length;

    return { enrollmentTrend, topCoursesData, totalQuizSubmissions, totalEnrollments };
  } catch (e) {
    console.error("Analytics error:", e);
    return { enrollmentTrend: [], topCoursesData: [], totalQuizSubmissions: 0, totalEnrollments: 0 };
  }
}

export default async function AdminDashboard() {
  let users = [];
  let allCourses = [];
  let analytics = { enrollmentTrend: [], topCoursesData: [], totalQuizSubmissions: 0, totalEnrollments: 0 };

  try {
    const [usersResult, coursesResult, analyticsResult] = await Promise.allSettled([
      getAllUsers(),
      getCourseList(),
      getAdminAnalytics(),
    ]);

    if (usersResult.status === 'fulfilled') users = Array.isArray(usersResult.value) ? usersResult.value : [];
    else console.error("Error fetching users:", usersResult.reason);

    if (coursesResult.status === 'fulfilled') allCourses = Array.isArray(coursesResult.value) ? coursesResult.value : [];
    else console.error("Error fetching courses:", coursesResult.reason);

    if (analyticsResult.status === 'fulfilled') analytics = analyticsResult.value;
  } catch (error) {
    console.error("Error in AdminDashboard:", error);
  }

  const totalStudents = users.filter(u => u.role === "student").length;
  const totalInstructors = users.filter(u => u.role === "instructor").length;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1">
          <div className="space-y-6">
            {/* Mobile Navigation Tabs */}
            <div className="lg:hidden">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2" data-tab="users">
                    <IconUsers className="h-5 w-5" />
                    <span>Users ({users.length})</span>
                  </button>
                  <button className="border-blue-500 text-blue-600 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2" data-tab="courses">
                    <IconBook2 className="h-5 w-5" />
                    <span>Courses ({allCourses.length})</span>
                  </button>
                </nav>
              </div>
            </div>

            {/* Analytics Summary — 4 stat cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{allCourses.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">{totalStudents} students · {totalInstructors} instructors</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalEnrollments}</div>
                  <p className="text-xs text-muted-foreground mt-1">Last 6 months</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Quiz Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalQuizSubmissions}</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <AnalyticsCharts
              enrollmentTrend={analytics.enrollmentTrend}
              topCourses={analytics.topCoursesData}
            />

            {/* Badge Management */}
            <BadgeManagement />

            {/* Users Section */}
            <div id="users-section">
              <Suspense fallback={<div className="flex justify-center items-center h-64">Loading user data...</div>}>
                <UserManagement users={users} />
              </Suspense>
            </div>

            <div id="courses-section" className="hidden">
              <Suspense fallback={<div className="flex justify-center items-center h-64">Loading course data...</div>}>
                <CourseManagement courses={allCourses} />
              </Suspense>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}