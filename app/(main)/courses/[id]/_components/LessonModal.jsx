"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Video,
    Play,
    CheckCircle,
    Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const LessonModal = ({
                                lesson,
                                week,
                                isLessonCompleted,
                                getAttachmentIcon,
                                currentUser,
                                handleAttachmentClick,
                                handleMarkLessonComplete,
                                isUpdating
                            }) => {
    const isCompleted = isLessonCompleted(lesson.id);
    console.log(" lesson lesson lesson: ", lesson)

    return (
        <div className="space-y-6">
            {/* Lesson Description */}
            <div>
                <p className="text-muted-foreground">{lesson.description}</p>
            </div>

            {/* Video Player */}
            {lesson.videoUrl && (
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-card-foreground font-poppins font-bold flex items-center gap-2">
                            <Video className="h-5 w-5" />
                            Lesson Video
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                                <Play className="h-12 w-12 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Video Player</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                                    onClick={() => window.open(lesson.videoUrl, '_blank')}
                                >
                                    Watch on YouTube
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Lesson Resources */}
            {lesson.attachments && lesson.attachments.length > 0 && (
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-card-foreground font-poppins font-bold">
                            Resources & Attachments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {lesson.attachments.map((attachment, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => handleAttachmentClick(attachment)}
                                >
                                    <div className="flex items-center gap-3">
                                        {getAttachmentIcon(attachment.type)}
                                        <div>
                                            <p className="font-medium text-foreground">{attachment.name}</p>
                                            <p className="text-sm text-muted-foreground capitalize">
                                                {attachment.type}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-foreground hover:bg-accent hover:text-accent-foreground"
                                    >
                                        {attachment.type === 'link' ? 'Open' : 'Download'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Lesson Progress */}
            {currentUser && (
                <Card className="bg-card border-border">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {isCompleted ? (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground" />
                                )}
                                <span className="font-medium text-foreground">
                                    {isCompleted ? 'Completed' : 'Not Completed'}
                                </span>
                            </div>

                            <Button
                                onClick={() => handleMarkLessonComplete(lesson.id)}
                                variant={isCompleted ? "outline" : "default"}
                                disabled={isUpdating}
                                className={isCompleted
                                    ? "border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                                }
                            >
                                {isUpdating ? 'Updating...' : (isCompleted ? 'Mark as Incomplete' : 'Mark as Complete')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};