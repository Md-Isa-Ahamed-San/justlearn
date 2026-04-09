"use client"
import { IconBadge } from "@/components/icon-badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { FileText, LayoutDashboard, Video } from "lucide-react";
import { LessonActiveForm } from "./lesson-active-form";
import { LessonAttachmentsForm } from "./lesson-attachments-form";
import { LessonDescriptionForm } from "./lesson-description-form";
import { LessonTitleForm } from "./lesson-title-form";
import { VideoUrlForm } from "./video-url-form";

export const LessonModal = ({
                                open, setOpen, lessonData,
                                onSave,
                                courseId,
                                weekId
                            }) => {
    console.log("init data in lesson modal: ",lessonData)
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                className="sm:max-w-[1200px] w-[95%] max-w-[95vw] overflow-y-auto max-h-[90vh] p-0"
                onInteractOutside={(e) => {
                    e.preventDefault();
                }}
            >
                <DialogHeader className="p-4 sm:p-6 border-b">
                    <DialogTitle className="text-lg sm:text-xl">Edit Lesson</DialogTitle>
                    <DialogDescription className="text-sm">
                        Configure your lesson settings and content.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-4 sm:p-6">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ">

                        <div className="flex justify-end">
                            {/*<CourseActions isActive={lessonData?.active}*/}
                            {/*               courseId={courseId}*/}
                            {/*               weekId={weekId}*/}
                            {/*               lessonId={lessonData?.id}/>*/}
                            <LessonActiveForm 
                                initialData={{ active: lessonData?.active, weekId: lessonData?.weekId }}
                                courseId={courseId}
                                lessonId={lessonData?.id}
                            />
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Basic Settings Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-x-2">
                                    <IconBadge icon={LayoutDashboard} size="sm"/>
                                    <h2 className="text-lg sm:text-xl font-semibold">Basic Settings</h2>
                                </div>
                                <div className="space-y-4 pl-0 sm:pl-2">
                                    <LessonTitleForm
                                        initialData={lessonData?.title}
                                        courseId={courseId}
                                        weekId={weekId}
                                        lessonId={lessonData?.id}

                                    />
                                    <LessonDescriptionForm
                                        descriptionData={lessonData?.description}
                                        courseId={courseId}
                                        weekId={weekId}
                                        lessonId={lessonData?.id}
                                    />
                                </div>
                            </div>


                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Video Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-x-2">
                                    <IconBadge icon={Video} size="sm"/>
                                    <h2 className="text-lg sm:text-xl font-semibold">Video Content</h2>
                                </div>
                                <div className="pl-0 sm:pl-2">
                                    <VideoUrlForm
                                        initialData={lessonData?.videoUrl}
                                        courseId={courseId}
                                        weekId={weekId}
                                        lessonId={lessonData?.id}
                                    />
                                </div>
                            </div>

                            {/* Attachments Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-x-2">
                                    <IconBadge icon={FileText} size="sm"/>
                                    <h2 className="text-lg sm:text-xl font-semibold">Lesson Attachments</h2>
                                </div>
                                <div className="pl-0 sm:pl-2">
                                    <LessonAttachmentsForm
                                        initialData={lessonData?.attachments}
                                        courseId={courseId}
                                        lessonId={lessonData?.id}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};