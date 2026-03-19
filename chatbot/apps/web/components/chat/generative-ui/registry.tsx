"use client"

import { defineRegistry } from "@json-render/react"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { catalog } from "./catalog"

const { registry } = defineRegistry(catalog, {
  components: {
    CoursePreviewCard: ({ props, children }) => (
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-blue-50/80 dark:from-indigo-950/30 dark:to-blue-950/30 dark:border-indigo-800">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-tight">{props.title}</CardTitle>
            {props.status && (
              <Badge
                variant="outline"
                className={
                  props.status === "published"
                    ? "border-green-500 text-green-700 dark:text-green-400"
                    : "border-yellow-500 text-yellow-700 dark:text-yellow-400"
                }
              >
                {props.status}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{props.description}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 pt-0 text-xs">
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">Instructor:</span> {props.instructor}
          </span>
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">Category:</span> {props.category}
          </span>
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">Level:</span> {props.level}
          </span>
          {children}
        </CardContent>
      </Card>
    ),

    ModuleSection: ({ props, children }) => (
      <div className="rounded-md border bg-background/60 px-3 py-2">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-semibold">{props.title}</span>
          <Badge variant="secondary" className="text-[10px]">
            {props.lessonCount} {props.lessonCount === 1 ? "lesson" : "lessons"}
          </Badge>
        </div>
        {children && <div className="flex flex-col gap-1 pl-2">{children}</div>}
      </div>
    ),

    LessonRow: ({ props }) => {
      const typeColors: Record<string, string> = {
        video: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
        article: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
        quiz: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
        assignment: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
      }
      return (
        <div className="flex items-center gap-2 py-0.5">
          <span className="flex-1 text-xs text-muted-foreground">{props.title}</span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${typeColors[props.type] ?? ""}`}>
            {props.type}
          </span>
        </div>
      )
    },

    MetadataRow: ({ props }) => (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">{props.label}</span>
        <span className="font-medium text-foreground">{props.value}</span>
      </div>
    ),

    SectionDivider: () => <Separator className="my-1" />,

    Container: ({ props, children }) => {
      const gapClass = props.gap === "lg" ? "gap-3" : props.gap === "sm" ? "gap-1" : "gap-2"
      return <div className={`flex flex-col ${gapClass}`}>{children}</div>
    },
  },
})

export { registry }
