"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

export default function AnalyticsCharts({ enrollmentTrend, topCourses }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Enrollment Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Enrollment Trend (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enrollmentTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={enrollmentTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--background))",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="enrollments"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">
              No enrollment data available yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Top Courses by Enrollment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Top Courses by Enrollment
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topCourses?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topCourses} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  className="stroke-muted"
                />
                <XAxis
                  type="number"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                  tick={{ fill: "hsl(var(--foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--background))",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar
                  dataKey="students"
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">
              No course data available yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
