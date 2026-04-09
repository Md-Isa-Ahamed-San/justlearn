"use client";

import React, { useState } from "react";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import { Play, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ClassJoin = ({ isJoined: initialIsJoined, userId, courseId, isInstructor }) => {
  const [isJoined, setIsJoined] = useState(initialIsJoined);
  const [showInput, setShowInput] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Instructors should never see the join button on their own course
  if (isInstructor) return null;

  const handleJoinClick = () => {
    setShowInput(true);
    setError("");
  };

  const handleCancel = () => {
    setShowInput(false);
    setClassCode("");
    setError("");
  };

  const getErrorMessage = (errorType, defaultMessage) => {
    const errorMessages = {
      'COURSE_NOT_FOUND': 'Course not found. Please check your class code.',
      'USER_NOT_FOUND': 'User account not found or inactive.',
      'ALREADY_ENROLLED': 'You are already enrolled in this course.',
      'DUPLICATE_ENROLLMENT': 'You are already enrolled in this course.',
      'SELF_ENROLLMENT_NOT_ALLOWED': 'You cannot join your own course as a participant.',
      'PRIVATE_COURSE_ACCESS_DENIED': 'This is a private course. Please check your class code.',
      'MISSING_REQUIRED_FIELDS': 'Please enter a valid class code.',
      'INVALID_JSON': 'Invalid request format. Please try again.',
      'SERVER_ERROR': 'Server error occurred. Please try again later.',
      'RECORD_NOT_FOUND': 'Course or user information not found.'
    };
    
    return errorMessages[errorType] || defaultMessage;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!classCode.trim()) {
      const message = "Please enter a class code";
      setError(message);
      toast.error(message);
      return;
    }

    if (!userId) {
      const message = "User not authenticated. Please log in again.";
      setError(message);    
      toast.error(message);
      return;
    }

    if (!courseId) {
      const message = "Course information missing. Please refresh the page.";
      setError(message);
      toast.error(message);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/participation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classCode: classCode.trim(),
          courseId,
          userId: userId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success case
        setIsJoined(true);
        setShowInput(false);
        setClassCode("");
        setError("");
        
        // Show success toast with course name if available
        const successMessage = data.data?.courseName 
          ? `Successfully joined "${data.data.courseName}"!`
          : "Successfully joined the course!";
        
        toast.success(successMessage, {
          description: data.data?.instructorName 
            ? `Instructor: ${data.data.instructorName}`
            : undefined,
          duration: 5000,
        });
      } else {
        // Error case - handle specific error types
        const errorMessage = getErrorMessage(
          data.error, 
          data.message || "Failed to join course. Please try again."
        );
        
        setError(errorMessage);
        
        // Show different toast types based on error severity
        if (data.error === 'ALREADY_ENROLLED' || data.error === 'DUPLICATE_ENROLLMENT') {
          toast.info(errorMessage, {
            description: "You can access the course from your dashboard.",
          });
        } else if (data.error === 'COURSE_NOT_FOUND' || data.error === 'PRIVATE_COURSE_ACCESS_DENIED') {
          toast.error(errorMessage, {
            description: "Please verify the class code with your instructor.",
          });
        } else if (data.error === 'SELF_ENROLLMENT_NOT_ALLOWED') {
          toast.warning(errorMessage, {
            description: "As the instructor, you already have full access.",
          });
        } else if (data.error === 'SERVER_ERROR') {
          toast.error(errorMessage, {
            description: "Please try again in a few moments.",
          });
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (err) {
      console.error("Join course error:", err);
      
      let errorMessage;
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (err instanceof SyntaxError) {
        errorMessage = "Invalid response from server. Please try again.";
      } else {
        errorMessage = "An unexpected error occurred. Please try again.";
      }
      
      setError(errorMessage);
      toast.error(errorMessage, {
        description: "If the problem persists, please contact support.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if already joined
  if (isJoined) return null;

  return showInput ? (
    <div className="mt-8 flex flex-col items-center space-y-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2"
      >
        <div className="relative">
          <Input
            type="text"
            placeholder="Enter class code"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            className="w-64 text-center my-1"
            disabled={isLoading}
            autoFocus
            maxLength={10}
          />
        </div>
        <div className="flex space-x-2">
          <Button
            type="submit"
            size="sm"
            disabled={isLoading || !classCode.trim()}
            className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </form>
      {/* {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 max-w-md">
          <p className="text-red-600 text-sm text-center">{error}</p>
        </div>
      )} */}
    </div>
  ) : (
    <div className="mt-8 flex justify-center">
      <Button
        onClick={handleJoinClick}
        size="lg"
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg font-semibold rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105"
      >
        <Play className="mr-2 h-5 w-5" />
        Join Course
      </Button>
    </div>
  );
};

export default ClassJoin;