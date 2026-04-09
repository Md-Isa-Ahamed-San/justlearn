"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { chalkLog } from "../../../../../utils/logger";
import ImageUploadField from "../../../../../components/image-upload-field";

const mcqFormSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  explanation: z.string().optional(),
  image: z.string().optional(),
  mark: z.number().min(1).default(1),
  optionA: z.object({
    label: z.string().min(1, "Option label is required"),
    isCorrect: z.boolean().default(false),
  }),
  optionB: z.object({
    label: z.string().min(1, "Option label is required"),
    isCorrect: z.boolean().default(false),
  }),
  optionC: z.object({
    label: z.string().min(1, "Option label is required"),
    isCorrect: z.boolean().default(false),
  }),
  optionD: z.object({
    label: z.string().min(1, "Option label is required"),
    isCorrect: z.boolean().default(false),
  }),
});

const shortAnswerFormSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  explanation: z.string().optional(),
  mark: z.number().min(1).default(1),
  correctAnswer: z.string().min(1, "Correct answer is required"),
});

const longAnswerFormSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  explanation: z.string().optional(),
  mark: z.number().min(1).default(1),
  correctAnswer: z.string().min(1, "Sample answer is required"),
});

export const AddQuizForm = ({
  quizId,
  onQuestionAdded,
  onQuestionUpdated,
  onCancel,
  initialData,
  isEditing = false, processing
}) => {
  const [questionType, setQuestionType] = useState(initialData?.type || "mcq");

  // Determine which schema to use based on question type
  const getFormSchema = () => {
    switch (questionType) {
      case "short_answer":
        return shortAnswerFormSchema;
      case "long_answer":
        return longAnswerFormSchema;
      default:
        return mcqFormSchema;
    }
  };

  // Get default values based on question type and initial data
  const getDefaultValues = () => {
    const baseValues = {
      text: initialData?.text || "",
      explanation: initialData?.explanation || "",
      mark: initialData?.mark || 1,
    };

    if (questionType === "mcq") {
      const options = initialData?.options || [];
      return {
        ...baseValues,
        optionA: {
          label: options[0]?.label || "",
          isCorrect: options[0]?.isCorrect || false,
        },
        optionB: {
          label: options[1]?.label || "",
          isCorrect: options[1]?.isCorrect || false,
        },
        optionC: {
          label: options[2]?.label || "",
          isCorrect: options[2]?.isCorrect || false,
        },
        optionD: {
          label: options[3]?.label || "",
          isCorrect: options[3]?.isCorrect || false,
        },
      };
    } else {
      return {
        ...baseValues,
        correctAnswer:
          typeof initialData?.correctAnswer === "string"
            ? initialData.correctAnswer
            : "",
      };
    }
  };

  const form = useForm({
    resolver: zodResolver(getFormSchema()),
    mode: "all",
    defaultValues: getDefaultValues(),
  });

  const { isSubmitting, isValid } = form.formState;

  // Reset form when question type changes
  const handleQuestionTypeChange = (newType) => {
    setQuestionType(newType);
    form.reset(getDefaultValues());
  };

  const onSubmit = async (values) => {
    try {
      let structuredQuestion;

      if (questionType === "mcq") {
        // Validate that at least one option is correct
        const hasCorrectAnswer = [
          values.optionA.isCorrect,
          values.optionB.isCorrect,
          values.optionC.isCorrect,
          values.optionD.isCorrect,
        ].some(Boolean);

        if (!hasCorrectAnswer) {
          toast.error("Please select at least one correct answer");
          return;
        }

        structuredQuestion = {
          id: initialData?.id || `temp-${Date.now()}`,
          type: "mcq",
          text: values.text,
          image: values.image,
          options: [
            {
              label: values.optionA.label,
              isCorrect: values.optionA.isCorrect,
            },
            {
              label: values.optionB.label,
              isCorrect: values.optionB.isCorrect,
            },
            {
              label: values.optionC.label,
              isCorrect: values.optionC.isCorrect,
            },
            {
              label: values.optionD.label,
              isCorrect: values.optionD.isCorrect,
            },
          ],
          correctAnswer: values.optionA.isCorrect
            ? "A"
            : values.optionB.isCorrect
            ? "B"
            : values.optionC.isCorrect
            ? "C"
            : "D",
          explanation: values.explanation || "",
          mark: values.mark,
          order: initialData?.order || 0,
          isFromPool: false,
        };
      } else {
        // Short answer or long answer
        structuredQuestion = {
          id: initialData?.id || `temp-${Date.now()}`,
          type: questionType,
          text: values.text,
          image: values.image,
          correctAnswer: values.correctAnswer,
          explanation: values.explanation || "",
          mark: values.mark,
          order: initialData?.order || 0,
          isFromPool: false,
        };
      }

      if (isEditing && onQuestionUpdated) {
        onQuestionUpdated(structuredQuestion);
      } else if (onQuestionAdded) {
        onQuestionAdded(structuredQuestion);
      }
      // chalkLog.log(structuredQuestion)
      // Reset form if not editing
      if (!isEditing) {
        form.reset(getDefaultValues());
        setQuestionType("mcq");
      }
    } catch (error) {
      console.error("Error submitting question:", error);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="mt-6 border rounded-md p-4">
      <div className="font-medium flex items-center justify-between mb-4">
        <h3>{isEditing ? "Edit Question" : "Add New Question"}</h3>
        <div className="flex items-center gap-2">
          <Select
            value={questionType}
            onValueChange={handleQuestionTypeChange}
            disabled={isSubmitting}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Question Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mcq">Multiple Choice</SelectItem>
              <SelectItem value="short_answer">Short Answer</SelectItem>
              <SelectItem value="long_answer">Long Answer</SelectItem>
            </SelectContent>
          </Select>
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Question Text */}
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Question Text</FormLabel>
                <FormControl>
                  <Textarea
                    disabled={isSubmitting}
                    placeholder="Enter your question here..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Upload Image (Optional)</FormLabel>
                <FormControl>
                  <ImageUploadField
                    field={field}
                    form={form}
                    isSubmitting={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Question Mark */}
          <FormField
            control={form.control}
            name="mark"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Points</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    disabled={isSubmitting}
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 1)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* MCQ Options */}
          {questionType === "mcq" && (
            <>
              {["A", "B", "C", "D"].map((letter, index) => {
                const fieldName = `option${letter}`;
                return (
                  <div key={letter} className="space-y-3">
                    <FormLabel>Option {letter}</FormLabel>
                    <div className="flex items-start gap-3">
                      <FormField
                        control={form.control}
                        name={`${fieldName}.isCorrect`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex-1">
                        <FormField
                          control={form.control}
                          name={`${fieldName}.label`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  disabled={isSubmitting}
                                  placeholder={`Enter option ${letter}`}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Short/Long Answer */}
          {(questionType === "short_answer" ||
            questionType === "long_answer") && (
            <FormField
              control={form.control}
              name="correctAnswer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {questionType === "short_answer"
                      ? "Correct Answer"
                      : "Sample Answer"}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={isSubmitting}
                      placeholder={
                        questionType === "short_answer"
                          ? "Enter the correct answer..."
                          : "Enter a sample answer or key points..."
                      }
                      rows={questionType === "long_answer" ? 5 : 2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Explanation */}
          <FormField
            control={form.control}
            name="explanation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Explanation (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    disabled={isSubmitting}
                    placeholder="Provide an explanation for the answer..."
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-end gap-x-2">
            <Button disabled={!isValid || isSubmitting} type="submit">
              {processing? "Processing...": (isEditing ? "Update Question" : "Add Question")}
                </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
