// actions/testimonials.js
"use server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Helper: recalculate and persist course average rating
async function recalculateCourseRating(courseId) {
  try {
    const result = await db.testimonial.aggregate({
      where: { courseId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const avg = result._avg.rating ?? 0;
    await db.course.update({
      where: { id: courseId },
      data: { rating: parseFloat(avg.toFixed(2)) },
    });
  } catch (e) {
    console.error("Rating recalculation error:", e);
  }
}

// 1. Create testimonial
export async function onSubmitTestimonial({ userId, courseId, content, rating }) {
  const response = await db.testimonial.create({
    data: { userId, courseId, content, rating },
  });
  if (response) {
    await recalculateCourseRating(courseId);
    revalidatePath(`/courses/${courseId}`);
  }
}

// 2. Edit testimonial
export async function onEditTestimonial({ id, content, rating }) {
  const response = await db.testimonial.update({
    where: { id },
    data: { content, rating },
  });
  if (response) {
    await recalculateCourseRating(response.courseId);
    revalidatePath(`/courses/${response.courseId}`);
  }
}

// 3. Delete testimonial
export async function onDeleteTestimonial(id) {
  const response = await db.testimonial.delete({ where: { id } });
  if (response) {
    await recalculateCourseRating(response.courseId);
    revalidatePath(`/courses/${response.courseId}`);
  }
}


// 4. Fetch testimonials with user data
export async function getTestimonials(courseId) {
  return await db.testimonial.findMany({
    where: { courseId },
    include: {
      user: {
        include: {
          student: true,
          instructor: true,
          admin: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
