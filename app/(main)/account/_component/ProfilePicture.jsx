"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // Using sonner instead of react-hot-toast

export default function ProfilePicture({ src, alt, fallback }) {
  const [preview, setPreview] = useState(src || "/placeholder.svg");
  const fileInputRef = useRef(null);

  // Sync preview if src changes externally
  useEffect(() => {
    setPreview(src || "/placeholder.svg");
  }, [src]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 2 * 1024 * 1024; // 2MB
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"];

      if (!validTypes.includes(file.type)) {
        toast.error("Invalid file type. Only JPG, PNG, WEBP, or AVIF allowed.");
        return;
      }

      if (file.size > maxSize) {
        toast.error("Image size exceeds 2MB limit.");
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setPreview("/placeholder.svg");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pb-6 border-b">
      <Avatar
        className="w-20 h-20 border-4 border-background cursor-pointer"
        onClick={triggerFileInput}
        aria-label="Click to upload profile picture"
      >
        <AvatarImage src={preview || null} alt={alt} />
        <AvatarFallback className="text-lg font-medium">{fallback}</AvatarFallback>
      </Avatar>

      {/* Hidden file input */}
      <input
        type="file"
        name="profilePicture"
        accept=".jpg,.jpeg,.png,.webp,.avif"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="space-y-2 flex-1">
        <h4 className="font-medium">Profile Picture</h4>
        <p className="text-sm text-muted-foreground">
          Upload a new profile picture. Max size: 2MB. Allowed: JPG, PNG, WebP, AVIF.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" type="button" onClick={triggerFileInput}>
            Upload New
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            type="button"
            onClick={removeImage}
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}
