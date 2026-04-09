"use client";

import {Button} from "@/components/ui/button";
import {useState} from "react";
import {toast} from "sonner";
import {Eye, EyeOff} from "lucide-react";

export const QuizSetAction = ({
                                  disabled,
                                  quizId,
                                  isPublished,
                                  onPublishToggle
                              }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleTogglePublish = async () => {
        if (!onPublishToggle) return;

        setIsLoading(true);
        try {
            await onPublishToggle();
        } catch (error) {
            toast.error("Failed to update quiz status");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={handleTogglePublish}
            disabled={disabled || isLoading}
            variant={isPublished ? "outline" : "default"}
            size="sm"
            className="bg-accent"
        >
            Toggle Status
        </Button>
    );
};