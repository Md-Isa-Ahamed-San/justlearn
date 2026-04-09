import React, { useEffect, useRef, useCallback } from 'react'

/**
 * AntiCheatMonitor - Invisible monitoring component
 * Detects various cheating attempts and violations
 * No visual UI - purely functional monitoring
 */
export default function AntiCheatMonitor({
                                             violations,
                                             security,
                                             quiz,
                                             onViolation,
                                             isActive = true,
                                             isFullscreenSupported = true
                                         }) {
    // Refs for tracking state
    const lastActiveTime = useRef(Date.now())
    const tabSwitchCount = useRef(0)
    const copyAttempts = useRef(0)
    const rightClickCount = useRef(0)
    const devToolsWarned = useRef(false)

    // Track visibility changes (tab switching)
    const handleVisibilityChange = useCallback(() => {
        if (!isActive) return

        if (document.hidden) {
            tabSwitchCount.current += 1
            console.log('🔍 Tab switch detected:', tabSwitchCount.current)

            onViolation(
                'tab_switch',
                `Tab switching detected (${tabSwitchCount.current} times)`
            )
        }

        lastActiveTime.current = Date.now()
    }, [isActive, onViolation])

    // Track window blur/focus (window switching)
    const handleWindowBlur = useCallback(() => {
        if (!isActive) return

        console.log('🔍 Window blur detected')
        onViolation('window_minimize', 'Window lost focus or was minimized')
    }, [isActive, onViolation])

    // Detect keyboard shortcuts
    const handleKeyDown = useCallback((event) => {
        if (!isActive) return

        const { ctrlKey, metaKey, altKey, shiftKey, key, keyCode } = event

        // Common cheating key combinations
        const violations = [
            // Developer tools
            { condition: key === 'F12', type: 'developer_tools', message: 'Developer tools attempted (F12)' },
            { condition: ctrlKey && shiftKey && key === 'I', type: 'developer_tools', message: 'Developer tools attempted (Ctrl+Shift+I)' },
            { condition: ctrlKey && shiftKey && key === 'J', type: 'developer_tools', message: 'Developer tools attempted (Ctrl+Shift+J)' },
            { condition: ctrlKey && shiftKey && key === 'C', type: 'developer_tools', message: 'Developer tools attempted (Ctrl+Shift+C)' },
            { condition: ctrlKey && key === 'U', type: 'developer_tools', message: 'View source attempted (Ctrl+U)' },

            // Copy/paste attempts
            { condition: ctrlKey && key === 'c', type: 'copy_paste_attempt', message: 'Copy attempt detected (Ctrl+C)' },
            { condition: ctrlKey && key === 'v', type: 'copy_paste_attempt', message: 'Paste attempt detected (Ctrl+V)' },
            { condition: ctrlKey && key === 'x', type: 'copy_paste_attempt', message: 'Cut attempt detected (Ctrl+X)' },

            // Navigation attempts
            { condition: altKey && key === 'Tab', type: 'keyboard_shortcut', message: 'Alt+Tab detected' },
            { condition: metaKey && key === 'Tab', type: 'keyboard_shortcut', message: 'Cmd+Tab detected' },

            // Page refresh/navigation
            { condition: key === 'F5', type: 'keyboard_shortcut', message: 'Page refresh attempted (F5)' },
            { condition: ctrlKey && key === 'r', type: 'keyboard_shortcut', message: 'Page refresh attempted (Ctrl+R)' },
            { condition: ctrlKey && key === 'w', type: 'keyboard_shortcut', message: 'Close tab attempted (Ctrl+W)' },

            // Search attempts
            { condition: ctrlKey && key === 'f', type: 'keyboard_shortcut', message: 'Find in page attempted (Ctrl+F)' },
            { condition: ctrlKey && key === 'g', type: 'keyboard_shortcut', message: 'Find next attempted (Ctrl+G)' },
        ]

        // Check each violation condition
        violations.forEach(violation => {
            if (violation.condition) {
                event.preventDefault()
                event.stopPropagation()

                console.log('🔍 Keyboard violation:', violation.type, violation.message)
                onViolation(violation.type, violation.message)
            }
        })
    }, [isActive, onViolation])

    // Detect right-click attempts
    const handleContextMenu = useCallback((event) => {
        if (!isActive) return

        event.preventDefault()
        rightClickCount.current += 1

        console.log('🔍 Right-click detected:', rightClickCount.current)
        onViolation('right_click', `Right-click attempted (${rightClickCount.current} times)`)
    }, [isActive, onViolation])

    // Detect copy events
    const handleCopy = useCallback((event) => {
        if (!isActive) return

        event.preventDefault()
        copyAttempts.current += 1

        console.log('🔍 Copy event detected:', copyAttempts.current)
        onViolation('copy_paste_success', `Copy operation blocked (${copyAttempts.current} times)`)
    }, [isActive, onViolation])

    // Detect paste events
    const handlePaste = useCallback((event) => {
        if (!isActive) return

        // Allow paste in input fields for answers, but log it
        const target = event.target
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
            console.log('🔍 Paste allowed in input field')
            return
        }

        event.preventDefault()
        console.log('🔍 Paste event blocked')
        onViolation('copy_paste_attempt', 'Paste attempt in non-input area')
    }, [isActive, onViolation])

    // Detect text selection
    const handleSelectStart = useCallback((event) => {
        if (!isActive) return

        // Allow selection in input fields and answer areas
        const target = event.target
        if (target && (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.closest('[data-answer-area]')
        )) {
            return
        }

        // Log excessive text selection attempts
        const selection = window.getSelection()
        if (selection && selection.toString().length > 50) {
            console.log('🔍 Large text selection detected')
            onViolation('text_selection', 'Large text selection attempted')
        }
    }, [isActive, onViolation])

    // Developer tools detection using console
    const detectDevTools = useCallback(() => {
        if (!isActive || devToolsWarned.current) return

        const startTime = Date.now()

        // This will execute faster when dev tools are open
        console.log('%cAnti-Cheat Monitor Active', 'color: transparent')

        const endTime = Date.now()
        const executionTime = endTime - startTime

        // If console.log takes too long, dev tools might be open
        if (executionTime > 100) {
            devToolsWarned.current = true
            console.log('🔍 Developer tools possibly detected')
            onViolation('developer_tools', 'Developer tools possibly opened')
        }
    }, [isActive, onViolation])

    // Monitor console access attempts
    const setupConsoleProtection = useCallback(() => {
        if (!isActive) return

        // Override console methods to detect usage
        const originalLog = console.log
        const originalError = console.error
        const originalWarn = console.warn

        console.log = function(...args) {
            // Allow our own logs but detect external usage
            const stack = new Error().stack
            if (stack && !stack.includes('AntiCheatMonitor') && !stack.includes('quiz')) {
                onViolation('console_access', 'Console usage detected')
            }
            return originalLog.apply(console, args)
        }

        // Restore on cleanup
        return () => {
            console.log = originalLog
            console.error = originalError
            console.warn = originalWarn
        }
    }, [isActive, onViolation])

    // Monitor window resize (potential fullscreen exit)
    const handleResize = useCallback(() => {
        if (!isActive || !isFullscreenSupported) return

        // Check if we're no longer in fullscreen but should be
        const isCurrentlyFullscreen = !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        )

        if (!isCurrentlyFullscreen && security.wasFullscreen) {
            console.log('🔍 Fullscreen exit detected via resize')
            onViolation('fullscreen_exit', 'Fullscreen mode exited')
        }
    }, [isActive, isFullscreenSupported, security.wasFullscreen, onViolation])

    // Set up all event listeners
    useEffect(() => {
        if (!isActive) return

        // Document events
        document.addEventListener('visibilitychange', handleVisibilityChange)
        document.addEventListener('keydown', handleKeyDown)
        document.addEventListener('contextmenu', handleContextMenu)
        document.addEventListener('copy', handleCopy)
        document.addEventListener('paste', handlePaste)
        document.addEventListener('selectstart', handleSelectStart)

        // Window events
        window.addEventListener('blur', handleWindowBlur)
        window.addEventListener('resize', handleResize)

        // Console protection
        const cleanupConsole = setupConsoleProtection()

        // Developer tools detection interval
        const devToolsInterval = setInterval(detectDevTools, 1000)

        // Cleanup function
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            document.removeEventListener('keydown', handleKeyDown)
            document.removeEventListener('contextmenu', handleContextMenu)
            document.removeEventListener('copy', handleCopy)
            document.removeEventListener('paste', handlePaste)
            document.removeEventListener('selectstart', handleSelectStart)

            window.removeEventListener('blur', handleWindowBlur)
            window.removeEventListener('resize', handleResize)

            if (cleanupConsole) cleanupConsole()
            if (devToolsInterval) clearInterval(devToolsInterval)
        }
    }, [
        isActive,
        handleVisibilityChange,
        handleKeyDown,
        handleContextMenu,
        handleCopy,
        handlePaste,
        handleSelectStart,
        handleWindowBlur,
        handleResize,
        setupConsoleProtection,
        detectDevTools
    ])

    // Monitor inactivity
    useEffect(() => {
        if (!isActive) return

        const checkInactivity = () => {
            const now = Date.now()
            const inactiveTime = now - lastActiveTime.current

            // Warn after 2 minutes of inactivity
            if (inactiveTime > 120000) { // 2 minutes
                console.log('🔍 User inactivity detected:', inactiveTime / 1000, 'seconds')
                onViolation('inactivity', `User inactive for ${Math.floor(inactiveTime / 1000)} seconds`)
                lastActiveTime.current = now // Reset to avoid repeated warnings
            }
        }

        const inactivityInterval = setInterval(checkInactivity, 30000) // Check every 30 seconds

        // Track user activity
        const updateActivity = () => {
            lastActiveTime.current = Date.now()
        }

        document.addEventListener('mousemove', updateActivity)
        document.addEventListener('keypress', updateActivity)
        document.addEventListener('click', updateActivity)

        return () => {
            clearInterval(inactivityInterval)
            document.removeEventListener('mousemove', updateActivity)
            document.removeEventListener('keypress', updateActivity)
            document.removeEventListener('click', updateActivity)
        }
    }, [isActive, onViolation])

    // This component renders nothing - it's purely functional
    return null
}