import { useState, useCallback, useRef } from 'react'

/**
 * Custom hook for managing quiz answers
 * Handles answer state, validation, and persistence
 */
export function useAnswerManagement(questions = []) {
    // Debug logging
    console.log('🐛 useAnswerManagement called with questions:', questions)

    // Validate questions parameter
    if (!Array.isArray(questions)) {
        console.error('❌ useAnswerManagement: questions must be an array, received:', typeof questions)
        questions = []
    }

    // Initialize answers state - object with questionId as key
    const [answers, setAnswers] = useState({})
    const [isValidated, setIsValidated] = useState(false)
    const answersRef = useRef(answers)

    // Keep ref in sync with state for callbacks
    answersRef.current = answers

    /**
     * Update a single answer
     */
    const updateAnswer = useCallback((questionId, answer, type = 'single') => {
        if (!questionId) {
            console.warn('⚠️ updateAnswer called without questionId')
            return
        }

        console.log('📝 Updating answer:', { questionId, answer, type })

        setAnswers(prev => {
            const newAnswers = {
                ...prev,
                [questionId]: {
                    answer,
                    type,
                    timestamp: new Date().toISOString(),
                    // Store additional metadata
                    questionType: questions.find(q => q.id === questionId)?.type || 'unknown'
                }
            }

            console.log('📝 New answers state:', newAnswers)
            return newAnswers
        })

        // Reset validation when answers change
        setIsValidated(false)
    }, [questions])

    /**
     * Update multiple answers at once (for bulk operations)
     */
    const bulkUpdateAnswers = useCallback((newAnswers) => {
        if (!newAnswers || typeof newAnswers !== 'object') {
            console.warn('⚠️ bulkUpdateAnswers called with invalid data:', newAnswers)
            return
        }

        console.log('📦 Bulk updating answers:', newAnswers)

        setAnswers(prev => {
            const merged = { ...prev, ...newAnswers }
            console.log('📦 Merged answers:', merged)
            return merged
        })

        setIsValidated(false)
    }, [])

    /**
     * Clear a specific answer
     */
    const clearAnswer = useCallback((questionId) => {
        if (!questionId) return

        console.log('🗑️ Clearing answer for question:', questionId)

        setAnswers(prev => {
            const newAnswers = { ...prev }
            delete newAnswers[questionId]
            return newAnswers
        })

        setIsValidated(false)
    }, [])

    /**
     * Clear all answers
     */
    const clearAllAnswers = useCallback(() => {
        console.log('🗑️ Clearing all answers')
        setAnswers({})
        setIsValidated(false)
    }, [])

    /**
     * Get answer for a specific question
     */
    const getAnswer = useCallback((questionId) => {
        return answers[questionId] || null
    }, [answers])

    /**
     * Check if a question is answered
     */
    const isQuestionAnswered = useCallback((questionId) => {
        const answer = answers[questionId]
        if (!answer) return false

        // Check based on answer type
        if (Array.isArray(answer.answer)) {
            return answer.answer.length > 0
        }

        if (typeof answer.answer === 'string') {
            return answer.answer.trim().length > 0
        }

        return answer.answer !== null && answer.answer !== undefined
    }, [answers])

    /**
     * Get answered questions count
     */
    const getAnsweredCount = useCallback(() => {
        return questions.filter(q => isQuestionAnswered(q.id)).length
    }, [questions, isQuestionAnswered])

    /**
     * Get unanswered questions
     */
    const getUnansweredQuestions = useCallback(() => {
        return questions.filter(q => !isQuestionAnswered(q.id))
    }, [questions, isQuestionAnswered])

    /**
     * Validate all answers
     */
    const validateAnswers = useCallback(() => {
        console.log('✅ Validating all answers')

        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
            answeredCount: 0,
            totalCount: questions.length
        }

        questions.forEach(question => {
            const isAnswered = isQuestionAnswered(question.id)

            if (isAnswered) {
                validation.answeredCount++
            } else {
                validation.warnings.push({
                    questionId: question.id,
                    message: `Question ${question.order + 1} is not answered`
                })
            }

            // Additional validation based on question type
            if (isAnswered) {
                const answer = answers[question.id]

                // Validate MCQ answers
                if (question.type === 'mcq' && !answer.answer) {
                    validation.errors.push({
                        questionId: question.id,
                        message: `Question ${question.order + 1} requires a selection`
                    })
                    validation.isValid = false
                }

                // Validate text answers (minimum length)
                if ((question.type === 'short_answer' || question.type === 'long_answer') &&
                    typeof answer.answer === 'string' &&
                    answer.answer.trim().length < 3) {
                    validation.warnings.push({
                        questionId: question.id,
                        message: `Question ${question.order + 1} has a very short answer`
                    })
                }
            }
        })

        setIsValidated(true)
        console.log('✅ Validation result:', validation)
        return validation
    }, [questions, answers, isQuestionAnswered])

    /**
     * Get completion percentage
     */
    const getCompletionPercentage = useCallback(() => {
        if (questions.length === 0) return 0
        return Math.round((getAnsweredCount() / questions.length) * 100)
    }, [questions.length, getAnsweredCount])

    /**
     * Export answers for submission
     */
    const exportAnswers = useCallback(() => {
        const exportData = {
            answers: { ...answers },
            metadata: {
                totalQuestions: questions.length,
                answeredQuestions: getAnsweredCount(),
                completionPercentage: getCompletionPercentage(),
                exportedAt: new Date().toISOString()
            }
        }

        console.log('📤 Exporting answers:', exportData)
        return exportData
    }, [answers, questions.length, getAnsweredCount, getCompletionPercentage])

    /**
     * Import answers (for recovery/restoration)
     */
    const importAnswers = useCallback((importData) => {
        if (!importData || !importData.answers) {
            console.warn('⚠️ Invalid import data:', importData)
            return false
        }

        console.log('📥 Importing answers:', importData)

        try {
            setAnswers(importData.answers)
            setIsValidated(false)
            return true
        } catch (error) {
            console.error('❌ Failed to import answers:', error)
            return false
        }
    }, [])

    // Debug current state
    console.log('🐛 useAnswerManagement state:', {
        answers,
        answeredCount: getAnsweredCount(),
        totalQuestions: questions.length,
        completionPercentage: getCompletionPercentage()
    })

    return {
        // State
        answers,
        isValidated,

        // Actions
        updateAnswer,
        bulkUpdateAnswers,
        clearAnswer,
        clearAllAnswers,

        // Getters
        getAnswer,
        isQuestionAnswered,
        getAnsweredCount,
        getUnansweredQuestions,
        getCompletionPercentage,

        // Validation
        validateAnswers,

        // Import/Export
        exportAnswers,
        importAnswers,

        // Computed values
        answeredCount: getAnsweredCount(),
        totalCount: questions.length,
        completionPercentage: getCompletionPercentage(),
        hasAnswers: Object.keys(answers).length > 0
    }
}