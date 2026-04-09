
"use client";

import CourseDetails from "./CourseDetails";
import {useLessonProgress} from "@/hooks/useLessonProgress";

const CourseDetailsWithProgress = ({
                                       courseDetails,
                                       currentUser,
                                       userId,
                                       initialCompletedLessons
                                   }) => {
    const { completedLessons, onMarkLessonComplete } = useLessonProgress(
        userId,
        initialCompletedLessons
    );
    console.log(" CourseDetailsWithProgress ~ completedLessons,onMarkLessonComplete,userId,: ", completedLessons, onMarkLessonComplete,userId,)

    // return null;
    return (
        <CourseDetails
            courseDetails={courseDetails}
            currentUser={currentUser}
            completedLessons={completedLessons}
            onMarkLessonComplete={onMarkLessonComplete}
        />
    );
};

export default CourseDetailsWithProgress;