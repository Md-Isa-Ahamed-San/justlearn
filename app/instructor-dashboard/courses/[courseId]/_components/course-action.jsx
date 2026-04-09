"use client";

import { Trash, CheckCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";

export const CourseActions = ({ status, courseId, disabled, isCompleted: initialIsCompleted }) => {
    const [currentStatus, setCurrentStatus] = useState(status);
    const [isCompleted, setIsCompleted] = useState(initialIsCompleted ?? false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const isPublished = currentStatus === "public";

    const patchCourse = async (payload, successMsg, errorMsg) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/courses/${courseId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || errorMsg);
            }

            toast.success(successMsg);
            router.refresh();
            return data;
        } catch (error) {
            console.error("Error updating course:", error);
            toast.error(error.message || "Something went wrong");
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleStatus = async () => {
        if (isCompleted) {
            toast.warning("Reopen the course first before changing its published status.");
            return;
        }
        const newStatus = isPublished ? "private" : "public";
        const result = await patchCourse(
            { visibility: newStatus },
            `Course ${newStatus === "public" ? "published" : "saved as draft"} successfully`,
            "Failed to update status"
        );
        if (result) setCurrentStatus(newStatus);
    };

    const handleToggleCompleted = async () => {
        if (!isPublished && !isCompleted) {
            toast.error("Publish the course before marking it as completed.");
            return;
        }
        const newCompleted = !isCompleted;
        const result = await patchCourse(
            { isCompleted: newCompleted },
            newCompleted
                ? "Course marked as completed. Students can now download certificates."
                : "Course reopened. Students can resume adding progress.",
            "Failed to update completion status"
        );
        if (result) setIsCompleted(newCompleted);
    };

    const handleDeleteCourse = async () => {
        if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Failed to delete course");
            toast.success("Course deleted successfully");
            router.push("/instructor-dashboard/courses");
        } catch (error) {
            console.error("Error deleting course:", error);
            toast.error("Failed to delete course");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-x-2 flex-wrap gap-y-2">
            {/* Status badges */}
            <div className="flex items-center gap-2">
                <Badge variant={isPublished ? "default" : "secondary"}>
                    {isPublished ? "Published" : "Draft"}
                </Badge>
                {isCompleted && (
                    <Badge variant="success" className="bg-green-600 text-white">
                        Completed
                    </Badge>
                )}
            </div>

            {/* Publish / Unpublish toggle */}
            <Button
                onClick={handleToggleStatus}
                disabled={disabled || isLoading}
                size="sm"
                variant={isPublished ? "outline" : "default"}
                className="bg-foreground text-background hover:bg-foreground/90"
            >
                {isLoading ? "Updating..." : isPublished ? "Unpublish" : "Publish"}
            </Button>

            {/* Mark Complete / Reopen toggle */}
            <Button
                onClick={handleToggleCompleted}
                disabled={disabled || isLoading || (!isPublished && !isCompleted)}
                size="sm"
                variant={isCompleted ? "outline" : "default"}
                className={isCompleted ? "" : "bg-green-600 hover:bg-green-700 text-white"}
                title={!isPublished && !isCompleted ? "Publish the course first" : ""}
            >
                {isCompleted ? (
                    <>
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Reopen
                    </>
                ) : (
                    <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Complete
                    </>
                )}
            </Button>

            {/* Delete */}
            <Button
                size="sm"
                variant="destructive"
                onClick={handleDeleteCourse}
                disabled={disabled || isLoading}
            >
                <Trash className="h-4 w-4" />
            </Button>
        </div>
    );
};