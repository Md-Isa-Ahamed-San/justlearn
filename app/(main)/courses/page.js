import FilterCourse from "./_components/FilterCourse";
import FilterCourseMobile from "./_components/FilterCourseMobile";
import SearchCourse from "./_components/SearchCourse";

import { getCourseList } from "@/queries/courses";
import { getCategories } from "../../../queries/categories";
import CourseCard from "./_components/CourseCard";

const CoursesPage = async ({ searchParams }) => {
  // Get search parameters
  const { categories: selectedCategories, q: searchQuery, page: currentPage } = await searchParams;
  const pageNum = parseInt(currentPage) || 1;
  const PAGE_SIZE = 12;

  // Parse selected categories from URL
  const categoryFilters = selectedCategories
    ? Array.isArray(selectedCategories)
      ? selectedCategories
      : [selectedCategories]
    : [];

  // Fetch all courses and categories
  const [fetchedCourses, categories] = await Promise.all([
    getCourseList(),
    getCategories(),
  ]);
  const courses = fetchedCourses.filter(item => item.visibility === "public" && item.active === true);

  // Filter courses based on selected categories
  let filteredCourses =
    categoryFilters.length > 0
      ? courses.filter((course) => categoryFilters.includes(course?.category?.title))
      : courses;

  // Filter by search query
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredCourses = filteredCourses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }

  // Pagination
  const totalCourses = filteredCourses.length;
  const totalPages = Math.ceil(totalCourses / PAGE_SIZE);
  const paginatedCourses = filteredCourses.slice((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE);

  console.log("Selected categories:", categoryFilters);
  console.log("Filtered courses count:", filteredCourses.length);

  return (
    <section
      id="courses"
      className="container space-y-6 dark:bg-transparent py-6"
    >
      {/* header */}
      <div className="flex items-baseline justify-between border-gray-200 border-b pb-6 flex-col gap-4 lg:flex-row"></div>

      <section className="pb-24 pt-6">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
          {/* Filters */}
          <div>
            <div className="flex gap-4 justify-start items-center">
              <SearchCourse defaultValue={searchQuery || ""} />
              <FilterCourseMobile
                categories={categories}
                selectedCategories={categoryFilters}
              />
            </div>
            <FilterCourse
              categories={categories}
              selectedCategories={categoryFilters}
            />
          </div>

          {/* Course grid */}
          <div className="lg:col-span-3">
            {searchQuery && (
              <p className="text-sm text-muted-foreground mb-4">
                {totalCourses} result{totalCourses !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;
              </p>
            )}
            <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              {paginatedCourses.length > 0 ? (
                paginatedCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">
                    No courses found{searchQuery ? ` for "${searchQuery}"` : " for the selected categories"}.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <a
                    key={p}
                    href={`?${new URLSearchParams({
                      ...(searchQuery ? { q: searchQuery } : {}),
                      ...(categoryFilters.length ? { categories: categoryFilters } : {}),
                      page: p,
                    }).toString()}`}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                      p === pageNum
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {p}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </section>
  );
};

export default CoursesPage;

