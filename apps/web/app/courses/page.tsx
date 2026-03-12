"use client"

import {
  ArrowLeftIcon,
  BookOpenIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClipboardTextIcon,
  ClockIcon,
  DotsSixVerticalIcon,
  EyeIcon,
  FileTextIcon,
  GearIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  QuestionIcon,
  RocketIcon,
  TrashIcon,
  UploadIcon,
  VideoIcon,
} from "@phosphor-icons/react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
import { Switch } from "@workspace/ui/components/switch"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import { useState, type ComponentProps } from "react"

// ============ TYPES ============

type LessonType = "video" | "text" | "quiz"

type Lesson = {
  id: string
  title: string
  type: LessonType
  duration?: string
}

type Module = {
  id: string
  title: string
  lessons: Lesson[]
}

type CourseStatus = "published" | "draft"

type Course = {
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

type PublishForm = {
  mode: "immediate" | "schedule"
  scheduleDate: string
}

// ============ LOCAL COMPONENTS ============

function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "flex h-8 w-full border border-input bg-background px-2 py-1 text-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function RadioItem({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string
  label: string
  description?: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded border p-3 transition-colors",
        checked
          ? "border-ring/50 bg-muted/40"
          : "border-border hover:bg-muted/20"
      )}
    >
      <input
        type="radio"
        id={id}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 accent-primary"
      />
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium">{label}</span>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </div>
    </label>
  )
}

