import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const ImageUploadField = ({ field, form, isSubmitting }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (e.g., 5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      form.setValue("image", reader.result);
      setIsUploading(false);
    };
    reader.onerror = () => {
      toast.error("Error reading file");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
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

  const handleRemoveImage = () => {
    form.setValue("image", "");
  };

  const currentImage = form.watch("image");

  return (
    <div className="space-y-2">
      {!currentImage ? (
        <div
          className={`
            relative flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg cursor-pointer h-48 transition-all duration-200
            ${isDragOver 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
              : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
            }
            ${isSubmitting || isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
          `}
          onClick={() => !isSubmitting && !isUploading && document.getElementById("image-upload").click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            className="hidden"
            disabled={isSubmitting || isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
          
          <div className="flex flex-col items-center justify-center space-y-3">
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-sm text-gray-500">Uploading...</p>
              </>
            ) : (
              <>
                <div className={`p-3 rounded-full ${isDragOver ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                  <Upload className={`h-6 w-6 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                </div>
                <div className="text-center">
                  <p className={`text-sm font-medium ${isDragOver ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`}>
                    {isDragOver ? 'Drop image here' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="relative group">
          <div className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <img
              src={currentImage}
              alt="Uploaded preview"
              className="w-full h-48 object-cover transition-transform duration-200 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
          </div>
          
          {/* Remove button */}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={handleRemoveImage}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
          
          {/* Replace button */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={() => document.getElementById("image-upload").click()}
            disabled={isSubmitting}
          >
            <ImageIcon className="h-4 w-4 mr-1" />
            Replace
          </Button>
          
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            className="hidden"
            disabled={isSubmitting}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploadField;