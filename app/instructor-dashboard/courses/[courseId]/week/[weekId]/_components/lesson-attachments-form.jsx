"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Pencil, Upload, X, FileText, Loader2, Trash2, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { uploadToCloudinary } from "@/utils/uploadToCloudinary";
import { updateLesson } from "@/app/actions/lesson";

const attachmentsFormSchema = z.object({
  attachments: z.array(z.object({
    name: z.string().min(1, "Name is required"),
    url: z.string().url("Valid URL is required"),
    type: z.string().min(1, "Type is required"),
  })).optional(),
});

export const LessonAttachmentsForm = ({ initialData, courseId, lessonId, weekId }) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [attachments, setAttachments] = useState(initialData || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadAbortController, setUploadAbortController] = useState(null);
  const fileInputRef = useRef(null);

  const toggleEdit = () => setIsEditing((current) => !current);
  console.log("attachements; ", initialData)

  const form = useForm({
    resolver: zodResolver(attachmentsFormSchema),
    defaultValues: {
      attachments: initialData?.attachments || [],
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values) => {
    try {
      // Validate all attachments have required fields
      const validAttachments = attachments.filter(att =>
          att.name && att.name.trim() !== '' &&
          att.url && att.url.trim() !== '' &&
          att.type && att.type.trim() !== ''
      );

      const payload = {
        attachments: validAttachments
      };

      console.log("payload of lesson-attachments-form: ", payload);

      const result = await updateLesson(payload, lessonId, courseId, weekId);

      if (result.success) {
        // Update local state with the validated attachments
        setAttachments(validAttachments);
        toast.success("Lesson attachments updated successfully");
        toggleEdit();
        router.refresh();
      } else {
        toast.error(result.error || "Something went wrong");
        console.error("Error updating lesson attachments:", result.error);
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error("Error updating attachments:", error);
    }
  };

  const cancelUpload = () => {
    if (uploadAbortController) {
      uploadAbortController.abort();
      setUploadAbortController(null);
    }
    setIsUploading(false);
    setUploadProgress({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info("Upload cancelled");
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Create abort controller for this upload session
    const abortController = new AbortController();
    setUploadAbortController(abortController);

    setIsUploading(true);
    const newAttachments = [];

    try {
      // Upload files one by one
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check if upload was cancelled
        if (abortController.signal.aborted) {
          break;
        }

        try {
          // Upload to Cloudinary
          const uploadedUrl = await uploadToCloudinary(file);

          // Check again if upload was cancelled after each file
          if (abortController.signal.aborted) {
            break;
          }

          // Determine file type based on file extension
          const fileType = getFileType(file.name, file.type);

          // Create attachment object
          const newAttachment = {
            name: file.name,
            url: uploadedUrl,
            type: fileType,
          };

          newAttachments.push(newAttachment);

        } catch (error) {
          if (abortController.signal.aborted) {
            break;
          }
          console.error(`Error uploading file ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      // Add all successfully uploaded attachments if not cancelled
      if (newAttachments.length > 0 && !abortController.signal.aborted) {
        setAttachments(prev => [...prev, ...newAttachments]);
        toast.success(`Successfully uploaded ${newAttachments.length} file(s)`);
      }

    } catch (error) {
      if (!abortController.signal.aborted) {
        console.error("Error in file upload process:", error);
        toast.error("Error uploading files");
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsUploading(false);
        setUploadProgress({});
        setUploadAbortController(null);
        // Reset file input
        event.target.value = '';
      }
    }
  };

  const getFileType = (fileName, mimeType) => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    // Image files
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return 'image';
    }

    // Document files
    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension)) {
      return 'document';
    }

    // Video files
    if (mimeType?.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(extension)) {
      return 'video';
    }

    // Audio files
    if (mimeType?.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac'].includes(extension)) {
      return 'audio';
    }

    // Default to file
    return 'file';
  };

  const addAttachment = () => {
    const newAttachment = {
      name: "",
      url: "",
      type: "file",
    };
    setAttachments([...attachments, newAttachment]);
  };

  const removeAttachment = (index) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(newAttachments);
    toast.success("Attachment removed");
  };

  const updateAttachment = (index, field, value) => {
    const newAttachments = [...attachments];
    newAttachments[index][field] = value;
    setAttachments(newAttachments);
  };

  const deleteAttachment = async (index) => {
    try {
      const newAttachments = attachments.filter((_, i) => i !== index);

      // Update the lesson immediately
      const payload = {
        attachments: newAttachments
      };

      const result = await updateLesson(payload, lessonId, courseId, weekId);

      if (result.success) {
        setAttachments(newAttachments);
        toast.success("Attachment deleted successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete attachment");
      }
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast.error("Failed to delete attachment");
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'document':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'image':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'video':
        return <FileText className="h-4 w-4 text-red-600" />;
      case 'audio':
        return <FileText className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const validateAttachments = () => {
    return attachments.every(att =>
        att.name && att.name.trim() !== '' &&
        att.url && att.url.trim() !== '' &&
        att.type && att.type.trim() !== ''
    );
  };

  return (
      <div className="mt-6 border rounded-md p-4">
        <div className="font-medium flex items-center justify-between">
          Lesson Attachments
          <Button variant="ghost" onClick={toggleEdit}>
            {isEditing ? (
                <>Cancel</>
            ) : (
                <>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Attachments
                </>
            )}
          </Button>
        </div>

        {!isEditing && (
            <div className={cn("text-sm mt-2", !attachments?.length && "text-slate-500 italic")}>
              {!attachments?.length ? (
                  "No attachments"
              ) : (
                  <div className="space-y-2">
                    {attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent">
                          {getFileIcon(attachment.type)}
                          <span className="flex-1 font-medium">{attachment.name}</span>
                          <span className="text-xs text-muted-foreground  px-2 py-1 rounded">
                    {attachment.type}
                  </span>
                          <div className="flex items-center gap-1">
                            {attachment.url && (
                                <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View
                                </a>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteAttachment(index)}
                                className="text-red-600 hover:text-red-800 h-auto p-1"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                    ))}
                  </div>
              )}
            </div>
        )}

        {isEditing && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">

                {/* File Upload Section */}
                <div className="border rounded-lg p-4 ">
                  <div className="flex items-center gap-2 mb-3">
                    <Upload className="h-4 w-4" />
                    <span className="font-medium">Upload Files</span>
                  </div>

                  <div className="space-y-3">
                    <Input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.txt,.rtf,.mp4,.avi,.mov,.mp3,.wav"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />

                    {isUploading && (
                        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                          <div className="text-sm text-blue-600 flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading files...
                          </div>
                          <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={cancelUpload}
                              className="text-red-600 hover:text-red-800"
                          >
                            Cancel Upload
                          </Button>
                        </div>
                    )}
                  </div>
                </div>

                {/* Manual Attachments Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Manual Attachments</h4>
                    <Button type="button" variant="outline" size="sm" onClick={addAttachment}>
                      <Upload className="h-4 w-4 mr-2" />
                      Add Manual Entry
                    </Button>
                  </div>

                  {attachments.map((attachment, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3 ">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium flex items-center gap-2">
                            {getFileIcon(attachment.type)}
                            Attachment {index + 1}
                          </h4>
                          <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(index)}
                              className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Name</label>
                            <Input
                                placeholder="Attachment name"
                                value={attachment.name}
                                onChange={(e) => updateAttachment(index, 'name', e.target.value)}
                                className={cn(
                                    !attachment.name && "border-red-200 focus:border-red-500"
                                )}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">URL</label>
                            <Input
                                placeholder="https://example.com/file.pdf"
                                value={attachment.url}
                                onChange={(e) => updateAttachment(index, 'url', e.target.value)}
                                className={cn(
                                    !attachment.url && "border-red-200 focus:border-red-500"
                                )}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Type</label>
                            <Select
                                value={attachment.type}
                                onValueChange={(value) => updateAttachment(index, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="file">File</SelectItem>
                                <SelectItem value="link">Link</SelectItem>
                                <SelectItem value="document">Document</SelectItem>
                                <SelectItem value="image">Image</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="audio">Audio</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {attachment.url && (
                            <div className="flex items-center gap-2 text-sm">
                              <a
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Preview
                              </a>
                            </div>
                        )}
                      </div>
                  ))}
                </div>

                {/* Validation Message */}
                {attachments.length > 0 && !validateAttachments() && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      Please fill in all required fields (name, URL, type) for all attachments.
                    </div>
                )}

                <div className="flex items-center gap-x-2">
                  <Button
                      disabled={!validateAttachments() || isSubmitting || isUploading}
                      type="submit"
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Attachments
                  </Button>
                </div>
              </form>
            </Form>
        )}
      </div>
  );
};