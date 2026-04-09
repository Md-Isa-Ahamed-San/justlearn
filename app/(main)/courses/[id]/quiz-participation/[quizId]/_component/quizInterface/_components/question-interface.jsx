import QuizQuestion from "@/app/(main)/courses/[id]/quiz-participation/[quizId]/_component/quizInterface/_components/quiz-question";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, WifiOff } from "lucide-react";

const QuestionInterface = ({
  currentQuestion,
  state,
  previousQuestion,
  nextQuestion,
  handleManualSubmit,
  handleAnswerChange,
  currentQuestionIndex,
  totalQuestions,
}) => {
  if (!currentQuestion) {
    return (
      <div className="lg:col-span-3">
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center text-muted-foreground">
            No questions available for this quiz.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="lg:col-span-3">
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          {/* Question Component */}
          <QuizQuestion
            question={currentQuestion}
            answer={state.answers[currentQuestion.id]}
            onAnswerChange={handleAnswerChange}
            disabled={state.isSubmitting || state.isOffline}
          />

          {/* Offline Mode Notice */}
          {state.isOffline && (
            <Alert className="mt-4 bg-destructive/10 border-destructive">
              <WifiOff className="h-4 w-4" />
              <AlertDescription className="text-foreground">
                <strong>Offline Mode Active</strong>
                <br />
                {state.disconnectionCount === 1
                  ? state.shouldAutoSubmitOnReconnect
                    ? "Grace period expired. Quiz will auto-submit when connection returns."
                    : "Reconnect within 30 seconds to avoid auto-submission."
                  : "Multiple disconnections detected. Quiz will auto-submit immediately when connection returns."}
              </AlertDescription>
            </Alert>
          )}

          {/* Navigation Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mt-8 pt-6 border-t border-border">
            {/* Previous Button */}
            <Button
              variant="outline"
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0 || state.isSubmitting}
              className="w-full sm:w-auto border-border text-foreground hover:bg-accent"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {/* Question Counter */}
            <div className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </div>

            {/* Next/Submit Button */}
            {currentQuestionIndex === totalQuestions - 1 ? (
              <Button
                onClick={handleManualSubmit}
                disabled={state.isSubmitting || state.isOffline}
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {state.isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  "Submit Quiz"
                )}
              </Button>
            ) : (
              <Button
                onClick={nextQuestion}
                disabled={state.isSubmitting}
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionInterface;
