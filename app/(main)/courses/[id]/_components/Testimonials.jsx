"use client";
import React, { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Edit, Trash2, MessageSquare, Quote } from "lucide-react"; // Added Quote icon
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useUserData } from "../../../../../provider/user-data-provider";
import { useParams } from "next/navigation";
import {
  onDeleteTestimonial,
  onSubmitTestimonial,
  onEditTestimonial,
} from "../../../../actions/testimonials";

const Testimonials = ({ testimonials = [] }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const { userData } = useUserData();
  const { id: courseId } = useParams();

  const currentUserTestimonial = testimonials.find(
    (t) => t.userId === userData?.userData?.id
  );

  const getUserProfilePicture = (testimonialUser) => {
    if (!testimonialUser) return "/placeholder.svg";
    return (
      testimonialUser.student?.profilePicture ||
      testimonialUser.admin?.profilePicture ||
      testimonialUser.image ||
      "/placeholder.svg"
    );
  };

  const getUserDesignation = (testimonialUser) => {
    if (!testimonialUser) return "";
    if (testimonialUser.instructor?.designation) {
      return testimonialUser.instructor.designation;
    }
    if (testimonialUser.admin?.designation) {
      return testimonialUser.admin.designation;
    }
    if (testimonialUser.role) {
      return (
        testimonialUser.role.charAt(0).toUpperCase() +
        testimonialUser.role.slice(1)
      );
    }
    return "";
  };

  const getRoleBadge = (testimonialUser) => {
    if (!testimonialUser?.role) return null;
    const roleConfig = {
      student: { label: "Student", className: "bg-blue-100 text-blue-800" },
      instructor: { label: "Instructor", className: "bg-purple-100 text-purple-800" },
      admin: { label: "Admin", className: "bg-red-100 text-red-800" },
    };
    const config = roleConfig[testimonialUser.role] || {
      label: "User",
      className: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge variant="outline" className={cn("text-xs", config.className)}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // useCallback: stabilizes onClick references across frequent state changes
  // (rating, content, hoveredStar). Rule: rerender-memo (vercel-react-best-practices)
  const handleSubmit = useCallback(async () => {
    if (content.trim().length < 10) {
      toast.error("Please write at least 10 characters");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingTestimonial) {
        await onEditTestimonial?.({
          id: editingTestimonial.id,
          content: content.trim(),
          rating,
        });
        toast.success("Testimonial updated successfully!");
      } else {
        await onSubmitTestimonial?.({
          userId: userData?.userData?.id,
          courseId,
          content: content.trim(),
          rating,
        });
        toast.success("Thank you for your feedback!");
      }
      handleDialogClose(); // Close dialog and reset state
    } catch (error) {
      console.error("Error submitting testimonial:", error);
      toast.error("Failed to submit testimonial. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [content, editingTestimonial, rating, userData?.userData?.id, courseId]);

  const handleEdit = useCallback((testimonial) => {
    setEditingTestimonial(testimonial);
    setContent(testimonial.content);
    setRating(testimonial.rating);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (testimonialId) => {
    if (!confirm("Are you sure you want to delete your testimonial?")) return;
    try {
      await onDeleteTestimonial?.(testimonialId);
      toast.success("Testimonial deleted successfully");
    } catch (error) {
      toast.error("Failed to delete testimonial");
    }
  }, []);

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
    setTimeout(() => {
      setEditingTestimonial(null);
      setContent("");
      setRating(5);
    }, 300); // Delay reset to allow dialog to animate out
  }, []);

  const renderStars = (currentRating, interactive = false, size = "h-5 w-5") => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((starValue) => (
          <Star
            key={starValue}
            className={cn(
              size,
              "transition-all",
              interactive ? "cursor-pointer" : "",
              (hoveredStar || currentRating) >= starValue
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            )}
            onClick={() => interactive && setRating(starValue)}
            onMouseEnter={() => interactive && setHoveredStar(starValue)}
            onMouseLeave={() => interactive && setHoveredStar(0)}
          />
        ))}
      </div>
    );
  };

  if (testimonials.length === 0 && !userData) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Reviews Yet</h2>
          <p className="text-muted-foreground">
            Be the first to share your experience with this course!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50/50 dark:bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              What Our Students Say
            </h2>
            <p className="text-lg text-muted-foreground">
              Real experiences from our learning community.
            </p>
          </div>

          {userData && !currentUserTestimonial && (
            <div className="mb-12 rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12 border">
                  <AvatarImage
                    src={getUserProfilePicture(userData.userData)}
                    alt={userData.userData.name || "You"}
                  />
                  <AvatarFallback className="font-bold">
                    {(userData.userData.name?.charAt(0) || "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <h3 className="font-bold text-lg">Share Your Experience</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Rating:</label>
                    {renderStars(rating, true)}
                  </div>
                  <Textarea
                    placeholder="What did you love? What could be improved?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || content.trim().length < 10}
                    >
                      {isSubmitting ? "Submitting..." : "Post Review"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Carousel opts={{ align: "start", loop: testimonials.length > 2 }} className="w-full">
            <CarouselContent className="-ml-4">
              {testimonials.map((testimonial) => {
                const user = testimonial.user || {};
                const isCurrentUser = userData?.userData?.id === testimonial.userId;
                return (
                  <CarouselItem key={testimonial.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <div className="h-full rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md flex flex-col p-6 relative overflow-hidden">
                      <Quote className="absolute -top-2 -left-2 h-16 w-16 text-gray-100 dark:text-gray-800" />
                      <div className="flex items-center gap-4 mb-4 z-10">
                        <Avatar className="h-12 w-12 border-2 border-background">
                          <AvatarImage src={getUserProfilePicture(user)} alt={user.name} />
                          <AvatarFallback>
                            {(user.name?.charAt(0) || "U").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {getUserDesignation(user) || "Learner"}
                          </p>
                        </div>
                        {isCurrentUser && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(testimonial)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(testimonial.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="mb-4">{renderStars(testimonial.rating)}</div>
                      <p className="text-sm text-muted-foreground flex-1">
                        "{testimonial.content}"
                      </p>
                      <div className="mt-4 text-xs text-muted-foreground">
                        {formatDate(testimonial.createdAt)}
                      </div>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2" />
            <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2" />
          </Carousel>
        </div>
      </div>

      {/* FIX: ADDED THE DIALOG COMPONENT FOR EDITING */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={handleDialogClose}>
          <DialogHeader>
            <DialogTitle>Edit Your Review</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Rating</label>
              {renderStars(rating, true)}
            </div>
            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium">
                Your Review
              </label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || content.trim().length < 10}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Testimonials;