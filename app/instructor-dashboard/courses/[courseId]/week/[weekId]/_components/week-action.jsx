"use client";

import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {updateWeek} from "@/app/actions/week";


export const WeekActions = ({ status, weekId, courseId ,disabled }) => {
    const [currentStatus, setCurrentStatus] = useState(status===true? "published":"draft");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
console.log("statusstatusstatus: ",status)
    const isPublished = currentStatus === "published";

    const handleToggleStatus = async () => {
        const newStatus = isPublished ? "draft" : "published";

        setIsLoading(true);

        try {
            const result = await updateWeek(weekId, {
                status: newStatus
            });

            if (result.success) {
                setCurrentStatus(newStatus);
                toast.success(`Week ${newStatus === 'published' ? 'published' : 'saved as draft'} successfully`);
                router.refresh();
            } else {
                toast.error(result.error || "Failed to update week");
            }
        } catch (error) {
            console.error("Error updating week:", error);
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteWeek = async () => {
        if (!confirm("Are you sure you want to delete this week? This action cannot be undone.")) {
            return;
        }

        setIsLoading(true);

        try {
            // You'll need to create a deleteWeek server action for this
            // For now, keeping the API call or you can create a deleteWeek action
            const response = await fetch(`/api/weeks/${weekId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete week");
            }

            toast.success("Week deleted successfully");
            router.refresh(); // or redirect to weeks list
        } catch (error) {
            console.error("Error deleting week:", error);
            toast.error("Failed to delete week");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-x-2">
            <p className="text-sm font-medium bg-card text-card-foreground p-3 rounded-lg border border-border">
                Status: {isPublished ? "Published." : "Draft."}
            </p>

            <Button
                onClick={handleToggleStatus}
                disabled={disabled || isLoading}
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
                {isLoading ? "Updating..." : "Toggle Status"}
            </Button>

            <Button
                size="sm"
                variant="destructive"
                onClick={handleDeleteWeek}
                disabled={disabled || isLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
                <Trash className="h-4 w-4" />
            </Button>
        </div>
    );
};