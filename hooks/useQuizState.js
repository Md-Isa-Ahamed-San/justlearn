import { useState, useCallback, useRef } from 'react'

/**
 * Custom hook for managing overall quiz state
 * Handles quiz lifecycle, loading states, and errors
 */
export function useQuizState(quiz) {
    console.log('🐛 useQuizState called with quiz:', quiz)

    // Quiz status: 'loading' | 'ready' | 'in_progress' | 'submitting' | 'completed' | 'error'
    const [status, setStatus] = useState(() => {
        // Determine initial status based on quiz data
        if (!quiz) return 'loading'
        if (!quiz.questions || quiz.questions.length === 0) return 'error'
        return 'ready'
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState(null)

    // Metadata about the quiz session
    const [sessionMetadata, setSessionMetadata] = useState({
        startedAt: null,
        completedAt: null,
        timeSpent: 0,
        violations: [],
        submissionReason: null
    })

    const statusRef = useRef(status)
    statusRef.current = status

    /**
     * Start the quiz
     */
    const startQuiz = useCallback(() => {
        console.log('🚀 Starting quiz')

        setStatus('in_progress')
        setError(null)
        setSessionMetadata(prev => ({
            ...prev,
            startedAt: new Date().toISOString()
        }))
    }, [])

    /**
     * Set quiz to submitting state
     */
    const setSubmittingState = useCallback((isSubmitting) => {
        console.log('📤 Setting submitting state:', isSubmitting)

        setSubmitting(isSubmitting)
        if (isSubmitting && statusRef.current === 'in_progress') {
            setStatus('submitting')
        }
    }, [])

    /**
     * Complete the quiz with results
     */
    const completeQuiz = useCallback((quizResult) => {
        console.log('✅ Completing quiz with result:', quizResult)

        setStatus('completed')
        setSubmitting(false)
        setResult(quizResult)
        setSessionMetadata(prev => ({
            ...prev,
            completedAt: new Date().toISOString(),
            timeSpent: prev.startedAt ?
                Date.now() - new Date(prev.startedAt).getTime() : 0
        }))
    }, [])

    /**
     * Set error state
     */
    const setErrorState = useCallback((errorMessage) => {
        console.error('❌ Setting quiz error:', errorMessage)

        setError(errorMessage)
        setStatus('error')
        setSubmitting(false)
        setLoading(false)
    }, [])

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        console.log('🧹 Clearing quiz error')
        setError(null)
        if (status === 'error') {
            setStatus(quiz && quiz.questions?.length > 0 ? 'ready' : 'error')
        }
    }, [status, quiz])

    /**
     * Set loading state
     */
    const setLoadingState = useCallback((isLoading) => {
        console.log('⏳ Setting loading state:', isLoading)
        setLoading(isLoading)
        if (isLoading && status !== 'loading') {
            setStatus('loading')
        }
    }, [status])

    /**
     * Reset quiz state (for retries)
     */
    const resetQuiz = useCallback(() => {
        console.log('🔄 Resetting quiz state')

        setStatus('ready')
        setLoading(false)
        setError(null)
        setSubmitting(false)
        setResult(null)
        setSessionMetadata({
            startedAt: null,
            completedAt: null,
            timeSpent: 0,
            violations: [],
            submissionReason: null
        })
    }, [])

    /**
     * Add violation to session metadata
     */
    const addViolation = useCallback((violation) => {
        console.log('⚠️ Adding violation to session:', violation)

        setSessionMetadata(prev => ({
            ...prev,
            violations: [...prev.violations, {
                ...violation,
                timestamp: new Date().toISOString()
            }]
        }))
    }, [])

    /**
     * Update session metadata
     */
    const updateSessionMetadata = useCallback((updates) => {
        console.log('📊 Updating session metadata:', updates)

        setSessionMetadata(prev => ({
            ...prev,
            ...updates
        }))
    }, [])

    /**
     * Get current quiz statistics
     */
    const getQuizStats = useCallback(() => {
        return {
            status,
            duration: sessionMetadata.startedAt ?
                Date.now() - new Date(sessionMetadata.startedAt).getTime() : 0,
            violationCount: sessionMetadata.violations.length,
            isActive: status === 'in_progress',
            isCompleted: status === 'completed',
            hasErrors: !!error,
            isSubmitting: submitting
        }
    }, [status, sessionMetadata, error, submitting])

    /**
     * Check if quiz can be started
     */
    const canStartQuiz = useCallback(() => {
        return status === 'ready' && !loading && !error && quiz && quiz.questions?.length > 0
    }, [status, loading, error, quiz])

    /**
     * Check if quiz is in progress
     */
    const isInProgress = useCallback(() => {
        return status === 'in_progress'
    }, [status])

    /**
     * Check if quiz can be submitted
     */
    const canSubmit = useCallback(() => {
        return status === 'in_progress' && !submitting
    }, [status, submitting])

    // Debug current state
    console.log('🐛 useQuizState current state:', {
        status,
        loading,
        error,
        submitting,
        sessionMetadata,
        canStart: canStartQuiz(),
        isActive: isInProgress(),
        canSubmit: canSubmit()
    })

    return {
        // State
        status,
        loading,
        error,
        submitting,
        result,
        sessionMetadata,

        // Actions
        startQuiz,
        completeQuiz,
        resetQuiz,
        setSubmitting: setSubmittingState,
        setError: setErrorState,
        clearError,
        setLoading: setLoadingState,
        addViolation,
        updateSessionMetadata,

        // Computed values
        canStartQuiz: canStartQuiz(),
        isInProgress: isInProgress(),
        canSubmit: canSubmit(),
        stats: getQuizStats(),

        // Methods
        getQuizStats
    }
}