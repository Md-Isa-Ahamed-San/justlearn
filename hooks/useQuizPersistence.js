import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * useQuizPersistence - Auto-save and localStorage operations
 * Handles: periodic auto-save, localStorage management, recovery on reload
 * Estimated line reduction: ~80 lines from main component
 */
export const useQuizPersistence = (quizId, userId, isOffline = false) => {
    const [lastSaved, setLastSaved] = useState(null)
    const [isSaving, setIsSaving] = useState(false)
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

    const autoSaveIntervalRef = useRef(null)
    const pendingChangesRef = useRef({})
    const autoSaveInterval = 30000 // 30 seconds

    // Generate storage keys
    const storageKeys = {
        answers: `quiz_answers_${quizId}_${userId}`,
        metadata: `quiz_metadata_${quizId}_${userId}`,
        violations: `quiz_violations_${quizId}_${userId}`,
        progress: `quiz_progress_${quizId}_${userId}`
    }

    // Save data to localStorage
    const saveToLocalStorage = useCallback((key, data) => {
        try {
            const dataToSave = {
                ...data,
                timestamp: new Date().toISOString(),
                version: '1.0'
            }
            localStorage.setItem(key, JSON.stringify(dataToSave))
            console.log(`💾 Saved to localStorage: ${key}`)
            return true
        } catch (error) {
            console.error('❌ Failed to save to localStorage:', error)
            return false
        }
    }, [])

    // Load data from localStorage
    const loadFromLocalStorage = useCallback((key) => {
        try {
            const stored = localStorage.getItem(key)
            if (!stored) return null

            const parsed = JSON.parse(stored)
            console.log(`📂 Loaded from localStorage: ${key}`)
            return parsed
        } catch (error) {
            console.error('❌ Failed to load from localStorage:', error)
            return null
        }
    }, [])

    // Save quiz answers
    const saveAnswers = useCallback(async (answers) => {
        if (isOffline) {
            return saveToLocalStorage(storageKeys.answers, { answers })
        }

        setIsSaving(true)
        try {
            // TODO: Replace with actual server action
            // const response = await fetch('/api/quiz/save-answers', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({ quizId, userId, answers })
            // })

            // Simulate server save
            await new Promise(resolve => setTimeout(resolve, 200))

            // Also save to localStorage as backup
            saveToLocalStorage(storageKeys.answers, { answers })

            setLastSaved(new Date())
            setHasUnsavedChanges(false)
            console.log('✅ Answers saved successfully')
            return true
        } catch (error) {
            console.error('❌ Failed to save answers:', error)
            // Fallback to localStorage
            return saveToLocalStorage(storageKeys.answers, { answers })
        } finally {
            setIsSaving(false)
        }
    }, [quizId, userId, isOffline, storageKeys.answers, saveToLocalStorage])

    // Save quiz metadata (violations, timer state, etc.)
    const saveMetadata = useCallback((metadata) => {
        return saveToLocalStorage(storageKeys.metadata, metadata)
    }, [storageKeys.metadata, saveToLocalStorage])

    // Save violation data
    const saveViolations = useCallback((violations) => {
        return saveToLocalStorage(storageKeys.violations, violations)
    }, [storageKeys.violations, saveToLocalStorage])

    // Save progress data
    const saveProgress = useCallback((progress) => {
        return saveToLocalStorage(storageKeys.progress, progress)
    }, [storageKeys.progress, saveToLocalStorage])

    // Load all saved data
    const loadSavedData = useCallback(() => {
        const savedAnswers = loadFromLocalStorage(storageKeys.answers)
        const savedMetadata = loadFromLocalStorage(storageKeys.metadata)
        const savedViolations = loadFromLocalStorage(storageKeys.violations)
        const savedProgress = loadFromLocalStorage(storageKeys.progress)

        return {
            answers: savedAnswers?.answers || {},
            metadata: savedMetadata || {},
            violations: savedViolations || {},
            progress: savedProgress || {},
            hasRecoveryData: !!(savedAnswers || savedMetadata || savedViolations || savedProgress)
        }
    }, [storageKeys, loadFromLocalStorage])

    // Auto-save functionality
    const scheduleAutoSave = useCallback((data) => {
        if (!autoSaveEnabled) return

        // Store pending changes
        pendingChangesRef.current = { ...pendingChangesRef.current, ...data }
        setHasUnsavedChanges(true)

        // Clear existing timeout
        if (autoSaveIntervalRef.current) {
            clearTimeout(autoSaveIntervalRef.current)
        }

        // Schedule new auto-save
        autoSaveIntervalRef.current = setTimeout(async () => {
            const pendingData = pendingChangesRef.current
            if (Object.keys(pendingData).length === 0) return

            console.log('🔄 Auto-saving pending changes...')

            if (pendingData.answers) {
                await saveAnswers(pendingData.answers)
            }
            if (pendingData.metadata) {
                saveMetadata(pendingData.metadata)
            }
            if (pendingData.violations) {
                saveViolations(pendingData.violations)
            }
            if (pendingData.progress) {
                saveProgress(pendingData.progress)
            }

            // Clear pending changes
            pendingChangesRef.current = {}
        }, autoSaveInterval)
    }, [autoSaveEnabled, autoSaveInterval, saveAnswers, saveMetadata, saveViolations, saveProgress])

    // Clear all saved data
    const clearSavedData = useCallback(() => {
        Object.values(storageKeys).forEach(key => {
            localStorage.removeItem(key)
        })
        console.log('🗑️ Cleared all saved quiz data')
    }, [storageKeys])

    // Force save all pending changes
    const forceSave = useCallback(async (data) => {
        if (autoSaveIntervalRef.current) {
            clearTimeout(autoSaveIntervalRef.current)
        }

        const dataToSave = data || pendingChangesRef.current
        if (dataToSave.answers) {
            await saveAnswers(dataToSave.answers)
        }
        if (dataToSave.metadata) {
            saveMetadata(dataToSave.metadata)
        }
        if (dataToSave.violations) {
            saveViolations(dataToSave.violations)
        }
        if (dataToSave.progress) {
            saveProgress(dataToSave.progress)
        }

        pendingChangesRef.current = {}
        setHasUnsavedChanges(false)
    }, [saveAnswers, saveMetadata, saveViolations, saveProgress])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (autoSaveIntervalRef.current) {
                clearTimeout(autoSaveIntervalRef.current)
            }
        }
    }, [])

    return {
        // State
        lastSaved,
        isSaving,
        hasUnsavedChanges,
        autoSaveEnabled,

        // Configuration
        setAutoSaveEnabled,

        // Save functions
        saveAnswers,
        saveMetadata,
        saveViolations,
        saveProgress,
        scheduleAutoSave,
        forceSave,

        // Load functions
        loadSavedData,
        loadFromLocalStorage,

        // Utilities
        clearSavedData,
        storageKeys
    }
}