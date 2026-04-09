"use client";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
    learning: z.array(z.string().min(1, "Learning objective cannot be empty")).min(1, "At least one learning objective is required"),
});

export const LearningForm = ({ initialData = {}, courseId }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [learning, setLearning] = useState(initialData?.learning || []);

    const toggleEdit = () => setIsEditing((current) => !current);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            learning: initialData?.learning || [""],
        },
    });

    const { isSubmitting, isValid } = form.formState;

    const onSubmit = async (values) => {
        try {
            // Filter out empty strings
            const filteredLearning = values.learning.filter(item => item.trim() !== "");

            const response = await fetch(`/api/courses/${courseId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-cache",
                },
                body: JSON.stringify({ learning: filteredLearning }),
            });

            if (!response.ok) {
                throw new Error("Failed to update course");
            }

            setLearning(filteredLearning);
            toast.success("Learning objectives updated successfully");
            toggleEdit();
        } catch (error) {
            console.error("Error updating course:", error);
            toast.error("Something went wrong");
        }
    };

    const addLearningObjective = () => {
        const currentLearning = form.getValues("learning");
        form.setValue("learning", [...currentLearning, ""], { shouldValidate: true });
    };

    const removeLearningObjective = (index) => {
        const currentLearning = form.getValues("learning");
        if (currentLearning.length > 1) {
            const newLearning = currentLearning.filter((_, i) => i !== index);
            form.setValue("learning", newLearning, { shouldValidate: true });
        }
    };

    return (
        <div className="mt-6 border border-border rounded-md p-4 bg-card">
            <div className="font-medium flex items-center justify-between text-card-foreground font-poppins font-bold">
                Learning Objectives
                <Button variant="ghost" onClick={toggleEdit} className="text-foreground hover:bg-accent hover:text-accent-foreground">
                    {isEditing ? (
                        <>Cancel</>
                    ) : (
                        <>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Learning Objectives
                        </>
                    )}
                </Button>
            </div>

            {!isEditing && (
                <div className="mt-2">
                    {learning && learning.length > 0 ? (
                        <ul className="space-y-2">
                            {learning.map((objective, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-card-foreground">
                                    <span className="text-muted-foreground mt-1">•</span>
                                    <span>{objective}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">
                            No learning objectives set
                        </p>
                    )}
                </div>
            )}

            {isEditing && (
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4 mt-4"
                    >
                        <div className="space-y-2">
                            {form.watch("learning").map((_, index) => (
                                <FormField
                                    key={index}
                                    control={form.control}
                                    name={`learning.${index}`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        disabled={isSubmitting}
                                                        placeholder="e.g. 'Understand advanced React concepts'"
                                                        className="bg-input border-border text-foreground"
                                                        {...field}
                                                    />
                                                    {form.watch("learning").length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeLearningObjective(index)}
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={addLearningObjective}
                            className="w-full border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Learning Objective
                        </Button>

                        <div className="flex items-center gap-x-2">
                            <Button
                                disabled={!isValid || isSubmitting}
                                type="submit"
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                Save
                            </Button>
                        </div>
                    </form>
                </Form>
            )}
        </div>
    );
};