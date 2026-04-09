"use client";

import {
    DragDropContext,
    Draggable,
    Droppable
} from "@hello-pangea/dnd";
import { Grip, Pencil } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const WeekList = ({ items, onReorder, onEdit }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [weeks, setWeeks] = useState(items);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setWeeks(items);
  }, [items]);

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(weeks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const startIndex = Math.min(result.source.index, result.destination.index);
    const endIndex = Math.max(result.source.index, result.destination.index);

    const updatedWeeks = items.slice(startIndex, endIndex + 1);

    setWeeks(items);

    const bulkUpdateData = updatedWeeks.map((week) => ({
      id: week.id,
      position: items.findIndex((item) => item.id === week.id),
    }));

    onReorder(bulkUpdateData);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="weeks">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {weeks.map((week, index) => (
              <Draggable key={week.id} draggableId={week.id} index={index}>
                {(provided) => (
                  <div
                    className={cn(
                      "flex items-center gap-x-2  border-slate-200 border  rounded-md mb-4 text-sm",
                      week.status === "published" &&
                        "bg-sky-100 border-sky-200 text-sky-700"
                    )}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                  >
                    <div
                      className={cn(
                        "px-2 py-3 border-r border-r-slate-200 hover: rounded-l-md transition",
                        week.status === "published" &&
                          "border-r-sky-200 hover:bg-sky-200"
                      )}
                      {...provided.dragHandleProps}
                    >
                      <Grip className="h-5 w-5" />
                    </div>
                    {week.title}
                    <div className="ml-auto pr-2 flex items-center gap-x-2">
                      <Badge
                        className={cn(
                          "0",
                        week.status === "published" && "bg-emerald-600"
                      )}
                    >
                      {week.status === "published" ? "Published" : "Draft"}
                    </Badge>
                      <Pencil
                        onClick={() => onEdit(week.id)}
                        className="w-4 h-4 cursor-pointer hover:opacity-75 transition"
                      />
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
