import { getCompletedLessonsByCourse } from "@/queries/lesson";
import { getCourseDetailsById } from "../../../../queries/courses";
import { checkUserParticipation } from "../../../../queries/participation";
import { getCompletedQuizIdsByCourse } from "../../../../queries/quizzes";
import { getServerUserData } from "../../../../queries/users";
import CourseDetails from "./_components/CourseDetails";
import CourseDetailsHero from "./_components/CourseDetailsHero";
import ScrollToTop from "./_components/ScrollToTop";

const SingleCoursePage = async ({ params }) => {
  const { id } = await params;

  // 1. Get session first (extremely fast since it's likely already in Request/Context)
  const [{ userData }] = await Promise.all([getServerUserData()]);

  // 2. Fetch Course Details AND Participation in parallel
  // This avoids Batch 2 waiting for Batch 1 to finish completely
  const [rawCourseDetails, { isJoined }] = await Promise.all([
    getCourseDetailsById(id),
    userData?.id ? checkUserParticipation(userData.id, id) : Promise.resolve({ isJoined: false }),
  ]);

  // Determine if the viewer is the course instructor
  const isInstructor =
    userData?.id && rawCourseDetails?.userId === userData?.id;

  // Filter draft weeks and inactive lessons for students (not instructor)
  let courseDetails = rawCourseDetails;
  if (rawCourseDetails && !isInstructor) {
    courseDetails = {
      ...rawCourseDetails,
      weeks: rawCourseDetails.weeks
        ?.filter((week) => week.status === "published" || !week.status)
        .map((week) => ({
          ...week,
          lessons: week.lessons?.filter((lesson) => lesson.active !== false),
        })),
    };
  }

  // 3. Fetch user progress only if they are joined
  // This reduces unnecessary DB calls for non-joined users
  const [completedLessons, completedQuizzes] = await Promise.all([
    userData?.id && courseDetails?.id && isJoined
      ? getCompletedLessonsByCourse(userData.id, courseDetails.id)
      : Promise.resolve([]),
    userData?.id && courseDetails?.id && isJoined
      ? getCompletedQuizIdsByCourse(userData.id, courseDetails.id)
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <ScrollToTop />
      <CourseDetailsHero
        categoryTitle={courseDetails?.category?.title}
        title={courseDetails?.title}
        description={courseDetails?.description}
        thumbnail={courseDetails?.thumbnail}
        isJoined={isJoined}
        userId={userData?.id}
        courseId={id}
        isInstructor={isInstructor}
      />

      <CourseDetails
        courseDetails={courseDetails}
        currentUser={userData}
        completedLessons={completedLessons}
        completedQuizzes={completedQuizzes}
        testimonials={courseDetails?.testimonials}
        isInstructor={isInstructor}
      />
    </div>
  );
};

export default SingleCoursePage;
