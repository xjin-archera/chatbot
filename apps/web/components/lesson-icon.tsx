import {
  FileTextIcon,
  QuestionIcon,
  VideoIcon,
} from "@phosphor-icons/react"

import type { LessonType } from "@/app/courses/store"

export const lessonTypeLabel: Record<LessonType, string> = {
  video: "Video",
  text: "Reading",
  quiz: "Quiz",
}

export function LessonIcon({ type }: { type: LessonType }) {
  if (type === "video")
    return <VideoIcon className="size-3.5 shrink-0 text-blue-500" />
  if (type === "quiz")
    return <QuestionIcon className="size-3.5 shrink-0 text-amber-500" />
  return <FileTextIcon className="size-3.5 shrink-0 text-emerald-500" />
}
