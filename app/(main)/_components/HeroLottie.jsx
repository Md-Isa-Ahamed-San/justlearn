"use client";
import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function HeroLottie() {
  return (
    <div className="w-full flex justify-center items-center">
      <div className="w-full max-w-[240px] sm:max-w-[280px] md:max-w-[375px] lg:max-w-[450px] aspect-square">
        <DotLottieReact
          src="/hero-animation.lottie"
          background="transparent"
          speed="1"
          style={{ width: "100%", height: "100%" }}
          loop
          autoplay
        />
      </div>
    </div>
  );
}