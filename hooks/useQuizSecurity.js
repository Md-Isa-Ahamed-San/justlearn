import { useState, useEffect, useCallback, useMemo } from 'react'

/**
 * useQuizSecurity - Combined security monitoring and status
 * Handles: violation + fullscreen + anti-cheat status aggregation
 * Estimated line reduction: ~40 lines from main component
 */
export const useQuizSecurity = ({
                                    violations,
                                    fullscreen,
                                    offline,
                                    quiz
                                }) => {
    const [securityStatus, setSecurityStatus] = useState('secure') // secure, warning, critical
    const [securityMessages, setSecurityMessages] = useState([])
    const [lastSecurityCheck, setLastSecurityCheck] = useState(null)

    // Calculate overall security level
    const overallSecurityLevel = useMemo(() => {
        if (!quiz?.enableAntiCheating) return 'disabled'

        const criticalViolations = violations.totalViolations >= (quiz.maxViolationsAllowed || 3)
        const fullscreenExit = fullscreen.hasExited && quiz.enableFullscreen
        const offlineMode = offline.isOffline

        if (criticalViolations) return 'critical'
        if (fullscreenExit || violations.totalViolations > 0) return 'warning'
        if (offlineMode) return 'offline'

        return 'secure'
    }, [violations.totalViolations, fullscreen.hasExited, offline.isOffline, quiz])

    // Generate security messages
    const generateSecurityMessages = useCallback(() => {
        const messages = []

        // Violation messages
        if (violations.totalViolations > 0) {
            const remaining = (quiz.maxViolationsAllowed || 3) - violations.totalViolations
            if (remaining > 0) {
                messages.push({
                    type: 'warning',
                    message: `⚠️ ${violations.totalViolations} violation(s) detected. ${remaining} remaining before auto-submission.`,
                    timestamp: new Date()
                })
            } else {
                messages.push({
                    type: 'critical',
                    message: '🚨 Maximum violations exceeded. Quiz will be auto-submitted.',
                    timestamp: new Date()
                })
            }
        }

        // Fullscreen messages
        if (fullscreen.hasExited && quiz.enableFullscreen) {
            messages.push({
                type: 'warning',
                message: '📺 Please return to fullscreen mode to continue.',
                timestamp: new Date()
            })
        }

        // Offline messages
        if (offline.isOffline) {
            messages.push({
                type: 'info',
                message: '📡 You are currently offline. Answers are being saved locally.',
                timestamp: new Date()
            })
        }

        // Timer warnings
        if (violations.tabSwitchCount > 0) {
            messages.push({
                type: 'warning',
                message: `🔄 Tab switching detected (${violations.tabSwitchCount} times). Avoid switching tabs.`,
                timestamp: new Date()
            })
        }

        if (violations.minimizeCount > 0) {
            messages.push({
                type: 'warning',
                message: `🪟 Window minimizing detected (${violations.minimizeCount} times). Keep window visible.`,
                timestamp: new Date()
            })
        }

        return messages
    }, [violations, fullscreen, offline, quiz])

    // Update security status and messages
    useEffect(() => {
        const newStatus = overallSecurityLevel === 'critical' ? 'critical' :
            overallSecurityLevel === 'warning' ? 'warning' : 'secure'

        setSecurityStatus(newStatus)
        setSecurityMessages(generateSecurityMessages())
        setLastSecurityCheck(new Date())
    }, [overallSecurityLevel, generateSecurityMessages])

    // Check if quiz should be auto-submitted due to security violations
    const shouldAutoSubmit = useMemo(() => {
        if (!quiz?.autoSubmitOnViolation) return false

        return violations.totalViolations >= (quiz.maxViolationsAllowed || 3)
    }, [violations.totalViolations, quiz])

    // Get security summary for display
    const getSecuritySummary = useCallback(() => {
        return {
            level: overallSecurityLevel,
            status: securityStatus,
            violationCount: violations.totalViolations,
            maxViolations: quiz.maxViolationsAllowed || 3,
            remainingViolations: Math.max(0, (quiz.maxViolationsAllowed || 3) - violations.totalViolations),
            isFullscreen: fullscreen.isActive,
            isOnline: !offline.isOffline,
            shouldAutoSubmit,
            messages: securityMessages
        }
    }, [overallSecurityLevel, securityStatus, violations, quiz, fullscreen, offline, shouldAutoSubmit, securityMessages])

    // Get security indicator color for UI
    const getSecurityColor = useCallback(() => {
        switch (securityStatus) {
            case 'critical': return 'text-red-500'
            case 'warning': return 'text-yellow-500'
            case 'secure': return 'text-green-500'
            default: return 'text-gray-500'
        }
    }, [securityStatus])

    // Get security icon for UI
    const getSecurityIcon = useCallback(() => {
        switch (securityStatus) {
            case 'critical': return '🚨'
            case 'warning': return '⚠️'
            case 'secure': return '🔒'
            default: return '❓'
        }
    }, [securityStatus])

    // Check if specific security features are active
    const isSecurityFeatureActive = useCallback((feature) => {
        switch (feature) {
            case 'fullscreen':
                return quiz?.enableFullscreen && fullscreen.isActive
            case 'antiCheat':
                return quiz?.enableAntiCheating
            case 'offline':
                return offline.isOffline
            case 'violations':
                return violations.totalViolations > 0
            default:
                return false
        }
    }, [quiz, fullscreen, offline, violations])

    // Reset security warnings (for testing or special cases)
    const resetSecurityWarnings = useCallback(() => {
        setSecurityMessages([])
        setLastSecurityCheck(new Date())
    }, [])

    return {
        // Status
        securityStatus,
        overallSecurityLevel,
        securityMessages,
        lastSecurityCheck,
        shouldAutoSubmit,

        // Computed values
        getSecuritySummary,
        getSecurityColor,
        getSecurityIcon,
        isSecurityFeatureActive,

        // Actions
        resetSecurityWarnings,

        // Raw data access
        violations: violations.totalViolations,
        maxViolations: quiz.maxViolationsAllowed || 3,
        remainingViolations: Math.max(0, (quiz.maxViolationsAllowed || 3) - violations.totalViolations),
        isFullscreenActive: fullscreen.isActive,
        hasExitedFullscreen: fullscreen.hasExited,
        isOffline: offline.isOffline
    }
}