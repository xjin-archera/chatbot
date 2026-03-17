// ============ TYPES ============

export type LessonType = "video" | "article" | "quiz" | "assignment"

export type QuestionOption = {
  id: string
  text: string
}

export type Question = {
  id: string
  text: string
  options: QuestionOption[]  // always 4 options: a, b, c, d
  correctOptionId?: string
}

export type Lesson = {
  id: string
  title: string
  type: LessonType
  duration?: string
  description?: string
  videoUrl?: string
  articleContent?: string
  resources?: string
  numQuestions?: number
  passingScore?: number
  questions?: Question[]
  assignmentBrief?: string
  maxScore?: number
  daysToComplete?: number
}

export type Module = {
  id: string
  title: string
  lessons: Lesson[]
}

export type CourseStatus = "published" | "draft"

export type Course = {
  id: string
  title: string
  description: string
  status: CourseStatus
  modules: Module[]
  instructor: string
  duration: string
  students: number
  category: string
  level: string
  price?: string
  tags?: string
  thumbnail?: string
  learningOutcomes?: string
}

export type PublishForm = {
  mode: "immediate" | "schedule"
  scheduleDate: string
}

// ============ STORE ============

// In-memory store for new courses that haven't been saved to the DB yet.
let courses: Course[] = []
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

export const coursesStore = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  getSnapshot(): Course[] {
    return courses
  },

  getById(id: string): Course | undefined {
    return courses.find((c) => c.id === id)
  },

  upsert(course: Course) {
    const exists = courses.some((c) => c.id === course.id)
    courses = exists
      ? courses.map((c) => (c.id === course.id ? course : c))
      : [...courses, course]
    notify()
  },

  delete(id: string) {
    courses = courses.filter((c) => c.id !== id)
    notify()
  },
}
