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
    BookOpen,
    Brain,
    CheckCircle,
    MoreHorizontal,
    Pencil,
    Shuffle,
    XCircle,
} from "lucide-react"; // Added new icons
import Link from "next/link";

// Helper to format generationType for display
const formatGenerationType = (type) => {
  switch (type) {
    case "manual":
      return { label: "Manual", Icon: BookOpen, color: "text-purple-600" };
    case "ai_fixed":
      return { label: "AI Fixed", Icon: Brain, color: "text-blue-600" };
    case "ai_pool":
      return { label: "AI Pool", Icon: Shuffle, color: "text-green-600" };
    default:
      return { label: type, Icon: null, color: "" };
  }
};

export const columns = [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "totalQuestions",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total Questions <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const count = row.original._count?.questions || 0;
      return <span>{count}</span>;
    }
  },
  {
    accessorKey: "status", // Changed from isPublished to status to match your data sample
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Published <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue("status");
      const isPublished = status === "published";

      return (
        <Badge
          className={cn(
            "bg-muted text-muted-foreground hover:bg-muted",
            isPublished &&
              "bg-success text-success-foreground hover:bg-success/90"
          )}
        >
          {isPublished ? "Published" : "Draft"}
        </Badge>
      );
    },
  },
  // NEW COLUMN for Active status
  {
    accessorKey: "active",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Active <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const isActive = row.getValue("active");
      const Icon = isActive ? CheckCircle : XCircle;
      const color = isActive ? "text-green-500" : "text-red-500";

      return (
        <div className="flex items-center">
          <Icon className={cn("mr-2 h-4 w-4", color)} />
          <span className={color}>{isActive ? "Active" : "Inactive"}</span>
        </div>
      );
    },
  },
  // NEW COLUMN for Generation Type
  {
    accessorKey: "generationType",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Gen. Type <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const type = row.getValue("generationType");
      const { label, Icon, color } = formatGenerationType(type);
      return (
        <div className="flex items-center">
          {Icon && <Icon className={cn("mr-2 h-4 w-4", color)} />}
          <span className={cn(color)}>{label}</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { id } = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-4 w-8 p-0">
              <span className="sr-only">Open Menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Link href={`/instructor-dashboard/quiz-sets/${id}`}>
              <DropdownMenuItem>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            </Link>
            {/* You can add more actions here, e.g., Delete, View Details */}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
