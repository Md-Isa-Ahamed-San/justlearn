// CourseDetailsWrapper.jsx (Server Component)
import { getInstructorDetailedStats } from "../../../../../lib/instructor-stats"; // Adjust path as needed
import CourseDetails from "./CourseDetails";

const CourseDetailsWrapper = async ({
                                        courseDetails,
                                        currentUser,
                                        completedLessons,
                                        onMarkLessonComplete
                                    }) => {
    // Fetch instructor stats on the server
    const instructorStats = await getInstructorDetailedStats(courseDetails?.user?.id);

    return (
        <CourseDetails
            courseDetails={courseDetails}
            currentUser={currentUser}
            completedLessons={completedLessons}
            onMarkLessonComplete={onMarkLessonComplete}
            instructorStats={instructorStats}
        />
    );
};

export default CourseDetailsWrapper;