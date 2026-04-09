import React from 'react';
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";

const QuizNavigationSidebar = (
    {
    quiz,
    state,
    currentQuestionIndex,
    totalQuestions,
    goToQuestion,
    isFullscreen,
    timerPaused
}

) => {
    return (
        <div className="lg:col-span-1">
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-card-foreground font-poppins font-bold">
                        Questions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-5 lg:grid-cols-3 gap-2">
                        {quiz.questions.map((question, index) => {
                            const answerData = state.answers[question.id];
                            let isAnswered = false;
                            if (answerData) {
                                if (Array.isArray(answerData.answer)) {
                                    isAnswered = answerData.answer.length > 0;
                                } else {
                                    isAnswered = !!answerData.answer;
                                }
                            }
                            const isCurrent = index === currentQuestionIndex

                            return (
                                <Button
                                    key={question.id}
                                    variant={isCurrent ? "default" : isAnswered ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={() => goToQuestion(index)}
                                    className={`
                                                h-8 w-8 p-0 text-xs
                                                ${isCurrent ? 'bg-primary text-primary-foreground' : ''}
                                                ${isAnswered && !isCurrent ? 'bg-secondary text-secondary-foreground' : ''}
                                                ${!isAnswered && !isCurrent ? 'border-border text-foreground hover:bg-accent' : ''}
                                            `}
                                    disabled={state.isSubmitting}
                                >
                                    {index + 1}
                                </Button>
                            )
                        })}
                    </div>

                    {/* Answer Summary */}
                    <div className="mt-4 pt-4 border-t border-border">
                        <div className="text-sm text-muted-foreground space-y-1">
                            <div>Answered: {Object.values(state.answers).filter(a => (Array.isArray(a.answer) ? a.answer.length > 0 : !!a.answer)).length}/{totalQuestions}</div>
                            <div>Remaining: {totalQuestions - Object.values(state.answers).filter(a => (Array.isArray(a.answer) ? a.answer.length > 0 : !!a.answer)).length}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            {/* Debug Information (Remove in production) */}

            <Card className="mt-6 bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-sm text-card-foreground">Debug Info</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-xs text-muted-foreground space-y-1">
                        <div>Violations: {state.violations.length}</div>
                        <div>Warnings: {state.warningCount}</div>
                        <div>Fullscreen: {isFullscreen ? 'Active' : 'Inactive'}</div>
                        <div>Fullscreen Supported: {state.isFullscreenSupported ? 'Yes' : 'No'}</div>
                        <div>Offline: {state.isOffline ? 'Yes' : 'No'}</div>
                        <div>Disconnections: {state.disconnectionCount}</div>
                        <div>Total Offline Time: {Math.floor(state.totalOfflineTime / 1000)}s</div>
                        <div>Auto-Submit Pending: {state.shouldAutoSubmitOnReconnect ? 'Yes' : 'No'}</div>
                        <div>Timer Paused: {timerPaused ? 'Yes' : 'No'}</div>
                        <div>Answered Questions: {Object.keys(state.answers).length}</div>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
};

export default QuizNavigationSidebar;