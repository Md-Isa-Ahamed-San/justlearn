"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const formSchema = z.object({
  categoryId: z.string().min(1),
});

export const CategoryForm = ({ initialData = {}, courseId }) => { // ✅ Added default value
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialData?.categoryId); // ✅ Added local state

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/category");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Transform categories to match Combobox expected format
        const formattedCategories = data.map((category) => ({
          label: category.title || category.name, // Adjust based on your API response
          value: category.id,
        }));

        setCategories(formattedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

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
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to update course");
      }

      setSelectedCategoryId(values?.categoryId);
      toast.success("Course updated successfully"); 
      toggleEdit();
      router.refresh();
    } catch (error) {
      console.error("Error updating course:", error);
      toast.error("Something went wrong");
    }
  };


  const selectedCategory = categories.find(
    (category) => category.value === selectedCategoryId 
  );

  if (isLoading) {
    return (
      <div className="mt-6 border rounded-md p-4 bg-card">
        <div className="font-medium flex items-center justify-between">
          Course Category
          <Button variant="ghost" disabled>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Category
          </Button>
        </div>
        <p className="text-sm mt-2 text-slate-500">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="mt-6 border rounded-md p-4 bg-card">
      <div className="font-medium flex items-center justify-between">
        Course Category
        <Button variant="ghost" onClick={toggleEdit}>
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Category
            </>
          )}
        </Button>
      </div>

      {!isEditing && (
        <p
          className={cn(
            "text-sm mt-2",
            !selectedCategoryId
          )}
        >
          {selectedCategory?.label || initialData?.category?.title}
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
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Combobox
                      options={categories}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select a category..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2">
              <Button disabled={!isValid || isSubmitting} type="submit">
                Save
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};