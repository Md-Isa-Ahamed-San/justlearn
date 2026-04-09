// app/api/auth/[...nextauth]/route.js
// Authentication endpoints handled by NextAuth.js

// app/api/users/route.js
// User Management
export async function GET() {
  try {
    const users = await db.user.findMany();
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        hashedPassword: await bcrypt.hash(data.password, 10),
      },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// app/api/users/[id]/route.js
// Individual User Operations
export async function GET(request, { params }) {
  try {
    const user = await db.user.findUnique({
      where: { id: params.id },
    });
    
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const data = await request.json();
    const updatedUser = await db.user.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await db.user.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: "User deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// app/api/classes/route.js
// Class Management
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sortBy');
    
    let orderBy = {};
    if (sortBy === 'popularity') {
      orderBy = { participations: { _count: 'desc' } };
    } else if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    }
    
    const whereClause = category ? { category } : {};
    
    const classes = await db.class.findMany({
      where: whereClause,
      orderBy,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { participations: true },
        },
      },
    });
    
    return NextResponse.json(classes, { status: 200 });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const newClass = await db.class.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        instructorId: data.instructorId,
      },
    });
    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    console.error("Error creating class:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// app/api/classes/[id]/route.js
// Individual Class Operations
export async function GET(request, { params }) {
  try {
    const classData = await db.class.findUnique({
      where: { id: params.id },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
          },
        },
        weeks: {
          orderBy: { order: 'asc' },

        },
        _count: {
          select: { participations: true },
        },
      },
    });
    
    if (!classData) {
      return NextResponse.json({ message: "Class not found" }, { status: 404 });
    }
    
    return NextResponse.json(classData, { status: 200 });
  } catch (error) {
    console.error("Error fetching class:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const data = await request.json();
    const updatedClass = await db.class.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(updatedClass, { status: 200 });
  } catch (error) {
    console.error("Error updating class:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await db.class.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: "Class deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting class:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// app/api/classes/[classId]/weeks/route.js
// Week Management
export async function GET(request, { params }) {
  try {
    const weeks = await db.week.findMany({
      where: { classId: params.classId },
      orderBy: { order: 'asc' },
      include: {

        quiz: {
          select: {
            id: true,
            version: true,
            createdAt: true,
          },
        },
      },
    });
    
    return NextResponse.json(weeks, { status: 200 });
  } catch (error) {
    console.error("Error fetching weeks:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const data = await request.json();
    
    // Get the highest order value for the class
    const highestOrder = await db.week.findFirst({
      where: { classId: params.classId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    
    const newOrder = (highestOrder?.order || 0) + 1;
    
    const newWeek = await db.week.create({
      data: {
        title: data.title,
        classId: params.classId,
        order: newOrder,
        quizPrompt: data.quizPrompt || "",
      },
    });
    
    return NextResponse.json(newWeek, { status: 201 });
  } catch (error) {
    console.error("Error creating week:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// app/api/weeks/[id]/route.js
// Individual Week Operations
export async function GET(request, { params }) {
  try {
    const week = await db.week.findUnique({
      where: { id: params.id },
      include: {

        quiz: {
          include: {
            questions: true,
          },
        },
      },
    });
    
    if (!week) {
      return NextResponse.json({ message: "Week not found" }, { status: 404 });
    }
    
    return NextResponse.json(week, { status: 200 });
  } catch (error) {
    console.error("Error fetching week:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const data = await request.json();
    const updatedWeek = await db.week.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(updatedWeek, { status: 200 });
  } catch (error) {
    console.error("Error updating week:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await db.week.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: "Week deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting week:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// app/api/weeks/[weekId]/resources/route.js
// Resource Management
export async function GET(request, { params }) {
  try {
    const resources = await db.resource.findMany({
      where: { weekId: params.weekId },
    });
    
    return NextResponse.json(resources, { status: 200 });
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const data = await request.json();
    const newResource = await db.resource.create({
      data: {
        title: data.title,
        type: data.type, // text/pdf/video/link
        url: data.url,
        weekId: params.weekId,
      },
    });
    
    return NextResponse.json(newResource, { status: 201 });
  } catch (error) {
    console.error("Error creating resource:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// app/api/resources/[id]/route.js
// Individual Resource Operations
export async function GET(request, { params }) {
  try {
    const resource = await db.resource.findUnique({
      where: { id: params.id },
    });
    
    if (!resource) {
      return NextResponse.json({ message: "Resource not found" }, { status: 404 });
    }
    
    return NextResponse.json(resource, { status: 200 });
  } catch (error) {
    console.error("Error fetching resource:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const data = await request.json();
    const updatedResource = await db.resource.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(updatedResource, { status: 200 });
  } catch (error) {
    console.error("Error updating resource:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await db.resource.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: "Resource deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting resource:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// app/api/uploads/route.js
// Handle file uploads to S3
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ message: "File is required" }, { status: 400 });
    }
    
    // S3 upload logic here
    // This is a simplified example - actual implementation would involve AWS SDK
    const fileName = `${Date.now()}-${file.name}`;
    const s3Result = await uploadToS3(file, fileName);
    
    return NextResponse.json({
      url: s3Result.Location,
      key: s3Result.Key,
    }, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// app/api/weeks/[weekId]/quiz/route.js
// Quiz Generation and Management
export async function GET(request, { params }) {
  try {
    const quiz = await db.quiz.findFirst({
      where: { weekId: params.weekId },
      orderBy: { version: 'desc' },
      include: {
        questions: true,
      },
    });
    
    if (!quiz) {
      return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
    }
    
    return NextResponse.json(quiz, { status: 200 });
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Generate a new quiz
export async function POST(request, { params }) {
  try {
    const { prompt } = await request.json();
    
    // Get the week data with resources
    const week = await db.week.findUnique({
      where: { id: params.weekId },

    });
    
    if (!week) {
      return NextResponse.json({ message: "Week not found" }, { status: 404 });
    }
    
    // Collect resource content for the AI
    const resourceContents = await Promise.all(
      week.resources.map(async (resource) => {
        // Here you would extract text from PDFs, videos, etc.
        // This is a simplified example
        if (resource.type === 'text') {
          return resource.url; // Assuming text is stored directly in the URL field
        } else {
          return resource.title; // Just use the title for other resource types
        }
      })
    );
    
    // Get the highest version number for this week's quizzes
    const highestVersion = await db.quiz.findFirst({
      where: { weekId: params.weekId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    
    const newVersion = (highestVersion?.version || 0) + 1;
    
    // Call OpenAI to generate quiz questions
    const questions = await generateQuestionsWithOpenAI(
      resourceContents.join('\n\n'),
      prompt || week.quizPrompt
    );
    
    // Create the quiz and questions in the database
    const quiz = await db.quiz.create({
      data: {
        weekId: params.weekId,
        version: newVersion,
        questions: {
          create: questions.map(q => ({
            type: q.type,
            prompt: q.prompt,
            choices: q.choices,
            answer: q.answer,
            explanation: q.explanation,
          })),
        },
      },
      include: {
        questions: true,
      },
    });
    
    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error("Error generating quiz:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// app/api/quizzes/[id]/route.js
// Individual Quiz Operations
export async function GET(request, { params }) {
  try {
    const quiz = await db.quiz.findUnique({
      where: { id: params.id },
      include: {
        questions: true,
      },
    });
    
    if (!quiz) {
      return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
    }
    
    return NextResponse.json(quiz, { status: 200 });
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const data = await request.json();
    
    // Update quiz questions - this needs special handling since it's a one-to-many relationship
    const { questions, ...quizData } = data;
    
    const updatedQuiz = await db.quiz.update({
      where: { id: params.id },
      data: quizData,
    });
    
    // If questions were provided, handle them separately
    if (questions && Array.isArray(questions)) {
      for (const question of questions) {
        if (question.id) {
          // Update existing question
          await db.question.update({
            where: { id: question.id },
            data: {
              type: question.type,
              prompt: question.prompt,
              choices: question.choices,
              answer: question.answer,
              explanation: question.explanation,
            },
          });
        } else {
          // Create new question
          await db.question.create({
            data: {
              quizId: params.id,
              type: question.type,
              prompt: question.prompt,
              choices: question.choices,
              answer: question.answer,
              explanation: question.explanation,
            },
          });
        }
      }
    }
    
    const finalQuiz = await db.quiz.findUnique({
      where: { id: params.id },
      include: {
        questions: true,
      },
    });
    
    return NextResponse.json(finalQuiz, { status: 200 });
  } catch (error) {
    console.error("Error updating quiz:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await db.quiz.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: "Quiz deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// app/api/participation/route.js
// Student Class Participation
export async function POST(request) {
  try {
    const { studentId, classId } = await request.json();
    
    // Check if the student is already participating
    const existingParticipation = await db.participation.findFirst({
      where: {
        studentId,
        classId,
      },
    });
    
    if (existingParticipation) {
      return NextResponse.json(
        { message: "Already participating in this class" },
        { status: 400 }
      );
    }
    
    // Create participation record
    const participation = await db.participation.create({
      data: {
        studentId,
        classId,
        progress: [],
      },
    });
    
    return NextResponse.json(participation, { status: 201 });
  } catch (error) {
    console.error("Error joining class:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// app/api/students/[studentId]/classes/route.js
// Get classes for a student
export async function GET(request, { params }) {
  try {
    const participations = await db.participation.findMany({
      where: { studentId: params.studentId },
      include: {
        class: {
          include: {
            instructor: {
              select: {
                id: true,
                name: true,
              },
            },
            weeks: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
    
    const classes = participations.map(p => ({
      ...p.class,
      progress: p.progress,
    }));
    
    return NextResponse.json(classes, { status: 200 });
  } catch (error) {
    console.error("Error fetching student classes:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// app/api/students/[studentId]/progress/route.js
// Update student progress
export async function POST(request, { params }) {
  try {
    const { classId, weekId, quizResult } = await request.json();
    
    // Find participation record
    const participation = await db.participation.findFirst({
      where: {
        studentId: params.studentId,
        classId,
      },
    });
    
    if (!participation) {
      return NextResponse.json(
        { message: "Participation not found" },
        { status: 404 }
      );
    }
    
    // Update progress for this week
    const progress = [...(participation.progress || [])];
    const weekIndex = progress.findIndex(p => p.weekId === weekId);
    
    if (weekIndex >= 0) {
      progress[weekIndex] = {
        ...progress[weekIndex],
        completed: true,
        score: quizResult.score,
      };
    } else {
      progress.push({
        weekId,
        completed: true,
        score: quizResult.score,
      });
    }
    
    // Update participation
    const updatedParticipation = await db.participation.update({
      where: { id: participation.id },
      data: { progress },
    });
    
    // Record feedback if provided
    if (quizResult.feedback) {
      await db.feedback.create({
        data: {
          studentId: params.studentId,
          weekId,
          quizScore: quizResult.score,
          suggestions: quizResult.feedback,
        },
      });
    }
    
    return NextResponse.json(updatedParticipation, { status: 200 });
  } catch (error) {
    console.error("Error updating progress:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// app/api/instructors/[instructorId]/classes/route.js
// Get classes for an instructor
export async function GET(request, { params }) {
  try {
    const classes = await db.class.findMany({
      where: { instructorId: params.instructorId },
      include: {
        _count: {
          select: { participations: true },
        },
        weeks: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
    
    return NextResponse.json(classes, { status: 200 });
  } catch (error) {
    console.error("Error fetching instructor classes:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// app/api/admin/stats/route.js
// Admin statistics
export async function GET() {
  try {
    const [
      userCount,
      classCount,
      instructorCount,
      studentCount,
      participationCount,
    ] = await Promise.all([
      db.user.count(),
      db.class.count(),
      db.user.count({ where: { role: 'instructor' } }),
      db.user.count({ where: { role: 'student' } }),
      db.participation.count(),
    ]);
    
    // Get popular classes
    const popularClasses = await db.class.findMany({
      take: 5,
      orderBy: {
        participations: {
          _count: 'desc',
        },
      },
      include: {
        instructor: {
          select: {
            name: true,
          },
        },
        _count: {
          select: { participations: true },
        },
      },
    });
    
    return NextResponse.json({
      userCount,
      classCount,
      instructorCount,
      studentCount,
      participationCount,
      popularClasses,
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Helper function for OpenAI integration (would be in a separate file)
async function generateQuestionsWithOpenAI(content, prompt) {
  // This is a placeholder - you would implement the actual OpenAI API call
  // The real implementation would call the OpenAI API with the content and prompt
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that generates educational quiz questions based on content."
      },
      {
        role: "user",
        content: `Generate 5 quiz questions based on the following content. The questions should be a mix of multiple choice, true/false, and short answer questions. Each question should have an explanation for the correct answer.

Content:
${content}

Instructor prompt: ${prompt}

Return the response as JSON array with the following structure for each question:
{
  "type": "MCQ" or "TF" or "short",
  "prompt": "Question text",
  "choices": ["A", "B", "C", "D"] (for MCQ) or ["True", "False"] (for TF) or [] (for short answer),
  "answer": "Correct answer",
  "explanation": "Explanation of the correct answer"
}
`
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 2000
  });
  
  const questions = JSON.parse(response.choices[0].message.content).questions;
  return questions;
}