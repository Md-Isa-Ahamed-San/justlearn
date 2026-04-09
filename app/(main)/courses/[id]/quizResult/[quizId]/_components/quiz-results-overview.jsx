import { CheckCircle, XCircle, AlertCircle, Target, HelpCircle } from 'lucide-react'

export function QuizResultsOverview({ answers }) {
  // Calculate performance statistics
  const calculateStats = () => {
    let correctCount = 0
    let incorrectCount = 0
    let partialCount = 0
    let unansweredCount = 0
    let totalMarks = 0
    let earnedMarks = 0

    answers.forEach(answer => {
      totalMarks += answer.question.mark
      earnedMarks += answer.marksAwarded

      // Check if unanswered
      const isUnanswered = 
        answer.submittedAnswer === "" || 
        answer.submittedAnswer === null ||
        answer.submittedAnswer === undefined ||
        (Array.isArray(answer.submittedAnswer) && answer.submittedAnswer.length === 0);

      if (isUnanswered) {
        unansweredCount++
      } else if (answer.isCorrect) {
        correctCount++
      } else if (answer.marksAwarded > 0) {
        partialCount++
      } else {
        incorrectCount++
      }
    })

    const accuracy = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0
    const questionAccuracy = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0

    return {
      correctCount,
      incorrectCount,
      partialCount,
      unansweredCount,
      totalQuestions: answers.length,
      accuracy,
      questionAccuracy,
      earnedMarks,
      totalMarks
    }
  }

  const stats = calculateStats()

  // Get question type breakdown
  const getQuestionTypeBreakdown = () => {
    const typeBreakdown = {}
    
    answers.forEach(answer => {
      const type = answer.question.type
      if (!typeBreakdown[type]) {
        typeBreakdown[type] = { total: 0, correct: 0, unanswered: 0 }
      }
      typeBreakdown[type].total++
      
      const isUnanswered = 
        answer.submittedAnswer === "" || 
        answer.submittedAnswer === null ||
        answer.submittedAnswer === undefined ||
        (Array.isArray(answer.submittedAnswer) && answer.submittedAnswer.length === 0);
      
      if (isUnanswered) {
        typeBreakdown[type].unanswered++
      } else if (answer.isCorrect) {
        typeBreakdown[type].correct++
      }
    })

    return typeBreakdown
  }

  const typeBreakdown = getQuestionTypeBreakdown()
  const hasMultipleTypes = Object.keys(typeBreakdown).length > 1

  const getTypeDisplayName = (type) => {
    switch (type) {
      case 'mcq':
        return 'Multiple Choice'
      case 'short_answer':
        return 'Short Answer'
      case 'long_answer':
        return 'Long Answer'
      default:
        return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  return (
    <section className="bg-card rounded-lg border border-border p-6 w-full">
      <h2 className="font-poppins font-bold text-xl text-foreground mb-6">
        Performance Overview
      </h2>
      
      {/* Main Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Correct Answers */}
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600 mb-1">
            {stats.correctCount}
          </div>
          <div className="text-sm text-green-700 font-medium">
            Correct
          </div>
        </div>

        {/* Partial Credit */}
        {stats.partialCount > 0 && (
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {stats.partialCount}
            </div>
            <div className="text-sm text-yellow-700 font-medium">
              Partial Credit
            </div>
          </div>
        )}

        {/* Incorrect Answers */}
        <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
          <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-red-600 mb-1">
            {stats.incorrectCount}
          </div>
          <div className="text-sm text-red-700 font-medium">
            Incorrect
          </div>
        </div>

        {/* Unanswered Questions */}
        {stats.unansweredCount > 0 && (
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <HelpCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-600 mb-1">
              {stats.unansweredCount}
            </div>
            <div className="text-sm text-gray-700 font-medium">
              Unanswered
            </div>
          </div>
        )}

        {/* Overall Accuracy */}
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {stats.accuracy}%
          </div>
          <div className="text-sm text-blue-700 font-medium">
            Score Accuracy
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Question Summary */}
        <div className="p-4 bg-background rounded-lg border border-border">
          <h3 className="font-poppins font-bold text-foreground mb-3">
            Question Summary
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Questions:</span>
              <span className="font-medium text-foreground">{stats.totalQuestions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Questions Correct:</span>
              <span className="font-medium text-green-600">{stats.correctCount}</span>
            </div>
            {stats.unansweredCount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Questions Unanswered:</span>
                <span className="font-medium text-gray-600">{stats.unansweredCount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Question Accuracy:</span>
              <span className="font-medium text-foreground">{stats.questionAccuracy}%</span>
            </div>
          </div>
        </div>

        {/* Marks Breakdown */}
        <div className="p-4 bg-background rounded-lg border border-border">
          <h3 className="font-poppins font-bold text-foreground mb-3">
            Marks Breakdown
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Marks:</span>
              <span className="font-medium text-foreground">{stats.totalMarks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Marks Earned:</span>
              <span className="font-medium text-green-600">{stats.earnedMarks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mark Percentage:</span>
              <span className="font-medium text-foreground">{stats.accuracy}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Question Type Breakdown (if multiple types exist) */}
      {hasMultipleTypes && (
        <div className="mt-6 p-4 bg-background rounded-lg border border-border">
          <h3 className="font-poppins font-bold text-foreground mb-3">
            Question Type Performance
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(typeBreakdown).map(([type, data]) => {
              const typeAccuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
              return (
                <div key={type} className="text-center">
                  <div className="text-lg font-bold text-foreground">
                    {data.correct}/{data.total}
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">
                    {getTypeDisplayName(type)}
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {typeAccuracy}%
                  </div>
                  {data.unanswered > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      ({data.unanswered} unanswered)
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}