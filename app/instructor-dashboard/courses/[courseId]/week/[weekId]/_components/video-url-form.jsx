"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { updateLesson } from "@/app/actions/lesson";

const formSchema = z.object({
    url: z.string().min(1, {
        message: "Video URL is required",
    }),
});

export const VideoUrlForm = ({ initialData, courseId, lessonId, weekId }) => {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    // Add local state to track current URL value
    const [currentUrl, setCurrentUrl] = useState(initialData || "");

    const toggleEdit = () => setIsEditing((current) => !current);

    // Initialize form with default values based on initialData
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            url: initialData || "",
        },
    });

    const { isSubmitting, isValid } = form.formState;

    useEffect(() => {
        form.reset({
            url: initialData || "",
        });
        // Update local state when initialData changes
        setCurrentUrl(initialData || "");
    }, [initialData, form]);

    const onSubmit = async (values) => {
        try {
            const payload = {
                videoUrl: values.url,
            };

            await updateLesson(payload, lessonId, courseId, weekId);

            // Update local state immediately after successful update
            setCurrentUrl(values.url);

            toast.success("Lesson video URL updated successfully");
            toggleEdit();
        } catch (error) {
            toast.error(error.message || "Something went wrong");
            console.error("Error updating lesson video:", error);
        }
    };

    return (
        <div className="mt-6 border rounded-md p-4">
            <div className="font-medium flex items-center justify-between">
                Video URL
                <Button variant="ghost" onClick={toggleEdit}>
                    {isEditing ? (
                        <>Cancel</>
                    ) : (
                        <>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit URL
                        </>
                    )}
                </Button>
            </div>
            {!isEditing && (
                <>
                    <p className="text-sm mt-2">
                        {currentUrl || "No URL provided"}
                    </p>
                    {/*!MARK: VIDEO PLAYER*/}
                    {/*<div className="mt-6">*/}
                    {/*    /!* Conditionally render VideoPlayer with current URL *!/*/}
                    {/*    {currentUrl && <VideoPlayer url={currentUrl} />}*/}
                    {/*</div>*/}
                </>
            )}
            {isEditing && (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        {/* URL Field */}
                        <FormField
                            control={form.control}
                            name="url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Video URL</FormLabel>
                                    <FormControl>
                                        <Input
                                            disabled={isSubmitting}
                                            placeholder="e.g. 'https://www.youtube.com/watch?v=...'"
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