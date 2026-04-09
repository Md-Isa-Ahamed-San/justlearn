import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { getAllQuizzesByInstructorId } from "../../../queries/quizzes";
import { getServerUserData } from "../../../queries/users";
import { columns } from "./_components/columns";
import { DataTable } from "./_components/data-table";

// Add this to fix the static generation error
export const dynamic = 'force-dynamic';

const QuizSets = async () => {
  let allQuizzes = [];

  try {
    const data = await getServerUserData();
    
    if (data?.userData?.id) {
      const quizzes = await getAllQuizzesByInstructorId(data.userData.id);
      // Ensure we always have an array
      allQuizzes = Array.isArray(quizzes) ? quizzes : [];
    }
  } catch (err) {
    console.log("Error fetching quiz sets:", err);
    // Keep allQuizzes as empty array on error
    allQuizzes = [];
  }

  console.log(" QuizSets ~ allQuizzes:", allQuizzes);

  return (
    <div className="p-6">
      {allQuizzes.length > 0 ? (
        <DataTable columns={columns} data={allQuizzes} />
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No quiz sets found.</p>
          <div className="flex flex-col gap-4 justify-center items-center "> 
          <p className="text-sm text-gray-400 mt-2">
            Create your first quiz set to get started.
            
          </p>
          <Link href="/instructor-dashboard/quiz-sets/add" replace><Button>Create A Quiz</Button></Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizSets;