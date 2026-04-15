import React from "react";
// import Menu from './account-menu';
import Image from "next/image";
import { getServerUserData } from "../../../../queries/users";
import Menu from "./account-menu";

const ProfileSummery = async () => {
  let serverUserData = null;

  try {
    serverUserData = await getServerUserData();
  } catch (error) {
    console.log(
      "Could not fetch server user data during build:",
      error.message
    );
    serverUserData = null;
  }

  const userData = serverUserData?.userData;

  const profileImage = userData?.image || "/placeholder.svg";

  return (
    <div className="p-6 rounded-md shadow border">
      <div className="profile-pic text-center mb-5">
        <input
          id="pro-img"
          name="profile-image"
          type="file"
          className="hidden"
        />
        <div>
          <div className="relative size-28 mx-auto">
            {profileImage.startsWith("/") ? (
              <Image
                src={profileImage}
                className="rounded-full shadow dark:shadow-gray-800 ring-4 ring-slate-50 dark:ring-slate-800"
                id="profile-banner"
                alt="profile-image"
                width={112}
                height={112}
              />
            ) : (
              <Image
                src={profileImage}
                className="rounded-full shadow dark:shadow-gray-800 ring-4 ring-slate-50 dark:ring-slate-800"
                id="profile-banner"
                alt="profile-image"
                width={112}
                height={112}
                unoptimized
              />
            )}
            <label
              className="absolute inset-0 cursor-pointer"
              htmlFor="pro-img"
            />
          </div>
          <div className="mt-4">
            <h5 className="text-lg font-semibold">{userData?.name || "User"}</h5>
            <p className="text-slate-400">{userData?.email || ""}</p>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 dark:border-gray-700">
        <Menu />
      </div>
    </div>
  );
};

export default ProfileSummery;
