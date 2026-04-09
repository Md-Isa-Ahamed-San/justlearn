import { columns } from "./_components/columns"
import { DataTable } from "./_components/data-table"

// Sample student data based on the provided structure
const courseOverviewData = {
  courseInfo: {
    id: "686bd330132d72f488155d02",
    title: "Foundation of Web Development.",
    code: "CSE-3210",
    description:
      "This course offers a foundational overview of web development, covering both front-end and back-end basics. Key topics include HTML, CSS, JavaScript, Git, and web hosting. By the end, learners will understand how the web works and be able to build simple, responsive websites.",
  },
  weeklyQuizzes: [
    {
      week: {
        id: "686bdc19981bb26d863af828",
        title: "Basic HTML..",
        description: "This Week you will learn basics of HTML.",
        order: 1,
        status: "published",
      },
      quizzes: [
        {
          id: "686be8d4981bb26d863af82a",
          title: "HTML structure",
          description: "Basic of HTML structure",
          status: "published",
          timeLimit: 5,
          maxAttempts: 1,
          securityLevel: "medium",
          totalSubmissions: 1,
          completionPercentage: "100%",
          createdAt: new Date("2025-07-07T15:33:40.677Z"),
          submissions: [
            {
              id: "689b8cd551a848511379bd75",
              score: 4,
              attemptNumber: 1,
              timeSpent: 1,
              submissionReason: "manual_submit",
              createdAt: new Date("2025-08-12T18:49:57.094Z"),
              student: {
                id: "6842e2f52433a7219fcb76e1",
                name: "Isa Ahmed Shan",
                email: "isaahmedshan190138@gmail.com",
                idNumber: 190138,
                session: "2019-2020",
                department: "Computer Science",
              },
            },
          ],
        },
      ],
      totalQuizzes: 1,
    },
    {
      week: {
        id: "686cc1ee8fd21e3e01b88cec",
        title: "Basic of CSS",
        description: "You will learn basic of CSS",
        order: 2,
        status: "published",
      },
      quizzes: [
        {
          id: "686cb9c48fd21e3e01b88cc0",
          title: "HTML basic",
          description: "A comprehensive quiz about HTML",
          status: "published",
          timeLimit: 5,
          maxAttempts: 1,
          securityLevel: "medium",
          totalSubmissions: 0,
          completionPercentage: "0%",
          createdAt: new Date("2025-07-08T06:25:08.252Z"),
          submissions: [],
        },
      ],
      totalQuizzes: 1,
    },
  ],
  summary: {
    totalWeeks: 2,
    totalQuizzes: 2,
    totalStudents: 1,
    totalSubmissions: 1,
    averageScore: 4,
  },
}

export default function QuizListPage() {
  return (
    <div className="mx-auto py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quiz Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track quiz submissions, student performance, and course analytics.
          </p>
        </div>

        <DataTable columns={columns} data={courseOverviewData} />
      </div>
    </div>
  )
}
