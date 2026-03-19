"use client"

import { type ToolCallWithResult } from "@langchain/langgraph-sdk"
import { motion } from "motion/react"
import { Badge } from "@workspace/ui/components/badge"

type ToolCallCardProps = {
  toolCall: ToolCallWithResult
}

function humanizeTool(name: string): string {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function parseResult(content: unknown): Record<string, unknown> | string {
  if (typeof content === "string") {
    try {
      return JSON.parse(content) as Record<string, unknown>
    } catch {
      return content
    }
  }
  return String(content)
}

function PendingCard({ name }: { name: string }) {
  return (
    <div className="flex animate-pulse items-center gap-2 rounded-lg border border-muted p-3">
      <span className="flex size-4 shrink-0 items-center justify-center">
        <span className="inline-flex size-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </span>
      <span className="text-xs text-muted-foreground">Running {humanizeTool(name)}…</span>
    </div>
  )
}

function ErrorCard({ name, content }: { name: string; content: unknown }) {
  return (
    <div className="rounded-lg border border-red-300 bg-red-50 p-3 dark:bg-red-950/20">
      <p className="text-xs font-medium text-red-700">⚠ Error in {humanizeTool(name)}</p>
      <p className="mt-1 text-xs text-red-600">{String(content)}</p>
    </div>
  )
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const { call, result, state } = toolCall
  const name = call.name
  const args = call.args as Record<string, unknown>

  if (state === "pending") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-[85%]"
      >
        <PendingCard name={name} />
      </motion.div>
    )
  }

  if (state === "error") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-[85%]"
      >
        <ErrorCard name={name} content={result?.content ?? "Unknown error"} />
      </motion.div>
    )
  }

  // Completed
  const parsed = parseResult(result?.content)

  let card: React.ReactNode

  if (name === "get_courses") {
    const count =
      typeof parsed === "object" && parsed !== null && "courses" in parsed
        ? (parsed.courses as unknown[]).length
        : typeof parsed === "object" && Array.isArray(parsed)
          ? (parsed as unknown[]).length
          : "?"
    card = (
      <div className="rounded-lg border border-muted bg-muted/50 p-3">
        <p className="text-xs font-medium">📚 Found {count} course{count !== 1 ? "s" : ""}</p>
      </div>
    )
  } else if (name === "get_course") {
    const data = typeof parsed === "object" && parsed !== null ? parsed : {}
    const title = String(data.title ?? data.name ?? "Course")
    const status = String(data.status ?? "draft")
    const modules = Array.isArray(data.modules) ? data.modules.length : "?"
    card = (
      <div className="rounded-lg border border-muted bg-muted/50 p-3">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium">{title}</p>
          <Badge variant="secondary" className="text-[10px]">{status}</Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{modules} module{modules !== 1 ? "s" : ""}</p>
      </div>
    )
  } else if (name === "create_course") {
    const data = typeof parsed === "object" && parsed !== null ? parsed : {}
    const title = String(data.title ?? args.title ?? "Course")
    card = (
      <div className="rounded-lg border border-green-300 bg-green-50 p-3 dark:bg-green-950/20">
        <p className="text-xs font-medium text-green-800 dark:text-green-300">✅ Course Created</p>
        <p className="mt-0.5 text-xs text-green-700 dark:text-green-400">{title}</p>
      </div>
    )
  } else if (name === "add_module") {
    const title = String(args.module_title ?? args.title ?? args.name ?? "Module")
    card = (
      <div className="rounded-lg border border-green-300 bg-green-50 p-3 dark:bg-green-950/20">
        <p className="text-xs font-medium text-green-800 dark:text-green-300">✅ Module Added</p>
        <p className="mt-0.5 text-xs text-green-700 dark:text-green-400">{title}</p>
      </div>
    )
  } else if (name === "add_lesson") {
    const title = String(args.lesson_title ?? args.title ?? args.name ?? "Lesson")
    const lessonType = String(args.lesson_type ?? args.type ?? "")
    card = (
      <div className="rounded-lg border border-green-300 bg-green-50 p-3 dark:bg-green-950/20">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-green-800 dark:text-green-300">✅ Lesson Added</p>
          {lessonType && <Badge variant="secondary" className="text-[10px]">{lessonType}</Badge>}
        </div>
        <p className="mt-0.5 text-xs text-green-700 dark:text-green-400">{title}</p>
      </div>
    )
  } else if (name === "publish_course") {
    const data = typeof parsed === "object" && parsed !== null ? parsed : {}
    const title = String(data.title ?? args.title ?? "Course")
    card = (
      <div className="rounded-lg border border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50 p-4 dark:from-purple-950/20 dark:to-pink-950/20">
        <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">🎉 Course Published!</p>
        <p className="mt-0.5 text-xs text-purple-700 dark:text-purple-400">{title}</p>
      </div>
    )
  } else {
    // Generic fallback
    card = (
      <details className="rounded-lg border border-muted bg-muted/50 p-3">
        <summary className="cursor-pointer text-xs font-medium">{humanizeTool(name)}</summary>
        <pre className="mt-2 overflow-x-auto text-[10px] text-muted-foreground">
          {JSON.stringify({ args, result: parsed }, null, 2)}
        </pre>
      </details>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-[85%]"
    >
      {card}
    </motion.div>
  )
}
