import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { QuizResultsOverview } from './_components/quiz-results-overview'
import { QuestionResultsList } from './_components/quiz-results-list'
import { QuizResultsHeader } from './_components/quiz-results-header'
import { getQuizSubmissionDetails } from "@/app/actions/quiz"
import { getServerUserData } from '../../../../../../queries/users'

function formatTimeSpent(timeInSeconds) {
  if (timeInSeconds < 60) {
    return `${timeInSeconds} seconds`
  }

  const minutes = Math.floor(timeInSeconds / 60)
  const seconds = timeInSeconds % 60

  if (seconds === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }

  return `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`
}

export async function generateMetadata({ params }) {
  try {
    const { id, quizId } = await params;
    // Get current user session
    const session = await getServerUserData()
    
    // Check if session exists and has userData
    if (!session || !session.userData) {
      return {
        title: 'Quiz Results',
        description: 'View your quiz results and performance details.',
      }
    }

    // Use correct parameter names from URL and userData.id
    const submissionData = await getQuizSubmissionDetails({
      userId: session.userData.id,  // Use userData.id from session
      courseId: id,           // Use awaited id
      quizId: quizId          // Use awaited quizId
    })
    
    const { submission, answers } = submissionData.data
    const percentage = Math.round((submission.score / answers.length) * 100)

    return {
      title: `Quiz Results - ${submission.score}/${answers.length} (${percentage}%)`,
      description: `Quiz attempt ${submission.attemptNumber} completed with ${submission.score} out of ${answers.length} questions correct.`,
    }
  } catch (error) {
    console.error('Metadata generation error:', error)
    return {
      title: 'Quiz Results',
      description: 'View your quiz results and performance details.',
    }
  }
}

export default async function QuizResultsPage({ params }) {
  const { id, quizId } = await params;
  let submissionData

  try {
    // Get current authenticated user session
    const session = await getServerUserData()
    console.log("Session data:", session)

    // Check if session exists and has userData
    if (!session || !session.userData) {
      console.log("No session or userData found, redirecting to login")
      redirect('/login')
    }

    // Use dynamic params from URL and userData.id from session
    submissionData = await getQuizSubmissionDetails({
      userId: session.userData.id,  // Use userData.id (MongoDB _id as string)
      courseId: id,           // Use awaited id
      quizId: quizId          // Use awaited quizId
    })
    
    console.log("Submission data loaded successfully:", submissionData)
  } catch (error) {
    console.error('Failed to load quiz results:', error)
    // Check if it's a redirect error (thrown by redirect())
    if (error.message?.includes('NEXT_REDIRECT')) {
      throw error
    }
    // Otherwise show not found page
    notFound()
  }

  // Validate that we have the required data
  if (!submissionData || !submissionData.data) {
    console.error("No submission data returned")
    notFound()
  }

  const { submission, answers } = submissionData.data

  if (!submission || !answers || answers.length === 0) {
    console.error("Invalid submission or answers data")
    notFound()
  }

  // Sort answers by question order to maintain consistency
  const sortedAnswers = answers.sort((a, b) => a.question.order - b.question.order)

  const formattedTimeSpent = formatTimeSpent(submission.timeSpent)
  const totalQuestions = sortedAnswers.length

  return (
    <div className="min-h-screen bg-background">
      {/* Results Header with Score Display */}
      <div className="flex gap-4 md:min-w-7xl max-w-7xl flex-col md:flex-row justify-center mx-auto mt-2 md:mt-10">
        <QuizResultsHeader
          score={submission.score}
          totalQuestions={totalQuestions}
          timeSpent={formattedTimeSpent}
          attemptNumber={submission.attemptNumber}
        />
        <QuizResultsOverview answers={sortedAnswers} />
      </div>

      {/* Main Content Container */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Detailed Question Results */}
        <QuestionResultsList answers={sortedAnswers} />

        {/* Navigation Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12 pt-8 border-t border-border">
          <Button asChild variant="default" size="lg">
            <Link href={`/courses/${id}`}>
              Return to Course
            </Link>
          </Button>
        </div>

        {/* Additional Information */}
        <div className="mt-8 p-4 bg-card rounded-lg border border-border">
          <h3 className="font-poppins font-bold text-sm text-foreground mb-2">
            Submission Details
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Started:</span>
              <div>{new Date(submission.startTime).toLocaleString()}</div>
            </div>
            <div>
              <span className="font-medium">Completed:</span>
              <div>{new Date(submission.endTime).toLocaleString()}</div>
            </div>
            <div>
              <span className="font-medium">Submission:</span>
              <div className="capitalize">{submission.submissionReason.replace('_', ' ')}</div>
            </div>
            <div>
              <span className="font-medium">Warnings:</span>
              <div>{submission.warningCount} violation{submission.warningCount !== 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}