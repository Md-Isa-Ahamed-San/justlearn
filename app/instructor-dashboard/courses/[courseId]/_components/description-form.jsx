"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
  description: z.string().min(1, {
    message: "Description is required",
  }),
});

export const DescriptionForm = ({ initialData = {}, courseId, revalidate }) => {
  // const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(initialData?.description);

  const toggleEdit = () => setIsEditing((current) => !current);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values) => {
    try {

      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to update course");
      }

      setDescription(values?.description);
      toast.success("Course updated successfully");
      toggleEdit();
    } catch (error) {
      console.error("Error updating course:", error);
      toast.error("Something went wrong");
    }
  };

  return (
      <div className="mt-6 border border-border rounded-md p-4 bg-card">
        <div className="font-medium flex items-center justify-between text-card-foreground font-poppins font-bold">
          Course Description
          <Button variant="ghost" onClick={toggleEdit} className="text-foreground hover:bg-accent hover:text-accent-foreground">
            {isEditing ? (
                <>Cancel</>
            ) : (
                <>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Description
                </>
            )}
          </Button>
        </div>
        {!isEditing && (
            <p
                className={cn(
                    "text-sm mt-2 text-card-foreground",
                    !description && "text-muted-foreground italic"
                )}
            >
              {description || "No description"}
            </p>
        )}
        {isEditing && (
            <Form {...form}>
              <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4 mt-4"
              >
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                                disabled={isSubmitting}
                                placeholder="e.g. 'This course is about...'"
                                className="bg-input border-border text-foreground"
                                {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex items-center gap-x-2">
                  <Button disabled={!isValid || isSubmitting} type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Save
                  </Button>
                </div>
              </form>
            </Form>
        )}
      </div>
  );
};