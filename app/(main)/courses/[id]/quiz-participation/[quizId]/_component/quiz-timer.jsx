"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Clock, AlertTriangle, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function QuizTimer({
                                      initialTime,
                                      onTimeUp,
                                      paused = false,
                                      warningThreshold = 300, // 5 minutes
                                      criticalThreshold = 120, // 2 minutes
                                      onTimeUpdate = () => {} // Optional callback for parent components
                                  }) {
    const [timeRemaining, setTimeRemaining] = useState(initialTime)
    const [isPaused, setIsPaused] = useState(paused)
    const intervalRef = useRef(null)
    const lastSyncRef = useRef(Date.now())
    const pauseStartTimeRef = useRef(null)
    const lastUpdateTimeRef = useRef(Date.now())

    // Handle pause/resume state changes from parent
    useEffect(() => {
        if (paused !== isPaused) {
            if (paused) {
                // Pausing - record when pause started
                pauseStartTimeRef.current = Date.now()
                setIsPaused(true)
                console.log("⏸️ Timer paused")
            } else {
                // Resuming - compensate for any time drift
                if (pauseStartTimeRef.current) {
                    const pauseDuration = Date.now() - pauseStartTimeRef.current
                    console.log(`▶️ Timer resumed after ${Math.floor(pauseDuration / 1000)}s pause`)
                    pauseStartTimeRef.current = null
                }
                setIsPaused(false)
                lastUpdateTimeRef.current = Date.now()
            }
        }
    }, [paused, isPaused])

    // Enhanced timer logic with drift compensation
    useEffect(() => {
        if (isPaused || timeRemaining <= 0) {
            // Clear interval if paused or time is up
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            return
        }

        // Start/restart timer
        intervalRef.current = setInterval(() => {
            const now = Date.now()
            const timeSinceLastUpdate = now - lastUpdateTimeRef.current

            // Compensate for any drift (should be close to 1000ms)
            const adjustment = timeSinceLastUpdate > 1200 ? 1 : 0 // Add extra second if significant drift

            setTimeRemaining((prev) => {
                const newTime = Math.max(0, prev - 1 - adjustment)
                lastUpdateTimeRef.current = now

                // Call parent callback
                onTimeUpdate(newTime)

                // Enhanced server sync logic
                if (now - lastSyncRef.current > 30000) { // Every 30 seconds
                    console.log(`🔄 Syncing timer: ${newTime}s remaining`)
                    // TODO: Replace with actual server action
                    // await syncQuizTimer({ timeRemaining: newTime })
                    lastSyncRef.current = now
                }

                // Check if time is up
                if (newTime <= 0) {
                    console.log("⏰ Time's up!")
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current)
                        intervalRef.current = null
                    }
                    // Small delay to ensure UI updates before triggering callback
                    setTimeout(() => onTimeUp(), 100)
                    return 0
                }

                return newTime
            })
        }, 1000)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [isPaused, timeRemaining, onTimeUp, onTimeUpdate])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [])

    // Enhanced time formatting with context awareness
    const formatTime = useCallback((seconds) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
        }
        return `${minutes}:${secs.toString().padStart(2, "0")}`
    }, [])

    // Enhanced timer status with multiple warning levels
    const getTimerStatus = useCallback(() => {
        if (isPaused) {
            return {
                variant: "secondary",
                text: "PAUSED",
                icon: Clock,
                className: "animate-pulse"
            }
        }

        if (timeRemaining <= 0) {
            return {
                variant: "destructive",
                text: "TIME UP",
                icon: AlertTriangle,
                className: "animate-bounce"
            }
        }

        if (timeRemaining <= criticalThreshold) {
            return {
                variant: "destructive",
                text: "CRITICAL",
                icon: Zap,
                className: "animate-pulse"
            }
        }

        if (timeRemaining <= warningThreshold) {
            return {
                variant: "secondary",
                text: "WARNING",
                icon: AlertTriangle,
                className: ""
            }
        }

        return {
            variant: "default",
            text: "NORMAL",
            icon: Clock,
            className: ""
        }
    }, [timeRemaining, isPaused, warningThreshold, criticalThreshold])

    // Get display color based on time remaining
    const getDisplayColor = useCallback(() => {
        if (isPaused) return "text-muted-foreground"
        if (timeRemaining <= criticalThreshold) return "text-destructive"
        if (timeRemaining <= warningThreshold) return "text-secondary-foreground"
        return "text-foreground"
    }, [timeRemaining, isPaused, warningThreshold, criticalThreshold])

    const timerStatus = getTimerStatus()
    const displayColor = getDisplayColor()

    return (
        <div className="flex items-center gap-3">
            {/* Main Timer Display */}
            <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg">
                <timerStatus.icon className={`h-4 w-4 ${displayColor} ${timerStatus.className}`} />
                <span className={`font-mono text-lg font-bold ${displayColor}`}>
                    {formatTime(timeRemaining)}
                </span>
            </div>

            {/* Status Badge */}
            <Badge
                variant={timerStatus.variant}
                className={`px-3 py-1 font-medium ${timerStatus.className}`}
            >
                {timerStatus.text}
            </Badge>

            {/* Additional Context for Low Time */}
            {timeRemaining <= warningThreshold && timeRemaining > 0 && (
                <div className="text-xs text-muted-foreground">
                    {timeRemaining <= criticalThreshold
                        ? "Quiz will auto-submit when timer expires!"
                        : "Time running low - prepare to submit soon"
                    }
                </div>
            )}
        </div>
    )
}