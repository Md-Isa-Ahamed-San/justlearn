"use client";
import React, { useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { useParams, useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BookCheck,
  Clock,
  FileText,
  Video,
  Play,
  Download,
  ExternalLink,
  CheckCircle,
  Circle,
  Users,
  Award,
  Lock,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LessonModal } from "@/app/(main)/courses/[id]/_components/LessonModal";
import { markLessonComplete } from "@/app/actions/lesson";

const CourseCurriculum = ({
  courseDetails,
  currentUser,
  completedLessons,
  completedQuizzes,
}) => {
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const params = useParams();

  // Helper function to check if a lesson is completed
  const isLessonCompleted = (lessonId) => {
    return completedLessons.includes(lessonId);
  };

  // Helper function to check if a quiz is completed
  const isQuizCompleted = (quizId) => {
    return completedQuizzes.includes(quizId);
  };

  // Check if all lessons in a week are completed
  const areAllWeekLessonsCompleted = (week) => {
    if (!week.lessons || week.lessons.length === 0) return true;
    return week.lessons.every((lesson) => isLessonCompleted(lesson.id));
  };

  // Check if all quizzes in a week are completed
  const areAllWeekQuizzesCompleted = (week) => {
    if (!week.quizzes || week.quizzes.length === 0) return true;
    return week.quizzes.every((quiz) => isQuizCompleted(quiz.id));
  };

  // Check if an entire week is completed (all lessons + quizzes)
  const isWeekCompleted = (week) => {
    return areAllWeekLessonsCompleted(week) && areAllWeekQuizzesCompleted(week);
  };

  // Check if a lesson should be unlocked
  const isLessonUnlocked = (currentWeek, currentLessonIndex, weekIndex) => {
    if (!currentUser) return false;

    // First lesson of first week is always unlocked
    if (weekIndex === 0 && currentLessonIndex === 0) return true;

    // For lessons in the first week (after the first lesson)
    if (weekIndex === 0 && currentLessonIndex > 0) {
      // Check if previous lesson is completed
      const previousLesson = currentWeek.lessons[currentLessonIndex - 1];
      return isLessonCompleted(previousLesson.id);
    }

    // For lessons in subsequent weeks
    if (weekIndex > 0) {
      // Check if previous week is completely finished
      const previousWeek = courseDetails.weeks[weekIndex - 1];
      const isPreviousWeekCompleted = isWeekCompleted(previousWeek);

      if (!isPreviousWeekCompleted) return false;

      // If it's the first lesson of the week, it's unlocked
      if (currentLessonIndex === 0) return true;

      // Otherwise, check if previous lesson in current week is completed
      const previousLesson = currentWeek.lessons[currentLessonIndex - 1];
      return isLessonCompleted(previousLesson.id);
    }

    return false;
  };

  // Check if a quiz should be unlocked
  const isQuizUnlocked = (currentWeek, weekIndex) => {
    if (!currentUser) return false;

    // Quiz is unlocked if all lessons in the current week are completed
    return areAllWeekLessonsCompleted(currentWeek);
  };

  // Check if a week should be accessible
  const isWeekUnlocked = (weekIndex) => {
    if (!currentUser) return false;
    if (weekIndex === 0) return true; // First week is always unlocked

    // Check if previous week is completed
    const previousWeek = courseDetails.weeks[weekIndex - 1];
    return isWeekCompleted(previousWeek);
  };

  // Get the next required item for unlock
  const getNextRequiredItem = (currentWeek, currentLessonIndex, weekIndex) => {
    if (weekIndex === 0 && currentLessonIndex === 0) return null;

    if (weekIndex === 0 && currentLessonIndex > 0) {
      const previousLesson = currentWeek.lessons[currentLessonIndex - 1];
      return `Complete "${previousLesson.title}" to unlock this lesson`;
    }

    if (weekIndex > 0) {
      const previousWeek = courseDetails.weeks[weekIndex - 1];
      if (!isWeekCompleted(previousWeek)) {
        return `Complete Week ${previousWeek.order} to unlock this week`;
      }

      if (currentLessonIndex > 0) {
        const previousLesson = currentWeek.lessons[currentLessonIndex - 1];
        return `Complete "${previousLesson.title}" to unlock this lesson`;
      }
    }

    return null;
  };

  // Get quiz unlock requirement
  const getQuizUnlockRequirement = (currentWeek) => {
    const incompleteLessons =
      currentWeek.lessons?.filter((lesson) => !isLessonCompleted(lesson.id)) ||
      [];

    if (incompleteLessons.length === 0) return null;

    if (incompleteLessons.length === 1) {
      return `Complete "${incompleteLessons[0].title}" to unlock this quiz`;
    }

    return `Complete all ${incompleteLessons.length} lessons to unlock this quiz`;
  };

  const handleMarkLessonComplete = async (lessonId) => {
    console.log("Processing lesson completion for ID:", lessonId);
    setIsUpdating(true);

    try {
      const userId = currentUser?.id;

      if (!userId) {
        toast.error("User not authenticated");
        return;
      }
      let courseId = params.id;
      const result = await markLessonComplete({ lessonId, userId, courseId });
      console.log("Server action result:", result);

      if (result?.success === false) {
        console.error("Server action failed:", result.error);
        toast.error(result.error || "Failed to update lesson progress");
      } else if (result?.success === true) {
        toast.success(result.message || "Lesson marked as complete!");
        setIsModalOpen(false);
      } else if (result && typeof result === "object" && result.id) {
        toast.success("Lesson marked as complete!");
        setIsModalOpen(false);
      } else {
        console.error("Unexpected server response:", result);
        toast.error("Unexpected response from server");
      }
    } catch (error) {
      console.error("Error calling server action:", error);
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const getAttachmentIcon = (type) => {
    switch (type) {
      case "image":
        return <FileText className="h-4 w-4" />;
      case "document":
        return <Download className="h-4 w-4" />;
      case "link":
        return <ExternalLink className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleAttachmentClick = (attachment) => {
    if (attachment.type === "link") {
      window.open(attachment.url, "_blank");
    } else {
      window.open(attachment.url, "_blank");
    }
  };

  const onNavigateToQuiz = (quizId, quizCompleted) => {
    console.log("quizCompleted: ", quizCompleted);
    if (quizCompleted) {
      router.push(`/courses/${params.id}/quizResult/${quizId}`);
    } else {
      router.push(`/courses/${params.id}/quiz-participation/${quizId}`);
    }
  };

  const handleLessonClick = (lesson, isUnlocked) => {
    if (!currentUser) {
      toast.error("Please log in to access lessons");
      return;
    }

    if (!isUnlocked) {
      toast.error("Complete previous lessons to unlock this content");
      return;
    }

    setSelectedLesson(lesson);
    setIsModalOpen(true);
  };

  const handleQuizClick = (quiz, isUnlocked, quizCompleted) => {
    if (!currentUser) {
      toast.error("Please log in to take quizzes");
      return;
    }

    if (!isUnlocked) {
      toast.error("Complete all lessons in this week to unlock the quiz");
      return;
    }
    console.log("Navigating to quiz ID:", quiz.id, "Completed:", quizCompleted);
    onNavigateToQuiz(quiz.id, quizCompleted);
  };

  const getTotalDuration = () => {
    if (!courseDetails?.weeks) return 0;
    return courseDetails.weeks.reduce(
      (total, week) => total + (week.duration || 0),
      0
    );
  };

  const getTotalLessons = () => {
    if (!courseDetails?.weeks) return 0;
    return courseDetails.weeks.reduce(
      (total, week) => total + (week.lessons?.length || 0),
      0
    );
  };

  return (
    <TabsContent value="curriculum" className="mt-6">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-2xl font-bold text-foreground font-poppins">
            Course Curriculum
          </h3>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <BookCheck className="h-4 w-4" />
              <span className="text-foreground">
                {courseDetails?.weeks?.length || 0} Weeks
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-foreground">
                {Math.ceil(getTotalDuration() / 60)}+ Hours
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span className="text-foreground">
                {getTotalLessons()} Lessons
              </span>
            </div>
          </div>
        </div>

        {!currentUser && (
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <LogIn className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-semibold text-card-foreground font-poppins mb-2">
              Sign in to Access Course Content
            </h4>
            <p className="text-muted-foreground mb-4">
              Log in to unlock lessons, track your progress, and take quizzes.
            </p>
            <Button
              onClick={() => router.push("/sign-in")}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Sign In Now
            </Button>
          </div>
        )}

        <Accordion
          type="multiple"
          defaultValue={courseDetails?.weeks?.map((m) => m.id) || []}
          className="w-full"
        >
          {courseDetails?.weeks?.map((week, weekIndex) => {
            const weekUnlocked = isWeekUnlocked(weekIndex);

            return (
              <AccordionItem
                key={week.id}
                value={week.id}
                className="border-b border-border px-0"
              >
                <AccordionTrigger className="py-4 text-lg font-medium hover:no-underline text-foreground font-poppins">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={weekUnlocked ? "default" : "secondary"}
                      className={
                        weekUnlocked
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }
                    >
                      Week {week.order}
                    </Badge>
                    {!weekUnlocked && (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                    {week.title}
                    {week.status === "draft" && (
                      <Badge
                        variant="secondary"
                        className="bg-secondary text-secondary-foreground"
                      >
                        Draft
                      </Badge>
                    )}
                    {weekUnlocked && isWeekCompleted(week) && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  {!weekUnlocked && currentUser && (
                    <div className="mb-4 rounded-lg border border-border bg-muted/30 p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Lock className="h-4 w-4" />
                        <span>
                          Complete Week {weekIndex} to unlock this content
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg bg-muted/30 p-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Video className="h-4 w-4" />
                      <span className="text-foreground">
                        {week.lessons?.length || 0} Lessons
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span className="text-foreground">
                        {Math.ceil((week.duration || 0) / 60)} Hours
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4" />
                      <span className="text-muted-foreground">
                        {week.description}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Lessons */}
                    {week.lessons?.map((lesson, lessonIndex) => {
                      const lessonUnlocked = isLessonUnlocked(
                        week,
                        lessonIndex,
                        weekIndex
                      );
                      const lessonCompleted = isLessonCompleted(lesson.id);
                      const unlockRequirement = !lessonUnlocked
                        ? getNextRequiredItem(week, lessonIndex, weekIndex)
                        : null;

                      return (
                        <div
                          key={lesson.id}
                          className={`flex items-center justify-between rounded-lg p-3 pl-8 transition-colors border border-border
                            ${lessonUnlocked ? "hover:bg-muted/50" : "opacity-60 bg-muted/20"}`}
                        >
                          <div className="flex items-center gap-3">
                            {lessonCompleted ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : lessonUnlocked ? (
                              <Video className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div>
                              <span
                                className={`font-medium ${lessonUnlocked ? "text-foreground" : "text-muted-foreground"}`}
                              >
                                {lesson.title}
                              </span>
                              <p className="text-sm text-muted-foreground">
                                {lesson.description}
                              </p>
                              {unlockRequirement && (
                                <p className="text-xs text-orange-600 mt-1">
                                  {unlockRequirement}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {lesson.attachments &&
                              lesson.attachments.length > 0 && (
                                <Badge
                                  variant="outline"
                                  className="border-border text-foreground"
                                >
                                  {lesson.attachments.length} Resources
                                </Badge>
                              )}
                            {currentUser ? (
                              <Button
                                variant={lessonUnlocked ? "ghost" : "secondary"}
                                size="sm"
                                className={`h-8 gap-1 ${lessonUnlocked ? "text-foreground hover:bg-accent hover:text-accent-foreground" : "text-muted-foreground cursor-not-allowed"}`}
                                onClick={() =>
                                  handleLessonClick(lesson, lessonUnlocked)
                                }
                                disabled={!lessonUnlocked}
                              >
                                {lessonUnlocked ? (
                                  <Play className="h-3 w-3" />
                                ) : (
                                  <Lock className="h-3 w-3" />
                                )}
                                {lessonUnlocked ? "Open Lesson" : "Locked"}
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 text-muted-foreground"
                                onClick={() =>
                                  toast.error("Please log in to access lessons")
                                }
                              >
                                <LogIn className="h-3 w-3" />
                                Sign In
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Quizzes */}
                    {week.quizzes?.map((quiz) => {
                      const quizUnlocked = isQuizUnlocked(week, weekIndex);
                      const quizCompleted = isQuizCompleted(quiz.id);
                      const quizRequirement = !quizUnlocked
                        ? getQuizUnlockRequirement(week)
                        : null;
                      // console.log("single quiz on the curriculum page: ", quiz);
                      if (quiz.status === "draft") return null;
                      return (
                        <div
                          key={quiz.id}
                          className={`flex items-center justify-between rounded-lg p-3 pl-8 transition-colors border border-border
                            ${quizUnlocked ? "hover:bg-muted/50 bg-accent/20" : "opacity-60 bg-muted/10"}`}
                        >
                          <div className="flex items-center gap-3">
                            {quizCompleted ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : quizUnlocked ? (
                              <Award className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div>
                              <span
                                className={`font-medium ${quizUnlocked ? "text-foreground" : "text-muted-foreground"}`}
                              >
                                {quiz.title}
                              </span>
                              <p className="text-sm text-muted-foreground">
                                {quiz.description}
                              </p>
                              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                <span>
                                  {quiz.questionsPerStudent} Questions
                                </span>
                                <span>{quiz.timeLimit} Minutes</span>
                                <span>{quiz.maxAttempts} Attempt(s)</span>
                              </div>
                              {quizRequirement && (
                                <p className="text-xs text-orange-600 mt-1">
                                  {quizRequirement}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`border-border ${quizUnlocked ? "text-foreground" : "text-muted-foreground"}`}
                            >
                              Quiz
                            </Badge>
                            {currentUser ? (
                              <Button
                                variant={quizUnlocked ? "default" : "secondary"}
                                size="sm"
                                className={`h-8 gap-1 ${quizUnlocked ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground cursor-not-allowed"}`}
                                onClick={() =>
                                  handleQuizClick(
                                    quiz,
                                    quizUnlocked,
                                    quizCompleted
                                  )
                                }
                                disabled={!quizUnlocked}
                              >
                                {quizUnlocked ? (
                                  <Users className="h-3 w-3" />
                                ) : (
                                  <Lock className="h-3 w-3" />
                                )}
                                {quizCompleted
                                  ? "See Result"
                                  : quizUnlocked
                                    ? "Take Quiz"
                                    : "Locked"}
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 text-muted-foreground"
                                onClick={() =>
                                  toast.error("Please log in to take quizzes")
                                }
                              >
                                <LogIn className="h-3 w-3" />
                                Sign In
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Lesson Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground font-poppins font-bold">
                {selectedLesson?.title}
              </DialogTitle>
            </DialogHeader>

            {selectedLesson && (
              <LessonModal
                lesson={selectedLesson}
                week={courseDetails?.weeks?.find((w) =>
                  w.lessons?.some((l) => l.id === selectedLesson.id)
                )}
                isLessonCompleted={isLessonCompleted}
                getAttachmentIcon={getAttachmentIcon}
                currentUser={currentUser}
                handleAttachmentClick={handleAttachmentClick}
                handleMarkLessonComplete={handleMarkLessonComplete}
                isUpdating={isUpdating}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TabsContent>
  );
};

export default CourseCurriculum;
