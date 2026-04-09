export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { db } from "../../../lib/prisma";
import { postUser } from "../../../queries/users";

export async function POST(request) {
  try {
    const data = await request.json();
    console.log(" POST ~ data:", data);

    // Basic validation
    if (!data.name || !data.email || !data.password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }
    // Validate social media data
    if (
      data.socialMedia &&
      typeof data.socialMedia !== "string" &&
      typeof data.socialMedia !== "object"
    ) {
      return NextResponse.json(
        { message: "Invalid social media data" },
        { status: 400 }
      );
    }

    // Check for existing user with same email
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already in use" },
        { status: 409 }
      );
    }

    // console.log(" POST ~ hashedPassword:", data);

    const user = await postUser(data);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
