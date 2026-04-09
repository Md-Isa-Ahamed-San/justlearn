"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useContext, useState } from "react";

import { Logo } from "@/components/logo";
import { MobileNav } from "@/components/mobile-nav";
import { Menu, X, LayoutDashboard, FilePlus2, NotebookPen } from "lucide-react";
import { Button, buttonVariants } from "./ui/button";
import {
  IconHome,
  IconBooks,
  IconBook2,
  IconUser,
  IconChalkboard,
  IconListCheck,
  IconRobot,
  IconSettings,
  IconBrandGithub,
  IconBrandX,
  IconLayoutDashboard,
  IconNotebook,
} from "@tabler/icons-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import FloatingDockDemo from "./FloatingDockDemo";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useUserData } from "../provider/user-data-provider";

export function MainNav({ items, children }) {
  const { data: session, status, update } = useSession();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { userData, setUserData } = useUserData();

  const router = useRouter();
  const handleSignOut = async () => {
    // Call signOut with redirect: false to prevent full page reload
    await signOut({ redirect: false });
    // Manually trigger a session update on the client
    await update();
    setUserData(null);

    router.push("/");
  };
  if (session?.error === "RefreshAccessTokenError") {
    handleSignOut();
  }
  const navLinks = [
    {
      title: "Home",
      icon: <IconHome className="h-full w-full " />,
      href: "/",
    },
    {
      title: "Courses",
      icon: <IconBooks className="h-full w-full " />,
      href: "/courses",
    },
  ];

  // console.log(" MainLayout ~ serverUserData:", serverUserData)
  if (userData?.userData?.role === "admin") {
    navLinks.push({
      title: "Dashboard",
      icon: (
        <IconLayoutDashboard className="w-full h-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/admin-dashboard",
    });
  }

  if (userData?.userData?.role === "student") {
    navLinks.push({
      title: "Dashboard",
      icon: (
        <IconUser className="w-full h-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/student-dashboard",
    });

    navLinks.push({
      title: "Enrolled Courses",
      icon: (
        <IconNotebook className="w-full h-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/account/enrolled-courses",
    });
  }
  if (userData?.userData?.role === "instructor") {
    navLinks.push({
      title: "Manage Courses",
      icon: (
        <LayoutDashboard className="w-full h-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/instructor-dashboard/courses",
    });

    navLinks.push({
      title: "Enrolled Courses",
      icon: (
        <IconNotebook className="w-full h-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/account/enrolled-courses",
    });

navLinks.push({
  title: "Quizzes",
  icon: (
    <NotebookPen                                                                                                                          className="w-full h-full text-neutral-500 dark:text-neutral-300" />
  ),
  href: "/instructor-dashboard/quiz-sets",
});

navLinks.push({
  title: "Create a Quiz",
  icon: (
    <FilePlus2 className="w-full h-full text-neutral-500 dark:text-neutral-300" />
  ),
  href: "/instructor-dashboard/quiz-sets/add",
});
  }

  return (
    <div className="flex justify-between items-center w-full px-4 py-3">
      {/* Left: Logo */}
      <div className="flex items-center">
        <Link href="/">
          <Logo />
        </Link>
      </div>

      {/* Center: Nav items */}
      <div className="hidden lg:flex justify-center flex-1 ">
        <FloatingDockDemo links={navLinks} />
      </div>

      {/* Right: Auth + Avatar */}
      <div className="flex items-center gap-3">
        {session && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="cursor-pointer">
                <Avatar>
                  <AvatarImage
                    src={userData?.userData?.image || null}
                    alt="User"
                  />
                  <AvatarFallback>JL</AvatarFallback>
                </Avatar>
                {/* <Image src={userData?.userData?.image || null} alt="User" width={100} height={100} /> */}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-4">
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="/account">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="/account/enrolled-courses">My Courses</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="">Testimonials & Certificates</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="#" onClick={() => handleSignOut()}>
                  Logout
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {!session && (
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "sm" }), "px-4")}
            >
              Login
            </Link>

            <Link href="/register">
              <Button variant="outline" size="sm">
                Register
              </Button>
            </Link>
          </div>
        )}

        {/* Avatar Dropdown */}

        {/* Mobile menu button */}
        <button
          className="lg:hidden ml-2"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          {showMobileMenu ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile nav dropdown */}
      {showMobileMenu && items && (
        <div className="absolute top-full left-0 w-full bg-white shadow-lg z-50">
          <MobileNav items={items}>{children}</MobileNav>
        </div>
      )}
    </div>
  );
}
