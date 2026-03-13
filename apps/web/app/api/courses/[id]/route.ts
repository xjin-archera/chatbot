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

const fullInclude = {
  modules: {
    orderBy: { order: "asc" as const },
    include: {
      lessons: {
        orderBy: { order: "asc" as const },
        include: { questions: { include: { options: true } } },
      },
    },
  },
}

// ---- schemas ----

const lessonSchema = z.object({
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

const moduleSchema = z.object({
  title: z.string().min(1),
  lessons: z.array(lessonSchema).default([]),
})

const courseUpdateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  instructor: z.string().min(1).optional(),
  duration: z.string().optional(),
  students: z.number().optional(),
  category: z.string().optional(),
  level: z.string().optional(),
  status: z.enum(["published", "draft"]).optional(),
  price: z.string().optional(),
  tags: z.string().optional(),
  thumbnail: z.string().optional(),
  learningOutcomes: z.string().optional(),
  modules: z.array(moduleSchema).optional(),
})

type Params = { params: Promise<{ id: string }> }

// ---- GET /api/courses/[id] ----

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const course = await prisma.course.findUnique({ where: { id }, include: fullInclude })
    if (!course) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ ...course, status: mapStatus(course.status) })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ---- PUT /api/courses/[id] ----

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = courseUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const exists = await prisma.course.findUnique({ where: { id }, select: { id: true } })
    if (!exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const { modules, status, ...scalarFields } = parsed.data

    await prisma.$transaction(async (tx) => {
      if (modules !== undefined) {
        // delete-and-recreate strategy (cascade removes lessons/questions/options)
        await tx.module.deleteMany({ where: { courseId: id } })
        await tx.course.update({
          where: { id },
          data: {
            ...(status ? { status: toDbStatus(status) } : {}),
            ...scalarFields,
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
        })
      } else {
        await tx.course.update({
          where: { id },
          data: {
            ...(status ? { status: toDbStatus(status) } : {}),
            ...scalarFields,
          },
        })
      }
    })

    const updated = await prisma.course.findUnique({ where: { id }, include: fullInclude })
    return NextResponse.json({ ...updated!, status: mapStatus(updated!.status) })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ---- DELETE /api/courses/[id] ----

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const exists = await prisma.course.findUnique({ where: { id }, select: { id: true } })
    if (!exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    await prisma.course.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
