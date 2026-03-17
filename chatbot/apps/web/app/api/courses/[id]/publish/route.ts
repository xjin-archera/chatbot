import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@workspace/db"

const publishSchema = z
  .object({
    mode: z.enum(["immediate", "schedule"]),
    scheduleDate: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "schedule") {
      if (!data.scheduleDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["scheduleDate"],
          message: "scheduleDate is required when mode is 'schedule'",
        })
      } else if (new Date(data.scheduleDate) <= new Date()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["scheduleDate"],
          message: "scheduleDate must be in the future",
        })
      }
    }
  })

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = publishSchema.safeParse(body)
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

    const { mode, scheduleDate } = parsed.data

    const course = await prisma.course.update({
      where: { id },
      data:
        mode === "immediate"
          ? { status: "PUBLISHED", scheduledAt: null }
          : { scheduledAt: new Date(scheduleDate!) },
    })

    return NextResponse.json({
      ...course,
      status: course.status === "PUBLISHED" ? "published" : "draft",
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
