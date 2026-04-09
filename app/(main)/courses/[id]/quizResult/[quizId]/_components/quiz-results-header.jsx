import { Badge } from '@/components/ui/badge'

export function QuizResultsHeader({ score, totalQuestions, timeSpent, attemptNumber }) {
  // Calculate percentage with proper rounding
  const percentage = Math.round((score / totalQuestions) * 100)
  
  // Determine performance level for styling
  const getPerformanceLevel = () => {
    if (percentage >= 90) return 'excellent'
    if (percentage >= 80) return 'good'
    if (percentage >= 70) return 'average'
    if (percentage >= 60) return 'below-average'
    return 'poor'
  }

  const performanceLevel = getPerformanceLevel()
  
  // Get appropriate colors based on performance
  const getScoreColor = () => {
    switch (performanceLevel) {
      case 'excellent':
        return 'text-green-600'
      case 'good':
        return 'text-green-500'
      case 'average':
        return 'text-yellow-600'
      case 'below-average':
        return 'text-orange-500'
      case 'poor':
        return 'text-red-500'
      default:
        return 'text-foreground'
    }
  }

  const getBadgeVariant = () => {
    if (percentage >= 80) return 'default'
    if (percentage >= 60) return 'secondary'
    return 'outline'
  }

  const getPerformanceMessage = () => {
    switch (performanceLevel) {
      case 'excellent':
        return 'Outstanding performance! 🎉'
      case 'good':
        return 'Great job! 👏'
      case 'average':
        return 'Good effort! 👍'
      case 'below-average':
        return 'Keep practicing! 📚'
      case 'poor':
        return 'Review the material and try again! 💪'
      default:
        return 'Quiz completed!'
    }
  }

  return (
    <header className="bg-card border-b border-border w-full">
      <div className="container mx-auto px-4 py-12 text-center max-w-4xl">
        {/* Attempt Badge */}
        <Badge variant={getBadgeVariant()} className="mb-4">
          Attempt {attemptNumber}
        </Badge>
        
        {/* Main Title */}
        <h1 className="font-poppins font-bold text-4xl md:text-5xl text-foreground mb-2">
          Quiz Complete!
        </h1>
        
        {/* Performance Message */}
        <p className="text-lg text-muted-foreground mb-8">
          {getPerformanceMessage()}
        </p>
        
        {/* Score Display */}
        <div className="mb-6">
          <div className={`text-7xl md:text-8xl font-bold ${getScoreColor()} mb-2`}>
            {score}/{totalQuestions}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xl text-muted-foreground">
            <span className="font-semibold">
              {percentage}% Score
            </span>
            <span className="hidden sm:inline text-border">•</span>
            <span>
              Completed in {timeSpent}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto">
          <div className="w-full bg-secondary rounded-full h-3 mb-2">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                percentage >= 80 ? 'bg-green-500' :
                percentage >= 60 ? 'bg-yellow-500' : 
                'bg-red-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {score} out of {totalQuestions} questions correct
          </p>
        </div>
      </div>
    </header>
  )
}