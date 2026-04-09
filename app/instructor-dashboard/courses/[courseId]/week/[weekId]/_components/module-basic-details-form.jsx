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
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {updateWeek} from "@/app/actions/week";

const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
});

export const ModuleBasicDetailsForm = ({ initialData, courseId, weekId }) => {
    const [isEditing, setIsEditing] = useState(false);
    const router = useRouter();

    const toggleEditing = () => setIsEditing((current) => !current);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: initialData?.title || "",
            description: initialData?.description || "",
        },
    });

    const { isSubmitting, isValid } = form.formState;

    const onSubmit = async (values) => {
        try {
            const response = await updateWeek(weekId, values);

            if (!response.success) {
                throw new Error("Failed to update week");
            }

            toast.success("Week updated successfully");
            toggleEditing();
            router.refresh();
        } catch (error) {
            toast.error("Something went wrong");
            console.error(error);
        }
    };

    return (
        <div className="mt-6 border rounded-md p-4 bg-card">
            <div className="font-medium flex items-center justify-between">
                Week Title & Description
                <Button variant="ghost" onClick={toggleEditing}>
                    {isEditing ? (
                        <>Cancel</>
                    ) : (
                        <>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                        </>
                    )}
                </Button>
            </div>

            {!isEditing && (
                <div className="space-y-2 mt-2">
                    <p className="text-sm font-medium">
                        {initialData?.title || "No title"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {initialData?.description || "No description"}
                    </p>
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
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            disabled={isSubmitting}
                                            placeholder="e.g. 'Introduction to HTML'"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea
                                            disabled={isSubmitting}
                                            placeholder="e.g. 'This week covers HTML basics...'"
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