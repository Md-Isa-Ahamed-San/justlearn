export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";  // Import NextResponse
import { chalkLog } from "../../../utils/logger";
import { getAllCategories } from "../../../queries/courses";

export async function GET(request) {
  try {
    chalkLog.log("gett",{})
    const categories = await getAllCategories();
    return NextResponse.json(categories, { status: 200 }); // Wrap in NextResponse
  } catch (error) {
    console.error("Error in GET /api/category:", error);
    return NextResponse.json({ message: "Failed to fetch categories", error: error.message }, { status: 500 }); // Error response
  }
}