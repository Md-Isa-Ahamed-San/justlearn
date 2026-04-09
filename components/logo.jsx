import { TextShimmer } from "@/components/text-shimmer";
export const Logo = ({ textSize = "text-3xl" }) => {
  return (
    <>
      <div
        className={`text-2xl md:${textSize} font-delius hover:scale-105 hover:duration-200 `}
      >
        <TextShimmer style={{ color: "hsl(var(--primary))" }}>JUST</TextShimmer>
        Learn
      </div>
      {/* <TextShimmer
        // duration={2}
        className="font-delius text-2xl hover:scale-105 hover:duration-200 font-medium [--base-color:theme(colors.purple.950)] [--base-gradient-color:theme(colors.blue.200)] dark:[--base-color:theme(colors.blue.700)] dark:[--base-gradient-color:theme(colors.blue.400)]"
      >
        <span style={{ color: "hsl(var(--primary))"}}>JUST</span>Learn
      </TextShimmer> */}
    </>
  );
};
