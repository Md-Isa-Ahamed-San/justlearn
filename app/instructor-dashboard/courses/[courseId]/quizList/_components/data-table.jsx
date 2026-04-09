"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, Filter, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"


export function DataTable({ columns, data }) {
  const [sorting, setSorting] = React.useState([])
  const [columnFilters, setColumnFilters] = React.useState([])
  const [columnVisibility, setColumnVisibility] = React.useState({})
  const [rowSelection, setRowSelection] = React.useState({})

  // Flatten the quiz data for the table
  const flattenedData = React.useMemo(() => {
    return data.weeklyQuizzes.flatMap((weeklyQuiz) =>
      weeklyQuiz.quizzes.map((quiz) => ({
        ...quiz,
        week: weeklyQuiz.week,
      })),
    )
  }, [data.weeklyQuizzes])

  const table = useReactTable({
    data: flattenedData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // Get unique values for filters
  const uniqueStatuses = React.useMemo(() => {
    return Array.from(new Set(flattenedData.map((item) => item.status)))
  }, [flattenedData])

  const uniqueWeeks = React.useMemo(() => {
    return Array.from(new Set(flattenedData.map((item) => item.week.order))).sort((a, b) => a - b)
  }, [flattenedData])

  const clearFilters = () => {
    setColumnFilters([])
  }

  const hasActiveFilters = columnFilters.length > 0

  const weekFilterValue = React.useMemo(() => {
    const weekFilter = columnFilters.find((filter) => filter.id === "week.order")
    return weekFilter?.value?.toString() ?? ""
  }, [columnFilters])

  const handleWeekFilterChange = (value) => {
    if (value === "all") {
      // Remove week filter
      setColumnFilters((prev) => prev.filter((filter) => filter.id !== "week.order"))
    } else {
      // Set or update week filter
      setColumnFilters((prev) => {
        const otherFilters = prev.filter((filter) => filter.id !== "week.order")
        return [...otherFilters, { id: "week.order", value: Number(value) }]
      })
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Course Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              <span>{data.courseInfo.title}</span>
              <Badge variant="outline" className="ml-2">
                {data.courseInfo.code}
              </Badge>
            </div>
          </CardTitle>
          {/* <CardDescription>{data.courseInfo.description}</CardDescription> */}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{data.summary.totalWeeks}</div>
              <div className="text-sm text-muted-foreground">Total Weeks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{data.summary.totalQuizzes}</div>
              <div className="text-sm text-muted-foreground">Total Quizzes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{data.summary.totalStudents}</div>
              <div className="text-sm text-muted-foreground">Total Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{data.summary.totalSubmissions}</div>
              <div className="text-sm text-muted-foreground">Total Submissions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{data.summary.averageScore}</div>
              <div className="text-sm text-muted-foreground">Average Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Filter quizzes..."
              value={(table.getColumn("title")?.getFilterValue()) ?? ""}
              onChange={(event) => table.getColumn("title")?.setFilterValue(event.target.value)}
              className="max-w-sm"
            />

            <Select
              value={(table.getColumn("status")?.getFilterValue()) ?? ""}
              onValueChange={(value) => table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {uniqueStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={weekFilterValue || "all"} onValueChange={handleWeekFilterChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Week" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Weeks</SelectItem>
                {uniqueWeeks.map((week) => (
                  <SelectItem key={week} value={week.toString()}>
                    Week {week}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="h-8 px-2 lg:px-3">
                Reset
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto bg-transparent">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {columnFilters.map((filter) => (
              <Badge key={filter.id} variant="secondary" className="text-xs">
                {filter.id === "week.order" ? `Week: ${filter.value}` : `${filter.id}: ${filter.value}`}
                <button
                  onClick={() => {
                    if (filter.id === "week.order") {
                      handleWeekFilterChange("all")
                    } else {
                      table.getColumn(filter.id)?.setFilterValue("")
                    }
                  }}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
          selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
