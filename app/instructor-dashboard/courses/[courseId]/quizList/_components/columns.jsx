"use client"

import { ArrowUpDown, MoreHorizontal, Eye, BarChart3, Download, Users, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"


// Submissions Modal Component
function SubmissionsModal({ quiz, isOpen, onClose }) {
  const [sessionFilter, setSessionFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [idFilter, setIdFilter] = useState("")

  const uniqueSessions = useMemo(() => {
    return Array.from(new Set(quiz.submissions.map((sub) => sub.student.session))).sort()
  }, [quiz.submissions])

  const uniqueDepartments = useMemo(() => {
    return Array.from(new Set(quiz.submissions.map((sub) => sub.student.department))).sort()
  }, [quiz.submissions])

  const filteredSubmissions = useMemo(() => {
    return quiz.submissions.filter((submission) => {
      const matchesSession = sessionFilter === "all" || submission.student.session === sessionFilter
      const matchesDepartment = departmentFilter === "all" || submission.student.department === departmentFilter
      const matchesId = !idFilter || submission.student.idNumber.toString().includes(idFilter)

      return matchesSession && matchesDepartment && matchesId
    })
  }, [quiz.submissions, sessionFilter, departmentFilter, idFilter])

  const clearAllFilters = () => {
    setSessionFilter("all")
    setDepartmentFilter("all")
    setIdFilter("")
  }

  const hasActiveFilters = sessionFilter !== "all" || departmentFilter !== "all" || idFilter

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quiz Submissions - {quiz.title}</DialogTitle>
          <DialogDescription>View all student submissions for this quiz</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Total Submissions</div>
              <div className="text-2xl font-bold">{quiz.totalSubmissions}</div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Completion Rate</div>
              <div className="text-2xl font-bold">{quiz.completionPercentage}</div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Time Limit</div>
              <div className="text-2xl font-bold">{quiz.timeLimit}m</div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Max Attempts</div>
              <div className="text-2xl font-bold">{quiz.maxAttempts}</div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filter Submissions</span>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 px-2">
                  Clear All
                  <X className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Session</label>
                <Select value={sessionFilter} onValueChange={setSessionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Sessions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sessions</SelectItem>
                    {uniqueSessions.map((session) => (
                      <SelectItem key={session} value={session}>
                        {session}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Department</label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {uniqueDepartments.map((department) => (
                      <SelectItem key={department} value={department}>
                        {department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Student ID</label>
                <Input placeholder="Search by ID..." value={idFilter} onChange={(e) => setIdFilter(e.target.value)} />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {sessionFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    Session: {sessionFilter}
                    <button onClick={() => setSessionFilter("all")} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {departmentFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    Department: {departmentFilter}
                    <button onClick={() => setDepartmentFilter("all")} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {idFilter && (
                  <Badge variant="secondary" className="text-xs">
                    ID: {idFilter}
                    <button onClick={() => setIdFilter("")} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          {filteredSubmissions.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Student Submissions</h4>
                <span className="text-sm text-muted-foreground">
                  Showing {filteredSubmissions.length} of {quiz.submissions.length} submissions
                </span>
              </div>
              {filteredSubmissions.map((submission) => (
                <div key={submission.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-medium">{submission.student.name}</h5>
                      <p className="text-sm text-muted-foreground">
                        ID: {submission.student.idNumber} | {submission.student.department} |{" "}
                        {submission.student.session}
                      </p>
                    </div>
                    <Badge variant="secondary">Score: {submission.score}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Attempt:</span> {submission.attemptNumber}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Time Spent:</span> {submission.timeSpent}m
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reason:</span>{" "}
                      {submission.submissionReason.replace("_", " ")}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Submitted:</span>{" "}
                      {submission.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {hasActiveFilters ? "No submissions match the selected filters" : "No submissions yet for this quiz"}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Actions Cell Component
function ActionsCell({ quiz }) {
  const [showSubmissions, setShowSubmissions] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setShowSubmissions(true)}>
            <Eye className="mr-2 h-4 w-4" />
            View All Submissions
          </DropdownMenuItem>
          <DropdownMenuItem>
            <BarChart3 className="mr-2 h-4 w-4" />
            Quiz Analytics
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Users className="mr-2 h-4 w-4" />
            Student Performance
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Download className="mr-2 h-4 w-4" />
            Export Results
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SubmissionsModal quiz={quiz} isOpen={showSubmissions} onClose={() => setShowSubmissions(false)} />
    </>
  )
}

export const columns = [
  {
    accessorKey: "week.order",
    filterFn: (row, id, value) => {
      return row.original.week.order === value
    },
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Week
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const week = row.original.week
      return (
        <div className="flex flex-col">
          <Badge variant="outline" className="w-fit">
            Week {week.order}
          </Badge>
          <span className="text-sm text-muted-foreground mt-1">{week.title}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Quiz Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span className="font-medium">{row.getValue("title")}</span>
          <span className="text-sm text-muted-foreground">{row.original.description}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") 
      return <Badge variant={status === "published" ? "default" : "secondary"}>{status}</Badge>
    },
  },
  {
    accessorKey: "totalSubmissions",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Submissions
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const submissions = row.getValue("totalSubmissions")
      const percentage = row.original.completionPercentage
      return (
        <div className="flex flex-col">
          <span className="font-medium">{submissions}</span>
          <span className="text-sm text-muted-foreground">{percentage} completion</span>
        </div>
      )
    },
  },
  {
    accessorKey: "timeLimit",
    header: "Time Limit",
    cell: ({ row }) => {
      return <span>{row.getValue("timeLimit")} minutes</span>
    },
  },
  {
    accessorKey: "maxAttempts",
    header: "Max Attempts",
    cell: ({ row }) => {
      return <span>{row.getValue("maxAttempts")}</span>
    },
  },
  {
    accessorKey: "securityLevel",
    header: "Security",
    cell: ({ row }) => {
      const level = row.getValue("securityLevel")
      return (
        <Badge variant={level === "high" ? "destructive" : level === "medium" ? "default" : "secondary"}>{level}</Badge>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("createdAt")
      return <span>{date.toLocaleDateString()}</span>
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      return <ActionsCell quiz={row.original} />
    },
  },
]
