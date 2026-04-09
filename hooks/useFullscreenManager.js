import { useState, useEffect, useRef, useCallback } from 'react'

export const useFullscreenManager = (onViolation) => {
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isSupported, setIsSupported] = useState(true)
    const containerRef = useRef(null)
    const fullscreenAttempted = useRef(false)
    const wasIntentionalExit = useRef(false)

    // Check fullscreen API support across browsers
    const checkSupport = useCallback(() => {
        const supported = !!(
            document.fullscreenEnabled ||
            document.webkitFullscreenEnabled ||
            document.mozFullScreenEnabled ||
            document.msFullscreenEnabled
        )

        setIsSupported(supported)

        if (!supported) {
            console.warn("🚫 Fullscreen API not supported in this browser")
        }

        return supported
    }, [])

    // Attempt to enter fullscreen mode
    const attemptFullscreen = useCallback(async () => {
        if (fullscreenAttempted.current || !isSupported) {
            return { success: false, reason: 'already_attempted_or_unsupported' }
        }

        fullscreenAttempted.current = true

        try {
            const element = containerRef.current
            if (!element) {
                console.warn("⚠️ Quiz container not found for fullscreen")
                return { success: false, reason: 'no_container' }
            }

            // Check if already in fullscreen
            if (document.fullscreenElement || document.webkitFullscreenElement ||
                document.mozFullScreenElement || document.msFullscreenElement) {
                setIsFullscreen(true)
                return { success: true, reason: 'already_fullscreen' }
            }

            // Try different fullscreen methods based on browser support
            if (element.requestFullscreen) {
                await element.requestFullscreen()
            } else if (element.webkitRequestFullscreen) {
                await element.webkitRequestFullscreen()
            } else if (element.mozRequestFullScreen) {
                await element.mozRequestFullScreen()
            } else if (element.msRequestFullscreen) {
                await element.msRequestFullscreen()
            } else {
                throw new Error("No fullscreen method available")
            }

            console.log("✅ Successfully entered fullscreen mode")
            return { success: true, reason: 'entered_successfully' }

        } catch (error) {
            console.error("❌ Failed to enter fullscreen:", error)

            let errorReason = 'unknown_error'
            let userMessage = "Fullscreen unavailable. Enhanced monitoring is active."

            // Handle different types of errors
            if (error.name === 'NotAllowedError') {
                errorReason = 'permission_denied'
                userMessage = "Fullscreen blocked by browser. Please allow fullscreen and refresh to take quiz in secure mode."
            } else if (error.name === 'TypeError' && error.message.includes('Permissions')) {
                errorReason = 'permissions_error'
                userMessage = "Browser permissions prevent fullscreen. Quiz will continue in normal mode."
            }

            setIsFullscreen(false)

            return {
                success: false,
                reason: errorReason,
                message: userMessage,
                error: error.message
            }
        }
    }, [isSupported])

    // Exit fullscreen mode programmatically
    const exitFullscreen = useCallback(async () => {
        if (!isFullscreen) return { success: true, reason: 'not_in_fullscreen' }

        wasIntentionalExit.current = true

        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen()
            } else if (document.webkitExitFullscreen) {
                await document.webkitExitFullscreen()
            } else if (document.mozCancelFullScreen) {
                await document.mozCancelFullScreen()
            } else if (document.msExitFullscreen) {
                await document.msExitFullscreen()
            }

            console.log("✅ Successfully exited fullscreen mode")
            return { success: true, reason: 'exited_successfully' }

        } catch (error) {
            console.error("❌ Failed to exit fullscreen:", error)
            return { success: false, reason: 'exit_failed', error: error.message }
        }
    }, [isFullscreen])

    // Get current fullscreen status from DOM
    const getCurrentFullscreenStatus = useCallback(() => {
        return !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        )
    }, [])

    // Handle fullscreen change events
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = getCurrentFullscreenStatus()
            setIsFullscreen(isCurrentlyFullscreen)

            // Only trigger violation if:
            // 1. We exited fullscreen
            // 2. Fullscreen was attempted and supported
            // 3. It wasn't an intentional exit
            // 4. We have a violation handler
            if (!isCurrentlyFullscreen &&
                fullscreenAttempted.current &&
                isSupported &&
                !wasIntentionalExit.current &&
                onViolation) {

                // Give a brief moment to check if this was system-caused
                setTimeout(() => {
                    if (!getCurrentFullscreenStatus() && !wasIntentionalExit.current) {
                        console.log("🚨 Unintentional fullscreen exit detected")
                        onViolation("fullscreen_exit", "Exited fullscreen mode - Auto-submitting quiz")
                    }
                }, 1000)
            }

            // Reset intentional exit flag after handling
            if (!isCurrentlyFullscreen) {
                setTimeout(() => {
                    wasIntentionalExit.current = false
                }, 2000)
            }
        }

        // Add event listeners for different browsers
        const events = [
            'fullscreenchange',
            'webkitfullscreenchange',
            'mozfullscreenchange',
            'MSFullscreenChange'
        ]

        events.forEach(event => {
            document.addEventListener(event, handleFullscreenChange)
        })

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleFullscreenChange)
            })
        }
    }, [isSupported, onViolation, getCurrentFullscreenStatus])

    // Initialize fullscreen support check and attempt entry
    useEffect(() => {
        const supported = checkSupport()

        if (supported) {
            // Small delay to ensure DOM is ready
            const timer = setTimeout(() => {
                attemptFullscreen().then(result => {
                    if (!result.success) {
                        console.log("🔄 Fullscreen initialization result:", result)
                    }
                })
            }, 500)

            return () => clearTimeout(timer)
        }
    }, [checkSupport, attemptFullscreen])

    // Get fullscreen status with detailed information
    const getFullscreenStatus = useCallback(() => {
        if (!isSupported) {
            return {
                status: 'unsupported',
                secure: false,
                message: 'Fullscreen not supported in this browser'
            }
        }

        if (!fullscreenAttempted.current) {
            return {
                status: 'initializing',
                secure: false,
                message: 'Initializing fullscreen mode...'
            }
        }

        if (isFullscreen) {
            return {
                status: 'active',
                secure: true,
                message: 'Secure fullscreen mode active'
            }
        }

        return {
            status: 'compromised',
            secure: false,
            message: 'Fullscreen mode disabled - security compromised'
        }
    }, [isSupported, isFullscreen])

    // Reset fullscreen attempt flag (useful for retries)
    const resetAttemptFlag = useCallback(() => {
        fullscreenAttempted.current = false
    }, [])

    return {
        // State
        isFullscreen,
        isSupported,
        containerRef,

        // Actions
        attemptFullscreen,
        exitFullscreen,
        resetAttemptFlag,

        // Status
        getFullscreenStatus,
        getCurrentFullscreenStatus,

        // Flags
        hasAttempted: fullscreenAttempted.current
    }
}