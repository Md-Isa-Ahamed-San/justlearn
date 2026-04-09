import Image from "next/image";
import React from "react";

const HeroLottieImg = () => {
  return (
    <div className="w-full flex justify-center items-center">
      <div className="w-full max-w-[240px] sm:max-w-[280px] md:max-w-[375px] lg:max-w-[450px] aspect-square flex items-center justify-center">
        <Image
          src="/assets/lottie/heroImg.svg"
          alt="Hero Lottie"
          height={1000}
          width={1000}
          className="w-full h-full object-contain "
          priority
        />
      </div>
    </div>
  );
};

export default HeroLottieImg;