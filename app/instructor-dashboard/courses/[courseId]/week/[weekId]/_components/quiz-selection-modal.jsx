import React from 'react';
import {Button} from "@/components/ui/button";
import {CheckCircle, Clock, FileQuestion, Users, X} from "lucide-react";
import {Card, CardContent} from "@/components/ui/card";
import {cn} from "@/lib/utils";
import {Badge} from "@/components/ui/badge";

const QuizSelectionModal = ({
                                selectedQuiz,
                                formatTimeLimit,
                                items,
                                setIsAddingQuiz,
                                availableQuizzes,
                                handleQuizSelect,
                                getQuizStatusColor,
                                handleAddQuiz
                            }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-popover border border-border rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-poppins font-bold text-popover-foreground">Add Quiz to Week</h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAddingQuiz(false)}
                        className="text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                        <X className="h-4 w-4"/>
                    </Button>
                </div>

                <div className="space-y-3 mb-6">
                    {availableQuizzes.length === 0 ? (
                        <div className="text-center py-8">
                            <FileQuestion className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50"/>
                            <p className="text-popover-foreground">No quizzes available</p>
                            <p className="text-sm text-muted-foreground">Create a quiz first to add it to this week</p>
                        </div>
                    ) : (
                        availableQuizzes
                            .filter(quiz => !items.some(item => item.id === quiz.id))
                            .map((quiz) => (
                                <Card
                                    key={quiz.id}
                                    className={cn(
                                        "cursor-pointer transition-all hover:shadow-md bg-card border-border",
                                        selectedQuiz === quiz.id
                                            ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950"
                                            : "hover:bg-secondary"
                                    )}
                                    onClick={() => handleQuizSelect(quiz.id)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-medium text-card-foreground font-poppins font-bold">{quiz.title}</h4>
                                                    <Badge className={cn("text-xs", getQuizStatusColor(quiz.status))}>
                                                        {quiz.status}
                                                    </Badge>
                                                    {selectedQuiz === quiz.id && (
                                                        <CheckCircle className="h-4 w-4 text-blue-500"/>
                                                    )}
                                                </div>
                                                <p className="text-sm text-card-foreground mb-3">{quiz.description}</p>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <FileQuestion className="h-3 w-3"/>
                                                        <span>{quiz.questionsPerStudent || 0} questions</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3"/>
                                                        <span>{formatTimeLimit(quiz.timeLimit)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Users className="h-3 w-3"/>
                                                        <span>{quiz.maxAttempts || 1} attempts</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsAddingQuiz(false)}
                        className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAddQuiz}
                        disabled={!selectedQuiz}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        Add Quiz
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default QuizSelectionModal;