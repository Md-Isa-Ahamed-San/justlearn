const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = [
  {
    title: "Theory of Computation",
    description: "Core computer science theories including automata, languages, and computation complexity.",
    thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
  },
  {
    title: "Web Development",
    description: "Frontend and Backend development, covering React, Node.js, Next.js, and databases.",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
  },
  {
    title: "AI & Machine Learning",
    description: "Artificial Intelligence, Neural Networks, Deep Learning, and Data Mining.",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
  },
  {
    title: "Data Science",
    description: "Data analysis, statistics, Python for data, and big data technologies.",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
  },
  {
    title: "Mathematics",
    description: "Calculus, Linear Algebra, Discrete Math, and Probability.",
    thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80",
  },
  {
    title: "Physics",
    description: "Classical mechanics, electromagnetism, modern physics, and engineering physics.",
    thumbnail: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&q=80",
  },
  {
    title: "Business & Management",
    description: "Accounting, finance, organizational behavior, and project management.",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
  },
  {
    title: "Humanities & English",
    description: "Communication skills, technical writing, history, and sociology.",
    thumbnail: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
  }
];

async function main() {
  console.log("Start seeding categories...");
  for (const cat of categories) {
    const created = await prisma.category.create({
      data: cat,
    });
    console.log(`Created category: ${created.title}`);
  }
  console.log("Seeding finished.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
