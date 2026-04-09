import { getStudentsInCourse } from "../../../../../queries/courses";
import { columns } from "./_components/columns";
import { DataTable } from "./_components/data-table";

const AllJoinedStudentsPage = async ({ params }) => {
  const { courseId } = params;
  console.log(" AllJoinedStudentsPage ~ courseId:", courseId)
  let studentData = null;
  if (courseId) {
    studentData = await getStudentsInCourse(courseId);
  }
  console.log(" AllJoinedStudentsPage ~ studentData:", studentData)
  return (
    <div className="p-6">
      {/* <Link href="/teacher/create">
        <Button>New Course</Button>
      </Link> */}
      {/* <h2>Think in a Redux way enrollments</h2> */}
      <DataTable columns={columns} data={studentData} />
    </div>
  );
};

export default AllJoinedStudentsPage;
