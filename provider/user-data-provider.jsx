// components/providers/UserDataProvider.js
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const UserDataContext = createContext();

export function UserDataProvider({ children, initialUserData }) {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState(initialUserData);
  const [isLoading, setIsLoading] = useState(false);

  // If session changes and we don't have userData, fetch it
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email && !userData) {
      fetchUserData(session.user.email);
    }
  }, [session, status, userData]);

  const fetchUserData = async (userEmail) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      console.log(" fetchUserData ~ response inside user data provider:", response)
      setUserData(data);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = async () => {
    if (session?.user?.email) {
      await fetchUserData(session.user.email);
    }
  };

  const value = {
    userData,
    isLoading: status === "loading" || isLoading,
    refreshUserData,
    isAuthenticated: status === "authenticated",
    session,
    setUserData
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
}

// Custom hook to use user data
export function useUserData() {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error("useUserData must be used within UserDataProvider");
  }
  return context;
}