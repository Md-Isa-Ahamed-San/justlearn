"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, ExternalLink, MoreHorizontal, Pencil } from "lucide-react";
import Link from "next/link";

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
    accessorKey: "schedule",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Schedule <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const schedule = new Date(row.getValue("schedule"));
      return (
        <div>
          <div className="font-medium">{schedule.toLocaleDateString()}</div>
          <div className="text-xs text-muted-foreground">{schedule.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") || "scheduled";
      return (
        <Badge variant={status === "completed" ? "secondary" : "default"}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "meetLink",
    header: "Meet Link",
    cell: ({ row }) => {
      const link = row.getValue("meetLink");
      return link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
          Join <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      ) : (
        <span className="text-muted-foreground text-sm">No link</span>
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
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open Menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Link href={`/instructor-dashboard/lives/${id}`}>
              <DropdownMenuItem className="cursor-pointer">
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
