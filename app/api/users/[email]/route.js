// app/api/user/[email]/route.js
export const dynamic = 'force-dynamic';
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getUserByEmail } from "../../../../queries/users";

export async function GET(request, { params }) {
  try {
    const { email } = await params;
    // Verify authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Decode the email parameter (in case it was URL encoded)
    const requestedEmail = decodeURIComponent(email);
    console.log(" GET ~ requestedEmail:", requestedEmail)
    console.log(" GET ~ session.user.email:", session.user.email)

    // Ensure user can only access their own data
    if (session.user.email !== requestedEmail) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch user data
    const userData = await getUserByEmail(requestedEmail);
    
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Combine session and database data
    const responseData = {
      ...session,
      userData,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}