function LessonIcon({ type }: { type: LessonType }) {
  if (type === "video")
    return <VideoIcon className="size-3.5 shrink-0 text-blue-500" />
  if (type === "quiz")
    return <QuestionIcon className="size-3.5 shrink-0 text-amber-500" />
  return <FileTextIcon className="size-3.5 shrink-0 text-emerald-500" />
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

const lessonTypeLabel: Record<LessonType, string> = {
  video: "Video",
  text: "Reading",
  quiz: "Quiz",
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

// ============ COURSES LIST ============

function CoursesList({
  courses,
  onSelect,
  onNew,
}: {
  courses: Course[]
  onSelect: (course: Course) => void
  onNew: () => void
}) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | CourseStatus>("all")

  const filtered = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === "all" || c.status === filter
    return matchesSearch && matchesFilter
  })

  const totalLessons = (course: Course) =>
    course.modules.reduce((acc, m) => acc + m.lessons.length, 0)

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-base font-semibold">Courses</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Manage and publish your course content
          </p>
        </div>
        <Button onClick={onNew} size="sm">
          <PlusIcon />
          New Course
        </Button>
      </div>

      {/* Filters row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as typeof filter)}
        >
          <TabsList>
            <TabsTrigger value="all">All ({courses.length})</TabsTrigger>
            <TabsTrigger value="published">
              Published (
              {courses.filter((c) => c.status === "published").length})
            </TabsTrigger>
            <TabsTrigger value="draft">
              Draft ({courses.filter((c) => c.status === "draft").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-56">
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-7"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Course grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpenIcon className="mb-3 size-8 text-muted-foreground" />
          <p className="text-sm font-medium">No courses found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try adjusting your search or filter
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((course) => (
            <Card
              key={course.id}
              className="cursor-pointer overflow-hidden transition-all hover:ring-1 hover:ring-ring/30"
              onClick={() => onSelect(course)}
            >
              {/* Thumbnail */}
              <div className="flex h-32 items-center justify-center border-b border-border bg-muted">
                <BookOpenIcon className="size-8 text-muted-foreground/40" />
              </div>

              <div className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm leading-tight font-medium">
                    {course.title}
                  </p>
                  {course.status === "published" ? (
                    <Badge className="shrink-0 border-transparent bg-emerald-100 text-emerald-700">
                      Published
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="shrink-0">
                      Draft
                    </Badge>
                  )}
                </div>

                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {course.description}
                </p>

                <Separator />

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ClockIcon className="size-3" />
                    {course.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpenIcon className="size-3" />
                    {totalLessons(course)} lessons
                  </span>
                  {course.students > 0 && (
                    <span className="flex items-center gap-1">
                      <ChartBarIcon className="size-3" />
                      {course.students.toLocaleString()} students
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {course.instructor}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ============ COURSE EDITOR ============

function CourseEditor({
  course,
  onBack,
  onPreview,
  onPublish,
  onChange,
}: {
  course: Course
  onBack: () => void
  onPreview: () => void
  onPublish: () => void
  onChange: (course: Course) => void
}) {
  const [tab, setTab] = useState("details")

  function updateField<K extends keyof Course>(key: K, value: Course[K]) {
    onChange({ ...course, [key]: value })
  }

  function addModule() {
    const newModule: Module = {
      id: `m${Date.now()}`,
      title: "New Module",
      lessons: [],
    }
    updateField("modules", [...course.modules, newModule])
  }

  function deleteModule(moduleId: string) {
    updateField(
      "modules",
      course.modules.filter((m) => m.id !== moduleId)
    )
  }

  function updateModuleTitle(moduleId: string, title: string) {
    updateField(
      "modules",
      course.modules.map((m) => (m.id === moduleId ? { ...m, title } : m))
    )
  }

  function addLesson(moduleId: string) {
    const newLesson: Lesson = {
      id: `l${Date.now()}`,
      title: "New Lesson",
      type: "video",
    }
    updateField(
      "modules",
      course.modules.map((m) =>
        m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m
      )
    )
  }

  function deleteLesson(moduleId: string, lessonId: string) {
    updateField(
      "modules",
      course.modules.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) }
          : m
      )
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeftIcon />
          </Button>
          <span className="max-w-64 truncate text-sm font-medium">
            {course.title || "Untitled Course"}
          </span>
          {course.status === "published" ? (
            <Badge className="border-transparent bg-emerald-100 text-emerald-700">
              Published
            </Badge>
          ) : (
            <Badge variant="secondary">Draft</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPreview}>
            <EyeIcon />
            Preview
          </Button>
          <Button size="sm" onClick={onPublish}>
            <RocketIcon />
            Publish
          </Button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-border px-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList variant="line">
            <TabsTrigger value="details">
              <ClipboardTextIcon />
              Details
            </TabsTrigger>
            <TabsTrigger value="curriculum">
              <BookOpenIcon />
              Curriculum
            </TabsTrigger>
            <TabsTrigger value="settings">
              <GearIcon />
              Settings
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {/* Details tab */}
        {tab === "details" && (
          <div className="flex max-w-2xl flex-col gap-5">
            <h2 className="text-sm font-semibold">Course Details</h2>

            {/* Thumbnail upload */}
            <div className="flex flex-col gap-1.5">
              <Label>Thumbnail</Label>
              <div className="flex h-36 cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-border text-muted-foreground transition-colors hover:border-ring/50 hover:bg-muted/20">
                <UploadIcon className="size-5" />
                <p className="text-xs">Click to upload thumbnail</p>
                <p className="text-xs opacity-60">PNG, JPG up to 2MB</p>
              </div>
            </div>

            <Field label="Course Title">
              <Input
                value={course.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Enter course title..."
              />
            </Field>

            <Field label="Description">
              <Textarea
                value={course.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe what students will learn..."
                className="min-h-24"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Category">
                <NativeSelect
                  value={course.category}
                  onChange={(e) => updateField("category", e.target.value)}
                >
                  <option>Frontend Development</option>
                  <option>Backend Development</option>
                  <option>Programming</option>
                  <option>Design</option>
                  <option>Data Science</option>
                  <option>DevOps</option>
                </NativeSelect>
              </Field>

              <Field label="Level">
                <NativeSelect
                  value={course.level}
                  onChange={(e) => updateField("level", e.target.value)}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </NativeSelect>
              </Field>
            </div>

            <Field label="Instructor">
              <Input
                value={course.instructor}
                onChange={(e) => updateField("instructor", e.target.value)}
                placeholder="Instructor name..."
              />
            </Field>
          </div>
        )}

        {/* Curriculum tab */}
        {tab === "curriculum" && (
          <div className="flex max-w-2xl flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Curriculum</h2>
              <Button variant="outline" size="sm" onClick={addModule}>
                <PlusIcon />
                Add Module
              </Button>
            </div>

            {course.modules.length === 0 ? (
              <div className="flex flex-col items-center justify-center border border-dashed border-border py-14 text-center">
                <BookOpenIcon className="mb-2 size-7 text-muted-foreground" />
                <p className="text-sm font-medium">No modules yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add a module to start building your curriculum
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {course.modules.map((module) => (
                  <div key={module.id} className="border border-border">
                    {/* Module header */}
                    <div className="flex items-center gap-2 bg-muted/40 px-3 py-2">
                      <DotsSixVerticalIcon className="size-3.5 shrink-0 cursor-grab text-muted-foreground" />
                      <input
                        value={module.title}
                        onChange={(e) =>
                          updateModuleTitle(module.id, e.target.value)
                        }
                        className="flex-1 bg-transparent text-xs font-medium outline-none placeholder:text-muted-foreground"
                      />
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {module.lessons.length} lesson
                        {module.lessons.length !== 1 ? "s" : ""}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => deleteModule(module.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <TrashIcon />
                      </Button>
                    </div>

                    {/* Lessons */}
                    {module.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-2 border-t border-border px-3 py-2"
                      >
                        <DotsSixVerticalIcon className="size-3 shrink-0 cursor-grab text-muted-foreground" />
                        <LessonIcon type={lesson.type} />
                        <span className="flex-1 text-xs">{lesson.title}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {lessonTypeLabel[lesson.type]}
                        </span>
                        {lesson.duration && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {lesson.duration}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => deleteLesson(module.id, lesson.id)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <TrashIcon />
                        </Button>
                      </div>
                    ))}

                    {/* Add lesson */}
                    <div className="border-t border-border px-3 py-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addLesson(module.id)}
                        className="text-muted-foreground"
                      >
                        <PlusIcon />
                        Add Lesson
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings tab */}
        {tab === "settings" && (
          <div className="flex max-w-2xl flex-col gap-6">
            <h2 className="text-sm font-semibold">Course Settings</h2>

            <div className="flex flex-col gap-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Enrollment
              </p>

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium">Open Enrollment</span>
                  <span className="text-xs text-muted-foreground">
                    Allow anyone to enroll without approval
                  </span>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium">
                    Certificate of Completion
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Award a certificate when students complete the course
                  </span>
                </div>
                <Switch />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium">Discussion Forum</span>
                  <span className="text-xs text-muted-foreground">
                    Enable community discussion for this course
                  </span>
                </div>
                <Switch defaultChecked />
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Meta
              </p>
              <Field label="Course Duration">
                <Input
                  value={course.duration}
                  onChange={(e) => updateField("duration", e.target.value)}
                  placeholder="e.g. 8h 30m"
                />
              </Field>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============ COURSE PREVIEW ============

function CoursePreview({
  course,
  onBack,
  onPublish,
}: {
  course: Course
  onBack: () => void
  onPublish: () => void
}) {
  const totalLessons = course.modules.reduce(
    (acc, m) => acc + m.lessons.length,
    0
  )

  return (
    <div className="flex min-h-screen flex-col">
      {/* Preview bar */}
      <div className="flex items-center justify-between border-b border-border bg-amber-50 px-4 py-2.5 dark:bg-amber-950/20">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeftIcon />
            Back to Editor
          </Button>
          <Badge className="border-transparent bg-amber-100 text-amber-700">
            Preview Mode
          </Badge>
        </div>
        <Button size="sm" onClick={onPublish}>
          <RocketIcon />
          Publish
        </Button>
      </div>

      {/* Hero section */}
      <div className="border-b border-border bg-muted/30 px-6 py-10">
        <div className="max-w-3xl">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="secondary">{course.category}</Badge>
            <Badge variant="outline">{course.level}</Badge>
          </div>
          <h1 className="mb-3 text-2xl font-bold">{course.title}</h1>
          <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {course.description}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ClockIcon className="size-3.5" />
              {course.duration}
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpenIcon className="size-3.5" />
              {totalLessons} lessons across {course.modules.length} modules
            </span>
            {course.students > 0 && (
              <span className="flex items-center gap-1.5">
                <ChartBarIcon className="size-3.5" />
                {course.students.toLocaleString()} students enrolled
              </span>
            )}
            <span className="flex items-center gap-1.5">
              Taught by{" "}
              <span className="font-medium text-foreground">
                {course.instructor}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Curriculum preview */}
      <div className="max-w-3xl px-6 py-8">
        <h2 className="mb-4 text-sm font-semibold">Course Content</h2>

        {course.modules.length === 0 ? (
          <p className="text-xs text-muted-foreground">No content added yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {course.modules.map((module, idx) => (
              <div key={module.id} className="border border-border">
                {/* Module header */}
                <div className="flex items-center justify-between bg-muted/30 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Module {idx + 1}
                    </span>
                    <span className="text-xs font-medium">{module.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {module.lessons.length} lesson
                    {module.lessons.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Lessons */}
                {module.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-3 border-t border-border px-4 py-2.5"
                  >
                    <LessonIcon type={lesson.type} />
                    <span className="flex-1 text-xs">{lesson.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {lessonTypeLabel[lesson.type]}
                    </span>
                    {lesson.duration && (
                      <span className="text-xs text-muted-foreground">
                        {lesson.duration}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============ PUBLISH DIALOG ============

function PublishDialog({
  course,
  form,
  onFormChange,
  onConfirm,
  onCancel,
}: {
  course: Course
  form: PublishForm
  onFormChange: (form: PublishForm) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <DialogContent showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>Publish Course</DialogTitle>
        <DialogDescription>
          Make &ldquo;{course.title}&rdquo; available to students.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        <RadioItem
          id="publish-immediate"
          label="Publish immediately"
          description="Students can access the course right away."
          checked={form.mode === "immediate"}
          onChange={() => onFormChange({ ...form, mode: "immediate" })}
        />
        <RadioItem
          id="publish-schedule"
          label="Schedule for later"
          description="Choose a date and time to publish."
          checked={form.mode === "schedule"}
          onChange={() => onFormChange({ ...form, mode: "schedule" })}
        />
        {form.mode === "schedule" && (
          <div className="px-1 pt-1">
            <Input
              type="datetime-local"
              value={form.scheduleDate}
              onChange={(e) =>
                onFormChange({ ...form, scheduleDate: e.target.value })
              }
              className="text-xs"
            />
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={onConfirm}>
          <CheckCircleIcon />
          {form.mode === "immediate" ? "Publish Now" : "Schedule"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

// ============ MAIN PAGE ============

type View = "list" | "editor" | "preview"

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>(seedCourses)
  const [view, setView] = useState<View>("list")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [publishForm, setPublishForm] = useState<PublishForm | null>(null)

  function handleSelectCourse(course: Course) {
    setSelectedCourse({ ...course })
    setView("editor")
  }

  function handleNewCourse() {
    const newCourse: Course = {
      id: `c${Date.now()}`,
      title: "",
      description: "",
      status: "draft",
      modules: [],
      instructor: "",
      duration: "",
      students: 0,
      category: "Frontend Development",
      level: "Beginner",
    }
    setSelectedCourse(newCourse)
    setCourses((prev) => [...prev, newCourse])
    setView("editor")
  }

  function handleCourseChange(updated: Course) {
    setSelectedCourse(updated)
    setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }

  function handleBackToList() {
    setSelectedCourse(null)
    setView("list")
  }

  function handlePreview() {
    setView("preview")
  }

  function handleBackToEditor() {
    setView("editor")
  }

  function handleOpenPublish() {
    setPublishForm({ mode: "immediate", scheduleDate: "" })
  }

  function handleConfirmPublish() {
    if (!selectedCourse) return
    const updated: Course = { ...selectedCourse, status: "published" }
    handleCourseChange(updated)
    setPublishForm(null)
    setView("editor")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* List view */}
      {view === "list" && (
        <CoursesList
          courses={courses}
          onSelect={handleSelectCourse}
          onNew={handleNewCourse}
        />
      )}

      {/* Editor view */}
      {view === "editor" && selectedCourse && (
        <CourseEditor
          course={selectedCourse}
          onBack={handleBackToList}
          onPreview={handlePreview}
          onPublish={handleOpenPublish}
          onChange={handleCourseChange}
        />
      )}

      {/* Preview view */}
      {view === "preview" && selectedCourse && (
        <CoursePreview
          course={selectedCourse}
          onBack={handleBackToEditor}
          onPublish={handleOpenPublish}
        />
      )}

      {/* Publish dialog */}
      {selectedCourse && (
        <Dialog
          open={!!publishForm}
          onOpenChange={(open) => !open && setPublishForm(null)}
        >
          {publishForm && (
            <PublishDialog
              course={selectedCourse}
              form={publishForm}
              onFormChange={setPublishForm}
              onConfirm={handleConfirmPublish}
              onCancel={() => setPublishForm(null)}
            />
          )}
        </Dialog>
      )}
    </div>
  )
}
