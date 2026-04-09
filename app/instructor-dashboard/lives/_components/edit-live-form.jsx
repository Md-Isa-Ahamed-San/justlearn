"use client";

import { deleteLiveSession, updateLiveSession } from "@/app/actions/live";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required!" }),
  date: z.date({ required_error: "Date is required!" }),
  time: z.string({ required_error: "Time is required!" }).min(1, { message: "Time is required!" }),
  description: z.string().min(1, { message: "Description is required!" }),
  meetLink: z.string().min(1, { message: "Meeting Link is required!" }),
  videoId: z.string().optional(),
});

export const EditLiveForm = ({ initialData, liveId }) => {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData.title || "",
      description: initialData.description || "",
      date: initialData.schedule ? new Date(initialData.schedule) : new Date(),
      time: initialData.schedule ? new Date(initialData.schedule).toTimeString().slice(0, 5) : "",
      meetLink: initialData.meetLink || "",
      videoId: initialData.videoId || "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values) => {
    try {
        const response = await updateLiveSession(liveId, values);
        if (response.success) {
            toast.success("Live session updated");
            router.push(`/instructor-dashboard/lives`);
            router.refresh();
        } else {
            toast.error(response.error || "Something went wrong");
        }
    } catch (error) {
        toast.error("Something went wrong");
    }
  };

  const handleDelete = async () => {
      if (confirm("Are you sure you want to delete this session?")) {
        try {
            const response = await deleteLiveSession(liveId);
            if (response.success) {
                toast.success("Live session deleted");
                router.push(`/instructor-dashboard/lives`);
                router.refresh();
            } else {
                toast.error(response.error || "Failed to delete");
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
      }
  }

  return (
    <div className="max-w-5xl mx-auto flex md:items-center md:justify-center h-full p-6">
      <div className="max-w-full w-[536px]">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Edit Live Session</h1>
            <Button variant="destructive" size="sm" onClick={handleDelete} type="button">Delete</Button>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8"
          >
            {/* title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Live Title</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="e.g 'Reactive Accelerator'"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* time */}
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <Input
                      className="block"
                      disabled={isSubmitting}
                      placeholder="Select time"
                      {...field}
                      type="time"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* meetLink */}
            <FormField
              control={form.control}
              name="meetLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Link</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="e.g https://meet.google.com/..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Paste the link to your meeting (Zoom, Google Meet, etc.)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recording URL (videoId) */}
            <FormField
              control={form.control}
              name="videoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recording URL</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="e.g https://youtube.com/watch?v=... (paste after session ends)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Paste a YouTube or video URL for students to watch the recording after the session.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Live Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Live overview"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2">
              <Link href="/instructor-dashboard/lives">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};
