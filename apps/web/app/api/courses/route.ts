import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@workspace/db"

// ---- helpers ----

function mapStatus(status: string): "published" | "draft" {
  return status === "PUBLISHED" ? "published" : "draft"
}

function toDbStatus(status: string): "PUBLISHED" | "DRAFT" {
  return status === "published" ? "PUBLISHED" : "DRAFT"
}

function toDbLessonType(type: string): "VIDEO" | "ARTICLE" | "QUIZ" | "ASSIGNMENT" {
  return type.toUpperCase() as "VIDEO" | "ARTICLE" | "QUIZ" | "ASSIGNMENT"
}

// ---- schemas ----

const lessonCreateSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["video", "article", "quiz", "assignment"]),
  duration: z.string().optional(),
  description: z.string().optional(),
  videoUrl: z.string().optional(),
  articleContent: z.string().optional(),
  resources: z.string().optional(),
  numQuestions: z.number().optional(),
  passingScore: z.number().optional(),
  assignmentBrief: z.string().optional(),
  maxScore: z.number().optional(),
  daysToComplete: z.number().optional(),
})

const moduleCreateSchema = z.object({
  title: z.string().min(1),
  lessons: z.array(lessonCreateSchema).default([]),
})

const courseCreateSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  instructor: z.string().min(1),
  duration: z.string().default("0h"),
  students: z.number().default(0),
  category: z.string().default(""),
  level: z.string().default("Beginner"),
  status: z.enum(["published", "draft"]).default("draft"),
  price: z.string().optional(),
  tags: z.string().optional(),
  thumbnail: z.string().optional(),
  learningOutcomes: z.string().optional(),
  modules: z.array(moduleCreateSchema).default([]),
})

// ---- GET /api/courses ----

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              select: { id: true, title: true, type: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const result = courses.map(({ modules, ...c }) => ({
      ...c,
      status: mapStatus(c.status),
      modules: modules.map((m) => ({
        id: m.id,
        title: m.title,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          type: l.type.toLowerCase() as "video" | "article" | "quiz" | "assignment",
        })),
      })),
    }))

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ---- POST /api/courses ----

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = courseCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { modules, status, ...rest } = parsed.data

    const course = await prisma.course.create({
      data: {
        ...rest,
        status: toDbStatus(status),
        modules: {
          create: modules.map((mod, mIdx) => ({
            title: mod.title,
            order: mIdx,
            lessons: {
              create: mod.lessons.map((les, lIdx) => ({
                title: les.title,
                type: toDbLessonType(les.type),
                order: lIdx,
                duration: les.duration,
                description: les.description,
                videoUrl: les.videoUrl,
                articleContent: les.articleContent,
                resources: les.resources,
                numQuestions: les.numQuestions,
                passingScore: les.passingScore,
                assignmentBrief: les.assignmentBrief,
                maxScore: les.maxScore,
                daysToComplete: les.daysToComplete,
              })),
            },
          })),
        },
      },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              include: { questions: { include: { options: true } } },
            },
          },
        },
      },
    })

    return NextResponse.json({ ...course, status: mapStatus(course.status) }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
