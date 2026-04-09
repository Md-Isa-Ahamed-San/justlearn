"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Clock,
    FileQuestion,
    Users,
    X,
    CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export const QuizSelectionForm = ({
                                      weekDetails,
                                      courseId,
                                      weekId,
                                      availableQuizzes
                                  }) => {
    const [selectedQuizzes, setSelectedQuizzes] = useState(weekDetails.quizIds || []);
    const [isSelecting, setIsSelecting] = useState(false);

    const handleQuizSelect = (quizId) => {
        setSelectedQuizzes(prev => {
            if (prev.includes(quizId)) {
                // Remove quiz if already selected
                return prev.filter(id => id !== quizId);
            } else {
                // Add quiz if not selected
                return [...prev, quizId];
            }
        });
    };

    const handleSaveSelection = async () => {
        // TODO: Implement API call to update week's quizIds
        console.log("Selected quizzes for week:", selectedQuizzes);

        // For now, just log the selection
        // Later you can implement the API call here:
        // await updateWeekQuizzes(weekId, selectedQuizzes);

        setIsSelecting(false);
    };

    const handleCancelSelection = () => {
        setSelectedQuizzes(weekDetails.quizIds || []);
        setIsSelecting(false);
    };

    const getSelectedQuizzes = () => {
        return availableQuizzes.filter(quiz => selectedQuizzes.includes(quiz.id));
    };

    const getQuizStatusColor = (status) => {
        switch (status) {
            case 'published':
                return 'bg-green-100 text-green-800';
            case 'draft':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatTimeLimit = (minutes) => {
        if (!minutes) return "No time limit";
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    return (
        <div className="mt-6 space-y-4">
            {/* Selected Quizzes Display */}
            <div className="space-y-3">
                {getSelectedQuizzes().map((quiz) => (
                    <Card key={quiz.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-medium">{quiz.title}</h4>
                                        <Badge className={cn("text-xs", getQuizStatusColor(quiz.status))}>
                                            {quiz.status}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">{quiz.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <FileQuestion className="h-3 w-3" />
                                            <span>{quiz.questionsPerStudent || 0} questions</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span>{formatTimeLimit(quiz.timeLimit)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            <span>{quiz.maxAttempts || 1} attempts</span>
                                        </div>
                                    </div>
                                </div>
                                {!isSelecting && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleQuizSelect(quiz.id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Add Quiz Button or Quiz Selection Interface */}
            {!isSelecting ? (
                <Button
                    onClick={() => setIsSelecting(true)}
                    variant="outline"
                    className="w-full border-dashed border-2 h-20 flex flex-col items-center justify-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    <span>Add Quiz to Week</span>
                </Button>
            ) : (
                <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium">Select Quizzes for this Week</h3>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={handleSaveSelection}
                                disabled={selectedQuizzes.length === 0}
                            >
                                Save Selection
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelSelection}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {availableQuizzes.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <FileQuestion className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No quizzes available</p>
                                <p className="text-sm">Create a quiz first to add it to this week</p>
                            </div>
                        ) : (
                            availableQuizzes.map((quiz) => (
                                <Card
                                    key={quiz.id}
                                    className={cn(
                                        "cursor-pointer transition-all hover:shadow-md",
                                        selectedQuizzes.includes(quiz.id)
                                            ? "ring-2 ring-blue-500 bg-blue-50"
                                            : "hover:bg-gray-700"
                                    )}
                                    onClick={() => handleQuizSelect(quiz.id)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-medium">{quiz.title}</h4>
                                                    <Badge className={cn("text-xs", getQuizStatusColor(quiz.status))}>
                                                        {quiz.status}
                                                    </Badge>
                                                    {selectedQuizzes.includes(quiz.id) && (
                                                        <CheckCircle className="h-4 w-4 text-blue-500" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mb-3">{quiz.description}</p>
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <FileQuestion className="h-3 w-3" />
                                                        <span>{quiz.questionsPerStudent || 0} questions</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{formatTimeLimit(quiz.timeLimit)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
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
                </div>
            )}
        </div>
    );
};