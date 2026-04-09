import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    Award,
    BarChart3,
    BookOpen,
    CheckCircle,
    Clock,
    FileText,
    GraduationCap,
    Star,
    TrendingUp,
    Users
} from "lucide-react";

import { getServerUserData } from "@/queries/users";
import { redirect } from "next/navigation";
import { getInstructorAnalytics } from "../../queries/courses";

const DashboardPage = async () => {
    let serverUserData = null;
  
  try {
    serverUserData = await getServerUserData();
  } catch (error) {
    // During static generation, this might fail
    console.log(
      "Could not fetch server user data during build:",
      error.message
    );
    serverUserData = null;
  }

  const userData = serverUserData?.userData;

  if (!userData) redirect("/login");
  
  
  if (userData?.role !== "instructor") redirect("/login");
  
  const analytics = await getInstructorAnalytics(userData?.id);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&aposs what&aposs happening with your courses.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="px-3 py-1">
            {analytics.totalCourses} Active Courses
          </Badge>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Courses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.publishedCourses} published
            </p>
          </CardContent>
        </Card>

        {/* Total Students */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              ~{analytics.averageStudentsPerCourse} per course
            </p>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.completedCourses} completed
            </p>
          </CardContent>
        </Card>

        {/* Average Rating */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {analytics.averageRating}
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-muted-foreground">
              From {analytics.totalTestimonials} reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalLessons}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalQuizzes}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalQuizSubmissions} submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCertificates}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Items</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalLessons + analytics.totalQuizzes}
            </div>
            <p className="text-xs text-muted-foreground">
              Lessons + Quizzes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Course Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.coursePerformance.slice(0, 5).map((course) => (
                <div key={course.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm truncate">{course.title}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{course.students} students</span>
                        <span>{course.totalLessons} lessons</span>
                        <span>{course.totalQuizzes} quizzes</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {course.completionRate.toFixed(0)}%
                      </Badge>
                      {course.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">{course.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Progress value={course.completionRate} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.recentActivity?.length > 0 ? (
                analytics.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={activity.user?.image} />
                      <AvatarFallback className="text-xs">
                        {getInitials(activity.user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">
                        {activity.user?.name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted quiz in {activity.quiz?.week?.course?.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(activity.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={activity.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {activity.status}
                      </Badge>
                      {activity.score && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Score: {activity.score.toFixed(1)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border rounded-lg hover: text-left transition-colors">
              <BookOpen className="h-8 w-8 mb-2 text-blue-600" />
              <h3 className="font-medium">Create New Course</h3>
              <p className="text-sm text-muted-foreground">Start building your next course</p>
            </button>
            <button className="p-4 border rounded-lg hover: text-left transition-colors">
              <BarChart3 className="h-8 w-8 mb-2 text-green-600" />
              <h3 className="font-medium">View Analytics</h3>
              <p className="text-sm text-muted-foreground">Detailed course performance</p>
            </button>
            <button className="p-4 border rounded-lg hover: text-left transition-colors">
              <Users className="h-8 w-8 mb-2 text-purple-600" />
              <h3 className="font-medium">Manage Students</h3>
              <p className="text-sm text-muted-foreground">View student progress</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;