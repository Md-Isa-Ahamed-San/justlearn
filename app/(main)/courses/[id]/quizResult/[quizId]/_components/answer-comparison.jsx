export function AnswerComparison({
  questionType,
  submittedAnswer,
  correctAnswer,
  options = [],
  isCorrect,
  marksAwarded,
  totalMarks
}) {

  // Check if answer is empty/unanswered
  const isUnanswered = 
    submittedAnswer === "" || 
    submittedAnswer === null ||
    submittedAnswer === undefined ||
    (Array.isArray(submittedAnswer) && submittedAnswer.length === 0);

  const getSubmittedAnswerDisplay = () => {
    if (isUnanswered) {
      return null; // Handle separately
    }

    if (questionType === 'mcq') {
      // Handle both array and string formats for submitted answers
      const answerValue = Array.isArray(submittedAnswer) ? submittedAnswer[0] : submittedAnswer;
      const selectedOption = options.find(option => option.label === answerValue);
      return selectedOption ? selectedOption.label : answerValue;
    }

    // For text-based answers
    return Array.isArray(submittedAnswer) ? submittedAnswer[0] : submittedAnswer;
  }

  const getCorrectAnswerDisplay = () => {
    if (questionType === 'mcq') {
      const correctOption = options.find(option => option.isCorrect);
      return correctOption ? correctOption.label : correctAnswer;
    }
    return correctAnswer;
  }

  const getAnswerStyling = (correct) => {
    if (isUnanswered) {
      return 'bg-gray-50 border-gray-200 text-gray-600';
    }
    if (correct) {
      return 'bg-green-50 border-green-200 text-green-900';
    }
    if (marksAwarded > 0 && marksAwarded < totalMarks) {
      return 'bg-yellow-50 border-yellow-200 text-yellow-900';
    }
    return 'bg-red-50 border-red-200 text-red-900';
  }

  const submittedDisplay = getSubmittedAnswerDisplay();
  const correctDisplay = getCorrectAnswerDisplay();

  return (
    <div className="space-y-4">
      {/* Your Answer Section */}
      <div>
        <h4 className="font-poppins font-bold text-sm text-foreground mb-2">
          Your Answer:
        </h4>
        <div className={`p-3 rounded border ${getAnswerStyling(isCorrect)}`}>
          {isUnanswered ? (
            <div className="flex items-center gap-2 text-muted-foreground italic">
              <span>⚠️ Question not answered</span>
            </div>
          ) : questionType === 'mcq' ? (
            <div className="flex items-center gap-2">
              <div className="font-medium">
                {submittedDisplay}
              </div>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">
              {submittedDisplay}
            </div>
          )}
        </div>

        {/* Show partial credit info if applicable */}
        {!isUnanswered && marksAwarded > 0 && marksAwarded < totalMarks && (
          <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
            Partial credit awarded: {marksAwarded}/{totalMarks} marks
          </div>
        )}
      </div>

      {/* Correct Answer Section (show if incorrect, partial, or unanswered) */}
      {(!isCorrect || isUnanswered) && (
        <div>
          <h4 className="font-poppins font-bold text-sm text-green-700 mb-2">
            Correct Answer:
          </h4>
          <div className="p-3 rounded border border-green-200 bg-green-50 text-green-900">
            {questionType === 'mcq' ? (
              <div className="flex items-center gap-2">
                <div className="font-medium">
                  {correctDisplay}
                </div>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">
                {correctDisplay}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Multiple Choice Options Display */}
      {questionType === 'mcq' && options.length > 0 && (
        <div className="mt-4">
          <h4 className="font-poppins font-bold text-sm text-foreground mb-2">
            All Options:
          </h4>
          <div className="space-y-2">
            {options.map((option, index) => {
              const isSelected = !isUnanswered && option.label === submittedDisplay;
              const isCorrectOption = option.isCorrect;

              let optionStyling = 'p-2 rounded border text-sm';

              if (isCorrectOption && isSelected) {
                // Correct option selected
                optionStyling += ' bg-green-100 border-green-300 text-green-900 font-medium';
              } else if (isCorrectOption) {
                // Correct option not selected
                optionStyling += ' bg-green-50 border-green-200 text-green-800';
              } else if (isSelected) {
                // Wrong option selected
                optionStyling += ' bg-red-100 border-red-300 text-red-900';
              } else {
                // Regular option
                optionStyling += ' bg-background border-border text-muted-foreground';
              }

              return (
                <div key={index} className={optionStyling}>
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    <div className="flex gap-2">
                      {isSelected && (
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                          Your Choice
                        </span>
                      )}
                      {isCorrectOption && (
                        <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                          Correct
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}