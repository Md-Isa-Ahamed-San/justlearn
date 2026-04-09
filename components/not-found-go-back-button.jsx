"use client";
import { useRouter } from "next/navigation";
import React from "react";

const NotFoundGoBackButton = () => {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="mt-6 px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
    >
      Go Back
    </button>
  );
};

export default NotFoundGoBackButton;
