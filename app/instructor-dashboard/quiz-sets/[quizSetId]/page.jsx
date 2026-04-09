import React from "react";

import EditQuizSet from "./_components/EditQuizSet";
import { redirect } from "next/navigation";
import { getQuizDetailsById } from "../../../../queries/quizzes";
import { chalkLog } from "../../../../utils/logger";

// This is a Server Component
const QuizSetPage = async ({ params }) => {
  const { quizSetId } = params;

  if (!quizSetId) {
    console.error("QuizSet ID is missing from params.");

    redirect("/instructor-dashboard/quiz-sets");
  }

  let initialQuizData = null;

  let errorFetching = null;

  try {
    initialQuizData = await getQuizDetailsById(quizSetId);
    chalkLog.log(" QuizSetPage ~ initialQuizData:", initialQuizData);
  } catch (err) {
    console.error(`Failed to fetch quiz data for ID ${quizSetId}:`, err);
    errorFetching = "An error occurred while trying to load the quiz data.";
  }

  if (!initialQuizData && !errorFetching) {
    console.warn(`Quiz with ID ${quizSetId} not found.`);
  }

  if (errorFetching) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>{errorFetching}</p>
        <p>Please try again later or contact support.</p>
      </div>
    );
  }

  return <EditQuizSet initialQuizData={initialQuizData} />;
};

export default QuizSetPage;
