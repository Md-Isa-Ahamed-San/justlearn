/**
 * useOfflineHandling - Enhanced offline/online state management
 * Handles: network detection, offline time tracking, auto-submit logic, localStorage persistence
 * Impact: ~200 lines removed from main component
 */

import { useCallback, useRef, useEffect } from 'react'

export const useOfflineHandling = (quiz, currentUser, quizState, timeRemaining, currentQuestionIndex) => {
    const offlineTimeoutRef = useRef(null)
    const offlineTrackingIntervalRef = useRef(null)
    const hasAutoSubmittedRef = useRef(false)

    // Store current quiz state for offline recovery
    const storeOfflineState = useCallback((offlineStartTime, disconnectionCount) => {
        const offlineQuizState = {
            quizId: quiz.id,
            userId: currentUser.id,
            answers: quizState.state.answers,
            violations: quizState.state.violations,
            timeRemaining,
            currentQuestionIndex,
            offlineStartTime,
            disconnectionCount,
            totalOfflineTime: quizState.state.totalOfflineTime,
            timestamp: new Date().toISOString()
        }

        try {
            localStorage.setItem(`quiz_${quiz.id}_offline_state`, JSON.stringify(offlineQuizState))
            console.log("📱 Offline state stored in localStorage")
            return true
        } catch (error) {
            console.error("❌ Failed to store offline state:", error)
            return false
        }
    }, [quiz.id, currentUser.id, quizState.state.answers, quizState.state.violations,
        timeRemaining, currentQuestionIndex, quizState.state.totalOfflineTime])

    // Recover quiz state from localStorage
    const recoverOfflineState = useCallback(() => {
        try {
            const storedState = localStorage.getItem(`quiz_${quiz.id}_offline_state`)
            if (!storedState) return null

            const offlineData = JSON.parse(storedState)

            // Validate recovery data
            if (offlineData.userId === currentUser.id && offlineData.quizId === quiz.id) {
                console.log("🔄 Valid offline state found for recovery")
                return offlineData
            }

            console.log("❌ Invalid offline state data, cleaning up")
            localStorage.removeItem(`quiz_${quiz.id}_offline_state`)
            return null
        } catch (error) {
            console.error("❌ Failed to recover offline state:", error)
            return null
        }
    }, [quiz.id, currentUser.id])

    // Handle going offline
    const handleOffline = useCallback(() => {
        if (quizState.state.isOffline || hasAutoSubmittedRef.current) return

        const offlineStartTime = Date.now()
        const newDisconnectionCount = quizState.state.disconnectionCount + 1

        console.log(`🔴 User went offline - Disconnection #${newDisconnectionCount}`)

        // Update state
        quizState.dispatch({
            type: 'SET_OFFLINE_STATE',
            payload: {
                isOffline: true,
                offlineStartTime,
                disconnectionCount: newDisconnectionCount,
                shouldAutoSubmitOnReconnect: false
            }
        })

        // Store offline state
        storeOfflineState(offlineStartTime, newDisconnectionCount)

        // Start offline time tracking
        offlineTrackingIntervalRef.current = setInterval(() => {
            const currentOfflineTime = Date.now() - offlineStartTime
            const updatedState = {
                quizId: quiz.id,
                userId: currentUser.id,
                answers: quizState.state.answers,
                violations: quizState.state.violations,
                timeRemaining,
                currentQuestionIndex,
                offlineStartTime,
                disconnectionCount: newDisconnectionCount,
                totalOfflineTime: quizState.state.totalOfflineTime,
                currentOfflineTime,
                lastUpdate: new Date().toISOString()
            }

            try {
                localStorage.setItem(`quiz_${quiz.id}_offline_state`, JSON.stringify(updatedState))
            } catch (error) {
                console.error("❌ Failed to update offline tracking:", error)
            }
        }, 1000)

        // Handle disconnection logic
        if (newDisconnectionCount === 1) {
            // First disconnection: 30-second grace period
            quizState.showWarning("⚠️ Connection lost. Reconnect within 30 seconds to avoid auto-submission.")

            offlineTimeoutRef.current = setTimeout(() => {
                console.log("⏰ 30-second grace period expired - marking for auto-submit")

                quizState.dispatch({
                    type: 'MARK_FOR_AUTO_SUBMIT',
                    payload: { reason: "First disconnection exceeded 30 seconds" }
                })

                // Update localStorage with auto-submit flag
                try {
                    const storedState = localStorage.getItem(`quiz_${quiz.id}_offline_state`)
                    if (storedState) {
                        const data = JSON.parse(storedState)
                        data.shouldAutoSubmit = true
                        data.autoSubmitReason = "First disconnection exceeded 30 seconds"
                        localStorage.setItem(`quiz_${quiz.id}_offline_state`, JSON.stringify(data))
                    }
                } catch (error) {
                    console.error("❌ Failed to update auto-submit flag:", error)
                }

                quizState.showWarning("🔥 Grace period expired! Quiz will auto-submit when connection returns.")
            }, 30000)

        } else {
            // Multiple disconnections: immediate auto-submit
            console.log("🚨 Multiple disconnections detected - immediate auto-submit on reconnect")

            quizState.dispatch({
                type: 'MARK_FOR_AUTO_SUBMIT',
                payload: { reason: `Multiple disconnections detected (${newDisconnectionCount} times)` }
            })

            quizState.showWarning(`🚨 Multiple disconnections detected! Quiz will auto-submit immediately when connection returns.`)

            // Update localStorage immediately
            try {
                const storedState = localStorage.getItem(`quiz_${quiz.id}_offline_state`)
                if (storedState) {
                    const data = JSON.parse(storedState)
                    data.shouldAutoSubmit = true
                    data.autoSubmitReason = `Multiple disconnections (${newDisconnectionCount} times)`
                    localStorage.setItem(`quiz_${quiz.id}_offline_state`, JSON.stringify(data))
                }
            } catch (error) {
                console.error("❌ Failed to set immediate auto-submit flag:", error)
            }
        }
    }, [quiz.id, currentUser.id, quizState, storeOfflineState, timeRemaining, currentQuestionIndex])

    // Handle coming back online
    const handleOnline = useCallback((autoSubmitCallback, setTimerPaused, setTimeRemaining) => {
        if (!quizState.state.isOffline || hasAutoSubmittedRef.current) return

        console.log("🟢 Connection restored")

        // Calculate offline duration
        const offlineDuration = quizState.state.offlineStartTime ?
            Date.now() - quizState.state.offlineStartTime : 0
        const offlineSeconds = Math.floor(offlineDuration / 1000)
        const newTotalOfflineTime = quizState.state.totalOfflineTime + offlineDuration

        console.log(`📊 Offline duration: ${offlineSeconds}s, Total: ${Math.floor(newTotalOfflineTime / 1000)}s`)

        // Clear tracking intervals
        if (offlineTrackingIntervalRef.current) {
            clearInterval(offlineTrackingIntervalRef.current)
            offlineTrackingIntervalRef.current = null
        }
        if (offlineTimeoutRef.current) {
            clearTimeout(offlineTimeoutRef.current)
            offlineTimeoutRef.current = null
        }

        // Check for auto-submit conditions
        let shouldAutoSubmit = quizState.state.shouldAutoSubmitOnReconnect
        let autoSubmitReason = quizState.state.autoSubmitReason

        // Check localStorage for auto-submit flag
        try {
            const storedState = localStorage.getItem(`quiz_${quiz.id}_offline_state`)
            if (storedState) {
                const offlineData = JSON.parse(storedState)
                if (offlineData.shouldAutoSubmit) {
                    shouldAutoSubmit = true
                    autoSubmitReason = offlineData.autoSubmitReason || autoSubmitReason
                }
            }
        } catch (error) {
            console.error("❌ Failed to check localStorage for auto-submit:", error)
        }

        if (shouldAutoSubmit) {
            // Auto-submit due to offline conditions
            console.log("🚨 Auto-submitting due to offline conditions:", autoSubmitReason)

            // Add offline violation
            const offlineViolation = {
                type: "network_disconnect_violation",
                timestamp: new Date(),
                duration: offlineDuration,
                disconnectionNumber: quizState.state.disconnectionCount,
                reason: autoSubmitReason,
                totalOfflineTime: newTotalOfflineTime
            }

            quizState.dispatch({ type: 'ADD_VIOLATION', payload: offlineViolation })
            quizState.dispatch({
                type: 'UPDATE_OFFLINE_TRACKING',
                payload: {
                    totalOfflineTime: newTotalOfflineTime,
                    disconnectionCount: quizState.state.disconnectionCount
                }
            })

            // Clean up and submit
            try {
                localStorage.removeItem(`quiz_${quiz.id}_offline_state`)
            } catch (error) {
                console.error("❌ Failed to clean up localStorage:", error)
            }

            autoSubmitCallback(autoSubmitReason)
            return
        }

        // Resume normal operation
        console.log("✅ Resuming normal operation - no auto-submit needed")

        quizState.dispatch({
            type: 'SET_OFFLINE_STATE',
            payload: {
                isOffline: false,
                offlineStartTime: null,
                disconnectionCount: quizState.state.disconnectionCount,
                totalOfflineTime: newTotalOfflineTime,
                shouldAutoSubmitOnReconnect: false,
                autoSubmitReason: ""
            }
        })

        // Resume timer with time deduction
        setTimerPaused(false)
        const timeAfterDeduction = Math.max(0, timeRemaining - offlineSeconds)
        setTimeRemaining(timeAfterDeduction)

        // Clean up stored state
        try {
            localStorage.removeItem(`quiz_${quiz.id}_offline_state`)
        } catch (error) {
            console.error("❌ Failed to clean up localStorage:", error)
        }

        quizState.showWarning(
            `✅ Connection restored! ${offlineSeconds}s deducted. Total offline: ${Math.floor(newTotalOfflineTime / 1000)}s`
        )
    }, [quiz.id, quizState, timeRemaining])

    // Cleanup function
    const cleanup = useCallback(() => {
        if (offlineTimeoutRef.current) {
            clearTimeout(offlineTimeoutRef.current)
            offlineTimeoutRef.current = null
        }
        if (offlineTrackingIntervalRef.current) {
            clearInterval(offlineTrackingIntervalRef.current)
            offlineTrackingIntervalRef.current = null
        }
    }, [])

    // Auto-cleanup on unmount
    useEffect(() => {
        return cleanup
    }, [cleanup])

    return {
        // State
        isOffline: quizState.state.isOffline,
        disconnectionCount: quizState.state.disconnectionCount,
        totalOfflineTime: quizState.state.totalOfflineTime,
        shouldAutoSubmitOnReconnect: quizState.state.shouldAutoSubmitOnReconnect,

        // Actions
        handleOffline,
        handleOnline,
        storeOfflineState,
        recoverOfflineState,
        cleanup,

        // Utilities
        hasAutoSubmitted: hasAutoSubmittedRef.current,
        setHasAutoSubmitted: (value) => { hasAutoSubmittedRef.current = value }
    }
}