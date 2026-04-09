import React, { useState, useEffect } from 'react'
import { CheckCircle, AlertTriangle, Clock, FileText, X, Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'

/**
 * QuizSubmissionModal - Handles quiz submission confirmation
 * Shows unanswered questions, prevents accidental submission, handles errors
 */
export default function QuizSubmissionModal({
                                                isOpen,
                                                onClose,
                                                onConfirm,
                                                unansweredQuestions = [],
                                                isSubmitting = false,
                                                submissionError = null,
                                                totalQuestions = 0,
                                                onRetry = null
                                            }) {
    const [showUnansweredList, setShowUnansweredList] = useState(false)
    const [confirmationStep, setConfirmationStep] = useState(false)
    const [localError, setLocalError] = useState(null)

    // Reset states when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setShowUnansweredList(false)
            setConfirmationStep(false)
            setLocalError(null)
        }
    }, [isOpen])

    // Handle submission error
    useEffect(() => {
        if (submissionError) {
            setLocalError(submissionError)
            setConfirmationStep(false)
        }
    }, [submissionError])

    // Prevent modal close during submission
    const handleClose = () => {
        if (isSubmitting) return
        onClose()
    }

    // Handle keyboard events
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (!isOpen) return

            if (event.key === 'Escape' && !isSubmitting) {
                handleClose()
            }

            if (event.key === 'Enter' && !isSubmitting && confirmationStep) {
                handleConfirmSubmission()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, isSubmitting, confirmationStep])

    // Handle initial submit click
    const handleInitialSubmit = () => {
        if (unansweredQuestions.length > 0) {
            setConfirmationStep(true)
        } else {
            handleConfirmSubmission()
        }
    }

    // Handle final confirmation
    const handleConfirmSubmission = () => {
        setLocalError(null)
        onConfirm()
    }

    // Handle retry after error
    const handleRetry = () => {
        setLocalError(null)
        if (onRetry) {
            onRetry()
        } else {
            handleConfirmSubmission()
        }
    }

    // Calculate completion stats
    const answeredQuestions = totalQuestions - unansweredQuestions.length
    const completionPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0

    // Format question number for display
    const formatQuestionNumber = (question, index) => {
        return question.questionNumber || question.order || (index + 1)
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="bg-card border-border text-card-foreground font-poppins max-w-md mx-auto"
                onPointerDownOutside={(e) => isSubmitting && e.preventDefault()}
                onEscapeKeyDown={(e) => isSubmitting && e.preventDefault()}
            >
                <DialogHeader className="space-y-3">
                    <DialogTitle className="flex items-center space-x-2 text-foreground font-poppins font-bold">
                        {localError ? (
                            <>
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                <span>Submission Failed</span>
                            </>
                        ) : isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                                <span>Submitting Quiz...</span>
                            </>
                        ) : confirmationStep ? (
                            <>
                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                <span>Confirm Submission</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span>Submit Quiz</span>
                            </>
                        )}
                    </DialogTitle>

                    {/* Submission Stats */}
                    {!localError && (
                        <div className="bg-background border border-border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground font-poppins">Quiz Progress</span>
                                <Badge variant="secondary" className="font-poppins">
                                    {answeredQuestions}/{totalQuestions} Complete
                                </Badge>
                            </div>
                            <Progress value={completionPercentage} className="h-2 mb-2" />
                            <div className="text-xs text-muted-foreground font-poppins">
                                {completionPercentage.toFixed(0)}% of questions answered
                            </div>
                        </div>
                    )}
                </DialogHeader>

                <div className="space-y-4">
                    {/* Error State */}
                    {localError && (
                        <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            <AlertDescription className="text-red-800 dark:text-red-200 font-poppins">
                                <div className="font-bold mb-1">Unable to submit quiz</div>
                                <div className="text-sm">{localError}</div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Submission Progress */}
                    {isSubmitting && !localError && (
                        <div className="text-center space-y-3">
                            <div className="flex justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                            <div className="text-sm text-muted-foreground font-poppins">
                                Processing your submission...
                            </div>
                            <div className="text-xs text-muted-foreground font-poppins">
                                Please don't close this window
                            </div>
                        </div>
                    )}

                    {/* Unanswered Questions Warning */}
                    {!isSubmitting && !localError && unansweredQuestions.length > 0 && (
                        <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            <AlertDescription className="text-yellow-800 dark:text-yellow-200 font-poppins">
                                <div className="font-bold mb-1">
                                    You have {unansweredQuestions.length} unanswered question{unansweredQuestions.length !== 1 ? 's' : ''}
                                </div>
                                <div className="text-sm mb-2">
                                    These questions will be marked as incorrect if you submit now.
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowUnansweredList(!showUnansweredList)}
                                    className="text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 font-poppins"
                                >
                                    <FileText className="w-3 h-3 mr-1" />
                                    {showUnansweredList ? 'Hide' : 'Show'} Questions
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Unanswered Questions List */}
                    {showUnansweredList && unansweredQuestions.length > 0 && (
                        <div className="bg-background border border-border rounded-lg">
                            <div className="p-3 border-b border-border">
                                <h4 className="font-bold text-foreground font-poppins text-sm">
                                    Unanswered Questions
                                </h4>
                            </div>
                            <ScrollArea className="max-h-32">
                                <div className="p-3 space-y-2">
                                    {unansweredQuestions.map((question, index) => (
                                        <div
                                            key={question.id}
                                            className="flex items-start space-x-2 text-sm"
                                        >
                                            <Badge variant="outline" className="min-w-8 h-5 flex items-center justify-center font-poppins">
                                                {formatQuestionNumber(question, index)}
                                            </Badge>
                                            <div className="flex-1 text-muted-foreground font-poppins line-clamp-2">
                                                {question.question || question.title || `Question ${formatQuestionNumber(question, index)}`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {/* Confirmation Message */}
                    {!isSubmitting && !localError && confirmationStep && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-2">
                                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span className="font-bold text-blue-800 dark:text-blue-200 font-poppins text-sm">
                  Final Confirmation
                </span>
                            </div>
                            <p className="text-blue-800 dark:text-blue-200 text-xs font-poppins">
                                Are you sure you want to submit your quiz? This action cannot be undone.
                                {unansweredQuestions.length > 0 && (
                                    <span className="block mt-1 font-bold">
                    {unansweredQuestions.length} question{unansweredQuestions.length !== 1 ? 's' : ''} will be marked incorrect.
                  </span>
                                )}
                            </p>
                        </div>
                    )}

                    {/* Success State Message */}
                    {!isSubmitting && !localError && !confirmationStep && unansweredQuestions.length === 0 && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                <span className="text-green-800 dark:text-green-200 font-poppins text-sm">
                  All questions have been answered. Ready to submit!
                </span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="space-x-2">
                    {localError ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                disabled={isSubmitting}
                                className="font-poppins border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleRetry}
                                disabled={isSubmitting}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 font-poppins"
                            >
                                Try Again
                            </Button>
                        </>
                    ) : isSubmitting ? (
                        <div className="w-full text-center text-sm text-muted-foreground font-poppins">
                            Submitting your quiz...
                        </div>
                    ) : confirmationStep ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setConfirmationStep(false)}
                                className="font-poppins border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                            >
                                Go Back
                            </Button>
                            <Button
                                onClick={handleConfirmSubmission}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 font-poppins"
                            >
                                Submit Quiz
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                className="font-poppins border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleInitialSubmit}
                                className={`font-poppins ${
                                    unansweredQuestions.length > 0
                                        ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                }`}
                            >
                                {unansweredQuestions.length > 0 ? 'Submit Anyway' : 'Submit Quiz'}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}