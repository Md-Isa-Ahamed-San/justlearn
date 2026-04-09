"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { uploadToCloudinary } from "@/utils/uploadToCloudinary";
import { ChevronLeft, ChevronRight, Circle, CircleCheck, Database, Pencil, PlusCircle, Trash } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AddQuizForm } from "./add-quiz-form";

export const ManualQuizEditor = ({ quizData, setQuizData, initialQuestions = null }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [bulkProcessing, setBulkProcessing] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [questionsPerPage] = useState(10); // Configurable

    const QuestionDBExistStatus = quizData.questions.every(item => !item.id);

    console.log("quizData inside manual quiz editor: ", quizData);

    useEffect(() => {
        const shouldProcessInitialQuestions =
            initialQuestions &&
            Array.isArray(initialQuestions) &&
            initialQuestions.length > 0 &&
            (quizData?.generationType === "ai_fixed" || quizData?.generationType === "ai_pool") &&
            (!quizData?.questions || quizData.questions.length === 0);

        if (shouldProcessInitialQuestions) {
            handleBulkCreateQuestions(initialQuestions);
        }
    }, [initialQuestions, quizData?.generationType, quizData?.questions?.length, quizData?.id]);

    // Pagination logic
    const questions = quizData?.questions || [];
    const hasQuestions = questions.length > 0;
    const sortedQuestions = questions.sort((a, b) => (a.order || 0) - (b.order || 0));

    const totalPages = Math.ceil(sortedQuestions.length / questionsPerPage);
    const startIndex = (currentPage - 1) * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    const currentQuestions = sortedQuestions.slice(startIndex, endIndex);

    const shouldShowPagination = sortedQuestions.length > questionsPerPage;

    // Reset to page 1 when questions change significantly
    useEffect(() => {
        const maxPage = Math.ceil(sortedQuestions.length / questionsPerPage);
        if (currentPage > maxPage && maxPage > 0) {
            setCurrentPage(1);
        }
    }, [sortedQuestions.length, currentPage, questionsPerPage]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        // Smooth scroll to top of questions section
        const questionsSection = document.getElementById('questions-section');
        if (questionsSection) {
            questionsSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleBulkCreateQuestions = async (questions) => {
        if (!questions || questions.length === 0) return;

        setBulkProcessing(true);

        try {
            console.log("Creating bulk questions:", questions);

            const res = await fetch(`/api/quiz/${quizData.id}/questions/bulk`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ questions }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setQuizData((prev) => ({
                    ...prev,
                    questions: data.questions,
                }));

                toast.success(`${data.count} questions created successfully`);
            } else {
                throw new Error(data.error || "Failed to create questions");
            }
        } catch (error) {
            console.error("Error creating bulk questions:", error);
            toast.error(error.message || "Failed to create questions. Please try again.");
        } finally {
            setBulkProcessing(false);
        }
    };

    const handleImageUpload = async (imageData) => {
        if (!imageData || typeof imageData !== "string" || !imageData.startsWith("data:")) {
            return imageData;
        }

        try {
            console.log("Uploading image to Cloudinary...");
            const uploadResult = await uploadToCloudinary(imageData);
            console.log("Image uploaded successfully:", uploadResult);
            return uploadResult;
        } catch (error) {
            console.error("Error uploading image:", error);
            throw new Error("Failed to upload image. Please try again.");
        }
    };

    const handleAddQuestion = async (newQuestion) => {
        console.log("handleAddQuestion ~ newQuestion:", newQuestion, quizData);
        setProcessing(true);

        const currentQuestions = quizData?.questions || [];
        const newOrder = currentQuestions.length;

        try {
            // Handle image upload if needed
            const imageUrl = await handleImageUpload(newQuestion.image);

            // Create question with the image URL
            const questionData = {
                quizId: quizData?.id,
                text: newQuestion.text,
                type: newQuestion.type,
                mark: newQuestion.mark,
                explanation: newQuestion.explanation,
                image: imageUrl,
                options: newQuestion.options,
                correctAnswer: newQuestion.correctAnswer,
                order: newOrder,
            };

            const res = await fetch("/api/question", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(questionData),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setQuizData((prev) => ({
                    ...prev,
                    questions: [
                        ...currentQuestions,
                        {
                            ...newQuestion,
                            id: data.question.id,
                            image: imageUrl,
                            order: newOrder,
                        },
                    ],
                }));

                toast.success("Question added successfully");

                // Navigate to the last page to show the new question
                const newTotalPages = Math.ceil((currentQuestions.length + 1) / questionsPerPage);
                setCurrentPage(newTotalPages);

                closeModal();
            } else {
                throw new Error(data.error || "Failed to add question");
            }
        } catch (error) {
            console.error("Error adding question:", error);
            toast.error(error.message || "Failed to add question. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    const handleAddAllAIQuestions = async () => {
        try {
            setProcessing(true);
            const res = await fetch(`/api/quiz/${quizData.id}/questions/bulk`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    questions: quizData.questions
                })
            });

            const data = await res.json();
            console.log("data: ", data);
            if (res.ok && data.success) {
                toast.success(`All ${data?.count} questions added successfully`);
                setQuizData((prev) => ({
                    ...prev,
                    questions: data.questions,
                }));
            } else {
                toast.error(data.error || "Failed to add questions");
            }
        } catch (error) {
            console.error("Error adding questions:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    const handleUpdateQuestion = async (updatedQuestion) => {
        setProcessing(true);

        try {
            // Handle image upload if needed
            const imageUrl = await handleImageUpload(updatedQuestion.image);

            const questionData = {
                text: updatedQuestion.text,
                type: updatedQuestion.type,
                mark: updatedQuestion.mark,
                explanation: updatedQuestion.explanation,
                image: imageUrl,
                options: updatedQuestion.options,
                correctAnswer: updatedQuestion.correctAnswer,
            };

            const res = await fetch(`/api/question/${updatedQuestion.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(questionData),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setQuizData((prev) => ({
                    ...prev,
                    questions: prev.questions.map((q) =>
                        q.id === updatedQuestion.id
                            ? { ...updatedQuestion, image: imageUrl }
                            : q
                    ),
                }));

                toast.success("Question updated successfully");
                closeModal();
            } else {
                throw new Error(data.error || "Failed to update question");
            }
        } catch (error) {
            console.error("Error updating question:", error);
            toast.error(error.message || "Failed to update question. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    const handleDeleteQuestion = async (questionId) => {
        toast("Are you sure you want to delete this question?", {
            action: {
                label: "Delete",
                onClick: async () => {
                    try {
                        const res = await fetch(`/api/question/${questionId}`, {
                            method: "DELETE",
                            headers: {
                                "Content-Type": "application/json",
                            },
                        });

                        const data = await res.json();

                        if (res.ok && data.success) {
                            setQuizData((prev) => ({
                                ...prev,
                                questions: prev.questions
                                    .filter((q) => q.id !== questionId)
                                    .map((q, index) => ({ ...q, order: index })),
                            }));

                            toast.success("Question deleted successfully");

                            // Adjust current page if needed
                            const remainingQuestions = questions.filter(q => q.id !== questionId);
                            const newTotalPages = Math.ceil(remainingQuestions.length / questionsPerPage);
                            if (currentPage > newTotalPages && newTotalPages > 0) {
                                setCurrentPage(newTotalPages);
                            }
                        } else {
                            toast.error(data.message || "Failed to delete question");
                        }
                    } catch (error) {
                        console.error("Delete error:", error);
                        toast.error("Failed to delete question. Please try again.");
                    }
                },
            },
            cancel: {
                label: "Cancel",
                onClick: () => {
                    toast.dismiss();
                },
            },
        });
    };

    const openAddModal = () => {
        setEditingQuestion(null);
        setIsModalOpen(true);
    };

    const openEditModal = (question) => {
        setEditingQuestion(question);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingQuestion(null);
    };

    const handleModalOpenChange = (open) => {
        if (!open) {
            closeModal();
        }
    };

    // Derived state for better readability
    const isAiGenerated = quizData?.generationType === "ai_fixed" || quizData?.generationType === "ai_pool";
    const isPublished = quizData?.status === 'published';
    const isDisabled = bulkProcessing || isPublished;

    return (
        <div className="mt-6 bg-card border border-border rounded-md p-2 sm:p-4">
            <div className="font-poppins font-bold text-card-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <h3 className="text-lg">Questions</h3>
                    {shouldShowPagination && (
                        <div className="text-sm text-muted-foreground bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
                            Showing {startIndex + 1}-{Math.min(endIndex, sortedQuestions.length)} of {sortedQuestions.length}
                        </div>
                    )}
                </div>

                {/* Add buttons */}
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {QuestionDBExistStatus && (
                        <Button
                            onClick={handleAddAllAIQuestions}
                            variant="outline"
                            disabled={isDisabled}
                            title={isPublished ? "Cannot modify questions in a published quiz" : ""}
                            className="text-xs sm:text-sm border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                            <Database className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Add All AI Generated Questions</span>
                            <span className="sm:hidden">Add All AI Questions</span>
                        </Button>
                    )}

                    <Button
                        onClick={openAddModal}
                        variant="outline"
                        disabled={isDisabled}
                        title={isPublished ? "Cannot modify questions in a published quiz" : ""}
                        className="text-xs sm:text-sm border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add a Question
                    </Button>
                </div>
            </div>

            {/* Questions Section */}
            {hasQuestions && (
                <div id="questions-section">
                    {/* Pagination Controls - Top */}
                    {shouldShowPagination && (
                        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 p-2 sm:p-4 bg-card rounded-lg gap-3">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="hidden sm:inline">Previous</span>
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handlePageChange(page)}
                                            className={cn(
                                                "w-8 h-8 p-0",
                                                currentPage === page
                                                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                                    : "border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                                            )}
                                        >
                                            {page}
                                        </Button>
                                    ))}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                                >
                                    <span className="hidden sm:inline">Next</span>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="text-sm text-muted-foreground">
                                Page {currentPage} of {totalPages}
                            </div>
                        </div>
                    )}

                    {/* Questions List */}
                    <div className="space-y-4 sm:space-y-6">
                        {currentQuestions.map((question, index) => {
                            const actualIndex = startIndex + index;
                            return (
                                <div
                                    key={question.id || `question-${actualIndex}`}
                                    className="bg-card shadow-md p-3 sm:p-4 lg:p-6 rounded-md border border-border"
                                >
                                    <div className="flex flex-col sm:flex-row items-start justify-between mb-3 gap-3">
                                        <div className="flex flex-col gap-2 flex-1">
                                            {question?.image && (
                                                <Image
                                                    width={300}
                                                    height={300}
                                                    src={question?.image}
                                                    alt="question image"
                                                    className="rounded-md w-full max-w-xs sm:max-w-sm"
                                                />
                                            )}
                                            <h4 className="mb-1 font-poppins font-bold text-card-foreground text-sm sm:text-base">
                                                {actualIndex + 1}. {question.text}
                                            </h4>
                                        </div>
                                        <div className="text-sm text-muted-foreground flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                                            <span>
                                                {question.mark} {question.mark === 1 ? "point" : "points"}
                                            </span>
                                            {question.isFromPool && (
                                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                                    Pool Question
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {question.explanation && (
                                        <p className="text-xs text-muted-foreground mb-3 italic">
                                            <strong>Explanation:</strong> {question.explanation}
                                        </p>
                                    )}

                                    {/* Multiple Choice Questions */}
                                    {question.type === "mcq" && question.options && (
                                        <div className="grid grid-cols-1 gap-2 sm:gap-3 mb-4">
                                            {question.options.map((option, optionIndex) => (
                                                <div
                                                    className={cn(
                                                        "py-1.5 rounded-sm text-sm flex items-center gap-2",
                                                        option.isCorrect
                                                            ? "text-emerald-700"
                                                            : "text-muted-foreground"
                                                    )}
                                                    key={`${question.id}-option-${optionIndex}`}
                                                >
                                                    {option.isCorrect ? (
                                                        <CircleCheck className="size-4 text-emerald-500 flex-shrink-0" />
                                                    ) : (
                                                        <Circle className="size-4 flex-shrink-0" />
                                                    )}
                                                    <p className="break-words">
                                                        <span className="font-poppins font-bold mr-1">
                                                            {String.fromCharCode(65 + optionIndex)}.
                                                        </span>
                                                        {option.label}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Short Answer and Long Answer Questions */}
                                    {(question.type === "short_answer" || question.type === "long_answer") && (
                                        <div className="mb-4 p-3 bg-secondary rounded-md">
                                            <p className="text-sm text-secondary-foreground mb-1">
                                                <strong className="font-poppins font-bold">
                                                    {question.type === "short_answer"
                                                        ? "Correct Answer:"
                                                        : "Sample Answer:"}
                                                </strong>
                                            </p>
                                            <p className="text-sm text-secondary-foreground whitespace-pre-wrap break-words">
                                                {typeof question.correctAnswer === "string"
                                                    ? question.correctAnswer
                                                    : JSON.stringify(question.correctAnswer)}
                                            </p>
                                        </div>
                                    )}

                                    {/* Question Type Badge and Actions */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-3">
                                        <span
                                            className={cn(
                                                "px-2 py-1 text-xs rounded-full",
                                                question.type === "mcq" && "bg-blue-100 text-blue-700",
                                                question.type === "short_answer" && "bg-green-100 text-green-700",
                                                question.type === "long_answer" && "bg-purple-100 text-purple-700"
                                            )}
                                        >
                                            {question.type === "mcq" && "Multiple Choice"}
                                            {question.type === "short_answer" && "Short Answer"}
                                            {question.type === "long_answer" && "Long Answer"}
                                        </span>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditModal(question)}
                                                disabled={isDisabled}
                                                title={isPublished ? "Cannot edit questions in a published quiz" : ""}
                                                className="text-xs sm:text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                                            >
                                                <Pencil className="w-3 h-3 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="text-destructive hover:text-destructive text-xs sm:text-sm"
                                                variant="ghost"
                                                onClick={() => handleDeleteQuestion(question.id)}
                                                disabled={isDisabled}
                                                title={isPublished ? "Cannot delete questions in a published quiz" : ""}
                                            >
                                                <Trash className="w-3 h-3 mr-1" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination Controls - Bottom */}
                    {shouldShowPagination && (
                        <div className="flex flex-col sm:flex-row items-center justify-center mt-6 p-2 sm:p-4 bg-card rounded-lg gap-3">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="hidden sm:inline">Previous</span>
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handlePageChange(page)}
                                            className={cn(
                                                "w-8 h-8 p-0",
                                                currentPage === page
                                                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                                    : "border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                                            )}
                                        >
                                            {page}
                                        </Button>
                                    ))}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                                >
                                    <span className="hidden sm:inline">Next</span>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="text-sm text-muted-foreground">
                                Page {currentPage} of {totalPages} • {sortedQuestions.length} total questions
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* No Questions State */}
            {!hasQuestions && !bulkProcessing && (
                <div className="text-center py-8 text-muted-foreground">
                    <p className="text-lg mb-2 font-poppins font-bold">
                        No questions in this {isAiGenerated ? 'AI-generated' : ''} quiz yet.
                    </p>
                    <p className="text-sm">
                        {!isAiGenerated && !isPublished ? "Click 'Add a Question' to get started." :
                            isPublished ? "This quiz has no questions." :
                                "Generate questions using AI or add manually."}
                    </p>
                </div>
            )}

            {/* Bulk Processing State */}
            {bulkProcessing && (
                <div className="text-center py-8 text-blue-600">
                    <p className="text-lg font-poppins font-bold">Creating AI-generated questions...</p>
                    <p className="text-sm">Please wait.</p>
                </div>
            )}

            {/* Add/Edit Question Modal */}
            <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
                <DialogContent className="bg-popover border-border max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
                    <DialogHeader>
                        <DialogTitle className="text-popover-foreground font-poppins font-bold">
                            {editingQuestion ? "Edit Question" : "Add New Question"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        <AddQuizForm
                            quizId={quizData?.id}
                            initialData={editingQuestion}
                            onQuestionAdded={handleAddQuestion}
                            onQuestionUpdated={handleUpdateQuestion}
                            onCancel={closeModal}
                            isEditing={!!editingQuestion}
                            processing={processing}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};