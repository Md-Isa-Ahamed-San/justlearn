import { useCallback, useRef } from 'react'
import { toast } from 'sonner'

/**
 * useQuizSubmission - CORRECTED VERSION
 * This version is refactored to be compatible with the flat state object
 * returned by the `useQuizState` hook.
 */
export const useQuizSubmission = (quiz, quizState, answerManager, currentUser) => {
    const hasAutoSubmittedRef = useRef(false)
    const submissionTimeoutRef = useRef(null)

    // Prevent duplicate submissions
    const canSubmit = useCallback(() => {
        // CORRECTED: Reads 'submitting' directly from quizState, not quizState.state
        return !hasAutoSubmittedRef.current && !quizState.submitting
    }, [quizState.submitting])

    // Validate submission before processing
    const validateSubmission = useCallback(() => {
        // This function was already correct as it depends on answerManager
        const validation = answerManager.validateAnswers()
        const unansweredQuestions = answerManager.getUnansweredQuestions()

        return {
            ...validation,
            canProceed: true,
            unansweredCount: unansweredQuestions.length,
            unansweredQuestions: unansweredQuestions.map(q => ({
                id: q.id,
                order: q.order,
                text: q.text.substring(0, 100) + (q.text.length > 100 ? '...' : '')
            }))
        }
    }, [answerManager])

    // Process the actual submission
    const processSubmission = useCallback(async (submissionType = 'manual', reason = 'Manual submission') => {
        if (!canSubmit()) {
            console.log("🚫 Submission blocked - already in progress or completed")
            return { success: false, reason: 'already_submitted' }
        }

        hasAutoSubmittedRef.current = true
        // CORRECTED: Calls the specific setSubmitting function from useQuizState
        quizState.setSubmitting(true)

        console.log(`📤 Processing ${submissionType} submission:`, reason)

        try {
            const answersSummary = answerManager.exportAnswers() // Using exportAnswers for a complete summary

            const submissionData = {
                quizId: quiz.id,
                userId: currentUser.id,
                submissionType,
                reason,
                answers: answersSummary.answers,
                metadata: {
                    ...answersSummary.metadata,
                    submissionTime: new Date().toISOString(),
                    // CORRECTED: Reads violations from sessionMetadata
                    violations: quizState.sessionMetadata.violations,
                    // NOTE: offlineTracking data would need to be passed in or retrieved from another source
                }
            }

            console.log("📋 Final submission data:", submissionData)

            if (submissionTimeoutRef.current) {
                clearTimeout(submissionTimeoutRef.current)
            }

            localStorage.removeItem(`quiz_${quiz.id}_offline_state`)

            // Simulate server submission
            await new Promise(resolve => setTimeout(resolve, 1500))

            console.log("✅ Quiz submitted successfully")

            return {
                success: true,
                submissionId: `sub_${new Date().getTime()}`,
                submissionData,
                submissionType,
                reason
            }

        } catch (error) {
            console.error("❌ Submission failed:", error)
            // CORRECTED: Calls the specific setSubmitting function
            quizState.setSubmitting(false)
            hasAutoSubmittedRef.current = false // Allow retry on failure

            return {
                success: false,
                error: error.message,
                submissionType,
                reason
            }
        }
    }, [canSubmit, quizState, answerManager, quiz.id, currentUser.id])

    // Manual submission with confirmation
    const submitQuiz = useCallback(async () => {
        if (!canSubmit()) return

        const validation = validateSubmission()

        if (validation.unansweredCount > 0) {
            return new Promise((resolve) => {
                toast.warning("Are you sure you want to submit?", {
                    description: `You have ${validation.unansweredCount} unanswered questions.`,
                    action: {
                        label: "Submit Anyway",
                        onClick: async () => {
                            const result = await processSubmission('manual', 'Manual submission with unanswered questions')
                            resolve(result) // Resolve the promise with the result
                        },
                    },
                    cancel: {
                        label: "Cancel",
                        onClick: () => resolve({ success: false, reason: 'cancelled' })
                    },
                    duration: 10000,
                })
            })
        } else {
            return await processSubmission('manual', 'Manual submission')
        }
    }, [canSubmit, validateSubmission, processSubmission])

    // Auto submission (no confirmation)
    const autoSubmitQuiz = useCallback(async (reason) => {
        if (!canSubmit()) {
            console.log("🚫 Auto-submit blocked - already in progress")
            return { success: false, reason: 'already_submitted' }
        }

        console.log("🚨 AUTO-SUBMITTING QUIZ:", reason)
        const result = await processSubmission('auto', reason)

        if (result.success) {
            toast.error("Quiz Auto-Submitted", {
                description: reason,
                duration: 10000,
            })
        } else {
            toast.error("Auto-submission failed", {
                description: result.error || "System error occurred"
            })
        }

        return result
    }, [canSubmit, processSubmission])

    // Get submission status
    const getSubmissionStatus = useCallback(() => {
        return {
            // CORRECTED: Reads 'submitting' directly from quizState
            isSubmitting: quizState.submitting,
            hasSubmitted: hasAutoSubmittedRef.current,
            canSubmit: canSubmit()
        }
    }, [quizState.submitting, canSubmit])

    // Reset submission state
    const resetSubmissionState = useCallback(() => {
        hasAutoSubmittedRef.current = false
        // CORRECTED: Calls the specific setSubmitting function
        quizState.setSubmitting(false)

        if (submissionTimeoutRef.current) {
            clearTimeout(submissionTimeoutRef.current)
            submissionTimeoutRef.current = null
        }
        console.log("🔄 Submission state reset")
    }, [quizState])


    return {
        submitQuiz,
        autoSubmitQuiz,
        validateSubmission,
        canSubmit: canSubmit(),
        // CORRECTED: Reads 'submitting' directly from quizState
        isSubmitting: quizState.submitting,
        hasSubmitted: hasAutoSubmittedRef.current,
        resetSubmissionState,
    }
}