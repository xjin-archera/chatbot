import { useSyncExternalStore } from "react"

// ============ TYPES ============

export type LessonType = "video" | "text" | "quiz"

export type Lesson = {
  id: string
  title: string
  type: LessonType
  duration?: string
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
}

export type PublishForm = {
  mode: "immediate" | "schedule"
  scheduleDate: string
}

// ============ SEED DATA ============

const defaultModules: Module[] = [
  {
    id: "m1",
    title: "Getting Started",
    lessons: [
      {
        id: "l1",
        title: "Introduction to the Course",
        type: "video",
        duration: "5:30",
      },
      {
        id: "l2",
        title: "Setting Up Your Environment",
        type: "video",
        duration: "12:00",
      },
      { id: "l3", title: "Core Concepts Overview", type: "text" },
    ],
  },
  {
    id: "m2",
    title: "Core Concepts",
    lessons: [
      {
        id: "l4",
        title: "Deep Dive: Fundamentals",
        type: "video",
        duration: "24:15",
      },
      { id: "l5", title: "Hands-on Exercise", type: "text" },
      { id: "l6", title: "Module 2 Quiz", type: "quiz" },
    ],
  },
  {
    id: "m3",
    title: "Advanced Topics",
    lessons: [
      {
        id: "l7",
        title: "Advanced Patterns & Best Practices",
        type: "video",
        duration: "35:00",
      },
      {
        id: "l8",
        title: "Real-World Project",
        type: "video",
        duration: "28:45",
      },
      { id: "l9", title: "Final Assessment", type: "quiz" },
    ],
  },
]

const seedCourses: Course[] = [
  {
    id: "c1",
    title: "Introduction to React",
    description:
      "Learn the fundamentals of React including components, hooks, state management, and modern patterns. Build real-world applications from scratch.",
    status: "published",
    modules: defaultModules,
    instructor: "Sarah Johnson",
    duration: "8h 30m",
    students: 1243,
    category: "Frontend Development",
    level: "Beginner",
  },
  {
    id: "c2",
    title: "Advanced TypeScript",
    description:
      "Master TypeScript with advanced types, generics, conditional types, and architectural design patterns for large-scale applications.",
    status: "published",
    modules: defaultModules.slice(0, 2),
    instructor: "Michael Chen",
    duration: "12h 15m",
    students: 892,
    category: "Programming",
    level: "Advanced",
  },
  {
    id: "c3",
    title: "Node.js Backend Development",
    description:
      "Build scalable, production-ready backend services with Node.js, Express, PostgreSQL, and modern deployment workflows.",
    status: "draft",
    modules: defaultModules.slice(0, 1),
    instructor: "Emily Rodriguez",
    duration: "6h 45m",
    students: 0,
    category: "Backend Development",
    level: "Intermediate",
  },
  {
    id: "c4",
    title: "UI/UX Design Principles",
    description:
      "Understand core design principles, color theory, typography, and how to create beautiful, accessible, and usable interfaces.",
    status: "draft",
    modules: defaultModules.slice(0, 2),
    instructor: "Alex Park",
    duration: "5h 20m",
    students: 0,
    category: "Design",
    level: "Beginner",
  },
]

// ============ STORE ============

let courses: Course[] = [...seedCourses]
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
}

export function useCourses(): Course[] {
  return useSyncExternalStore(
    coursesStore.subscribe,
    coursesStore.getSnapshot
  )
}
