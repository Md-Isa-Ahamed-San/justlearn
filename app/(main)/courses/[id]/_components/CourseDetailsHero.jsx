import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import Image from "next/image";

import { Play } from "lucide-react";
import ClassJoin from "./ClassJoin";

const CourseDetailsHero = ({
  categoryTitle,
  title,
  description,
  thumbnail,
  isJoined,
  userId,
  courseId,
  isInstructor,
}) => {


  return (
    <section className="relative overflow-hidden bg-gradient-to-b pt-20">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=800&width=1600')] bg-cover bg-center opacity-5"></div>
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Badge className="mb-4">{categoryTitle}</Badge>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            <span className="block">{title}</span>
          </h1>

          <ClassJoin isJoined={isJoined} userId={userId} courseId={courseId} isInstructor={isInstructor} />
        </div>
      </div>
    </section>
  );
};

export default CourseDetailsHero;
