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

export default function InstructorAnalyticsCharts({ enrollmentTrend, quizAverages }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))", color: "hsl(var(--foreground))" }} />
                <Line type="monotone" dataKey="enrollments" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">No enrollment data in last 6 months.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Average Quiz Score by Quiz
          </CardTitle>
        </CardHeader>
        <CardContent>
          {quizAverages?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={quizAverages} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                <YAxis type="category" dataKey="name" fontSize={11} tickLine={false} axisLine={false} width={110} tick={{ fill: "hsl(var(--foreground))" }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))", color: "hsl(var(--foreground))" }} formatter={(v) => [`${v}%`, "Avg Score"]} />
                <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">No quiz submissions yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
