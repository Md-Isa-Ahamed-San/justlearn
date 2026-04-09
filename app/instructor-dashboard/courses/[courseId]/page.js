import { LearningForm } from "@/app/instructor-dashboard/courses/[courseId]/_components/learning-form";
import AlertBanner from "@/components/alert-banner";
import { IconBadge } from "@/components/icon-badge";
import { getCourseDetailsById } from "@/queries/courses";
import { chalkLog } from "@/utils/logger";
import {
    LayoutDashboard,
    ListChecks
} from "lucide-react";
import { CategoryForm } from "./_components/category-form";
import { CourseActions } from "./_components/course-action";
import { DescriptionForm } from "./_components/description-form";
import { ImageForm } from "./_components/image-form";
import { TitleForm } from "./_components/title-form";
import { WeeksForm } from "./_components/week-form";

export const dynamic = "force-dynamic";
const EditCourse = async ({ params }) => {
  const { courseId } = params;
  let courseData = null;
  courseData = await getCourseDetailsById(courseId);
  chalkLog.log(" EditCourse ~ courseData:", courseData);
  return (
    <>
      {courseData?.visibility !== "public" && (
        <AlertBanner
          label="This course is unpublished. It will not be visible in the course."
          className="bg-accent text-foreground"
        />
      )}
      {courseData?.isCompleted && (
        <AlertBanner
          label="🔒 This course is marked as completed. Adding or editing weeks, lessons and quizzes is disabled. Reopen the course to make changes."
          className="bg-green-50 text-green-800 border-green-200"
        />
      )}
      <div className="p-6">
        <div className="flex items-center justify-end">
          <CourseActions
            status={courseData?.visibility}
            courseId={courseId}
            isCompleted={courseData?.isCompleted ?? false}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <div className="flex items-center gap-x-2">
              <IconBadge icon={LayoutDashboard} />
              <h2 className="text-xl">Customize your course</h2>
            </div>
            <TitleForm
              initialData={{
                title: courseData?.title,
              }}
              courseId={courseData?.id}
            />
            <DescriptionForm
              initialData={{ description: courseData?.description }}
              courseId={courseData?.id}
            />

            <CategoryForm
              initialData={{ category: courseData?.category }}
              courseId={courseData?.id}
            />
            <WeeksForm
              weekData={courseData?.weeks}
              courseId={courseData?.id}
              isCompleted={courseData?.isCompleted ?? false}
            />

          </div>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-x-2 mb-6">
                <IconBadge icon={ListChecks} />
                <h2 className="text-xl">Course Weeks</h2>
              </div>


              <ImageForm
                  initialData={{ imageUrl: courseData?.thumbnail }}
                  courseId={courseData?.id}
              />
              <LearningForm
                  initialData={{ learning: courseData?.learning }}
                  courseId={courseData?.id}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default EditCourse;

