export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { db } from "../../../../lib/prisma";
export async function GET(request, { params }) {
  const { id } = params;
  console.log(" GET ~ id:", id);
  try {
    const course = await db.course.findUnique({
      where: { id },
      include: {
        category: true,
        instructor: true,
        quizSet: true,
        weeks: true,
        testimonials: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    // console.log(" GET ~ course:", course);
    return NextResponse.json(course || null);
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  const { id } = params;

  try {
    // Parse the request body
    const body = await request.json();
    console.log(" PATCH ~ body:", body);

    const allowedFields = [
      "title",
      "description",
      "thumbnail",
      "active",
      "isCompleted",
      "learning",
      "rating",
      "visibility",
      "categoryId",
    ];

    const updateData = {};
    Object.keys(body).forEach((key) => {
      if (allowedFields.includes(key) && body[key] !== undefined) {
        updateData[key] = body[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    updateData.updatedAt = new Date();

    if (updateData.categoryId) {
      const categoryExists = await db.category.findUnique({
        where: { id: updateData.categoryId },
      });

      if (!categoryExists) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
    }

    if (
      updateData.visibility &&
      !["public", "private"].includes(updateData.visibility)
    ) {
      return NextResponse.json(
        { error: "Invalid visibility value. Must be 'public' or 'private'" },
        { status: 400 }
      );
    }

    // Guard: cannot mark a course as completed if it is not published
    if (updateData.isCompleted === true) {
      const course = await db.course.findUnique({
        where: { id },
        select: { visibility: true },
      });
      const effectiveVisibility = updateData.visibility ?? course?.visibility;
      if (effectiveVisibility !== "public") {
        return NextResponse.json(
          { error: "A course must be published before it can be marked as completed." },
          { status: 400 }
        );
      }
    }

    if (updateData.rating && (updateData.rating < 0 || updateData.rating > 5)) {
      return NextResponse.json(
        { error: "Rating must be between 0 and 5" },
        { status: 400 }
      );
    }

    const updatedCourse = await db.course.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        user: {
          include: {
            instructor: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Course updated successfully",
      course: updatedCourse,
      updatedFields: Object.keys(updateData).filter(
        (key) => key !== "updatedAt"
      ),
    });
  } catch (error) {
    console.error("Error updating course:", error);

    // Handle specific Prisma errors
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Duplicate value for unique field" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
