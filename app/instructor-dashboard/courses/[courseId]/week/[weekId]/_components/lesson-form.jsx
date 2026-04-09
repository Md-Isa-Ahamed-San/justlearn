"use client";

import {zodResolver} from "@hookform/resolvers/zod";
import {useForm} from "react-hook-form";
import * as z from "zod";

import {Button} from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";
import {cn} from "@/lib/utils";
import {
    Loader2,
    PlusCircle,
    X,
    CheckCircle,
    GripVertical,
    Video,
    Edit,
    Trash2,
    BookOpen,
    Clock,
    FileQuestion,
    Users
} from "lucide-react";
import {useRouter} from "next/navigation";
import {useState, useEffect} from "react";
import {toast} from "sonner";
import {LessonList} from "./lesson-list";
import {LessonModal} from "./lesson-modal";
import {toggleAddRemoveQuizFromWeek} from "@/app/actions/week";
import { createLesson, updateLesson, deleteLesson, reorderLessons } from "@/app/actions/lesson";
import { updateQuizSettings } from "@/app/actions/quiz";
import QuizSelectionModal
    from "@/app/instructor-dashboard/courses/[courseId]/week/[weekId]/_components/quiz-selection-modal";
import { QuizModal } from "./quiz-modal";

// Schema for creating a lesson
const createLessonSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    videoUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

