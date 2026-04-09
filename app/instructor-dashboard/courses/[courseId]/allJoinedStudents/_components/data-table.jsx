"use client";

import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable
} from "@tanstack/react-table";
import * as React from "react";

import { manuallyCompleteCourse } from "@/app/actions/course";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { BookOpen, Calendar, CheckCircle, ChevronDown, FileText, Filter, Mail, Phone, User, X } from "lucide-react";
import { toast } from "sonner";

// Advanced Filters Component
function AdvancedFilters({ data, onFiltersChange, currentFilters }) {
    const [departments, setDepartments] = React.useState([]);
    const [sessions, setSessions] = React.useState([]);
    const [selectedDepartments, setSelectedDepartments] = React.useState([]);
    const [selectedSessions, setSelectedSessions] = React.useState([]);
    const [selectedProgressRanges, setSelectedProgressRanges] = React.useState([]);

    const progressRanges = [
        { label: "Not Started (0%)", value: "0", min: 0, max: 0 },
        { label: "Low Progress (1-49%)", value: "1-49", min: 1, max: 49 },
        { label: "Moderate Progress (50-74%)", value: "50-74", min: 50, max: 74 },
        { label: "High Progress (75-99%)", value: "75-99", min: 75, max: 99 },
        { label: "Completed (100%)", value: "100", min: 100, max: 100 }
    ];

    // Extract unique departments and sessions from data
    React.useEffect(() => {
        const uniqueDepartments = [...new Set(data.map(student => student.studentDetails?.department).filter(Boolean))];
        const uniqueSessions = [...new Set(data.map(student => student.studentDetails?.session).filter(Boolean))];
        
        setDepartments(uniqueDepartments.sort());
        setSessions(uniqueSessions.sort());
    }, [data]);

    // Update filters when selections change
    React.useEffect(() => {
        const filters = {
            departments: selectedDepartments,
            sessions: selectedSessions,
            progressRanges: selectedProgressRanges
        };
        onFiltersChange(filters);
    }, [selectedDepartments, selectedSessions, selectedProgressRanges, onFiltersChange]);

    const handleDepartmentChange = (department, checked) => {
        setSelectedDepartments(prev => 
            checked 
                ? [...prev, department]
                : prev.filter(d => d !== department)
        );
    };

    const handleSessionChange = (session, checked) => {
        setSelectedSessions(prev => 
            checked 
                ? [...prev, session]
                : prev.filter(s => s !== session)
        );
    };

    const handleProgressRangeChange = (range, checked) => {
        setSelectedProgressRanges(prev => 
            checked 
                ? [...prev, range]
                : prev.filter(r => r.value !== range.value)
        );
    };

    const clearAllFilters = () => {
        setSelectedDepartments([]);
        setSelectedSessions([]);
        setSelectedProgressRanges([]);
    };

    const hasActiveFilters = selectedDepartments.length > 0 || selectedSessions.length > 0 || selectedProgressRanges.length > 0;
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center flex-row">
                {/* Department Filter */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button 
                            variant="outline" 
                            className="bg-input border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Department
                            {selectedDepartments.length > 0 && (
                                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                                    {selectedDepartments.length}
                                </Badge>
                            )}
                            <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 bg-popover border-border" align="start">
                        <div className="space-y-2">
                            <h4 className="text-sm font-bold text-popover-foreground">Select Departments</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {departments.map(department => (
                                    <div key={department} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`dept-${department}`}
                                            checked={selectedDepartments.includes(department)}
                                            onCheckedChange={(checked) => handleDepartmentChange(department, checked)}
                                        />
                                        <label 
                                            htmlFor={`dept-${department}`} 
                                            className="text-sm text-popover-foreground cursor-pointer flex-1"
                                        >
                                            {department}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Session Filter */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button 
                            variant="outline" 
                            className="bg-input border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                            <Calendar className="h-4 w-4 mr-2" />
                            Session
                            {selectedSessions.length > 0 && (
                                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                                    {selectedSessions.length}
                                </Badge>
                            )}
                            <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 bg-popover border-border" align="start">
                        <div className="space-y-2">
                            <h4 className="text-sm font-bold text-popover-foreground">Select Sessions</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {sessions.map(session => (
                                    <div key={session} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`session-${session}`}
                                            checked={selectedSessions.includes(session)}
                                            onCheckedChange={(checked) => handleSessionChange(session, checked)}
                                        />
                                        <label 
                                            htmlFor={`session-${session}`} 
                                            className="text-sm text-popover-foreground cursor-pointer flex-1"
                                        >
                                            {session}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Progress Filter */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button 
                            variant="outline" 
                            className="bg-input border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Progress
                            {selectedProgressRanges.length > 0 && (
                                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                                    {selectedProgressRanges.length}
                                </Badge>
                            )}
                            <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 bg-popover border-border" align="start">
                        <div className="space-y-2">
                            <h4 className="text-sm font-bold text-popover-foreground">Select Progress Ranges</h4>
                            <div className="space-y-2">
                                {progressRanges.map(range => (
                                    <div key={range.value} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`progress-${range.value}`}
                                            checked={selectedProgressRanges.some(r => r.value === range.value)}
                                            onCheckedChange={(checked) => handleProgressRangeChange(range, checked)}
                                        />
                                        <label 
                                            htmlFor={`progress-${range.value}`} 
                                            className="text-sm text-popover-foreground cursor-pointer flex-1"
                                        >
                                            {range.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4 mr-1" />
                        Clear All
                    </Button>
                )}
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                    {selectedDepartments.map(dept => (
                        <Badge key={dept} variant="secondary" className="gap-1">
                            {dept}
                            <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => handleDepartmentChange(dept, false)}
                            />
                        </Badge>
                    ))}
                    {selectedSessions.map(session => (
                        <Badge key={session} variant="secondary" className="gap-1">
                            {session}
                            <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => handleSessionChange(session, false)}
                            />
                        </Badge>
                    ))}
                    {selectedProgressRanges.map(range => (
                        <Badge key={range.value} variant="secondary" className="gap-1">
                            {range.label}
                            <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => handleProgressRangeChange(range, false)}
                            />
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}

// Student Details Modal Component (unchanged)
function StudentDetailsModal({student, trigger}) {
    const {studentDetails, courseProgress} = student;

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-card-foreground font-poppins font-bold">
                        <User className="h-5 w-5"/>
                        Student Details
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Manual Override Action */}
                    <div className="flex justify-end px-1">
                        <Button 
                            disabled={student.courseProgress?.progress === 100}
                            onClick={async () => {
                                try {
                                    const confirm = window.confirm("Are you sure you want to force complete this course for this student? This will issue a certificate.");
                                    if (!confirm) return;
                                    
                                    const res = await manuallyCompleteCourse(student.id, student.courseId);
                                    if (res.success) {
                                        toast.success("Course marked as complete and certificate issued.");
                                        window.location.reload(); // Refresh to show updated progress
                                    }
                                } catch (err) {
                                    toast.error(err.message);
                                }
                            }}
                            variant="secondary" 
                            className="bg-green-600/10 text-green-500 hover:bg-green-600/20 border-green-600/20"
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Force Complete Course
                        </Button>
                    </div>

                    {/* Basic Information */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-lg text-card-foreground font-poppins font-bold">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground font-poppins font-bold">Full Name</label>
                                    <p className="text-sm font-bold text-card-foreground">{student.name}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground font-poppins font-bold">Student ID</label>
                                    <p className="text-sm font-bold text-card-foreground">{studentDetails?.idNumber}</p>
                                </div>
                                <div className="space-y-2">
                                    <label
                                        className="text-sm font-bold text-muted-foreground flex items-center gap-1 font-poppins font-bold">
                                        <Mail className="h-4 w-4"/>
                                        Email
                                    </label>
                                    <p className="text-sm text-card-foreground">{student.email}</p>
                                </div>
                                <div className="space-y-2">
                                    <label
                                        className="text-sm font-bold text-muted-foreground flex items-center gap-1 font-poppins font-bold">
                                        <Phone className="h-4 w-4"/>
                                        Phone
                                    </label>
                                    <p className="text-sm text-card-foreground">{studentDetails?.phone || 'Not provided'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Academic Information */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-lg text-card-foreground font-poppins font-bold">Academic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label
                                        className="text-sm font-bold text-muted-foreground flex items-center gap-1 font-poppins font-bold">
                                        <BookOpen className="h-4 w-4"/>
                                        Department
                                    </label>
                                    <p className="text-sm text-card-foreground">{studentDetails?.department}</p>
                                </div>
                                <div className="space-y-2">
                                    <label
                                        className="text-sm font-bold text-muted-foreground flex items-center gap-1 font-poppins font-bold">
                                        <Calendar className="h-4 w-4"/>
                                        Session
                                    </label>
                                    <p className="text-sm text-card-foreground">{studentDetails?.session}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground font-poppins font-bold">Course Progress</label>
                                    <p className="text-sm text-card-foreground">{courseProgress?.progress || 0}%</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground font-poppins font-bold">Status</label>
                                    <p className="text-sm text-card-foreground capitalize">{courseProgress?.status || 'not_started'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Progress Details */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-lg text-card-foreground font-poppins font-bold">Progress Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground font-poppins font-bold">Completed Lessons</label>
                                    <p className="text-sm text-card-foreground">{courseProgress?.completedLessons || 0} / {courseProgress?.totalLessons || 0}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground font-poppins font-bold">Completed Quizzes</label>
                                    <p className="text-sm text-card-foreground">{courseProgress?.completedQuizzes || 0} / {courseProgress?.totalQuizzes || 0}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground font-poppins font-bold">Completed Weeks</label>
                                    <p className="text-sm text-card-foreground">{courseProgress?.completedWeeks || 0} / {courseProgress?.totalWeeks || 0}</p>
                                </div>
                            </div>
                            {courseProgress?.lastActivityDate && (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground font-poppins font-bold">Last Activity</label>
                                    <p className="text-sm text-card-foreground">{new Date(courseProgress.lastActivityDate).toLocaleDateString()}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Bio Section */}
                    {studentDetails?.bio && (
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2 text-card-foreground font-poppins font-bold">
                                    <FileText className="h-5 w-5"/>
                                    Bio
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {studentDetails.bio}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Timestamps */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-lg text-card-foreground font-poppins font-bold">Registration Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="text-sm text-muted-foreground">
                                <strong>Joined:</strong> {new Date(studentDetails?.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                <strong>Last Updated:</strong> {new Date(studentDetails?.updatedAt).toLocaleDateString()}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function DataTable({columns, data}) {
    const [sorting, setSorting] = React.useState([]);
    const [columnFilters, setColumnFilters] = React.useState([]);
    const [advancedFilters, setAdvancedFilters] = React.useState({
        departments: [],
        sessions: [],
        progressRanges: []
    });

    // Custom filter function for advanced filters
    const customFilterFunction = React.useCallback((rows, columnIds, filterValue) => {
        return rows.filter(row => {
            const student = row.original;
            
            // Department filter
            if (advancedFilters.departments.length > 0) {
                const studentDept = student.studentDetails?.department;
                if (!studentDept || !advancedFilters.departments.includes(studentDept)) {
                    return false;
                }
            }
            
            // Session filter
            if (advancedFilters.sessions.length > 0) {
                const studentSession = student.studentDetails?.session;
                if (!studentSession || !advancedFilters.sessions.includes(studentSession)) {
                    return false;
                }
            }
            
            // Progress filter
            if (advancedFilters.progressRanges.length > 0) {
                const progress = student.courseProgress?.progress || 0;
                const matchesRange = advancedFilters.progressRanges.some(range => 
                    progress >= range.min && progress <= range.max
                );
                if (!matchesRange) {
                    return false;
                }
            }
            
            return true;
        });
    }, [advancedFilters]);

    // React Table instance
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        globalFilterFn: customFilterFunction,
        state: {
            sorting,
            columnFilters,
        },
    });

    // Apply custom filtering
    const filteredData = React.useMemo(() => {
        let filtered = data;
        
        // Apply advanced filters
        if (advancedFilters.departments.length > 0 || 
            advancedFilters.sessions.length > 0 || 
            advancedFilters.progressRanges.length > 0) {
            filtered = filtered.filter(student => {
                // Department filter
                if (advancedFilters.departments.length > 0) {
                    const studentDept = student.studentDetails?.department;
                    if (!studentDept || !advancedFilters.departments.includes(studentDept)) {
                        return false;
                    }
                }
                
                // Session filter
                if (advancedFilters.sessions.length > 0) {
                    const studentSession = student.studentDetails?.session;
                    if (!studentSession || !advancedFilters.sessions.includes(studentSession)) {
                        return false;
                    }
                }
                
                // Progress filter
                if (advancedFilters.progressRanges.length > 0) {
                    const progress = student.courseProgress?.progress || 0;
                    const matchesRange = advancedFilters.progressRanges.some(range => 
                        progress >= range.min && progress <= range.max
                    );
                    if (!matchesRange) {
                        return false;
                    }
                }
                
                return true;
            });
        }
        
        return filtered;
    }, [data, advancedFilters]);

    // Update table data when filters change
    const tableWithFilteredData = useReactTable({
        data: filteredData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
    });

    const handleAdvancedFiltersChange = React.useCallback((filters) => {
        setAdvancedFilters(filters);
    }, []);

    return (
        <div className="bg-background">
            {/* Advanced Filters */}
            <div className="py-4 flex flex-col md:flex-row gap-8 justify-between items-center">
                <AdvancedFilters 
                    data={data} 
                    onFiltersChange={handleAdvancedFiltersChange}
                    currentFilters={advancedFilters}
                />
                <div className="flex items-center py-4">
                <Input
                    placeholder="Filter by Student ID..."
                    value={(tableWithFilteredData.getColumn("idNumber")?.getFilterValue() ?? "")}
                    onChange={(event) =>
                        tableWithFilteredData.getColumn("idNumber")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm bg-input border-border text-foreground"
                />
            </div>
            </div>

            {/* Search Input */}
            

            {/* Results Count */}
            <div className="text-sm text-muted-foreground mb-4">
                Showing {tableWithFilteredData.getFilteredRowModel().rows.length} of {data.length} students
            </div>

            {/* Table */}
            <div className="rounded-md border border-border bg-card">
                <Table>
                    <TableHeader>
                        {tableWithFilteredData.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {tableWithFilteredData.getRowModel().rows?.length ? (
                            tableWithFilteredData.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No students found matching the current filters.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => tableWithFilteredData.previousPage()}
                    disabled={!tableWithFilteredData.getCanPreviousPage()}
                    className="bg-background border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => tableWithFilteredData.nextPage()}
                    disabled={!tableWithFilteredData.getCanNextPage()}
                    className="bg-background border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                    Next
                </Button>
            </div>
        </div>
    );
}

// Export the modal component for use in columns
export { StudentDetailsModal };
