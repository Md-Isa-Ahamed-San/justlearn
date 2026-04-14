// app/(main)/courses/[id]/quiz-participation/[quizId]/page.tsx
import { redirect } from "next/navigation"
import QuizParticipationClient from "@/app/(main)/courses/[id]/quiz-participation/[quizId]/_component/quiz-participation-client"
import { getServerUserData } from "../../../../../../queries/users"
import { getQuizWithDetails, getCompletedQuizIdsByCourse } from "../../../../../../queries/quizzes"
import { getCourseDetailsById } from "../../../../../../queries/courses"
import { getCompletedLessonsByCourse } from "../../../../../../queries/lesson"

// Remove: import { chalkLog } from "@/utils/chalkLogger"

// Sample data for development - replace with actual API calls
const sampleUserData = {
    user: {
        id: "2b24c5ab-d1c3-4157-a6a6-35317c4d2aa1",
        email: "isaahmedshan190138@gmail.com",
        name: "Isa Ahmed Shan",
        image: "https://lh3.googleusercontent.com/a/ACg8ocIZZqbK8Rw27uQBa3Xl5Ln82vYM_wJolq5vuAQzW9FQFbz9HI28=s96-c",
    },
    expires: "2025-08-17T13:29:24.922Z",
    // !MARK: COMMENTED FOR GITHUB ERROR
    accessToken:
        "ya29.a0AS3H6NzIfqqjORf8-GEuUrGjGimC8UvUPOnsedeOoKtgvjzbQRgnCAmXhr6dLw0177",
    provider: "google",
    userData: {
        id: "6842e2f52433a7219fcb76e1",
        name: "Isa Ahmed Shan",
        email: "isaahmedshan190138@gmail.com",
        provider: "google",
        providerId: "112149093724608599328",
        image: "https://lh3.googleusercontent.com/a/ACg8ocIZZqbK8Rw27uQBa3Xl5Ln82vYM_wJolq5vuAQzW9FQFbz9HI28=s96-c",
        role: "student",
        resetPasswordToken: null,
        resetPasswordExpires: null,
        isActive: true,
        createdAt: new Date("2025-06-06T12:45:41.302Z"),
        updatedAt: new Date("2025-07-09T09:56:06.347Z"),
        student: {
            id: "6842e3342433a7219fcb76e2",
            idNumber: 190138,
            session: "2019-2020",
            department: "Computer Science",
            phone: "01625337883",
            bio: "Cs undergrad trying to be good at coding.",
            profilePicture: null,
            socialMedia: {},
            createdAt: new Date("2025-06-06T12:46:44.758Z"),
            updatedAt: new Date("2025-06-06T12:46:44.758Z"),
            userId: "6842e2f52433a7219fcb76e1",
        },
    },
}

