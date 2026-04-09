// app/(main)/_components/HeroLottieWrapper.tsx
"use client";

import dynamic from "next/dynamic";
import HeroLottieImg from "./HeroLottieImg";

const HeroLottie = dynamic(() => import("./HeroLottie"), {
  ssr: false,
  loading: () => <HeroLottieImg />,
});

export default function HeroLottieWrapper() {
  return <HeroLottie />;
}