export const LessonForm = ({weekDetails, courseId, weekId, availableQuizzes = []}) => {
    console.log("week details in lesson form: ", weekDetails);

    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isAddingQuiz, setIsAddingQuiz] = useState(false);
    const [editingLesson, setEditingLesson] = useState(null);
    const [isEditingQuiz, setIsEditingQuiz] = useState(false);
    const [editingQuiz, setEditingQuiz] = useState(null);
    const [items, setItems] = useState([]);
    const [selectedQuiz, setSelectedQuiz] = useState(null); // Changed to single quiz
    const [isUpdating, setIsUpdating] = useState(false);
    const router = useRouter();

    const toggleCreating = () => setIsCreating((current) => !current);
    const toggleEditing = () => setIsEditing((current) => !current);

    // Initialize items with lessons and quizzes
    useEffect(() => {
        const lessons = weekDetails?.lessons || [];
        const quizzes = availableQuizzes.filter(quiz =>
            (weekDetails?.quizIds || []).includes(quiz.id)
        );

        // Combine lessons and quizzes, maintaining order
        const combinedItems = [
            ...lessons.map(lesson => ({
                ...lesson,
                type: 'lesson',
                order: lesson.order || 0
            })),
            ...quizzes.map(quiz => ({
                ...quiz,
                type: 'quiz',
                order: quiz.order || 999 // Place quizzes at the end initially
            }))
        ].sort((a, b) => a.order - b.order);

        setItems(combinedItems);
    }, [weekDetails, availableQuizzes]);

    // Form for creating a new lesson
    const createForm = useForm({
        resolver: zodResolver(createLessonSchema),
        defaultValues: {
            title: "",
            description: "",
            videoUrl: "",
        },
    });

    const {isSubmitting: isCreatingSubmitting, isValid: isCreateFormValid} = createForm.formState;

    // Helper functions
    const formatTimeLimit = (minutes) => {
        if (!minutes) return "No time limit";
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
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

    // --- CREATE LESSON SUBMISSION ---
    const onCreateSubmit = async (values) => {
        try {
            const response = await createLesson({
                ...values,
                weekId,
                courseId,
                order: items.length + 1,
            });

            if (!response.success) {
                throw new Error(response.error || "Failed to create lesson");
            }

            const newLessonWithType = {...response.lesson, type: 'lesson'};
            setItems((prevItems) => [...prevItems, newLessonWithType].sort((a, b) => a.order - b.order));
            toast.success("Lesson created successfully");
            toggleCreating();
            createForm.reset();
            router.refresh();
        } catch (error) {
            toast.error(error.message || "Something went wrong");
            console.error("Error creating lesson:", error);
        }
    };

    // REORDER ITEMS (lessons and quizzes)
    const onReorder = async (updateData) => {
        try {
            setIsUpdating(true);

            // Separate lessons and quizzes for different server actions
            const lessonUpdates = updateData.filter(item => item.type === 'lesson');
            const quizUpdates = updateData.filter(item => item.type === 'quiz');

            // Update lessons order
            if (lessonUpdates.length > 0) {
                const response = await reorderLessons({
                    courseId,
                    weekId,
                    lessons: lessonUpdates
                });

                if (!response.success) {
                    throw new Error(response.error || "Failed to reorder lessons");
                }
            }

            // Update quizzes order (using dummy server action)
            if (quizUpdates.length > 0) {
                // Call dummy server action for quiz reordering
                const response = await reorderQuizzes({
                    courseId,
                    weekId,
                    quizzes: quizUpdates
                });

                if (!response.success) {
                    throw new Error(response.error || "Failed to reorder quizzes");
                }
            }

            // Update local state
            const updatedItems = items.map(item => {
                const update = updateData.find(updateItem => updateItem.id === item.id);
                if (update) {
                    return {...item, order: update.order};
                }
                return item;
            }).sort((a, b) => a.order - b.order);

            setItems(updatedItems);
            toast.success("Items reordered successfully");
            router.refresh();
        } catch (error) {
            toast.error(error.message || "Something went wrong");
            console.error("Error reordering items:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    // EDIT LESSON
    const onEdit = (lessonId) => {
        const lessonToEdit = items.find(item => item.id === lessonId && item.type === 'lesson');
        if (lessonToEdit) {
            setEditingLesson(lessonToEdit);
            toggleEditing();
        } else {
            toast.error("Lesson not found for editing.");
        }
    };

    // SAVE EDITED LESSON
    const handleLessonSave = async (updatedLessonData) => {
        try {
            const response = await updateLesson({
                courseId,
                weekId,
                lessonId: updatedLessonData.id,
                ...updatedLessonData
            });

            if (!response.success) {
                throw new Error(response.error || "Failed to update lesson");
            }

            setItems(prevItems =>
                prevItems.map(item =>
                    item.id === response.lesson.id ? {...response.lesson, type: 'lesson'} : item
                )
            );

            toast.success("Lesson updated successfully");
            toggleEditing();
            router.refresh();
        } catch (error) {
            toast.error(error.message || "Something went wrong");
            console.error("Error saving lesson:", error);
        }
    };

    // EDIT QUIZ SETTINGS
    const onEditQuiz = (quizId) => {
        const quizToEdit = items.find(item => item.id === quizId && item.type === 'quiz');
        if (quizToEdit) {
            setEditingQuiz(quizToEdit);
            setIsEditingQuiz(true);
        } else {
            toast.error("Quiz not found for editing.");
        }
    };

    // SAVE EDITED QUIZ SETTINGS
    const handleQuizSave = async (updatedQuizData) => {
        try {
            const response = await updateQuizSettings({
                courseId,
                weekId,
                quizId: updatedQuizData.id,
                timeLimit: updatedQuizData.timeLimit,
                maxAttempts: updatedQuizData.maxAttempts
            });

            if (!response.success) {
                throw new Error(response.error || "Failed to update quiz settings");
            }

            setItems(prevItems =>
                prevItems.map(item =>
                    item.id === response.quiz.id && item.type === 'quiz' 
                        ? { ...item, timeLimit: response.quiz.timeLimit, maxAttempts: response.quiz.maxAttempts } 
                        : item
                )
            );

            toast.success("Quiz settings updated successfully");
            setIsEditingQuiz(false);
            router.refresh();
        } catch (error) {
            toast.error(error.message || "Something went wrong");
            console.error("Error saving quiz settings:", error);
        }
    };

    // DELETE ITEM (lesson or quiz)
    const onDelete = async (itemId, itemType) => {
        try {
            if (itemType === 'lesson') {
                const response = await deleteLesson({
                    courseId,
                    weekId,
                    lessonId: itemId
                });

                if (!response.success) {
                    throw new Error(response.error || "Failed to delete lesson");
                }
            } else if (itemType === 'quiz') {
                const response = await toggleAddRemoveQuizFromWeek(weekId, itemId);

                if (!response.success) {
                    throw new Error(response.error || "Failed to remove quiz");
                }
            }

            setItems((prevItems) => prevItems.filter(item => item.id !== itemId));
            toast.success(`${itemType === 'lesson' ? 'Lesson' : 'Quiz'} ${itemType === 'lesson' ? 'deleted' : 'removed'} successfully`);
            router.refresh();
        } catch (error) {
            toast.error(error.message || "Something went wrong");
            console.error(`Error deleting ${itemType}:`, error);
        }
    };

    // QUIZ SELECTION (Single quiz only)
    const handleQuizSelect = (quizId) => {
        setSelectedQuiz(prevSelected => prevSelected === quizId ? null : quizId);
    };

    // ADD SELECTED QUIZ
    const handleAddQuiz = async () => {
        try {
            if (!selectedQuiz) {
                toast.error("Please select a quiz to add");
                return;
            }

            const response = await toggleAddRemoveQuizFromWeek(weekId, selectedQuiz);
            console.log("response of lesson-form: ", response);

            if (!response.success) {
                throw new Error(response.error || "Failed to add quiz");
            }

            // Add the selected quiz to the items list
            const selectedQuizData = availableQuizzes.find(quiz => quiz.id === selectedQuiz);

            if (selectedQuizData && !items.some(item => item.id === selectedQuiz)) {
                const newQuiz = {
                    ...selectedQuizData,
                    type: 'quiz',
                    order: items.length
                };

                setItems(prev => [...prev, newQuiz]);
            }

            setIsAddingQuiz(false);
            setSelectedQuiz(null); // Clear selection
            toast.success("Quiz added successfully");
            router.refresh();

        } catch (error) {
            toast.error(error.message || "Something went wrong");
            console.error("Error adding quiz:", error);
        }
    };

    // Drag and drop handlers
    const handleDragStart = (e, index) => {
        e.dataTransfer.setData("text/plain", index.toString());
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));

        if (dragIndex !== dropIndex) {
            const newItems = [...items];
            const draggedItem = newItems[dragIndex];
            newItems.splice(dragIndex, 1);
            newItems.splice(dropIndex, 0, draggedItem);

            // Update order for all items
            const updatedItems = newItems.map((item, index) => ({
                ...item,
                order: index
            }));

            setItems(updatedItems);

            // Call reorder function
            onReorder(updatedItems);
        }
    };

    return (
        <div className="relative mt-6 border rounded-md p-4">
            {isUpdating && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-slate-200/50">
                    <Loader2 className="h-6 w-6 animate-spin text-sky-700"/>
                </div>
            )}

            <div className="font-medium flex items-center justify-between">
                Week Lessons & Quizzes
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={toggleCreating}>
                        {isCreating ? (
                            <>Cancel</>
                        ) : (
                            <>
                                <PlusCircle className="h-4 w-4 mr-2"/>
                                Add Lesson
                            </>
                        )}
                    </Button>
                    <Button variant="ghost" onClick={() => setIsAddingQuiz(true)}>
                        <PlusCircle className="h-4 w-4 mr-2"/>
                        Add Quiz
                    </Button>
                </div>
            </div>

            {/* CREATE LESSON FORM */}
            {isCreating && (
                <Form {...createForm}>
                    <form
                        onSubmit={createForm.handleSubmit(onCreateSubmit)}
                        className="space-y-4 mt-4"
                    >
                        <FormField
                            control={createForm.control}
                            name="title"
                            render={({field}) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            disabled={isCreatingSubmitting}
                                            placeholder="e.g. 'Introduction to HTML Structure'"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={createForm.control}
                            name="description"
                            render={({field}) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea
                                            disabled={isCreatingSubmitting}
                                            placeholder="e.g. 'Learn about the basic structure of HTML documents...'"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={createForm.control}
                            name="videoUrl"
                            render={({field}) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            disabled={isCreatingSubmitting}
                                            placeholder="Video URL (optional)"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <Button disabled={!isCreateFormValid || isCreatingSubmitting} type="submit">
                            Create
                        </Button>
                    </form>
                </Form>
            )}

            {/* ITEMS LIST */}
            {!isCreating && (
                <div className="space-y-3 mt-4">
                    {items.length === 0 ? (
                        <p className="text-slate-500 italic">No lessons or quizzes added yet.</p>
                    ) : (
                        items.map((item, index) => (
                            <Card
                                key={`${item.type}-${item.id}`}
                                className={cn(
                                    "cursor-move transition-all hover:shadow-md",
                                    item.type === 'lesson' ? "border-l-4 border-l-blue-500" : "border-l-4 border-l-green-500"
                                )}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, index)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            <GripVertical className="h-5 w-5 text-gray-400 mt-1"/>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {item.type === 'lesson' ? (
                                                        <Video className="h-4 w-4 text-blue-500"/>
                                                    ) : (
                                                        <BookOpen className="h-4 w-4 text-green-500"/>
                                                    )}
                                                    <h4 className="font-medium">{item.title}</h4>
                                                    <Badge variant="outline" className="text-xs">
                                                        {item.type}
                                                    </Badge>
                                                    {item.type === 'quiz' && (
                                                        <Badge
                                                            className={cn("text-xs", getQuizStatusColor(item.status))}>
                                                            {item.status}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mb-3">
                                                    {item.description || "No description"}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    {item.type === 'lesson' ? (
                                                        <>
                                                            <div className="flex items-center gap-1">
                                                                <span>Access: {item.access || 'free'}</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-1">
                                                                <FileQuestion className="h-3 w-3"/>
                                                                <span>{item._count?.questions || 0} questions</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3"/>
                                                                <span>{formatTimeLimit(item.timeLimit)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Users className="h-3 w-3"/>
                                                                <span>{item.maxAttempts || 1} attempts</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {item.type === 'lesson' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onEdit(item.id)}
                                                    className="text-blue-500 hover:text-blue-700"
                                                >
                                                    <Edit className="h-4 w-4"/>
                                                </Button>
                                            )}
                                            {item.type === 'quiz' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onEditQuiz(item.id)}
                                                    className="text-green-500 hover:text-green-700"
                                                >
                                                    <Edit className="h-4 w-4"/>
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDelete(item.id, item.type)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {!isCreating && items.length > 0 && (
                <p className="text-xs text-muted-foreground mt-4">
                    Drag & Drop to reorder the lessons and quizzes
                </p>
            )}

            {/* QUIZ SELECTION MODAL */}
            {isAddingQuiz && (
                <QuizSelectionModal selectedQuiz={selectedQuiz} formatTimeLimit={formatTimeLimit} items={items}
                                    setIsAddingQuiz={setIsAddingQuiz} availableQuizzes={availableQuizzes}
                                    handleQuizSelect={handleQuizSelect} getQuizStatusColor={getQuizStatusColor}
                                    handleAddQuiz={handleAddQuiz}/>
            )}

            {/* LESSON EDIT MODAL */}
            <LessonModal
                open={isEditing}
                setOpen={toggleEditing}
                lessonData={editingLesson}
                onSave={handleLessonSave}
                courseId={courseId}
                weekId={weekId}
            />

            {/* QUIZ SETTINGS MODAL */}
            <QuizModal
                open={isEditingQuiz}
                setOpen={setIsEditingQuiz}
                quizData={editingQuiz}
                onSave={handleQuizSave}
                courseId={courseId}
                weekId={weekId}
            />
        </div>
    );
};