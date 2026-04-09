"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const quizSettingsSchema = z.object({
  timeLimit: z.coerce.number().min(0, "Time limit must be 0 or greater"),
  maxAttempts: z.coerce.number().min(1, "At least 1 attempt is required"),
});

export const QuizModal = ({
  open,
  setOpen,
  quizData,
  onSave,
  courseId,
  weekId,
}) => {
  const form = useForm({
    resolver: zodResolver(quizSettingsSchema),
    defaultValues: {
      timeLimit: 5,
      maxAttempts: 1,
    },
  });

  const { isSubmitting, isValid } = form.formState;

  useEffect(() => {
    if (quizData) {
      form.reset({
        timeLimit: quizData.timeLimit !== null && quizData.timeLimit !== undefined ? quizData.timeLimit : 5,
        maxAttempts: quizData.maxAttempts !== null && quizData.maxAttempts !== undefined ? quizData.maxAttempts : 1,
      });
    }
  }, [quizData, form, open]);

  const onSubmit = async (values) => {
    try {
      await onSave({
        id: quizData.id,
        ...values,
      });
      setOpen(false);
    } catch (error) {
      toast.error("Failed to update quiz settings");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Quiz Settings</DialogTitle>
          <DialogDescription>
            Update duration and attempts for '{quizData?.title || "this quiz"}'.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="timeLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Limit (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxAttempts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Attempts Allowed</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-x-2 pt-4">
              <Button
                variant="outline"
                type="button"
                disabled={isSubmitting}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button disabled={!isValid || isSubmitting} type="submit">
                Save changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
