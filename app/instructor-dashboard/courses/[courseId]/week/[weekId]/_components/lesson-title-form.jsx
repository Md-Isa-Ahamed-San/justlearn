"use client";

import { zodResolver} from "@hookform/resolvers/zod";
import { useForm} from "react-hook-form";
import * as z from "zod";

import { Button} from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Input} from "@/components/ui/input";
import { Pencil} from "lucide-react";
import {useRouter} from "next/navigation";
import {useState, useEffect} from "react";
import {toast} from "sonner";
import {updateLesson} from "@/app/actions/lesson";

const formSchema = z.object({
    title: z.string().min(1),
});

export const LessonTitleForm = ({ initialData, courseId, lessonId, weekId }) => {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    // Add local state to track current title
    const [currentTitle, setCurrentTitle] = useState(initialData || "");

    const toggleEdit = () => setIsEditing((current) => !current);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: initialData || "",
        },
    });

    const { isSubmitting, isValid } = form.formState;

    // Add useEffect to reset the form when initialData changes
    useEffect(() => {
        if (initialData !== undefined) {
            form.reset({ title: initialData });
            // Update local state when initialData changes
            setCurrentTitle(initialData || "");
        }
    }, [initialData, form]);

    const onSubmit = async (values) => {
        try {
            await updateLesson(values, lessonId, courseId, weekId);

            // Update local state immediately after successful update
            setCurrentTitle(values.title);

            toast.success("Lesson Title updated successfully");
            toggleEdit();
        } catch (error) {
            toast.error(error.message || "Something went wrong");
            console.error("Error updating lesson title:", error);
        }
    };

    return (
        <div className="mt-6 border rounded-md p-4">
            <div className="font-medium flex items-center justify-between">
                Lesson title
                <Button variant="ghost" onClick={toggleEdit}>
                    {isEditing ? (
                        <>Cancel</>
                    ) : (
                        <>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Title
                        </>
                    )}
                </Button>
            </div>
            {!isEditing && (
                <p className="text-sm mt-2">{currentTitle}</p>
            )}
            {isEditing && (
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4 mt-4"
                    >
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            disabled={isSubmitting}
                                            placeholder="e.g. 'Introduction to the course'"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
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