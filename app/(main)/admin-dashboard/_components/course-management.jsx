import { BookOpen, CheckCircle, Clock, EyeOff } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import CourseTable from "./course-table";

export default async function CourseManagement({ courses }) {
  // Calculate stats based on the 'active' property
  const publishedCourses = courses.filter((c) => c.active).length;
  const draftCourses = courses.filter((c) => !c.active).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-muted-foreground">All available courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedCourses}</div>
            <p className="text-xs text-muted-foreground">Live and visible courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftCourses}</div>
            <p className="text-xs text-muted-foreground">In development</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hidden</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* The data only provides 'active' status. 
                We assume 'hidden' courses are those that are not active. */}
            <div className="text-2xl font-bold">{draftCourses}</div>
            <p className="text-xs text-muted-foreground">Not currently visible</p>
          </CardContent>
        </Card>
      </div>

      <CourseTable courses={courses} />
    </div>
  );
}