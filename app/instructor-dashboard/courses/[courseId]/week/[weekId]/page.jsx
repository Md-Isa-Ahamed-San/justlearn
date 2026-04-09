import { WeekActions } from "@/app/instructor-dashboard/courses/[courseId]/week/[weekId]/_components/week-action";
import AlertBanner from "@/components/alert-banner";
import { IconBadge } from "@/components/icon-badge";
import { getAllQuizzesByInstructorId } from "@/queries/quizzes";
import { getServerUserData } from "@/queries/users";
import { getWeekDetailsByIds } from "@/queries/week";
import { chalkLog } from "@/utils/logger";
import {
    ArrowLeft,
    BookOpenCheck,
    Eye,
    LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { LessonForm } from "./_components/lesson-form";
import { ModuleBasicDetailsForm } from "./_components/module-basic-details-form";

export const dynamic = 'force-dynamic';

const Week = async ({ params }) => {
  const { courseId, weekId } = await params;
  let allQuizzes = [];

  try {
    const data = await getServerUserData();
    if (data?.userData?.id) {
      const quizzes = await getAllQuizzesByInstructorId(data.userData.id);

      allQuizzes = Array.isArray(quizzes) ? quizzes : [];
    }
  } catch (err) {
    console.log("Error fetching quiz sets:", err);
    // Keep allQuizzes as empty array on error
    allQuizzes = [];
  }

  try {
    const weekDetails = await getWeekDetailsByIds(courseId, weekId);
    chalkLog.log("weekDetails: ", weekDetails);

    const isPublished = weekDetails.status === "published";

    return (
        <>
          {!isPublished && (
              <AlertBanner
                  label="This module is unpublished. It will not be visible in the course."
                  variant="warning"
              />
          )}

          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-full">
                <Link
                    href={`/instructor-dashboard/courses/${courseId}`}
                    className="flex items-center text-sm hover:opacity-75 transition mb-6"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to course setup
                </Link>
                <div className="flex items-center justify-between bg-card p-4 rouned-md">
                  <div className="flex flex-col gap-y-2">
                    <h1 className="text-2xl font-medium">
                      Week Setup
                    </h1>
                    <span className="text-sm ">
                    Complete all fields ({weekDetails.lessons?.length || 0} lessons, {weekDetails.quizIds?.length || 0} quizzes)
                  </span>
                  </div>
                  <WeekActions
                      disabled={!weekDetails.title || !weekDetails.description}
                      courseId={courseId}
                      weekId={weekId}
                      status={isPublished}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-x-2">
                    <IconBadge icon={LayoutDashboard} />
                    <h2 className="text-xl">Customize your week</h2>
                  </div>
                  <ModuleBasicDetailsForm
                      initialData={weekDetails}
                      courseId={courseId}
                      weekId={weekId}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-x-2">
                    <IconBadge icon={BookOpenCheck} />
                    <h2 className="text-xl">Week Lessons & Quizzes</h2>
                  </div>
                  <LessonForm
                      weekDetails={weekDetails}
                      courseId={courseId}
                      weekId={weekId}
                      availableQuizzes={allQuizzes}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-x-2">
                  <IconBadge icon={Eye} />
                  <h2 className="text-xl">Preview</h2>
                </div>
                <div className="mt-6 border rounded-md p-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">
                      {weekDetails.title || "No title"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {weekDetails.description || "No description"}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      {weekDetails.lessons?.length || 0} lessons • {weekDetails.quizIds?.length || 0} quizzes • Status: {weekDetails.status}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
    );
  } catch (error) {
    chalkLog.error("Error loading week details:", error);
    return (
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-600">
                Week not found
              </h2>
              <p className="text-gray-500 mt-2">
                The week you're looking for doesn't exist or has been deleted.
              </p>
              <Link
                  href={`/instructor-dashboard/courses/${courseId}`}
                  className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to course
              </Link>
            </div>
          </div>
        </div>
    );
  }
};

export default Week;