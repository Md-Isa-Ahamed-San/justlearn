import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * useQuizTimer - Timer management with pause/resume functionality
 * Handles: countdown, pause/resume, time warnings, time-up events
 * Estimated line reduction: ~40 lines from main component
 */
export const useQuizTimer = (initialTimeInSeconds, isPaused = false, onTimeUp) => {
    const [timeRemaining, setTimeRemaining] = useState(initialTimeInSeconds)
    const [isWarningTime, setIsWarningTime] = useState(false)
    const [isCriticalTime, setIsCriticalTime] = useState(false)
    const [timerActive, setTimerActive] = useState(true)

    const intervalRef = useRef(null)
    const warningThreshold = useRef(300) // 5 minutes default
    const criticalThreshold = useRef(120) // 2 minutes default
    const lastTickTime = useRef(Date.now())

    // Configure warning thresholds
    const setWarningThresholds = useCallback((warning = 300, critical = 120) => {
        warningThreshold.current = warning
        criticalThreshold.current = critical
    }, [])

    // Format time for display (MM:SS or HH:MM:SS)
    const formatTime = useCallback((seconds) => {
        if (seconds < 0) return "00:00"

        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const remainingSeconds = seconds % 60

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
        }

        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }, [])

    // Update warning states based on time remaining
    const updateWarningStates = useCallback((time) => {
        const wasWarning = isWarningTime
        const wasCritical = isCriticalTime

        const newIsWarning = time <= warningThreshold.current && time > criticalThreshold.current
        const newIsCritical = time <= criticalThreshold.current && time > 0

        setIsWarningTime(newIsWarning)
        setIsCriticalTime(newIsCritical)

        // Log state changes for debugging
        if (!wasWarning && newIsWarning) {
            console.log(`⚠️ Timer entered warning state: ${formatTime(time)} remaining`)
        }
        if (!wasCritical && newIsCritical) {
            console.log(`🚨 Timer entered critical state: ${formatTime(time)} remaining`)
        }
    }, [isWarningTime, isCriticalTime, formatTime])

    // Pause the timer
    const pauseTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
        console.log("⏸️ Timer paused")
    }, [])

    // Resume the timer
    const resumeTimer = useCallback(() => {
        if (!intervalRef.current && timerActive && timeRemaining > 0) {
            lastTickTime.current = Date.now()
            console.log("▶️ Timer resumed")
        }
    }, [timerActive, timeRemaining])

    // Add time to the timer (useful for extensions)
    const addTime = useCallback((secondsToAdd) => {
        setTimeRemaining(prev => {
            const newTime = prev + secondsToAdd
            console.log(`➕ Added ${secondsToAdd}s to timer. New time: ${formatTime(newTime)}`)
            return newTime
        })
    }, [formatTime])

    // Deduct time from the timer (useful for penalties)
    const deductTime = useCallback((secondsToDeduct) => {
        setTimeRemaining(prev => {
            const newTime = Math.max(0, prev - secondsToDeduct)
            console.log(`➖ Deducted ${secondsToDeduct}s from timer. New time: ${formatTime(newTime)}`)
            return newTime
        })
    }, [formatTime])

    // Reset timer to initial time
    const resetTimer = useCallback((newInitialTime = initialTimeInSeconds) => {
        setTimeRemaining(newInitialTime)
        setIsWarningTime(false)
        setIsCriticalTime(false)
        setTimerActive(true)
        lastTickTime.current = Date.now()
        console.log(`🔄 Timer reset to ${formatTime(newInitialTime)}`)
    }, [initialTimeInSeconds, formatTime])

    // Stop the timer completely
    const stopTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
        setTimerActive(false)
        console.log("⏹️ Timer stopped")
    }, [])

    // Get timer status information
    const getTimerStatus = useCallback(() => {
        return {
            timeRemaining,
            formattedTime: formatTime(timeRemaining),
            isWarning: isWarningTime,
            isCritical: isCriticalTime,
            isPaused: isPaused,
            isActive: timerActive,
            progress: initialTimeInSeconds > 0 ? ((initialTimeInSeconds - timeRemaining) / initialTimeInSeconds) * 100 : 0
        }
    }, [timeRemaining, formatTime, isWarningTime, isCriticalTime, isPaused, timerActive, initialTimeInSeconds])

    // Main timer effect
    useEffect(() => {
        // Don't start timer if paused, inactive, or time is up
        if (isPaused || !timerActive || timeRemaining <= 0) {
            pauseTimer()
            return
        }

        // Start the timer interval
        intervalRef.current = setInterval(() => {
            const now = Date.now()
            const elapsed = Math.floor((now - lastTickTime.current) / 1000)

            // Only update if at least 1 second has passed
            if (elapsed >= 1) {
                lastTickTime.current = now
                setTimeRemaining(prev => {
                    const newTime = Math.max(0, prev - elapsed)
                    updateWarningStates(newTime)

                    // Check if time is up
                    if (newTime <= 0 && prev > 0) {
                        console.log("⏰ Time's up!")
                        setTimerActive(false)
                        if (onTimeUp) {
                            onTimeUp()
                        }
                    }

                    return newTime
                })
            }
        }, 1000)

        // Update last tick time when starting
        lastTickTime.current = Date.now()

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [isPaused, timerActive, timeRemaining, onTimeUp, updateWarningStates, pauseTimer])

    // Handle external time updates (useful for offline recovery)
    const setTime = useCallback((newTime) => {
        const clampedTime = Math.max(0, newTime)
        setTimeRemaining(clampedTime)
        updateWarningStates(clampedTime)
        lastTickTime.current = Date.now()

        if (clampedTime <= 0) {
            setTimerActive(false)
            if (onTimeUp) {
                onTimeUp()
            }
        }
    }, [updateWarningStates, onTimeUp])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [])

    return {
        // State
        timeRemaining,
        isWarningTime,
        isCriticalTime,
        isActive: timerActive,

        // Actions
        pauseTimer,
        resumeTimer,
        addTime,
        deductTime,
        resetTimer,
        stopTimer,
        setTime,
        setWarningThresholds,

        // Utilities
        formatTime: formatTime(timeRemaining),
        getTimerStatus,

        // Raw formatter for custom times
        formatTimeRaw: formatTime
    }
}