"use server";

import { auth, signIn, unstable_update } from "@/auth"; // Adjust if needed
import { redirect } from "next/navigation";
import { db } from "../../lib/prisma";

export async function credentialLogin(data) {
  console.log("credentialLogin ~ formData:", data);

  return await signIn("credentials", {
    email: data.email,
    password: data.password,
    redirect: false,
  });
}

// export async function doSocialLogin(formData) {
//   const action = formData.get("action");
//   await signIn(action, { redirectTo: "/courses" });
// }

export async function doSocialLogin(formData) {
  const action = formData.get("action");
  console.log("🚀 doSocialLogin called with action:", action);

  await signIn(action, {
    redirectTo: "/googleRedirect/callback", // Create a callback route to handle post-signin logic
  });
}

export const checkProfileCompletion = async (email) => {
  console.log("email in checkProfileCompletion: ", email);

  const user = await db.user.findUnique({
    where: { email: email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // A user is considered complete if they have a role assigned AND isProfileComplete is true.
  const isComplete = !!user.role && !!user.isProfileComplete;

  console.log("Profile completion check:", {
    email,
    role: user.role,
    isProfileComplete: user.isProfileComplete,
    isComplete,
  });

  let redirectTo = "/courses";
  if (!user.role) {
    redirectTo = "/roleSelection";
  } else if (!user.isProfileComplete) {
    redirectTo = "/profile-completion";
  }

  return {
    isComplete,
    role: user.role,
    redirectTo: redirectTo,
  };
};

export async function submitRole(formData) {
  const role = formData.get("role")

  if (!role) {
    throw new Error("Role not selected")
  }

  const session = await auth()
  if (!session?.user?.email) {
    throw new Error("Not authenticated")
  }

  // Update role in DB
  await db.user.update({
    where: { email: session.user.email },
    data: { role },
  })

  // Force-update the JWT cookie so the middleware immediately sees the new role.
  // Without this, the middleware reads the stale token on the redirect request
  // and loops the user back to /roleSelection.
  await unstable_update({
    user: {
      ...session.user,
      role,
    },
  })

  redirect("/profile-completion")
}

export async function completeProfile() {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error("Not authenticated")
  }

  // Update isProfileComplete in DB
  await db.user.update({
    where: { email: session.user.email },
    data: { isProfileComplete: true },
  })

  // Force-update the JWT cookie so the middleware immediately sees isProfileComplete: true.
  await unstable_update({
    user: {
      ...session.user,
      isProfileComplete: true,
    },
  })

  redirect("/account")
}
