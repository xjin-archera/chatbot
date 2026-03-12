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
  GearIcon,
  PlusIcon,
  RocketIcon,
  TrashIcon,
  UploadIcon,
} from "@phosphor-icons/react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
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
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"

import { Field } from "@/components/field"
import { LessonIcon, lessonTypeLabel } from "@/components/lesson-icon"
import { NativeSelect } from "@/components/native-select"
import { RadioItem } from "@/components/radio-item"
import {
  type Course,
  type Lesson,
  type Module,
  type PublishForm,
  coursesStore,
  useCourses,
} from "../store"

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

// ============ EDIT PAGE CONTENT ============

function EditPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id") ?? ""

  // Subscribe to store so course updates re-render the page
  const courses = useCourses()
  const course = courses.find((c) => c.id === id)

  const [view, setView] = useState<"editor" | "preview">("editor")
  const [publishForm, setPublishForm] = useState<PublishForm | null>(null)

  if (!course) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Course not found.</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/courses")}>
          <ArrowLeftIcon />
          Back to Courses
        </Button>
      </div>
    )
  }

  function handleChange(updated: Course) {
    coursesStore.upsert(updated)
  }

  function handleConfirmPublish() {
    coursesStore.upsert({ ...course!, status: "published" })
    setPublishForm(null)
    setView("editor")
  }

  return (
    <div className="min-h-screen bg-background">
      {view === "editor" && (
        <CourseEditor
          course={course}
          onBack={() => router.push("/courses")}
          onPreview={() => setView("preview")}
          onPublish={() => setPublishForm({ mode: "immediate", scheduleDate: "" })}
          onChange={handleChange}
        />
      )}

      {view === "preview" && (
        <CoursePreview
          course={course}
          onBack={() => setView("editor")}
          onPublish={() => setPublishForm({ mode: "immediate", scheduleDate: "" })}
        />
      )}

      <Dialog
        open={!!publishForm}
        onOpenChange={(open) => !open && setPublishForm(null)}
      >
        {publishForm && (
          <PublishDialog
            course={course}
            form={publishForm}
            onFormChange={setPublishForm}
            onConfirm={handleConfirmPublish}
            onCancel={() => setPublishForm(null)}
          />
        )}
      </Dialog>
    </div>
  )
}

// ============ PAGE EXPORT ============

export default function EditPage() {
  return (
    <Suspense>
      <EditPageContent />
    </Suspense>
  )
}
