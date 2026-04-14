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

  // Batch 1: userData and courseDetails are fully independent — run in parallel
  // Rule: async-parallel (vercel-react-best-practices)
  const [{ userData }, rawCourseDetails] = await Promise.all([
    getServerUserData(),
    getCourseDetailsById(id),
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

  // Batch 2: completedLessons, completedQuizzes, and participation all need
  // userData.id + courseDetails.id but are independent of each other — run in parallel
  const [completedLessons, completedQuizzes, { isJoined }] = await Promise.all([
    userData?.id && courseDetails?.id
      ? getCompletedLessonsByCourse(userData.id, courseDetails.id)
      : Promise.resolve([]),
    userData?.id && courseDetails?.id
      ? getCompletedQuizIdsByCourse(userData.id, courseDetails.id)
      : Promise.resolve([]),
    checkUserParticipation(userData.id, id),
  ]);

  return (
    <div>
      <ScrollToTop />
      <CourseDetailsHero
        categoryTitle={courseDetails?.category.title}
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
