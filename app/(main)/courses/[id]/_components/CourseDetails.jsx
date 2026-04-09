
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Star
} from "lucide-react";
import { AITutorWidget } from "../../../../../components/ai-tutor-widget";
import { formatDate } from "../../../../../lib/formatDate";
import CourseCurriculum from "./CourseCurriculum";
import CourseInstructor from "./CourseInstructor";
import CourseOverview from "./CourseOverview";

const CourseDetails = ({   courseDetails,
                         currentUser,
                         completedLessons,
                         completedQuizzes,
                         testimonials
                          }) => {
  const getInstructorInitials = () => {
    if (!courseDetails?.user) return "IN";
    return `${courseDetails.user.name.charAt(0)}`;
  };

  // Calculate total lessons from modules
  const getTotalLessons = () => {
    if (!courseDetails?.weeks) return 0;
    return courseDetails.weeks.reduce((total, week) => {
      return total + (week.lessons?.length || 0);
    }, 0);
  };
  // console.log("courseDetails(courseDetails,currentUser,completedLessons,completedQuizzes: ",courseDetails,currentUser,completedLessons,completedQuizzes);
  // Calculate total duration in hours
  const getTotalDuration = () => {
    if (!courseDetails?.weeks) return 0;
    const totalMinutes = courseDetails.weeks.reduce((total, week) => {
      return total + (week.duration || 0);
    }, 0);

    // Convert minutes to hours
    return Math.ceil(totalMinutes / 60);
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
            <div className="mb-10">
              {/* <h2 className="text-3xl font-bold text-center">{courseDetails?.title}</h2> */}
              <div className="mt-2 flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Avatar className="h-20 w-20 rounded-lg">
                    <AvatarImage
                      src={courseDetails?.user?.image || "/placeholder.svg"}
                      alt={`${courseDetails?.user?.name} `}
                    />
                    <AvatarFallback>{getInstructorInitials()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm md:text-xl lg:text-2xl font-medium ">
                      {courseDetails?.user?.name}
                    </p>
                    <p className="text-xs md:text-lg lg:text-xl text-muted-foreground">
                      {courseDetails?.user?.designation}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < (courseDetails?.testimonials?.[0]?.rating || 5)
                            ? "fill-current"
                            : ""
                        }`}
                      />
                    ))}
                  <span className="ml-1 text-xs md:text-lg lg:text-xl">
                    ({courseDetails?.testimonials?.[0]?.rating || 5})
                  </span>
                </div>
                <div className=" text-sm md:text-lg lg:text-xl">
                  Last updated: {formatDate(courseDetails?.updatedAt)}
                </div>
              </div>
            </div>
          </div>

          {/* <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-full p-2">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {getTotalLessons()} Lessons
                  </p>
                  <p className="text-xs text-muted-foreground">HD Videos</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-full p-2">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {getTotalDuration()}+ Hours
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total Duration
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-full p-2">
                  <Radio className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Live Support</p>
                  <p className="text-xs text-muted-foreground">
                    Interactive Sessions
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-full p-2">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Lifetime Access</p>
                  <p className="text-xs text-muted-foreground">
                    Learn at your pace
                  </p>
                </div>
              </CardContent>
            </Card>
          </div> */}

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-lg p-1">
              <TabsTrigger
                value="overview"
                className="rounded-md data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="curriculum"
                className="rounded-md data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                Curriculum
              </TabsTrigger>
              <TabsTrigger
                value="instructor"
                className="rounded-md data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                Instructor
              </TabsTrigger>
            </TabsList>

            <CourseOverview courseDetails={courseDetails} testimonials={testimonials} />
            <CourseCurriculum
                courseDetails={courseDetails}
                currentUser={currentUser}
                completedLessons={completedLessons}
                completedQuizzes={completedQuizzes}

            />

            <CourseInstructor courseDetails={courseDetails} />
          </Tabs>
        </div>
      </div>

      {/* AI Tutor floating widget — context-aware to current course */}
      <AITutorWidget
        lessonContext={`Course: ${courseDetails?.title || 'Unknown'}.\nDescription: ${courseDetails?.description || 'No description available.'}`}
      />
    </section>
  );
};

export default CourseDetails;
