// app/api/users/route.js
import { NextResponse } from "next/server";
import { db } from "../../../lib/prisma";

export async function GET() {
  try {
    // Use `prisma.user.findMany()`
    // console.log(db)
    const users = await db.user.findMany();
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
