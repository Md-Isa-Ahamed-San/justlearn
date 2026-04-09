import React from "react";
import { TabsContent } from "@/components/ui/tabs";

import { CheckCircle } from "lucide-react";
import Testimonials from "./Testimonials";
const CourseOverview = ({ courseDetails, testimonials }) => {
  return (
    <TabsContent value="overview" className="mt-6">
      <div className="space-y-8">
        <div>
          <h3 className="mb-4 text-2xl font-bold">Course Description</h3>
          <div className="max-w-none">
            <p>{courseDetails?.description}</p>
          </div>
        </div>

        <div className="rounded-xl p-8 bg-muted/30">
          <h4 className="mb-6 text-2xl font-bold">What You Will Learn</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            {courseDetails?.learning?.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Testimonials testimonials={testimonials} />
    </TabsContent>
  );
};

export default CourseOverview;
