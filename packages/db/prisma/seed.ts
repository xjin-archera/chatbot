import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const defaultModules = [
  {
    title: "Getting Started",
    order: 0,
    lessons: {
      create: [
        {
          title: "Introduction to the Course",
          type: "VIDEO" as const,
          order: 0,
          duration: "5:30",
          description: "An overview of what you'll learn throughout this course.",
        },
        {
          title: "Setting Up Your Environment",
          type: "VIDEO" as const,
          order: 1,
          duration: "12:00",
          description: "Install and configure all the tools you need to follow along.",
        },
        {
          title: "Core Concepts Overview",
          type: "ARTICLE" as const,
          order: 2,
          description: "A written introduction to the key concepts covered in this course.",
        },
      ],
    },
  },
  {
    title: "Core Concepts",
    order: 1,
    lessons: {
      create: [
        {
          title: "Deep Dive: Fundamentals",
          type: "VIDEO" as const,
          order: 0,
          duration: "24:15",
          description: "A thorough exploration of the foundational principles.",
        },
        {
          title: "Hands-on Exercise",
          type: "ASSIGNMENT" as const,
          order: 1,
          description: "Apply what you've learned in a practical exercise.",
        },
        {
          title: "Module 2 Quiz",
          type: "QUIZ" as const,
          order: 2,
        },
      ],
    },
  },
  {
    title: "Advanced Topics",
    order: 2,
    lessons: {
      create: [
        {
          title: "Advanced Patterns & Best Practices",
          type: "VIDEO" as const,
          order: 0,
          duration: "35:00",
          description: "Explore advanced patterns used in production applications.",
        },
        {
          title: "Real-World Project",
          type: "VIDEO" as const,
          order: 1,
          duration: "28:45",
          description: "Build a complete project from start to finish.",
        },
        {
          title: "Final Assessment",
          type: "QUIZ" as const,
          order: 2,
        },
      ],
    },
  },
];

async function main() {
  console.log("Seeding database...");

  await prisma.course.deleteMany();

  await prisma.course.create({
    data: {
      title: "Introduction to React",
      description:
        "Learn the fundamentals of React including components, hooks, state management, and modern patterns. Build real-world applications from scratch.",
      status: "PUBLISHED",
      instructor: "Sarah Johnson",
      duration: "8h 30m",
      students: 1243,
      category: "Frontend Development",
      level: "Beginner",
      price: "49",
      tags: "react, javascript, frontend",
      modules: { create: defaultModules },
    },
  });

  await prisma.course.create({
    data: {
      title: "Advanced TypeScript",
      description:
        "Master TypeScript with advanced types, generics, conditional types, and architectural design patterns for large-scale applications.",
      status: "PUBLISHED",
      instructor: "Michael Chen",
      duration: "12h 15m",
      students: 892,
      category: "Programming",
      level: "Advanced",
      price: "79",
      tags: "typescript, javascript, types",
      modules: { create: defaultModules.slice(0, 2) },
    },
  });

  await prisma.course.create({
    data: {
      title: "Node.js Backend Development",
      description:
        "Build scalable, production-ready backend services with Node.js, Express, PostgreSQL, and modern deployment workflows.",
      status: "DRAFT",
      instructor: "Emily Rodriguez",
      duration: "6h 45m",
      students: 0,
      category: "Backend Development",
      level: "Intermediate",
      modules: { create: defaultModules.slice(0, 1) },
    },
  });

  await prisma.course.create({
    data: {
      title: "UI/UX Design Principles",
      description:
        "Understand core design principles, color theory, typography, and how to create beautiful, accessible, and usable interfaces.",
      status: "DRAFT",
      instructor: "Alex Park",
      duration: "5h 20m",
      students: 0,
      category: "Design",
      level: "Beginner",
      modules: { create: defaultModules.slice(0, 2) },
    },
  });

  console.log("Seeding complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
