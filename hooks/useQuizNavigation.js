import { useState, useCallback, useMemo } from 'react'

/**
 * Custom hook for managing quiz navigation
 * Handles question navigation, progress tracking, and visited questions
 */
export function useQuizNavigation(totalQuestions = 0, answers = {}) {
    console.log('🐛 useQuizNavigation called with:', { totalQuestions, answersCount: Object.keys(answers).length })

    // Current question index (0-based)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

    // Track which questions have been visited
    const [visitedQuestions, setVisitedQuestions] = useState(new Set([0]))

    /**
     * Navigate to a specific question by index
     */
    const goToQuestion = useCallback((index) => {
        if (index < 0 || index >= totalQuestions) {
            console.warn('⚠️ Invalid question index:', index)
            return false
        }

        console.log('🧭 Navigating to question:', index)

        setCurrentQuestionIndex(index)
        setVisitedQuestions(prev => new Set([...prev, index]))
        return true
    }, [totalQuestions])

    /**
     * Go to next question
     */
    const nextQuestion = useCallback(() => {
        const nextIndex = currentQuestionIndex + 1
        if (nextIndex < totalQuestions) {
            return goToQuestion(nextIndex)
        }
        return false
    }, [currentQuestionIndex, totalQuestions, goToQuestion])

    /**
     * Go to previous question
     */
    const previousQuestion = useCallback(() => {
        const prevIndex = currentQuestionIndex - 1
        if (prevIndex >= 0) {
            return goToQuestion(prevIndex)
        }
        return false
    }, [currentQuestionIndex, goToQuestion])

    /**
     * Jump to first unanswered question
     */
    const goToFirstUnanswered = useCallback((questions = []) => {
        const unansweredIndex = questions.findIndex(question => {
            const answer = answers[question.id]
            if (!answer) return true

            if (Array.isArray(answer.answer)) {
                return answer.answer.length === 0
            }

            if (typeof answer.answer === 'string') {
                return answer.answer.trim().length === 0
            }

            return answer.answer === null || answer.answer === undefined
        })

        if (unansweredIndex !== -1) {
            return goToQuestion(unansweredIndex)
        }

        return false
    }, [answers, goToQuestion])

    /**
     * Get question status (answered, current, visited, unvisited)
     */
    const getQuestionStatus = useCallback((questionIndex, questionId) => {
        const isAnswered = answers[questionId] &&
            (Array.isArray(answers[questionId].answer) ?
                answers[questionId].answer.length > 0 :
                answers[questionId].answer !== null &&
                answers[questionId].answer !== undefined &&
                answers[questionId].answer !== '')

        const isCurrent = questionIndex === currentQuestionIndex
        const isVisited = visitedQuestions.has(questionIndex)

        return {
            answered: isAnswered,
            current: isCurrent,
            visited: isVisited,
            unvisited: !isVisited && !isCurrent,
            status: isCurrent ? 'current' :
                isAnswered ? 'answered' :
                    isVisited ? 'visited' : 'unvisited'
        }
    }, [answers, currentQuestionIndex, visitedQuestions])

    // Computed values using useMemo for performance
    const canGoNext = useMemo(() => {
        return currentQuestionIndex < totalQuestions - 1
    }, [currentQuestionIndex, totalQuestions])

    const canGoPrevious = useMemo(() => {
        return currentQuestionIndex > 0
    }, [currentQuestionIndex])

    const isFirstQuestion = useMemo(() => {
        return currentQuestionIndex === 0
    }, [currentQuestionIndex])

    const isLastQuestion = useMemo(() => {
        return currentQuestionIndex === totalQuestions - 1
    }, [currentQuestionIndex, totalQuestions])

    const progressPercentage = useMemo(() => {
        if (totalQuestions === 0) return 0
        return Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)
    }, [currentQuestionIndex, totalQuestions])

    const answeredCount = useMemo(() => {
        return Object.keys(answers).filter(questionId => {
            const answer = answers[questionId]
            if (!answer) return false

            if (Array.isArray(answer.answer)) {
                return answer.answer.length > 0
            }

            if (typeof answer.answer === 'string') {
                return answer.answer.trim().length > 0
            }

            return answer.answer !== null && answer.answer !== undefined
        }).length
    }, [answers])

    const completionPercentage = useMemo(() => {
        if (totalQuestions === 0) return 0
        return Math.round((answeredCount / totalQuestions) * 100)
    }, [answeredCount, totalQuestions])

    const visitedCount = useMemo(() => {
        return visitedQuestions.size
    }, [visitedQuestions])

    /**
     * Get navigation summary
     */
    const getNavigationSummary = useCallback(() => {
        return {
            currentIndex: currentQuestionIndex,
            totalQuestions,
            progressPercentage,
            completionPercentage,
            answeredCount,
            visitedCount,
            canGoNext,
            canGoPrevious,
            isFirstQuestion,
            isLastQuestion,
            visitedQuestions: Array.from(visitedQuestions)
        }
    }, [
        currentQuestionIndex,
        totalQuestions,
        progressPercentage,
        completionPercentage,
        answeredCount,
        visitedCount,
        canGoNext,
        canGoPrevious,
        isFirstQuestion,
        isLastQuestion,
        visitedQuestions
    ])

    /**
     * Reset navigation state
     */
    const resetNavigation = useCallback(() => {
        console.log('🔄 Resetting navigation state')
        setCurrentQuestionIndex(0)
        setVisitedQuestions(new Set([0]))
    }, [])

    /**
     * Bulk update visited questions (for restoration)
     */
    const setVisitedQuestionsBulk = useCallback((questionIndices) => {
        if (!Array.isArray(questionIndices)) {
            console.warn('⚠️ setVisitedQuestionsBulk requires an array')
            return
        }

        console.log('📦 Bulk setting visited questions:', questionIndices)
        setVisitedQuestions(new Set(questionIndices))
    }, [])

    // Debug current state
    console.log('🐛 useQuizNavigation state:', {
        currentQuestionIndex,
        totalQuestions,
        progressPercentage,
        completionPercentage,
        answeredCount,
        visitedCount,
        canGoNext,
        canGoPrevious
    })

    return {
        // State
        currentQuestionIndex,
        visitedQuestions,

        // Navigation actions
        goToQuestion,
        nextQuestion,
        previousQuestion,
        goToFirstUnanswered,
        resetNavigation,
        setVisitedQuestionsBulk,

        // Status getters
        getQuestionStatus,
        getNavigationSummary,

        // Computed values
        canGoNext,
        canGoPrevious,
        isFirstQuestion,
        isLastQuestion,
        progressPercentage,
        completionPercentage,
        answeredCount,
        visitedCount,
        totalQuestions
    }
}