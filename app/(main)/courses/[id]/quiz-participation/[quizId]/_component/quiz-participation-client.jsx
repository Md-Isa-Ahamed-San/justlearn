"use client";

import { useState } from "react";
import QuizRulesPage from "./quiz-rules-page";
import QuizInterface from "./quizInterface/quiz-interface";

export default function QuizParticipationClient({
  quiz,
  currentUser,
  courseId,
  userSubmissions = [],
  hasExceededAttempts = false,
  hasCompletedSubmission = false,
}) {
  const [showRules, setShowRules] = useState(true);

  const [quizStarted, setQuizStarted] = useState(false);

  const handleStartQuiz = () => {
    setShowRules(false);

    setQuizStarted(true);
  };

  const handleGoBack = () => {
    // TODO: Call server action to redirect back to course
    // redirect(`/courses/${courseId}`)
    window.history.back();
  };

  if (showRules) {
    return (
      <QuizRulesPage
        quiz={quiz}
        onStartQuiz={handleStartQuiz}
        onGoBack={handleGoBack}
        hasExceededAttempts={hasExceededAttempts}
        hasCompletedSubmission={hasCompletedSubmission}
      />
    );
  }

  return (
    <QuizInterface
      quiz={quiz}
      currentUser={currentUser}
      courseId={courseId}
      userSubmissions={userSubmissions}
    />
  );
}
