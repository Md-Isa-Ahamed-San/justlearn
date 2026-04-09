import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { useLockBody } from "@/hooks/use-lock-body";

import { Button, buttonVariants } from "./ui/button";
import { useSession, signOut } from "next-auth/react";
import { useUserData } from "../provider/user-data-provider";
export function MobileNav({ items, children }) {
  const { setUserData } = useUserData()
  useLockBody();
  const { data: session, status } = useSession();

  if (session?.error === "RefreshAccessTokenError") {
    console.log("RefreshAccessTokenError... Signing out...");
    signOut();
    setUserData(null);
    redirect("/login");
    
  }

  return (
    <div
      className={cn(
        "fixed inset-0 top-16 z-30 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in slide-in-from-bottom-80 lg:hidden"
      )}
    >
      <div className="relative z-20 grid gap-6 rounded-md bg-popover p-4 text-popover-foreground shadow-md border">
        <nav className="grid grid-flow-row auto-rows-max text-sm">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "flex w-full items-center rounded-md p-2 text-sm font-medium hover:underline",
                item.disabled && "cursor-not-allowed opacity-60"
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>

        {!session && (
          <div className="items-center gap-3 flex lg:hidden">
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "sm" }), "px-4")}
            >
              Login
            </Link>
            <Button variant="outline" size="sm">
              <Link href="/register">Register</Link>
            </Button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
