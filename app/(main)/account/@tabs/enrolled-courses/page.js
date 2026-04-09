export const dynamic = "force-dynamic";
import { CourseProgress } from "@/components/course-progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Users, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getUserEnrolledCourses } from "../../../../../queries/courses";
import { getServerUserData } from "../../../../../queries/users";
import { chalkLog } from "../../../../../utils/logger";

async function EnrolledCourses() {
  // const { userData } = await getServerUserData();
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

  if (!userData?.id) {
    console.warn("⚠️ No user data found");
    return (
      <div className="space-y-4 p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold  mb-2">Enrolled Courses</h2>
          <div className="text-sm text-muted-foreground">
            Please sign in to view your enrolled courses
          </div>
        </div>
      </div>
    );
  }

  const enrolledCourses = await getUserEnrolledCourses(userData.id);
  //   chalkLog.log(" EnrolledCourses ~ enrolledCourses:", enrolledCourses)
  const enrolledCoursesCount = enrolledCourses?.length || 0;

  if (enrolledCoursesCount === 0) {
    return (
      <div className="space-y-4 p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold  mb-2">Enrolled Courses</h2>
          <div className="text-muted-foreground mb-4">
            You haven&apos;t enrolled in any courses yet.
          </div>
          <Link
            href="/courses"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Browse Courses
          </Link>
        </div>
      </div>
    );
  }

  // Helper function to format duration
  const formatDuration = (minutes) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ""}`;
    }
    return `${mins}m`;
  };

  // Helper function to format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper function to get status variant
  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "success";
      case "in_progress":
        return "default";
      case "not_started":
        return "secondary";
      default:
        return "default";
    }
  };

  // Helper function to get status label
  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      case "not_started":
        return "Not Started";
      default:
        return "Enrolled";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold ">
          Enrolled Courses ({enrolledCoursesCount})
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrolledCourses.map((enrollment) => {
          const { course } = enrollment;

          return (
            <Link
              key={enrollment.enrollmentId}
              href={`/courses/${course.slug || course.id}`}
              className="group"
            >
              <div className="group hover:shadow-lg transition-all duration-300 overflow-hidden border rounded-lg p-4 h-full ">
                {/* Course Image */}
                <div className="relative w-full aspect-video rounded-md overflow-hidden mb-4">
                  <Image
                    src={
                      course.thumbnail || "/assets/images/courses/course_1.png"
                    }
                    alt={course.title || "Course"}
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    fill
                  />
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant={getStatusVariant(enrollment.enrollmentStatus)}
                    >
                      {getStatusLabel(enrollment.enrollmentStatus)}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  {/* Course Title & Category */}
                  <div>
                    <h3 className="text-lg md:text-base font-semibold  line-clamp-2 mb-1">
                      {course.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {course.category?.title || "Development"}
                    </p>
                  </div>

                  {/* Course Stats */}
                  <div className="flex items-center gap-4 text-sm ">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{course.totalWeeks || 0} Weeks</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(course.totalDuration)}</span>
                    </div>
                  </div>

                  {/* Additional Stats */}
                  <div className="space-y-2 border-t pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="">Total Lessons:</span>
                      <span className="font-medium">
                        {course.totalLessons || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="">Students:</span>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span className="font-medium">
                          {course.totalStudents || 0}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="">Joined:</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span className="font-medium">
                          {formatDate(enrollment.enrolledAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium ">Progress</span>
                      <span className="text-sm font-medium ">
                        {Math.min(Math.round(enrollment.progress || 0), 100)}%
                      </span>
                    </div>
                    <CourseProgress
                      size="sm"
                      value={Math.min(enrollment.progress || 0, 100)}
                      variant={
                        enrollment.progress >= 100 ? "success" : "default"
                      }
                    />
                  </div>

                  {/* Instructor Info */}
                  {course.user && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <div className="w-6 h-6 rounded-full  flex items-center justify-center">
                        {!course?.user?.image ? (
                          <span className="text-xs font-medium ">
                            {course.user.name?.charAt(0).toUpperCase()}
                          </span>
                        ) : (
                          <Image
                            className="rounded-full"
                            src={course.user.image}
                            alt="instructor profile pic"
                            width={50}
                            height={50}
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium ">
                          {course.user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {course.user.instructor?.designation || "Instructor"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className=" p-4 rounded-lg text-center">
          <div className="text-2xl font-bold ">{enrolledCoursesCount}</div>
          <div className="text-sm ">Total Courses</div>
        </div>

        <div className=" p-4 rounded-lg text-center">
          <div className="text-2xl font-bold ">
            {
              enrolledCourses.filter((e) => e.enrollmentStatus === "completed")
                .length
            }
          </div>
          <div className="text-sm ">Completed</div>
        </div>

        <div className=" p-4 rounded-lg text-center">
          <div className="text-2xl font-bold ">
            {
              enrolledCourses.filter(
                (e) => e.enrollmentStatus === "in_progress"
              ).length
            }
          </div>
          <div className="text-sm ">In Progress</div>
        </div>

        <div className=" p-4 rounded-lg text-center">
          <div className="text-2xl font-bold ">
            {Math.min(Math.round(
              enrolledCourses.reduce((sum, e) => sum + (e.progress || 0), 0) /
                enrolledCoursesCount
            ) || 0, 100)}
            %
          </div>
          <div className="text-sm ">Avg Progress</div>
        </div>
      </div>
    </div>
  );
}

export default EnrolledCourses;
