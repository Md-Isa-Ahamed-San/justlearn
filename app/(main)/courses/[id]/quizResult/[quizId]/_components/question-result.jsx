import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {ExplanationSection} from "@/app/(main)/courses/[id]/quizResult/[quizId]/_components/explanation-section";
import {AnswerComparison} from "@/app/(main)/courses/[id]/quizResult/[quizId]/_components/answer-comparison";

export function QuestionResult({ answer, questionNumber }) {
  const { question, isCorrect, marksAwarded, submittedAnswer, answerExplanation } = answer

  // Check if question was unanswered
  const isUnanswered = 
    submittedAnswer === "" || 
    submittedAnswer === null ||
    submittedAnswer === undefined ||
    (Array.isArray(submittedAnswer) && submittedAnswer.length === 0);

  // Determine status and styling
  const getStatus = () => {
    if (isUnanswered) return 'unanswered'
    if (isCorrect) return 'correct'
    if (marksAwarded > 0) return 'partial'
    return 'incorrect'
  }

  const status = getStatus()

  const getBorderColor = () => {
    switch (status) {
      case 'correct':
        return 'border-l-green-500'
      case 'partial':
        return 'border-l-yellow-500'
      case 'incorrect':
        return 'border-l-red-500'
      case 'unanswered':
        return 'border-l-gray-400'
      default:
        return 'border-l-border'
    }
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'correct':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            Correct
          </Badge>
        )
      case 'partial':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Partial Credit
          </Badge>
        )
      case 'incorrect':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
            Incorrect
          </Badge>
        )
      case 'unanswered':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Not Answered
          </Badge>
        )
      default:
        return null
    }
  }

  const getQuestionTypeBadge = () => {
    switch (question.type) {
      case 'mcq':
        return (
          <Badge variant="outline" className="text-xs">
            Multiple Choice
          </Badge>
        )
      case 'short_answer':
        return (
          <Badge variant="outline" className="text-xs">
            Short Answer
          </Badge>
        )
      case 'long_answer':
        return (
          <Badge variant="outline" className="text-xs">
            Long Answer
          </Badge>
        )
      default:
        return null
    }
  }

  const getCorrectAnswer = () => {
    if (question.type === 'mcq') {
      const correctOption = question.options?.find(option => option.isCorrect)
      return correctOption ? correctOption.label : question.correctAnswer
    }
    return question.correctAnswer
  }

  return (
    <Card className={`p-6 w-full border-l-4 ${getBorderColor()}`}>
      {/* Question Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-medium">
            Question {questionNumber}
          </Badge>
          {getQuestionTypeBadge()}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              {marksAwarded}/{question.mark} marks
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </div>
      
      {/* Question Content */}
      <div className="mb-4">
        <h3 className="font-poppins font-bold text-foreground mb-3 text-base leading-relaxed">
          {question.text}
        </h3>
        {question.image && (
          <div className="mt-3 mb-3">
            <img 
              src={question.image} 
              alt="Question illustration" 
              className="max-w-full h-auto rounded border border-border"
            />
          </div>
        )}
      </div>

      {/* Answer Comparison */}
     <AnswerComparison
        questionType={question.type}
        submittedAnswer={submittedAnswer}
        correctAnswer={getCorrectAnswer()}
        options={question.options || []}
        isCorrect={isCorrect}
        marksAwarded={marksAwarded}
        totalMarks={question.mark}
      />
      
      {/* Explanation Section */}
      {answerExplanation && answerExplanation.explanation && (
        <ExplanationSection
          answerExplanation={answerExplanation.explanation}
          questionExplanation={question.explanation}
          status={status}
        />
      )}
    </Card>
  )
}