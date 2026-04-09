require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkQuiz() {
  try {
    const quizId = 'cmmhcxkls0001hhfod7cmuywk'; // The quiz the user reported
    console.log(`Checking quiz: ${quizId}`);
    
    // Also list all quizzes to see what's actually there
    const allQuizzes = await prisma.quiz.findMany({ select: { id: true, title: true } });
    console.log(`Total quizzes in DB: ${allQuizzes.length}`);
    if (allQuizzes.length > 0) {
      console.log('Sample quizzes:', allQuizzes.slice(0, 3));
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true
      }
    });

    if (!quiz) {
      console.log(`Quiz ${quizId} NOT FOUND in database!`);
    } else {
      console.log('Quiz found:', {
        id: quiz.id,
        title: quiz.title,
        status: quiz.status,
        active: quiz.active,
        questionCount: quiz.questions?.length || 0,
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQuiz();