const sampleQuizData = {
    id: "686be8d4981bb26d863af82a",
    title: "HTML structure",
    description: "Basic of HTML structure",
    status: "published",
    active: true,
    weekIds: [],
    generationType: "ai_fixed",
    poolSize: 50,
    MCQPerStudent: null,
    shortQuestionsPerStudent: null,
    longQuestionsPerStudent: null,
    aiPrompt: null,
    aiContextData: null,
    aiContextFiles: [],
    targetMcqCount: 5,
    timeLimit: 5,
    maxAttempts: 1,
    showResultsImmediately: true,
    securityLevel: "medium",
    enableAntiCheating: true,
    enableFullscreen: true,
    maxViolationsAllowed: 2,
    autoSubmitOnViolation: true,
    blockCopyPaste: true,
    blockRightClick: true,
    blockTabSwitching: true,
    blockWindowMinimize: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdByUserId: "6842941a7c0f28784f68f553",
    createdBy: {
        id: "6842941a7c0f28784f68f553",
        name: "Sk. Shalauddin Kabir",
        image:
            "https://res.cloudinary.com/djyzlmzoe/image/upload/v1749126425/JUSTLearn/b179c00cf8e036902344fa5dc7f5ab33.jpg",
    },
    questions: [
        {
            id: "686be91a981bb26d863af82b",
            type: "mcq",
            text: "What is the basic structure of an HTML document?",
            image: null,
            explanation:
                "The basic structure of an HTML document consists of the HTML element, which contains the Head and Body elements.",
            options: [
                { label: "HTML, Head, Body", isCorrect: true },
                { label: "HTML, Title, Body", isCorrect: false },
                { label: "HTML, Head, Footer", isCorrect: false },
                { label: "HTML, Body, Footer", isCorrect: false },
            ],
            correctAnswer: "",
            mark: 1,
            order: 0,
        },
        {
            id: "686be91a981bb26d863af82c",
            type: "mcq",
            text: "What is the purpose of the DOCTYPE declaration in an HTML document?",
            image: null,
            explanation: "The DOCTYPE declaration is used to declare the document type and version of HTML being used.",
            options: [
                { label: "To specify the character encoding", isCorrect: false },
                { label: "To link to an external stylesheet", isCorrect: false },
                { label: "To declare the document type", isCorrect: true },
                { label: "To specify the title of the document", isCorrect: false },
            ],
            correctAnswer: "",
            mark: 1,
            order: 1,
        },
        {
            id: "686be91a981bb26d863af82d",
            type: "mcq",
            text: "Which of the following is a valid HTML5 semantic element?",
            image: null,
            explanation:
                "The header element is a valid HTML5 semantic element used to define the header section of a document or section.",
            options: [
                { label: "div", isCorrect: false },
                { label: "span", isCorrect: false },
                { label: "header", isCorrect: true },
                { label: "table", isCorrect: false },
            ],
            correctAnswer: "",
            mark: 1,
            order: 2,
        },
        {
            id: "686be91a981bb26d863af82e",
            type: "mcq",
            text: "What is the purpose of the lang attribute in an HTML document?",
            image: null,
            explanation:
                "The lang attribute is used to specify the language of the document, which can help with accessibility and search engine optimization.",
            options: [
                { label: "To specify the character encoding", isCorrect: false },
                { label: "To declare the document type", isCorrect: false },
                { label: "To specify the language of the document", isCorrect: true },
                { label: "To link to an external stylesheet", isCorrect: false },
            ],
            correctAnswer: "",
            mark: 1,
            order: 3,
        },
        {
            id: "686be91a981bb26d863af82f",
            type: "mcq",
            text: "Which of the following is a required attribute for the HTML element?",
            image: null,
            explanation:
                "There are no required attributes for the HTML element, but it is recommended to include the lang attribute for accessibility purposes.",
            options: [
                { label: "lang", isCorrect: false },
                { label: "xmlns", isCorrect: false },
                { label: "None of the above", isCorrect: true },
                { label: "Both A and B", isCorrect: false },
            ],
            correctAnswer: "",
            mark: 1,
            order: 4,
        },
        {
            id: "686be91a981bb26d863af835",
            type: "short_answer",
            text: "What is the difference between the HTML and XHTML document types?",
            image: null,
            explanation:
                "The main difference between HTML and XHTML is that XHTML requires well-formed markup, which means that all elements must be properly closed and nested.",
            options: [],
            correctAnswer:
                "HTML is a more lenient document type, while XHTML is a more strict document type that requires well-formed markup.",
            mark: 2,
            order: 5,
        },
        {
            id: "686be91a981bb26d863af836",
            type: "long_answer",
            text: "Describe the basic structure of an HTML document, including the purpose of the DOCTYPE declaration, the HTML element, the Head element, and the Body element.",
            image: null,
            explanation:
                "The basic structure of an HTML document is essential for creating valid and accessible web pages. The DOCTYPE declaration, HTML element, Head element, and Body element all play important roles in defining the document and its content.",
            options: [],
            correctAnswer:
                "An HTML document typically starts with a DOCTYPE declaration, which declares the document type and version of HTML being used. The HTML element is the root element of the document and contains the Head and Body elements. The Head element contains metadata about the document, such as the title, character encoding, and links to external stylesheets or scripts. The Body element contains the content of the document, such as headings, paragraphs, images, and other elements.",
            mark: 5,
            order: 6,
        },
    ],
    weeks: [],
}

// Sample user submissions for testing
const sampleUserSubmissions = [
    // Empty array means no previous submissions
]

