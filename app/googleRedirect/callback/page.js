// app/auth/callback/page.js
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { checkProfileCompletion } from "../../actions/authActions";
// Add this to pages that use headers(), cookies(), etc.
export const dynamic = 'force-dynamic';
export default async function AuthCallback() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/signin?error=no_session");
  }

  const email = session.user.email;
  console.log("Callback - User email:", email);

  const profileCheck = await checkProfileCompletion(email);

  if (profileCheck.isComplete) {
    redirect("/courses");
  } else {
    redirect("/roleSelection");
  }
}
