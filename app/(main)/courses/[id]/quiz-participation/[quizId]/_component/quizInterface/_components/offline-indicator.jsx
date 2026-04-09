import React, { useState, useEffect } from 'react'
import { WifiOff, RefreshCw, AlertTriangle, Clock, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

/**
 * OfflineIndicator - Shows offline status with detailed metrics
 * Displays connection attempts, offline time, and auto-submit warnings
 */
export default function OfflineIndicator({
                                             onRetry,
                                             pendingSync = 0,
                                             disconnectionCount = 0,
                                             totalOfflineTime = 0,
                                             autoSubmitPending = false,
                                             maxDisconnections = 2,
                                             gracePeriodRemainingTime = 30
                                         }) {
    const [isRetrying, setIsRetrying] = useState(false)
    const [localOfflineTime, setLocalOfflineTime] = useState(totalOfflineTime)
    const [gracePeriodRemaining, setGracePeriodRemaining] = useState(gracePeriodRemainingTime)
    const [retryAttempts, setRetryAttempts] = useState(0)
    const [lastRetryTime, setLastRetryTime] = useState(null)

    // Update local offline time counter
    useEffect(() => {
        const timer = setInterval(() => {
            setLocalOfflineTime(prev => prev + 1000)
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    // Grace period countdown for first disconnection
    useEffect(() => {
        if (disconnectionCount === 1 && gracePeriodRemaining > 0 && !autoSubmitPending) {
            const countdown = setInterval(() => {
                setGracePeriodRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(countdown)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)

            return () => clearInterval(countdown)
        }
    }, [disconnectionCount, gracePeriodRemaining, autoSubmitPending])

    // Reset grace period when disconnection count changes
    useEffect(() => {
        if (disconnectionCount === 1) {
            setGracePeriodRemaining(gracePeriodRemainingTime)
        }
    }, [disconnectionCount, gracePeriodRemainingTime])

    // Auto-retry logic for first few attempts
    useEffect(() => {
        if (disconnectionCount === 1 && retryAttempts < 3 && !isRetrying && !autoSubmitPending) {
            const autoRetryDelay = Math.min(2000 * Math.pow(2, retryAttempts), 10000) // Exponential backoff

            const autoRetryTimer = setTimeout(() => {
                handleRetry(true) // true indicates auto-retry
            }, autoRetryDelay)

            return () => clearTimeout(autoRetryTimer)
        }
    }, [disconnectionCount, retryAttempts, isRetrying, autoSubmitPending])

    // Handle retry connection
    const handleRetry = async (isAutoRetry = false) => {
        if (isRetrying) return

        setIsRetrying(true)
        setLastRetryTime(new Date())

        if (!isAutoRetry) {
            setRetryAttempts(prev => prev + 1)
        }

        try {
            await onRetry()
            // Reset retry attempts on successful retry
            setRetryAttempts(0)
        } catch (error) {
            console.error('Retry failed:', error)
            if (isAutoRetry) {
                setRetryAttempts(prev => prev + 1)
            }
        } finally {
            setTimeout(() => {
                setIsRetrying(false)
            }, 2000)
        }
    }

    // Format time display
    const formatTime = (milliseconds) => {
        const seconds = Math.floor(milliseconds / 1000)
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    // Format last retry time
    const formatLastRetryTime = () => {
        if (!lastRetryTime) return 'Never'
        const now = new Date()
        const diffSeconds = Math.floor((now - lastRetryTime) / 1000)

        if (diffSeconds < 60) return `${diffSeconds}s ago`
        const diffMinutes = Math.floor(diffSeconds / 60)
        return `${diffMinutes}m ago`
    }

    // Determine severity level
    const getSeverityLevel = () => {
        if (autoSubmitPending) return 'critical'
        if (disconnectionCount >= maxDisconnections) return 'critical'
        if (disconnectionCount === 1 && gracePeriodRemaining < 10) return 'warning'
        return 'info'
    }

    const severityLevel = getSeverityLevel()

    // Severity configurations
    const severityConfig = {
        info: {
            cardBg: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'border-blue-200 dark:border-blue-700',
            iconColor: 'text-blue-600 dark:text-blue-400',
            badgeVariant: 'secondary'
        },
        warning: {
            cardBg: 'bg-yellow-50 dark:bg-yellow-900/20',
            borderColor: 'border-yellow-200 dark:border-yellow-700',
            iconColor: 'text-yellow-600 dark:text-yellow-400',
            badgeVariant: 'default'
        },
        critical: {
            cardBg: 'bg-red-50 dark:bg-red-900/20',
            borderColor: 'border-red-200 dark:border-red-700',
            iconColor: 'text-red-600 dark:text-red-400',
            badgeVariant: 'destructive'
        }
    }

    const config = severityConfig[severityLevel]

    // Calculate next auto-retry countdown
    const getNextAutoRetryTime = () => {
        if (disconnectionCount !== 1 || retryAttempts >= 3 || autoSubmitPending) return null
        return Math.min(2000 * Math.pow(2, retryAttempts), 10000) / 1000
    }

    const nextAutoRetry = getNextAutoRetryTime()

    return (
        <div className="fixed bottom-4 right-4 w-80 z-50 animate-slide-up">
            <Card className={`${config.cardBg} ${config.borderColor} border-2 shadow-lg bg-card`}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2 text-card-foreground font-poppins">
                            <WifiOff className={`w-5 h-5 ${config.iconColor}`} />
                            <span className="text-sm">Connection Lost</span>
                        </CardTitle>

                        <Badge variant={config.badgeVariant} className="animate-pulse font-poppins">
                            #{disconnectionCount}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Status Message */}
                    <div className="text-sm text-card-foreground font-poppins">
                        {autoSubmitPending ? (
                            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="font-bold">Quiz will auto-submit when reconnected!</span>
                            </div>
                        ) : disconnectionCount === 1 && gracePeriodRemaining > 0 ? (
                            <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400">
                                <Clock className="w-4 h-4" />
                                <span>Reconnect within {gracePeriodRemaining}s to avoid auto-submit</span>
                            </div>
                        ) : disconnectionCount >= maxDisconnections ? (
                            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="font-bold">Multiple disconnections detected!</span>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                                <Activity className="w-4 h-4" />
                                <span>
                  {isRetrying ? 'Reconnecting...' : 'Attempting to reconnect...'}
                </span>
                            </div>
                        )}
                    </div>

                    {/* Grace Period Progress Bar */}
                    {disconnectionCount === 1 && gracePeriodRemaining > 0 && !autoSubmitPending && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground font-poppins">
                                <span>Grace Period</span>
                                <span>{gracePeriodRemaining}s remaining</span>
                            </div>
                            <Progress
                                value={(gracePeriodRemaining / gracePeriodRemainingTime) * 100}
                                className="h-2"
                            />
                        </div>
                    )}

                    {/* Auto-retry countdown */}
                    {nextAutoRetry && !isRetrying && (
                        <div className="bg-background border border-border rounded-md p-2">
                            <div className="flex items-center justify-between text-xs font-poppins">
                                <span className="text-muted-foreground">Next auto-retry:</span>
                                <span className="text-card-foreground font-bold">
                  {Math.ceil(nextAutoRetry)}s
                </span>
                            </div>
                        </div>
                    )}

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4 text-xs font-poppins">
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Offline Time:</span>
                                <span className="text-card-foreground font-bold">
                  {formatTime(localOfflineTime)}
                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Pending Sync:</span>
                                <span className="text-card-foreground font-bold">
                  {pendingSync} item{pendingSync !== 1 ? 's' : ''}
                </span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Disconnections:</span>
                                <span className="text-card-foreground font-bold">
                  {disconnectionCount}/{maxDisconnections}
                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Retry Attempts:</span>
                                <span className="text-card-foreground font-bold">
                  {retryAttempts}
                </span>
                            </div>
                        </div>
                    </div>

                    {/* Additional Metrics */}
                    <div className="grid grid-cols-2 gap-4 text-xs font-poppins">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Total Offline:</span>
                            <span className="text-card-foreground font-bold">
                {formatTime(totalOfflineTime + localOfflineTime)}
              </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Last Retry:</span>
                            <span className="text-card-foreground font-bold">
                {formatLastRetryTime()}
              </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                        <Button
                            onClick={() => handleRetry(false)}
                            disabled={isRetrying}
                            size="sm"
                            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-poppins"
                        >
                            {isRetrying ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            {isRetrying ? 'Retrying...' : 'Retry Connection'}
                        </Button>
                    </div>

                    {/* Status-specific Warning Messages */}
                    {severityLevel === 'critical' && (
                        <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-2">
                            <p className="text-xs text-red-800 dark:text-red-200 font-poppins">
                                {autoSubmitPending
                                    ? "⚠️ Your quiz answers are saved. The quiz will be automatically submitted when connection is restored."
                                    : `🚨 You have exceeded the maximum number of disconnections (${maxDisconnections}). Quiz will auto-submit immediately upon reconnection.`
                                }
                            </p>
                        </div>
                    )}

                    {severityLevel === 'warning' && gracePeriodRemaining < 10 && (
                        <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-2">
                            <p className="text-xs text-yellow-800 dark:text-yellow-200 font-poppins">
                                ⏰ You have {gracePeriodRemaining} seconds to reconnect before the quiz is flagged for auto-submission.
                            </p>
                        </div>
                    )}

                    {/* Connection Tips */}
                    {severityLevel === 'info' && retryAttempts > 0 && (
                        <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md p-2">
                            <p className="text-xs text-blue-800 dark:text-blue-200 font-poppins">
                                💡 Try moving closer to your router or switching to mobile data if available.
                            </p>
                        </div>
                    )}

                    {/* Recovery Info */}
                    <div className="bg-background border border-border rounded-md p-2">
                        <p className="text-xs text-muted-foreground font-poppins">
                            💾 Your progress is automatically saved. Quiz timer is paused during offline periods.
                        </p>
                    </div>

                    {/* Technical Details (collapsible for advanced users) */}
                    {retryAttempts > 2 && (
                        <details className="text-xs">
                            <summary className="text-muted-foreground font-poppins cursor-pointer hover:text-card-foreground">
                                Technical Details
                            </summary>
                            <div className="mt-2 space-y-1 text-muted-foreground font-poppins">
                                <div>Connection attempts: {retryAttempts}</div>
                                <div>Grace period: {gracePeriodRemainingTime}s</div>
                                <div>Max disconnections: {maxDisconnections}</div>
                                <div>Auto-submit pending: {autoSubmitPending ? 'Yes' : 'No'}</div>
                            </div>
                        </details>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

// Add this CSS to your global styles for the slide-up animation
/*
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
*/