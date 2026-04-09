import { formatPrice } from "@/lib/formatPrice";
import { BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { EnrollCourse } from "@/components/enroll-course";

const CourseCard = ({ course }) => {
  return (
    <div className="group hover:shadow-sm transition overflow-hidden border rounded-lg p-3 h-full">
      <Link key={course.id} href={`/courses/${course.id}`}>
        <div>
          <div className="relative w-full aspect-video rounded-md overflow-hidden">
            <Image
              src={`${course?.thumbnail}`}
              alt={course?.title}
              className="object-cover"
              fill
            />
          </div>
          <div className="flex flex-col pt-2">
            <div className="text-lg md:text-base font-medium group-hover:text-sky-700 line-clamp-2">
              {course?.title}
            </div>
            <p className="text-xs text-muted-foreground">
              {course?.category?.title}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CourseCard;