export default async function QuizParticipationPage({ params }) {
    const { id: courseId, quizId } = await params;

    let serverUserData = null

    try {
        // For development, use sample data
        // In production, uncomment the line below:
        serverUserData = await getServerUserData();

        // Using sample data for development
        // serverUserData = sampleUserData

        console.log("serverUserData inside quiz participation page: ", serverUserData)
    } catch (error) {
        // During static generation, this might fail
        console.log("Could not fetch server user data during build:", error.message)
        serverUserData = null
    }

    const userData = serverUserData?.userData

    if (!userData) redirect("/login")

    // if (userData.role !== "student" || userData.role !== "admin") {
    //     console.error("user is not student. courseId inside quiz participation page before redirect: ", courseId);
    //     redirect(`/courses/${courseId}`)
    // }

    try {
        // For development, use sample data
        // In production, uncomment the line below:
        const quizData = await getQuizWithDetails(quizId);

        // Using sample data for development
        // const quizData = sampleQuizData

      
        if(quizData){
            // console.log("quiz data available.")
            console.log("quiz data for giving quiz inside quiz participation page: ", quizData)
        }
        else{
            console.log("No quiz data available.")
        }

        if (!quizData) {
            console.error("quiz data not found. course id is : ", courseId);
            redirect(`/courses/${courseId}`)
        }

        // Check if quiz is published and active
        if (quizData.status !== "published" || !quizData.active) {
            console.error("quiz is not published or inactive. course id is : ", courseId);
            redirect(`/courses/${courseId}`)
        }

        // --- PROGRESSION VALIDATION ---
        const course = await getCourseDetailsById(courseId);
        const completedLessons = await getCompletedLessonsByCourse(userData.id, courseId);
        const completedQuizIds = await getCompletedQuizIdsByCourse(userData.id, courseId);

        // Find which week this quiz belongs to
        const quizWeekIndex = course.weeks.findIndex(week => 
            week.quizzes.some(q => q.id === quizId)
        );

        if (quizWeekIndex !== -1) {
            // Check if all previous weeks are completed
            for (let i = 0; i < quizWeekIndex; i++) {
                const prevWeek = course.weeks[i];
                const allLessonsDone = prevWeek.lessons.every(l => completedLessons.includes(l.id));
                const allQuizzesDone = prevWeek.quizzes.every(q => completedQuizIds.includes(q.id));
                
                if (!allLessonsDone || !allQuizzesDone) {
                    console.error(`Progression Error: Week ${i + 1} not completed. Redirecting.`);
                    redirect(`/courses/${courseId}`);
                }
            }

            // Check if all lessons in the CURRENT week are completed
            const currentWeek = course.weeks[quizWeekIndex];
            const currentWeekLessonsDone = currentWeek.lessons.every(l => completedLessons.includes(l.id));
            if (!currentWeekLessonsDone) {
                console.error(`Progression Error: Lessons in current week ${quizWeekIndex + 1} not completed. Redirecting.`);
                redirect(`/courses/${courseId}`);
            }
        }
        // --- END PROGRESSION VALIDATION ---

        // Get user's previous submissions for this quiz
        // For development, use sample data
        // In production, uncomment the line below:
        // const userSubmissions = await getUserQuizSubmissions(userData.id, quizId);
        const userSubmissions = sampleUserSubmissions

        // Check if user has exceeded max attempts
        const hasExceededAttempts = userSubmissions.length >= (quizData.maxAttempts || 1)

        // Check if user has a completed submission
        const hasCompletedSubmission = userSubmissions.some((submission) => submission.status === "completed")

        // Additional security checks
        if (hasExceededAttempts) {
            console.log(`User ${userData.id} has exceeded max attempts for quiz ${quizId}`)
        }

        if (hasCompletedSubmission) {
            console.log(`User ${userData.id} has already completed quiz ${quizId}`)
        }

        // Log quiz access attempt
        console.log(`User ${userData.id} accessing quiz ${quizId} in course ${courseId}`)
        console.log(
            `Quiz settings: Security Level: ${quizData.securityLevel}, Anti-cheating: ${quizData.enableAntiCheating}`,
        )

        return (
            <QuizParticipationClient
                quiz={quizData}
                currentUser={userData}
                courseId={courseId}
                userSubmissions={userSubmissions}
                hasExceededAttempts={hasExceededAttempts}
                hasCompletedSubmission={hasCompletedSubmission}
            />
        )
    } catch (error) {
        console.error("Error loading quiz:", error)
        console.error("Redirecting back to course page:", courseId)
        redirect(`/courses/${courseId}`)
    }
}
