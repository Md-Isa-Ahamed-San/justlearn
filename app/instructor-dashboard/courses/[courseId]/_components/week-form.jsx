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
import { cn } from "@/lib/utils";
import { Loader2, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { WeekList} from "./week-list";
import {createWeek} from "@/app/actions/week";

const formSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

const initialWeeks = [
  {
    id: "1",
    title: "Week 1",
    isPublished: true,
  },
  {
    id: "2",
    title: "Week 2",
  },
];

export const WeeksForm = ({ weekData, courseId, isCompleted = false }) => {
  const [weeks, setWeeks] = useState(weekData);
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleCreating = () => setIsCreating((current) => !current);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values) => {
    try {
      const newWeek = await createWeek(courseId, { // Pass courseId and form values
        title: values.title,
        description: values.description,
        order: weeks?.length+1||1,
      });

      setWeeks((weeks) => [
        ...weeks,
          newWeek
        // {
        //   id: Date.now().toString(),
        //   title: values.title,
        //   description: values.description,
        // },
      ]);
      toast.success("Week created");
      toggleCreating();
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const onReorder = async (updateData) => {
    console.log({ updateData });
    try {
      setIsUpdating(true);

      toast.success("Chapters reordered");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  const onEdit = (id) => {
    router.push(`/instructor-dashboard/courses/${courseId}/week/${id}`);
  };

  return (
      <div className="relative mt-6 border rounded-md p-4 bg-card">
        {isUpdating && (
            <div className="absolute h-full w-full 0/20 top-0 right-0 rounded-md flex items-center justify-center">
              <Loader2 className="animate-spin h-6 w-6 text-sky-700" />
            </div>
        )}
        <div className="font-medium flex items-center justify-between">
          Course Weeks
          <Button
            variant="ghost"
            onClick={toggleCreating}
            disabled={isCompleted}
            title={isCompleted ? "Reopen the course to add weeks" : ""}
          >
            {isCreating ? (
                <>Cancel</>
            ) : (
                <>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add a week
                </>
            )}
          </Button>
        </div>

        {isCreating && (
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
                                placeholder="e.g. 'Introduction to the course...'"
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
                                placeholder="e.g. 'Detailed description of the week...'"
                                {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                    )}
                />
                <Button disabled={!isValid || isSubmitting} type="submit">
                  Create
                </Button>
              </form>
            </Form>
        )}
        {!isCreating && (
            <div
                className={cn(
                    "text-sm mt-2",
                    !weeks?.length && " italic"
                )}
            >
              {!weeks?.length && "No module"}
              <WeekList
                  onEdit={onEdit}
                  onReorder={onReorder}
                  items={weeks || []}
              />
            </div>
        )}
        {!isCreating && (
            <p className="text-xs text-muted-foreground mt-4">
              Drag & Drop to reorder the weeks
            </p>
        )}
      </div>
  );
};