// hooks/useLessonProgress.js
"use client";
import { useState, useCallback } from 'react';
import { markLessonComplete, markLessonIncomplete } from "@/queries/lesson";

export const useLessonProgress = (userId, initialCompletedLessons = []) => {
    const [completedLessons, setCompletedLessons] = useState(initialCompletedLessons);

    const handleMarkLessonComplete = useCallback(async (lessonId) => {
        try {
            const isCompleted = completedLessons.includes(lessonId);

            if (isCompleted) {
                await markLessonIncomplete(userId, lessonId);
                setCompletedLessons(prev => prev.filter(id => id !== lessonId));
            } else {
                await markLessonComplete(userId, lessonId);
                setCompletedLessons(prev => [...prev, lessonId]);
            }
        } catch (error) {
            console.error('Error updating lesson progress:', error);
        }
    }, [userId, completedLessons]); // Add dependencies for useCallback

    return {
        completedLessons,
        onMarkLessonComplete: handleMarkLessonComplete
    };
};