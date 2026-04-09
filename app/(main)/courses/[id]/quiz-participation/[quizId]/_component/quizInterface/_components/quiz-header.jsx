import React from 'react';
import {Badge} from "@/components/ui/badge";
import {Clock, Wifi, WifiOff} from "lucide-react";
import {Progress} from "@/components/ui/progress";

const QuizHeader = ({quiz,
                        currentQuestionIndex,
                        totalQuestions,
                        securityStatus,
                        state,
                        progress}) => {
    return (
        <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{quiz.title}</h1>
                    <p className="text-muted-foreground mt-1">
                        Question {currentQuestionIndex + 1} of {totalQuestions}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Enhanced Security Badge with offline status */}
                    <Badge
                        variant={securityStatus.variant}
                        className="flex items-center gap-2 px-3 py-1"
                    >
                        <securityStatus.icon className="h-3 w-3"/>
                        {securityStatus.text}
                    </Badge>

                    {/* Connection Status Badge */}
                    {state.isOffline ? (
                        <Badge variant="destructive" className="flex items-center gap-2 px-3 py-1">
                            <WifiOff className="h-3 w-3"/>
                            Disconnected ({state.disconnectionCount}x)
                        </Badge>
                    ) : (
                        <Badge variant="default" className="flex items-center gap-2 px-3 py-1">
                            <Wifi className="h-3 w-3"/>
                            Connected
                        </Badge>
                    )}

                    {/* Offline Time Tracker */}
                    {state.totalOfflineTime > 0 && (
                        <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
                            <Clock className="h-3 w-3"/>
                            Offline: {Math.floor(state.totalOfflineTime / 1000)}s
                        </Badge>
                    )}
                </div>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Progress</span>
                    <span className="text-sm text-foreground font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2"/>
            </div>
        </div>
    );
};

export default QuizHeader;