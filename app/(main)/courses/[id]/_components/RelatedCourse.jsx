import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const CourseProgress = ({ value, variant, size }) => {
  return (
    <div className="w-full space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Progress</span>
        <span
          className={cn(
            "font-medium",
            variant === "success" ? "text-emerald-600" : "text-muted-foreground"
          )}
        >
          {value}%
        </span>
      </div>
      <Progress
        value={value}
        className={cn(
          "h-1.5",
          variant === "success" ? "bg-emerald-100 [&>div]:bg-emerald-600" : ""
        )}
      />
    </div>
  );
};

const RelatedCourse = () => {
  const courses = [
    {
      id: 1,
      title: "Advanced React Patterns",
      category: "Development",
      thumbnail: "/placeholder.svg?height=400&width=600",
      price: 49,
      progress: 0,
    },
    {
      id: 2,
      title: "TypeScript Masterclass",
      category: "Development",
      thumbnail: "/placeholder.svg?height=400&width=600",
      price: 59,
      progress: 30,
    },
    {
      id: 3,
      title: "Full-Stack Next.js Development",
      category: "Development",
      thumbnail: "/placeholder.svg?height=400&width=600",
      price: 79,
      progress: 0,
    },
    {
      id: 4,
      title: "UI/UX Design Principles",
      category: "Design",
      thumbnail: "/placeholder.svg?height=400&width=600",
      price: 49,
      progress: 0,
    },
  ];
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };
  return (
    <section className="py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Related Courses
          </h2>

          <Carousel
            opts={{
              align: "start",
            }}
            className="mx-auto w-full"
          >
            <CarouselContent>
              {courses.map((course) => (
                <CarouselItem
                  key={course.id}
                  className="md:basis-1/2 lg:basis-1/3 pl-4"
                >
                  <Link href={`/courses/${course.id}`} className="block h-full">
                    <div className="h-full overflow-hidden rounded-xl border border-gray-200  transition-all hover:shadow-md">
                      <div className="relative aspect-video w-full overflow-hidden">
                        <Image
                          src={course.thumbnail || "/placeholder.svg"}
                          alt={course.title}
                          className="object-cover transition-transform duration-300 hover:scale-105"
                          fill
                        />
                        <div className="absolute inset-0 bg-gradient-to-t  opacity-0 transition-opacity hover:opacity-100">
                          <div className="absolute bottom-4 left-4 right-4">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="w-full"
                            >
                              View Course
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="p-5">
                        <Badge className="mb-2 b  ">{course.category}</Badge>
                        <h3 className="mb-2 line-clamp-2 text-lg font-bold">
                          {course.title}
                        </h3>

                        {course.progress > 0 ? (
                          <CourseProgress value={course.progress} />
                        ) : (
                          <div className="mt-4 flex items-center justify-between">
                            <p className="font-bold ">
                              {formatPrice(course.price)}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1 "
                            >
                              Enroll
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="mt-8 flex justify-center gap-2">
              <CarouselPrevious className="relative inset-0 translate-y-0" />
              <CarouselNext className="relative inset-0 translate-y-0" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default RelatedCourse;
