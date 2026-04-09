"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
    ArrowUpDown,
    GraduationCap,
    MoreHorizontal,
    Pencil,
    Star,
    Users,
    Clock,
    BookOpen,
    Calendar,
    Trophy,
    Copy
} from "lucide-react";
import Link from "next/link";
import {CopyButton} from "@/utils/CopyButton";



export const columns = [
    {
        accessorKey: "title",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Course Info <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const course = row.original;
            return (
                <div className="space-y-2 min-w-[300px]">
                    {/* Course Title & Code */}
                    <div>
                        <h3 className="font-semibold text-sm">{course.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-muted-foreground font-medium">Code: {course.code}</p>
                            <CopyButton text={course.code} />
                        </div>
                    </div>

                    {/* Course Description */}
                    {/*<p className="text-xs text-muted-foreground line-clamp-2">*/}
                    {/*    {course.description}*/}
                    {/*</p>*/}

                    {/* Category */}
                    <Badge variant="outline" className="text-xs">
                        {course.category?.title}
                    </Badge>
                </div>
            );
        },
    },
    {
        accessorKey: "stats",
        header: "Course Stats",
        cell: ({ row }) => {
            const course = row.original;
            return (
                <div className="space-y-2 min-w-[150px]">
                    {/* Students & Rating */}
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {course.totalStudents || 0}
                        </div>
                        <div className="flex items-center text-xs">
                            <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                            {course.averageRating || 0}
                        </div>
                    </div>

                    {/* Duration & Lessons */}
                    <div className="flex items-center space-x-4">
                        {/*<div className="flex items-center text-xs text-muted-foreground">*/}
                        {/*    <Clock className="h-3 w-3 mr-1" />*/}
                        {/*    {course.totalDuration || 0}min*/}
                        {/*</div>*/}
                        <div className="flex items-center text-xs text-muted-foreground">
                            <BookOpen className="h-3 w-3 mr-1" />
                            {course.totalLessons || 0} lessons
                        </div>
                    </div>

                    {/* Weeks & Certificates */}
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            {course.totalWeeks || 0} weeks
                        </div>
                        {/*<div className="flex items-center text-xs text-muted-foreground">*/}
                        {/*    <Trophy className="h-3 w-3 mr-1" />*/}
                        {/*    {course.totalCertificates || 0} certs*/}
                        {/*</div>*/}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: "learning",
        header: "Learning Outcomes",
        cell: ({ row }) => {
            const course = row.original;
            const learningOutcomes = course.learning || [];
            return (
                <div className="space-y-1 min-w-[250px]">
                    {learningOutcomes.length > 0 ? (
                        <ul className="text-xs space-y-1">
                            {learningOutcomes.slice(0, 3).map((outcome, index) => (
                                <li key={index} className="flex items-start">
                                    <span className="w-1 h-1 bg-primary rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                    <span className="text-muted-foreground">{outcome}</span>
                                </li>
                            ))}
                            {learningOutcomes.length > 3 && (
                                <li className="text-xs text-muted-foreground italic">
                                    +{learningOutcomes.length - 3} more...
                                </li>
                            )}
                        </ul>
                    ) : (
                        <p className="text-xs text-muted-foreground italic">
                            No learning outcomes defined
                        </p>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: "active",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Status <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const course = row.original;
            const visibility  = course.visibility==="public" || false;
            const createdAt = new Date(course.createdAt);

            return (
                <div className="space-y-2 min-w-[120px]">
                    <Badge className={cn("text-xs", visibility  ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800")}>
                        {visibility  ? "Published" : "Draft"}
                    </Badge>

                    <div className="text-xs text-muted-foreground">
                        <p>Visibility: {course.visibility}</p>
                        <p>Created: {createdAt.toLocaleDateString()}</p>
                    </div>
                </div>
            );
        },
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const course = row.original;
            const id = course.id;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open Menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <Link href={`/instructor-dashboard/courses/${id}`}>
                            <DropdownMenuItem className="cursor-pointer">
                                <Pencil className="h-4 w-4 mr-2" />
                                Manage Course
                            </DropdownMenuItem>
                        </Link>
                        <Link href={`/instructor-dashboard/courses/${id}/allJoinedStudents`}>
                            <DropdownMenuItem className="cursor-pointer">
                                <GraduationCap className="h-4 w-4 mr-2" />
                                Enrolled Students
                            </DropdownMenuItem>
                        </Link>
                        <Link href={`/instructor-dashboard/courses/${id}/reviews`}>
                            <DropdownMenuItem className="cursor-pointer">
                                <Star className="h-4 w-4 mr-2" />
                                View Reviews
                            </DropdownMenuItem>
                        </Link>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];