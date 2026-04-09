"use client";
import { useState } from "react";

import {
  AuthTabs,
  Ripple,
  TechOrbitDisplay,
} from "@/components/modern-animated-sign-in";
import Image from "next/image";
import {
  checkProfileCompletion,
  credentialLogin,
} from "../app/actions/authActions";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const iconsArray = [
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg"
        alt="nodejs"
      />
    ),
    className: "size-[30px] border-none bg-transparent",
    duration: 20,
    delay: 20,
    radius: 100,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg"
        alt="express"
      />
    ),
    className: "size-[30px] border-none bg-transparent",
    duration: 20,
    delay: 10,
    radius: 100,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/prisma/prisma-original.svg"
        alt="Prisma"
      />
    ),
    className: "size-[50px] border-none bg-transparent",
    radius: 210,
    duration: 20,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg"
        alt="JavaScript"
      />
    ),
    className: "size-[40px] border-none bg-transparent",
    radius: 210,
    duration: 20,
    delay: 20,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg"
        alt="TailwindCSS"
      />
    ),
    className: "size-[30px] border-none bg-transparent",
    duration: 20,
    delay: 20,
    radius: 150,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg"
        alt="Nextjs"
      />
    ),
    className: "size-[30px] border-none bg-transparent",
    duration: 20,
    delay: 10,
    radius: 150,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg"
        alt="React"
      />
    ),
    className: "size-[50px] border-none bg-transparent",
    radius: 270,
    duration: 20,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg"
        alt="MongoDB"
      />
    ),
    className: "size-[50px] border-none bg-transparent",
    radius: 270,
    duration: 20,
    delay: 60,
    path: false,
    reverse: true,
  },
];

export function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const handleInputChange = (event, name) => {
    const value = event.target.value;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const res = await credentialLogin(formData);
      console.log(" handleSubmit ~ res of credentialLogin:", res);
      if (res?.error) {
        setLoginError(res.error); // Display the error message from NextAuth.js
      } else {
        
        await update(); 
        const res = await fetch("/api/checkProfileCompletion",{
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: formData.email }),
        })
        const profileCompletionStatus = await res.json();
        // console.log("handleSubmit ~ profileCompletion:", profileData);
        
        if (profileCompletionStatus.success) {
          router.push(profileCompletionStatus.redirectTo);
        } else {
          setLoginError("Failed to check profile completion");
          setSubmitting(false);
        }

      
      }
      console.log("handleSubmit ~ res:", res);
    } catch (err) {
      setLoginError(err.message || "Unexpected error occurred.");
    }
  };

  const goToForgotPassword = (event) => {
    event.preventDefault();
    console.log("forgot password");
  };

  const formFields = {
    header: "Welcome back",
    subHeader: "Sign in to your account",
    fields: [
      {
        label: "Email",
        required: true,
        type: "email",
        placeholder: "Enter your email",
        onChange: (e) => handleInputChange(e, "email"),
      },
      {
        label: "Password",
        required: true,
        type: "password",
        placeholder: "Enter your password",
        onChange: (e) => handleInputChange(e, "password"),
      },
    ],
    submitButton: "Sign in",
    textVariantButton: "Don't have an account? Sign Up",
  };

  return (
    <section className="flex max-lg:justify-center">
      <span className="flex flex-col justify-center w-1/2 max-lg:hidden">
        <Ripple mainCircleSize={100} />
        <TechOrbitDisplay iconsArray={iconsArray} />
      </span>

      <span className="w-1/2 h-[100dvh] flex flex-col justify-center items-center max-lg:w-full max-lg:px-[10%]">
        <AuthTabs
          loginError={loginError}
          formFields={formFields}
          goTo={goToForgotPassword}
          handleSubmit={handleSubmit}
          submitting={submitting}
          setSubmitting={setSubmitting}
        />
      </span>
    </section>
  );
}
