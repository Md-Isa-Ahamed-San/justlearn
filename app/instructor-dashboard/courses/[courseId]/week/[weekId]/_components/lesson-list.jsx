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
import { CirclePlay } from "lucide-react";

export const LessonList = ({ items, onReorder, onEdit }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [lessons, setLessons] = useState(items);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setLessons(items);
  }, [items]);

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(lessons);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const startIndex = Math.min(result.source.index, result.destination.index);
    const endIndex = Math.max(result.source.index, result.destination.index);

    const updatedLessons = items.slice(startIndex, endIndex + 1);

    setLessons(items);

    const bulkUpdateData = updatedLessons.map((lesson, index) => ({
      id: lesson.id,
      order: items.findIndex((item) => item.id === lesson.id) + 1, // order starts from 1
    }));

    onReorder(bulkUpdateData);
  };

  if (!isMounted) {
    return null;
  }

  return (
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="lessons">
          {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {lessons.map((lesson, index) => (
                    <Draggable key={lesson.id} draggableId={lesson.id} index={index}>
                      {(provided) => (
                          <div
                              className={cn(
                                  "flex items-center gap-x-2 border-slate-200 border text-slate-700 rounded-md mb-4 text-sm",
                                  lesson.active &&
                                  "bg-sky-100 border-sky-200 text-sky-700"
                              )}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                          >
                            <div
                                className={cn(
                                    "px-2 py-3 border-r border-r-slate-200 hover:bg-slate-300 rounded-l-md transition",
                                    lesson.active &&
                                    "border-r-sky-200 hover:bg-sky-200"
                                )}
                                {...provided.dragHandleProps}
                            >
                              <Grip className="h-5 w-5" />
                            </div>
                            <div className="flex items-center gap-2">
                              <CirclePlay size={18} />
                              {lesson.title}
                            </div>
                            {lesson.duration && (
                                <div className="text-xs text-slate-500">
                                  {Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, '0')}
                                </div>
                            )}
                            <div className="ml-auto pr-2 flex items-center gap-x-2">
                              <Badge
                                  className={cn(
                                      "bg-slate-500",
                                      lesson.active && "bg-emerald-600"
                                  )}
                              >
                                {lesson.active ? "Active" : "Inactive"}
                              </Badge>
                              <Pencil
                                  onClick={() => onEdit(lesson.id)}
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