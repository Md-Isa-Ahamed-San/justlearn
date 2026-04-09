import React from "react";
import HeroLottieWrapper from "./HeroLottieWrapper";
import Link from "next/link";
import { cn } from "../../../lib/utils";
import { buttonVariants } from "../../../components/ui/button";
import { getServerUserData } from "../../../queries/users";

const HeroSection = async () => {
  
  let user = null;
  try{
    user = await getServerUserData();
  }catch(error){
    user = null;
  }
  // console.log(" HeroSection ~ userData:", user)

  return (
    <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32 ">
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto justify-center items-center">
        <div className="relative  md:ml-6 lg:mr-28 isolate  min-w-[240px] sm:min-w-[280px] md:min-w-[375px] lg:min-w-[450px]">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 rounded-2xl
               bg-gradient-to-tr from-[#ff80b5] to-[#9089fc]
               opacity-30
               blur-3xl
               pointer-events-none "
          />
          <HeroLottieWrapper />
        </div>
        {/* <HeroLottieWrapper /> */}
        {/* <HeroLottie/> */}

        <div className="container flex max-w-3xl flex-col items-center gap-4 text-center relative isolate">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          >
            <div
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            />
          </div>

          {/* <span className="rounded-2xl bg-muted px-4 py-1.5 text-sm font-medium border shadow-lg">
            Hey, Welcome
          </span> */}
          <h1 className="font-heading mb-8 text-2xl font-bold sm:text-3xl md:text-4xl lg:text-6xl">
            <span style={{ color: "hsl(var(--primary))" }}>J</span>ust{" "}
            <span style={{ color: "hsl(var(--primary))" }}>U</span>nlock{" "}
            <span style={{ color: "hsl(var(--primary))" }}>S</span>kills{" "}
            <span style={{ color: "hsl(var(--primary))" }}>T</span>hat{" "}
            <span style={{ color: "hsl(var(--primary))" }}>L</span>ead{" "}
            <span style={{ color: "hsl(var(--primary))" }}>E</span>very{" "}
            <span style={{ color: "hsl(var(--primary))" }}>A</span>mbition{" "}
            <span style={{ color: "hsl(var(--primary))" }}>R</span>ight{" "}
            <span style={{ color: "hsl(var(--primary))" }}>N</span>ow.
          </h1>

          <div className="flex items-start gap-3 flex-wrap justify-start">
            {user?.userData?.role === "admin" && (
              <>
                
                <Link
                  href="/admin-dashboard/users"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" })
                  )}
                >
                  Manage Users
                </Link>
                <Link
                  href="/admin-dashboard"
                  className={cn(buttonVariants({ size: "lg" }))}
                >
                  Admin Dashboard
                </Link>
              </>
            )}

            {user?.userData?.role === "student" && (
              <>
                
                <Link
                  href="/account/progress"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" })
                  )}
                >
                  My Progress
                </Link>
                <Link
                  href="/account/enrolled-courses"
                  className={cn(buttonVariants({ size: "lg" }))}
                >
                  Enrolled Courses
                </Link>
              </>
            )}

            {user?.userData?.role === "instructor" && (
              <>
                
                <Link
                  href="/instructor-dashboard/create-course"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" })
                  )}
                >
                  Create Course
                </Link>
                <Link
                  href="/instructor-dashboard"
                  className={cn(buttonVariants({ size: "lg" }))}
                >
                  Instructor Dashboard
                </Link>
              </>
            )}

            {!user?.userData && (
              <>
               
                <Link
                  href="#courses"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" })
                  )}
                >
                  Featured Courses
                </Link>
                 <Link
                  href="/courses"
                  className={cn(buttonVariants({ size: "lg" }))}
                >
                  Explore Now
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
