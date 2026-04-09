"use client";

import { manuallyCompleteCourse } from "@/app/actions/course";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function ForceCompleteButton({ userId, courseId, isCompleted }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleForceComplete = async () => {
        try {
            const confirmAction = window.confirm(
                "Are you sure you want to force complete this course for this student? This will issue a certificate."
            );
            if (!confirmAction) return;

            setLoading(true);
            const res = await manuallyCompleteCourse(userId, courseId);
            if (res.success) {
                toast.success("Course marked as complete and certificate issued.");
                router.refresh();
            }
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            disabled={isCompleted || loading}
            onClick={handleForceComplete}
            variant="secondary"
            className="bg-green-600/10 text-green-500 hover:bg-green-600/20 border-green-600/20"
        >
            <CheckCircle className="h-4 w-4 mr-2" />
            {loading ? "Completing..." : "Force Complete Course"}
        </Button>
    );
}
