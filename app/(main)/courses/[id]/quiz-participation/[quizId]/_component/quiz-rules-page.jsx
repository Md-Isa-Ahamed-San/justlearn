"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Shield, Clock, Eye, MousePointer, Keyboard, Monitor, ArrowLeft } from "lucide-react"

export default function QuizRulesPage({
                                          quiz,
                                          onStartQuiz,
                                          onGoBack,
                                          hasExceededAttempts,
                                          hasCompletedSubmission,
                                      }) {
    const canTakeQuiz = !hasExceededAttempts && !hasCompletedSubmission && quiz.active && quiz.status === "published"

    return (
        <div className="min-h-screen bg-background p-4 mt-4">
            <div className="max-w-4xl mx-auto space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={onGoBack}
                        className="flex items-center gap-2 bg-card border-border text-card-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Go Back to Course
                    </Button>
                    <Badge variant={quiz.active ? "default" : "destructive"}>{quiz.active ? "Active" : "Inactive"}</Badge>
                </div>

                {/* Quiz Info */}
                <Card className="border-2 border-primary/20 bg-card">
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-xl font-poppins font-bold text-card-foreground">{quiz.title}</CardTitle>
                        <p className="text-muted-foreground">{quiz.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                            <div className="space-y-1">
                                <Clock className="h-5 w-5 mx-auto text-primary" />
                                <p className="text-xs font-poppins font-bold text-card-foreground">Time Limit</p>
                                <p className="text-sm font-bold text-card-foreground">{quiz.timeLimit} min</p>
                            </div>
                            <div className="space-y-1">
                                <Shield className="h-5 w-5 mx-auto text-primary" />
                                <p className="text-xs font-poppins font-bold text-card-foreground">Questions</p>
                                <p className="text-sm font-bold text-card-foreground">{quiz.questions?.length || 0}</p>
                            </div>
                            <div className="space-y-1">
                                <Eye className="h-5 w-5 mx-auto text-primary" />
                                <p className="text-xs font-poppins font-bold text-card-foreground">Max Attempts</p>
                                <p className="text-sm font-bold text-card-foreground">{quiz.maxAttempts}</p>
                            </div>
                            <div className="space-y-1">
                                <Monitor className="h-5 w-5 mx-auto text-primary" />
                                <p className="text-xs font-poppins font-bold text-card-foreground">Security Level</p>
                                <p className="text-sm font-bold capitalize text-card-foreground">{quiz.securityLevel}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Anti-Cheating Rules */}
                <Card className="border-2 border-destructive/20 bg-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-destructive font-poppins font-bold">
                            <AlertTriangle className="h-4 w-4" />
                            Anti-Cheating Rules & Warnings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Alert className="border-destructive/50 bg-destructive/10">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="font-medium text-card-foreground">
                                This quiz has strict anti-cheating measures. Violations will result in automatic submission.
                            </AlertDescription>
                        </Alert>

                        <div className="grid md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <h4 className="font-poppins font-bold text-destructive text-sm">Immediate Auto-Submit Triggers:</h4>
                                <ul className="space-y-1 text-xs">
                                    <li className="flex items-center gap-2">
                                        <Monitor className="h-3 w-3 text-destructive" />
                                        <span className="text-card-foreground">Exiting fullscreen mode</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Keyboard className="h-3 w-3 text-destructive" />
                                        <span className="text-card-foreground">Opening developer tools</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <MousePointer className="h-3 w-3 text-destructive" />
                                        <span className="text-card-foreground">Successful copy-paste action</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Shield className="h-3 w-3 text-destructive" />
                                        <span className="text-card-foreground">Network disconnect {">"} 10 seconds</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-poppins font-bold text-orange-600 text-sm">Warning System (2 strikes):</h4>
                                <ul className="space-y-1 text-xs">
                                    <li className="flex items-center gap-2">
                                        <Eye className="h-3 w-3 text-orange-600" />
                                        <span className="text-card-foreground">Tab switching (2 times = auto-submit)</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Monitor className="h-3 w-3 text-orange-600" />
                                        <span className="text-card-foreground">Window minimize (2 times = auto-submit)</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <MousePointer className="h-3 w-3 text-orange-600" />
                                        <span className="text-card-foreground">Copy-paste attempts (2 times = auto-submit)</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Keyboard className="h-3 w-3 text-orange-600" />
                                        <span className="text-card-foreground">Keyboard shortcut violations</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="bg-muted p-3 rounded-lg border border-border">
                            <h4 className="font-poppins font-bold mb-2 text-card-foreground text-sm">Required Browser Settings:</h4>
                            <ul className="text-xs space-y-1 text-muted-foreground">
                                <li>• Must be in fullscreen mode throughout the quiz</li>
                                <li>• Right-click and keyboard shortcuts are disabled</li>
                                <li>• Text selection and copy-paste are blocked</li>
                                <li>• Print screen functionality is disabled</li>
                                <li>• Browser extensions may be detected</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Messages */}
                {hasCompletedSubmission && (
                    <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
                        <Shield className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700 dark:text-green-400">
                            You have already completed this quiz. You cannot take it again.
                        </AlertDescription>
                    </Alert>
                )}

                {hasExceededAttempts && (
                    <Alert className="border-destructive/50 bg-destructive/10">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-card-foreground">
                            You have exceeded the maximum number of attempts ({quiz.maxAttempts}) for this quiz.
                        </AlertDescription>
                    </Alert>
                )}

                {!quiz.active && (
                    <Alert className="border-destructive/50 bg-destructive/10">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-card-foreground">
                            This quiz is currently inactive and cannot be taken.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex justify-center gap-4 pt-4">
                    <Button
                        variant="outline"
                        onClick={onGoBack}
                        size="lg"
                        className="border-border text-foreground hover:bg-accent hover:text-accent-foreground bg-transparent"
                    >
                        Go Back to Course
                    </Button>
                    <Button
                        onClick={onStartQuiz}
                        disabled={!canTakeQuiz}
                        size="lg"
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        {canTakeQuiz ? "Start Quiz" : "Cannot Start Quiz"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
