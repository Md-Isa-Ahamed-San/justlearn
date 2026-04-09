"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, Eye, GraduationCap, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { StudentDetailsModal } from "./data-table";

export const columns = [
  {
    id: "idNumber",
    accessorFn: (row) => row.studentDetails?.idNumber,
    header: ({ column }) => {
      return (
          <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className=" text-foreground hover:bg-accent hover:text-accent-foreground font-poppins font-bold"
          >
            Student ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
      );
    },
    cell: ({ row }) => {
      const idNumber = row.getValue("idNumber");
      return <div className="pl-4 font-medium text-foreground">{idNumber}</div>;
    },
  },
  {
    id: "name",
    accessorFn: (row) => row.name,
    header: ({ column }) => {
      return (
          <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className=" text-foreground hover:bg-accent hover:text-accent-foreground font-poppins font-bold"
          >
            Student Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
      );
    },
    cell: ({ row }) => {
      const name = row.getValue("name");
      return <div className="pl-4 font-medium text-foreground">{name}</div>;
    },
  },
  {
    id: "department",
    accessorFn: (row) => row.studentDetails?.department,
    header: ({ column }) => {
      return (
          <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className=" text-foreground hover:bg-accent hover:text-accent-foreground font-poppins font-bold"
          >
            Department
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
      );
    },
    cell: ({ row }) => {
      const department = row.getValue("department");
      return <div className="pl-4 font-medium text-foreground">{department}</div>;
    },
  },
  {
    id: "session",
    accessorFn: (row) => row.studentDetails?.session,
    header: ({ column }) => {
      return (
          <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className=" text-foreground hover:bg-accent hover:text-accent-foreground font-poppins font-bold"
          >
            Session
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
      );
    },
    cell: ({ row }) => {
      const session = row.getValue("session");
      return <div className="pl-4 font-medium text-foreground">{session}</div>;
    },
  },
  {
    id: "progress",
    accessorFn: (row) => row.courseProgress.progress,
    header: ({ column }) => {
      return (
          <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className=" text-foreground hover:bg-accent hover:text-accent-foreground font-poppins font-bold"
          >
            Progress
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
      );
    },
    cell: ({ row }) => {
      const progress = row.getValue("progress");
      return <div className="pl-4 font-medium text-foreground">{progress}%</div>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-foreground font-poppins font-bold">Actions</div>,
    cell: ({ row }) => {
      // 'original' contains the full data object for the row.
      const student = row.original;
      const { userId } = student;

      return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 text-foreground hover:bg-accent hover:text-accent-foreground">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border">
              <DropdownMenuItem
                  className="text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                  asChild
              >
                <StudentDetailsModal
                    student={student}
                    trigger={
                      <div className="w-full flex items-center cursor-pointer">
                        <Eye className="h-4 w-4 mr-2 ml-2" />
                        View Details
                      </div>
                    }
                />
              </DropdownMenuItem>
              <DropdownMenuItem className="text-popover-foreground hover:bg-accent hover:text-accent-foreground">
                <Link href={`/instructor-dashboard/courses/${student.courseId || ""}/students/${userId}`} className="w-full flex items-center">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  View Marks & Progress
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      );
    },
  },
];