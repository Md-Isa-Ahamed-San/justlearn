"use client";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useUserData } from "../../../../provider/user-data-provider";
import { BookOpen, Brain, Shuffle } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required!",
  }),
  description: z.string().min(1, {
    message: "Description is required!",
  }),
  generationType: z.enum(["manual", "ai_fixed", "ai_pool"], {
    required_error: "Please select a quiz generation type",
  }),
});

const AddQuizSet = () => {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      generationType: "", // Ensure this is an empty string or one of the enum values if you want a default selected
    },
  });

  const {userData} = useUserData()

  const { isSubmitting, isValid } = form.formState;

  // Quiz type configurations
  const quizTypeConfig = {
    manual: {
      icon: BookOpen,
      label: "Manual Quiz",
      description: "Create questions manually with full control",
      color: "text-purple-600 dark:text-purple-400",
    },
    ai_fixed: {
      icon: Brain,
      label: "AI Fixed Questions",
      description: "AI creates a fixed set of questions",
      color: "text-blue-600 dark:text-blue-400",
    },
    ai_pool: {
      icon: Shuffle,
      label: "AI Question Pool",
      description: "AI creates a pool for randomized questions",
      color: "text-green-600 dark:text-green-400",
    },
  };

  const onSubmit = async (values) => {
    let instructorId = userData?.userData?.id
    let payloads = {...values, instructorId}
    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloads),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "An unknown error occurred" }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData && responseData.id) {
        toast.success("Quiz Set Created!");
        router.push(`/instructor-dashboard/quiz-sets/${responseData.id}`);
      } else {
        console.error("API response missing ID:", responseData);
        toast.error("Quiz Set created, but failed to get ID for redirection.");
      }

    } catch (error) {
      console.error("Error creating quiz set:", error);
      toast.error(error.message || "Something went wrong while creating the quiz set.");
    }
  };

  return (
    // This outer div centers the form on the page
    <div className="max-w-5xl mx-auto flex md:items-center md:justify-center h-full p-4 sm:p-6">
      {/* 
        MODIFICATION: Added card styling to this div to make the form stand out.
        - bg-card: Uses your theme's card background color.
        - rounded-lg: Applies consistent border radius.
        - shadow-lg: Adds a more prominent shadow.
        - p-6 md:p-8: Increased padding for better internal spacing.
      */}
      <div className="max-w-full w-[536px] bg-card p-6 md:p-8 rounded-lg shadow-lg">
        <div className="mb-6"> {/* Consider mb-8 if more space is desired before the form */}
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Create New Quiz Set
          </h1>
          <p className="text-sm text-muted-foreground"> {/* text-sm for subtitle consistency */}
            Set up your quiz with basic information and choose how you want to generate questions.
          </p>
        </div>
        
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            /* 
              MODIFICATION: Reduced space-y from 8 to 6 for a slightly more compact form.
              Kept mt-8 for separation from the header.
            */
            className="space-y-6 mt-8"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quiz Set Title</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="e.g 'Chapter 1: Introduction to Algebra'"
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
                  <FormLabel>Quiz Set Description</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={isSubmitting}
                      placeholder="e.g 'A comprehensive quiz covering the fundamental concepts of algebra...'"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="generationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quiz Generation Type</FormLabel>
                  <FormControl>
                    <Select
                      disabled={isSubmitting}
                      onValueChange={field.onChange}
                      value={field.value || undefined} // Ensure value is undefined if empty for placeholder to show
                    >
                      {/* MODIFICATION: Added text-sm to SelectTrigger for consistency if needed, h-12 is quite specific */}
                      <SelectTrigger className="w-full h-12 text-sm">
                        <SelectValue placeholder="Select how you want to create quiz questions" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(quizTypeConfig).map(([value, config]) => {
                          const Icon = config.icon;
                          return (
                            <SelectItem key={value} value={value} className="py-3">
                              {/* 
                                MODIFICATION: Changed to items-start for better alignment if description text wraps.
                              */}
                              <div className="flex items-start gap-3">
                                <Icon className={`h-5 w-5 ${config.color}`} /> {/* Slightly larger icon if preferred */}
                                <div className="text-left">
                                  <div className="font-medium text-sm">{config.label}</div>
                                  <div className="text-xs text-muted-foreground whitespace-normal"> {/* Allow wrapping */}
                                    {config.description}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                  
                  {field.value && quizTypeConfig[field.value] && (
                    /* 
                      MODIFICATION: Increased margin-top and padding for this info box.
                      Using bg-muted (which should pick up your theme's muted color) and border.
                    */
                    <div className="mt-4 p-4 rounded-md bg-muted border"> {/* rounded-md for consistency with other elements */}
                      <div className="flex items-start gap-3"> {/* items-start and gap-3 for consistency */}
                        {(() => {
                          const Icon = quizTypeConfig[field.value].icon;
                          // Ensure icon size and color match the select item for consistency
                          return <Icon className={`h-5 w-5 mt-0.5 ${quizTypeConfig[field.value].color}`} />;
                        })()}
                        <div>
                          <h4 className="font-medium text-sm text-foreground">
                            {quizTypeConfig[field.value].label}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {quizTypeConfig[field.value].description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </FormItem>
              )}
            />
            
            {/* MODIFICATION: Added pt-2 or pt-4 for a little more separation above buttons */}
            <div className="flex items-center gap-x-2 pt-4">
              <Link href="/instructor-dashboard/quiz-sets">
                <Button variant="outline" type="button" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={!isValid || isSubmitting}>
                Create Quiz Set
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AddQuizSet;