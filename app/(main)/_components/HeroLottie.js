'use client';

import React, { useEffect, useState } from 'react';

export default function HeroLottie() {
  // Track whether we're in the browser environment
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    // This code only runs on the client
    setIsBrowser(true);
    
    // Import Lottie player only on the client side
    import('@lottiefiles/lottie-player');
  }, []);

  // Only render the lottie-player component when in browser environment
  return (
    <div className="w-full flex justify-center items-center">
      <div className="w-full max-w-[250px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[500px] aspect-square">
        {isBrowser && (
          <lottie-player
            src="/hero-animation.json"
            background="transparent"
            speed="1"
            style={{ width: '90%', height: '90%' }}
            loop
            autoplay
          ></lottie-player>
        )}
      </div>
    </div>
  );
}