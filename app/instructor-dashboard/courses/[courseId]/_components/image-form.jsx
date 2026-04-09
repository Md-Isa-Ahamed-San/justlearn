"use client";

import { ImageIcon, Pencil, PlusCircle, Upload, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { uploadToCloudinary } from "@/utils/uploadToCloudinary";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  imageUrl: z.string().min(1, {
    message: "Image is required",
  }),
});

export const ImageForm = ({ initialData = {}, courseId }) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const toggleEdit = () => setIsEditing((current) => !current);

  const onSubmit = async (values) => {
    console.log(" onSubmit ~ values:", values);
    let thumbnail = {
      thumbnail: values.imageUrl,
    };
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(thumbnail),
      });

      if (!response.ok) {
        throw new Error("Failed to update course");
      }

      setImageUrl(values?.imageUrl);
      toast.success("Course updated successfully");
      toggleEdit();
      router.refresh();
    } catch (error) {
      console.error("Error updating course:", error);
      toast.error("Something went wrong");
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (e.g., 5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      const uploadedUrl = await uploadToCloudinary(file);
      await onSubmit({ imageUrl: uploadedUrl });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="mt-6 border rounded-md p-4 bg-card">
      <div className="font-medium flex items-center justify-between">
        Course Image
        <Button variant="ghost" onClick={toggleEdit} disabled={isUploading}>
          {isEditing && (
            <>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </>
          )}
          {!isEditing && !imageUrl && (
            <>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add an image
            </>
          )}
          {!isEditing && imageUrl && (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Edit image
            </>
          )}
        </Button>
      </div>

      {!isEditing &&
        (!imageUrl || (typeof imageUrl === 'string' && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) ? (
          <div className="flex items-center justify-center h-60 bg-slate-100 rounded-md">
            <ImageIcon className="h-10 w-10 text-slate-500" />
          </div>
        ) : (
          <div className="relative aspect-video mt-2">
            <Image
              alt="Course Image"
              fill
              className="object-cover rounded-md"
              src={imageUrl}
              sizes="40vw"
            />
          </div>
        ))}

      {isEditing && (
        <div className="mt-4">
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragOver ? "border-blue-400 bg-blue-50" : "border-slate-300"}
              ${
                isUploading
                  ? "opacity-50 pointer-events-none"
                  : "hover:border-slate-400"
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-slate-100 rounded-full">
                <Upload className="h-8 w-8 text-slate-600" />
              </div>

              <div className="space-y-2">
                <p className="text-lg font-medium text-slate-700">
                  {isUploading ? "Uploading..." : "Upload an image"}
                </p>
                <p className="text-sm text-slate-500">
                  {isUploading
                    ? "Please wait while we upload your image"
                    : "Drag and drop an image here, or click to select"}
                </p>
              </div>

              {!isUploading && (
                <Button variant="outline" size="sm" className="mt-2">
                  Choose File
                </Button>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground mt-4 space-y-1">
            <p>• 16:9 aspect ratio recommended</p>
            <p>• Maximum file size: 5MB</p>
            <p>• Supported formats: JPG, PNG, GIF, WebP</p>
          </div>
        </div>
      )}
    </div>
  );
};
