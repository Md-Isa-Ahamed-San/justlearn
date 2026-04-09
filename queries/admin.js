"use server";
import { db } from "@/lib/prisma";

// MARK: Toggle user active status

import { revalidatePath } from "next/cache";
import CourseDetails from "../app/(main)/courses/[id]/_components/CourseDetails";

export const toggleUserStatus = async (userId) => {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });

    if (!user) {
      return { success: false, error: "User not found." };
    }

    const newStatus = !user.isActive;

    await db.user.update({
      where: { id: userId },
      data: { isActive: newStatus },
    });

    revalidatePath("/admin-dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error in toggleUserStatus action:", error);
    return { success: false, error: "Failed to toggle user status." };
  }
};

export const toggleCourseVisibilityStatus = async(courseId)=>{
  console.log(" toggleCourseVisibilityStatus ~ courseId:", courseId)
  
  try {
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { visibility: true },
    });

    if (!course) {
      return { success: false, error: "Course not found." };
    }

    const newStatus = course.visibility ==="public"?"private":"public";

    await db.course.update({
      where: { id: courseId },
      data: { visibility: newStatus },
    });

    revalidatePath("/admin-dashboard"); 

    return { success: true };
  } catch (error) {
    console.error("Error in toggleUserStatus action:", error);
    return { success: false, error: "Failed to toggle course status." };
  }
}
