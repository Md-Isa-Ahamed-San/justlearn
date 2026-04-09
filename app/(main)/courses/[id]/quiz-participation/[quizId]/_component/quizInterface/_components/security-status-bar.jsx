import React from 'react'
import { Shield, AlertTriangle, WifiOff, Wifi, Eye, EyeOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

/**
 * SecurityStatusBar - Real-time security status display
 * Shows fullscreen, offline, violation status with visual indicators
 */
export default function SecurityStatusBar({
                                              security,
                                              offline,
                                              fullscreen,
                                              violations
                                          }) {
    // Get security status configuration
    const securityStatus = security.getSecurityStatus()

    // Determine overall security level
    const getSecurityLevel = () => {
        if (offline.isOffline) return 'critical'
        if (security.shouldAutoSubmit) return 'critical'
        if (violations.warningCount >= 2) return 'warning'
        if (!fullscreen.isFullscreen && fullscreen.isSupported) return 'warning'
        return 'secure'
    }

    const securityLevel = getSecurityLevel()

    // Security level configurations
    const securityConfig = {
        secure: {
            bgColor: 'bg-green-50 dark:bg-green-900/20',
            borderColor: 'border-green-200 dark:border-green-800',
            textColor: 'text-green-800 dark:text-green-200'
        },
        warning: {
            bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
            borderColor: 'border-yellow-200 dark:border-yellow-800',
            textColor: 'text-yellow-800 dark:text-yellow-200'
        },
        critical: {
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            borderColor: 'border-red-200 dark:border-red-800',
            textColor: 'text-red-800 dark:text-red-200'
        }
    }

    const config = securityConfig[securityLevel]

    return (
        <Card className={`mx-4 mb-4 ${config.bgColor} ${config.borderColor} border`}>
            <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                    {/* Left Side - Security Status */}
                    <div className="flex items-center space-x-4">
                        {/* Main Security Badge */}
                        <Badge
                            variant={securityStatus.variant}
                            className="flex items-center space-x-1 px-3 py-1"
                        >
                            <securityStatus.icon className="w-3 h-3" />
                            <span className="font-poppins font-bold text-xs">
                {securityStatus.text}
              </span>
                        </Badge>

                        <Separator orientation="vertical" className="h-4" />

                        {/* Individual Status Indicators */}
                        <div className="flex items-center space-x-3">
                            {/* Fullscreen Status */}
                            <div className="flex items-center space-x-1">
                                {fullscreen.isSupported ? (
                                    fullscreen.isFullscreen ? (
                                        <Eye className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    ) : (
                                        <EyeOff className="w-4 h-4 text-red-600 dark:text-red-400" />
                                    )
                                ) : (
                                    <EyeOff className="w-4 h-4 text-gray-400" />
                                )}
                                <span className={`text-xs font-poppins ${config.textColor}`}>
                  {fullscreen.isSupported ?
                      (fullscreen.isFullscreen ? 'Fullscreen' : 'Windowed') :
                      'No Support'
                  }
                </span>
                            </div>

                            {/* Network Status */}
                            <div className="flex items-center space-x-1">
                                {offline.isOffline ? (
                                    <WifiOff className="w-4 h-4 text-red-600 dark:text-red-400" />
                                ) : (
                                    <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
                                )}
                                <span className={`text-xs font-poppins ${config.textColor}`}>
                  {offline.isOffline ? 'Offline' : 'Online'}
                </span>
                            </div>

                            {/* Violation Count */}
                            <div className="flex items-center space-x-1">
                                <AlertTriangle className={`w-4 h-4 ${
                                    violations.warningCount > 0 ?
                                        'text-yellow-600 dark:text-yellow-400' :
                                        'text-gray-400'
                                }`} />
                                <span className={`text-xs font-poppins ${config.textColor}`}>
                  {violations.warningCount} Warning{violations.warningCount !== 1 ? 's' : ''}
                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Detailed Status */}
                    <div className="flex items-center space-x-2 text-xs font-poppins">
                        {/* Offline Metrics */}
                        {offline.disconnectionCount > 0 && (
                            <div className={`${config.textColor} text-right`}>
                                <div>Disconnections: {offline.disconnectionCount}</div>
                                <div>Offline Time: {Math.floor(offline.totalOfflineTime / 1000)}s</div>
                            </div>
                        )}

                        {/* Auto-submit Warning */}
                        {security.shouldAutoSubmit && (
                            <Badge variant="destructive" className="animate-pulse">
                                Auto-Submit Pending
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Additional Warning Message */}
                {security.showWarning && security.warningMessage && (
                    <div className="mt-2 pt-2 border-t border-border">
                        <p className={`text-xs font-poppins ${config.textColor}`}>
                            {security.warningMessage}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}