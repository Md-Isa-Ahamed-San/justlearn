export const dynamic = 'force-dynamic';
// /app/api/googleLoginRedirect/route.js
import { NextResponse } from "next/server";
import { auth, signOut } from "@/auth";


import { checkProfileCompletion } from "../../actions/authActions";

export async function POST(request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return Response.json({ 
        success: false, 
        error: "Not authenticated",
        redirectTo: "/login" 
      });
    }

    const { email } = await request.json();
    
    // Verify the email matches the session
    if (email !== session.user.email) {
      return Response.json({ 
        success: false, 
        error: "Email mismatch",
        redirectTo: "/login" 
      });
    }

    const profileCheck = await checkProfileCompletion(email);
    
    return Response.json({ 
      success: true, 
      redirectTo: profileCheck.redirectTo,
      isComplete: profileCheck.isComplete,
      role: profileCheck.role
    });
    
  } catch (error) {
    console.error("Profile check API error:", error);
    return Response.json({ 
      success: false, 
      error: "Failed to check profile completion",
      redirectTo: "/login" 
    });
  }
}
