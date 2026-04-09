import { cn } from "@/lib/utils";
import "./_css/loading.css";
export default function LoadingCoursePage() {


  return (
    <div className="flex items-center justify-center w-full min-h-[70dvh] max-h-[70dvh]">
      <div className={cn("flex flex-col items-center")}>
        

        <div className="text-2xl md:text-3xl lg:text-4xl font-bold mt-8">
          <div className="hourglassBackground">
            <div className="hourglassContainer">
              <div className="hourglassCurves"></div>
              <div className="hourglassCapTop"></div>
              <div className="hourglassGlassTop"></div>
              <div className="hourglassSand"></div>
              <div className="hourglassSandStream"></div>
              <div className="hourglassCapBottom"></div>
              <div className="hourglassGlass"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
