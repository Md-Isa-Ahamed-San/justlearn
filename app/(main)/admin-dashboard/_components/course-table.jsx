"use client";

import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Edit,
  Eye,
  EyeOff,
  Filter,
  MoreHorizontal,
  Power,
  PowerOff,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Other UI components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Dropdown components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Alert Dialog components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { toggleCourseVisibilityStatus } from "../../../../queries/admin";
export default function CourseTable({ courses }) {
  // console.log(" CourseTable ~ courses:", courses);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filteredCache, setFilteredCache] = useState({});
  const [courseData, setCourseData] = useState(courses);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [itemToToggle, setItemToToggle] = useState(null);
  

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Generate cache key for memoization
  const getCacheKey = useCallback((searchTerm, filterCategory) => {
    return `${searchTerm}_${filterCategory}`;
  }, []);

  // Dynamically get unique categories from the courses data
  const categories = useMemo(
    () => [
      "all",
      ...new Set(courseData.map((course) => course.category.title)),
    ],
    [courseData]
  );

  // Filter courses with caching
  const filteredCourses = useMemo(() => {
    const cacheKey = getCacheKey(debouncedSearchTerm, filterCategory);

    if (filteredCache[cacheKey]) {
      return filteredCache[cacheKey];
    }

    const filtered = courseData.filter((course) => {
      // Condition for search term
      const matchesSearch =
        course.title
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        course.user.name
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        course.category.title
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase());

      // Condition for category filter
      const matchesCategory =
        filterCategory === "all" || course.category.title === filterCategory;

      return matchesSearch && matchesCategory;
    });

    // Cache the result
    setFilteredCache((prev) => ({
      ...prev,
      [cacheKey]: filtered,
    }));

    return filtered;
  }, [
    courseData,
    debouncedSearchTerm,
    filterCategory,
    filteredCache,
    getCacheKey,
  ]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCourses.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

  // Clear cache when filter changes
  useEffect(() => {
    setFilteredCache({});
  }, [filterCategory]);

  const handleToggleCourseVisibility = async (courseId) => {

    toast.success("Action Processing...")
    
    const res = await toggleCourseVisibilityStatus(courseId);
    if (res.success) {
      const targetedCourse = courseData.find(
        (course) => course.id === courseId
      );

      const updatedTargetCourse = {
        ...targetedCourse,
        visibility:
          targetedCourse.visibility === "public" ? "private" : "public",
      };

      setCourseData((prev) =>
        prev.map((course) =>
          course.id === courseId ? updatedTargetCourse : course
        )
      );
      setFilteredCache({});
      // console.log("Toggling course visibility:", courseId);
      toast.success("Action Complete.")
    }
    else{
      toast.error("Something went wrong.Try Again.")
    }
  };

  const handleApproveCourse = (courseId) => {
    setCourseData((prev) =>
      prev.map((course) =>
        course.id === courseId ? { ...course, active: true } : course
      )
    );
    setFilteredCache({}); // Clear cache after data change
    console.log("Approving course:", courseId);
  };

  // Admin function to activate/disable course

  const handleConfirmVisibilityChange = () => {
    if (itemToToggle) {
      handleToggleCourseVisibility(itemToToggle.id);
    }

    setShowStatusDialog(false);
    setItemToToggle(null);
  };

  const getCourseStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          Published
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="bg-red-50 text-red-700 border-red-200"
      >
        Draft
      </Badge>
    );
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(parseInt(size));
    setCurrentPage(1);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Courses Management</CardTitle>
              <CardDescription>
                Manage course status and visibility ({filteredCourses.length}{" "}
                total)
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-[300px]"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Filter</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category}
                      onClick={() => setFilterCategory(category)}
                      className="capitalize"
                    >
                      {category}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
                
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="min-w-[200px] text-left p-4 font-medium">
                    Course
                  </th>
                  <th className="min-w-[150px] text-left p-4 font-medium">
                    Instructor
                  </th>
                  <th className="min-w-[100px] text-left p-4 font-medium">
                    Status
                  </th>
                  <th className="min-w-[100px] text-left p-4 font-medium">
                    Visibility
                  </th>
                  <th className="min-w-[80px] text-left p-4 font-medium hidden sm:table-cell">
                    Rating
                  </th>
                  <th className="text-right min-w-[120px] p-4 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedCourses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No courses found matching your criteria
                    </td>
                  </tr>
                ) : (
                  paginatedCourses.map((course) => (
                    <tr
                      key={course.id}
                      className={`border-b  ${
                        !course.active ? "opacity-70" : ""
                      }`}
                    >
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-sm sm:text-base">
                            {course.title}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            {course.category.title}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{course.user.name}</div>
                      </td>
                      <td className="p-4">
                        {getCourseStatusBadge(course.active)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          {course.visibility === "public" ? (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200 text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className=" text-gray-700 border-gray-200 text-xs"
                            >
                              <EyeOff className="h-3 w-3 mr-1" />
                              Deactivate
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <div className="flex items-center">
                          <span className="text-sm font-medium">
                            {course.rating}
                          </span>
                          <span className="text-yellow-400 ml-1">★</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end space-x-2">
                          {!course.active && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApproveCourse(course.id)}
                              title="Approve Course"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                               {/* <DropdownMenuSeparator /> */}
                              <DropdownMenuLabel className="text-xs">
                                Admin Actions
                              </DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                             
                              <DropdownMenuItem
                                onClick={() => {
                                  setItemToToggle({
                                    id: course.id,
                                    name: course.title,
                                    currentStatus: course.visibility,
                                  });
                                  setShowStatusDialog(true);
                                }}
                                className={
                                  course.visibility ==="public"
                                    ? "text-red-600"
                                    : "text-green-600"
                                }
                              >
                                {course.visibility ==="public" ? (
                                  <>
                                    <PowerOff className="h-4 w-4 mr-2" />
                                   Toggle private
                                  </>
                                ) : (
                                  <>
                                    <Power className="h-4 w-4 mr-2" />
                                    Toggle public
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredCourses.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 pt-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredCourses.length)} of{" "}
                  {filteredCourses.length} entries
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-muted-foreground">
                    Rows per page:
                  </p>
                  <select
                    value={pageSize.toString()}
                    onChange={(e) => handlePageSizeChange(e.target.value)}
                    className="w-16 h-8 px-2 text-sm border border-input bg-background rounded-md"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        const showPage =
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1;
                        return showPage;
                      })
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-muted-foreground">
                              ...
                            </span>
                          )}
                          <Button
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="h-8 w-8 p-0"
                          >
                            {page}
                          </Button>
                        </div>
                      ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {itemToToggle?.currentStatus ==="public"
                ? "Toggle private"
                : "Toggle public"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              {itemToToggle?.currentStatus ==="public" ? "private" : "public"} the course
              "{itemToToggle?.name}"?
              {itemToToggle?.currentStatus === "public"?
                 " This will make the course unavailable to students."
                : " This will make the course available to students."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmVisibilityChange}
              className={
                itemToToggle?.currentStatus ==="public"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }
            >
              {itemToToggle?.currentStatus ==="public" ? "Private" : "Public"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}