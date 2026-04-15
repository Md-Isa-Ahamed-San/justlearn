// app/account/page.tsx (or .jsx)

import ProfileTabs from "./_components/ProfileTabs";
import { getServerUserData } from "../../../../queries/users";
export const dynamic = 'force-dynamic';
export default async function RoleBasedProfile({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const selectedRole = resolvedSearchParams?.role;

  let serverUserData = null;
  
  try {
    serverUserData = await getServerUserData();
  } catch (error) {
    // During static generation, this might fail
    console.log(
      "Could not fetch server user data during build:",
      error.message
    );
    serverUserData = null;
  }
  const userData = serverUserData?.userData;
  const effectiveUserData = {
    ...userData,
    role: selectedRole || userData?.role,
  };

  return <ProfileTabs userData={effectiveUserData} />;
}
