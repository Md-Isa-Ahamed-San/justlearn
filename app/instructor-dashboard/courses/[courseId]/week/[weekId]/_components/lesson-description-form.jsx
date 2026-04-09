"use client";

import {useState, useEffect} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";
import {Button} from "@/components/ui/button";
import {Form, FormControl, FormField, FormItem, FormMessage} from "@/components/ui/form";
import {Textarea} from "@/components/ui/textarea";
import {Pencil} from "lucide-react";
import {cn} from "@/lib/utils";
import {toast} from "sonner";
import {updateLesson} from "@/app/actions/lesson";

const formSchema = z.object({
    description: z.string().min(1, "Description is required"),
});

export const LessonDescriptionForm = ({
                                          descriptionData,
                                          courseId,
                                          lessonId,
                                          weekId
                                      }) => {
    const [isEditing, setIsEditing] = useState(false);
    // Add local state to track current description
    const [currentDescription, setCurrentDescription] = useState(descriptionData || "");

    const toggleEdit = () => setIsEditing((current) => !current);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            description: descriptionData || "",
        },
    });

    const {isSubmitting, isValid} = form.formState;

    // Reset form when descriptionData changes
    useEffect(() => {
        if (descriptionData !== undefined) {
            form.reset({description: descriptionData});
            // Update local state when descriptionData changes
            setCurrentDescription(descriptionData || "");
        }
    }, [descriptionData, form]);

    const onSubmit = async (values) => {
        try {
            await updateLesson(values, lessonId, courseId, weekId);

            // Update local state immediately after successful update
            setCurrentDescription(values.description);

            toast.success("Lesson description updated successfully");
            toggleEdit();
        } catch (error) {
            toast.error(error.message || "Something went wrong");
            console.error("Error updating lesson description:", error);
        }
    };

    // Simple markdown-like formatting
    const formatText = (text) => {
        if (!text) return "";

        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic*
            .replace(/\n/g, '<br>') // line breaks
            .replace(/^# (.*$)/gm, '<h3>$1</h3>') // # headers
            .replace(/^## (.*$)/gm, '<h4>$1</h4>') // ## headers
            .replace(/^- (.*$)/gm, '<li>$1</li>') // - bullet points
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>'); // wrap lists
    };

    return (
        <div className="mt-6 border rounded-md p-4">
            <div className="font-medium flex items-center justify-between">
                Lesson Description
                <Button variant="ghost" onClick={toggleEdit}>
                    {isEditing ? (
                        <>Cancel</>
                    ) : (
                        <>
                            <Pencil className="h-4 w-4 mr-2"/>
                            Edit description
                        </>
                    )}
                </Button>
            </div>

            {!isEditing && (
                <div
                    className={cn(
                        "text-sm mt-2 text-white",
                        !currentDescription && " italic"
                    )}
                >
                    {!currentDescription ? (
                        <p>No description provided</p>
                    ) : (
                        <div
                            className="prose prose-sm max-w-none text-foreground"
                            dangerouslySetInnerHTML={{__html: formatText(currentDescription)}}
                        />
                    )}
                </div>
            )}

            {isEditing && (
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4 mt-4"
                    >
                        <FormField
                            control={form.control}
                            name="description"
                            render={({field}) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="Enter lesson description... (Use **bold**, *italic*, # headers, - bullet points)"
                                            className="resize-none"
                                            rows={8}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <div className="flex items-center gap-x-2">
                            <Button disabled={!isValid || isSubmitting} type="submit">
                                Save
                            </Button>
                        </div>
                    </form>
                </Form>
            )}
        </div>
    );
};