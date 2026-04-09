import {getServerUserData} from "@/queries/users";

export const dynamic = 'force-dynamic';
import React from 'react';
import { Login } from '../../components/login';
import {redirect} from "next/navigation";

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

    return <Login/>
    
};

export default page;