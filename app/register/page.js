import {getServerUserData} from "@/queries/users";

export const dynamic = 'force-dynamic'
import React from 'react';
import { Register } from '../../components/register';
import {redirect} from "next/navigation";

export const metadata = {
  title: "Create an Account",
  description: "Join JUSTLearn today. Explore, learn, build, and share your knowledge.",
};

const page = async() => {
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

    if (userData) redirect("/");
    return (
      <main>
        <h1 className="sr-only">Create your JUSTLearn Account</h1>
        <Register/>
      </main>
    );
    
};

export default page;