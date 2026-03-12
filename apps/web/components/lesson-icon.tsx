import {
  ClipboardTextIcon,
  FileTextIcon,
  QuestionIcon,
  VideoIcon,
} from "@phosphor-icons/react"

import type { LessonType } from "@/app/courses/store"

export const lessonTypeLabel: Record<LessonType, string> = {
  video: "Video",
  article: "Article",
  quiz: "Quiz",
  assignment: "Assignment",
}

export function LessonIcon({ type }: { type: LessonType }) {
  if (type === "video")
    return (
      <span className="w-7 h-7 rounded-md flex items-center justify-center text-blue-600 bg-blue-50">
        <VideoIcon className="w-3.5 h-3.5" />
      </span>
    )
  if (type === "quiz")
    return (
      <span className="w-7 h-7 rounded-md flex items-center justify-center text-purple-600 bg-purple-50">
        <QuestionIcon className="w-3.5 h-3.5" />
      </span>
    )
  if (type === "assignment")
    return (
      <span className="w-7 h-7 rounded-md flex items-center justify-center text-green-600 bg-green-50">
        <ClipboardTextIcon className="w-3.5 h-3.5" />
      </span>
    )
  return (
    <span className="w-7 h-7 rounded-md flex items-center justify-center text-amber-600 bg-amber-50">
      <FileTextIcon className="w-3.5 h-3.5" />
    </span>
  )
}
