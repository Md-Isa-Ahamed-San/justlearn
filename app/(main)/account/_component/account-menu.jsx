import Link from "next/link";
import {
  User,
  BookOpen,
  Settings,
  Bell,
  CreditCard,
  BadgeIcon as Certificate,
  LogOut,
  ChevronRight,
} from "lucide-react";

import SignOutButton from "./SignOutButton";
import { getServerUserData } from "../../../../queries/users";
import { getUserEnrolledCourses } from "../../../../queries/courses";

export const dynamic = "force-dynamic";

const menuItems = [
  {
    label: "Profile",
    href: "/account",
    icon: <User className="h-4 w-4" />,
  },
  {
    label: "Enrolled Courses",
    href: "/account/enrolled-courses",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    label: "My Progress",
    href: "/account/progress",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    label: "Certificates",
    href: "/account/certificates",
    icon: <Certificate className="h-4 w-4" />,
  },
];

async function Menu({ currentPath }) {
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
  try {
  

    if (!userData?.id) {
      console.warn("⚠️ No user data found");
      return (
        <nav className="space-y-1">
          <div className="text-sm text-muted-foreground px-3 py-2">
            Please sign in to view menu
          </div>
        </nav>
      );
    }

    const enrolledCourses = await getUserEnrolledCourses(userData.id);
    const enrolledCoursesCount = enrolledCourses?.length || 0;

    const menuItemsWithBadges = menuItems.map((item) => {
      if (item.href === "/account/enrolled-courses") {
        return {
          ...item,
          badge: enrolledCoursesCount > 0 ? enrolledCoursesCount : undefined,
        };
      }
      return item;
    });

    return (
      <nav className="space-y-1">
        {menuItemsWithBadges.map((item, index) => {
          const isActive = currentPath === item.href;

          return (
            <Link
              key={index}
              href={item.href}
              className={`
                flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium
                group relative transition-colors hover:bg-accent hover:text-accent-foreground
                ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span
                  className={
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-primary"
                  }
                >
                  {item.icon}
                </span>
                {item.label}
              </div>

              {item.badge && (
                <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1.5">
                  {item.badge}
                </span>
              )}

              {isActive && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-md" />
              )}

              {!item.badge && !isActive && (
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-70 transition-opacity" />
              )}
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-border">
          <SignOutButton />
        </div>
      </nav>
    );
  } catch (error) {
    console.error("❌ Error in Menu component:", error);

    return (
      <nav className="space-y-1">
        <div className="text-sm text-muted-foreground px-3 py-2">
          Error loading menu
        </div>
      </nav>
    );
  }
}

export default Menu;
