"use client"

import {
  ArrowLeftIcon,
  BookOpenIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CircleDashedIcon,
  ClipboardTextIcon,
  ClockIcon,
  DotsSixVerticalIcon,
  EyeIcon,
  GearIcon,
  PencilSimpleIcon,
  PlusIcon,
  RocketIcon,
  TrashIcon,
} from "@phosphor-icons/react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
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

import { DropZone } from "@/components/dropzone"
import { Field } from "@/components/field"
import { LessonIcon, lessonTypeLabel } from "@/components/lesson-icon"
import { NativeSelect } from "@/components/native-select"
import { RadioItem } from "@/components/radio-item"
import { Sheet } from "@/components/sheet"
import {
  type Course,
  type Lesson,
  type LessonType,
  type Module,
  type PublishForm,
  coursesStore,
  useCourses,
} from "../store"
import { collectErrors, courseDetailsSchema, lessonSchema, publishSchema } from "../schemas"

// ============ EDITABLE MODULE TITLE ============

function EditableModuleTitle({
  title,
  onSave,
}: {
  title: string
  onSave: (value: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)

  function commit() {
    onSave(draft.trim() || title)
    setEditing(false)
  }

  function cancel() {
    setDraft(title)
    setEditing(false)
  }

  if (editing) {
    return (
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit()
          if (e.key === "Escape") cancel()
        }}
        autoFocus
        className="h-7 w-48 text-xs font-medium"
      />
    )
  }

  return (
    <button
      className="group flex items-center gap-1.5 text-xs font-medium"
      onClick={() => {
        setDraft(title)
        setEditing(true)
      }}
    >
      {title}
      <PencilSimpleIcon className="size-3 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity" />
    </button>
  )
}

// ============ LESSON EDITOR SHEET ============

function LessonEditorSheet({
  open,
  lesson,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean
  lesson: Lesson | null
  onClose: () => void
  onSave: (updated: Lesson) => void
  onDelete: () => void
}) {
  const [form, setForm] = useState<Lesson>(
    lesson ?? { id: "", title: "", type: "video" }
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when lesson changes
  if (lesson && form.id !== lesson.id) {
    setForm(lesson)
    setErrors({})
  }

  function update<K extends keyof Lesson>(key: K, value: Lesson[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((e) => {
      const n = { ...e }
      delete n[key as string]
      return n
    })
  }

  function handleSave() {
    const result = lessonSchema.safeParse(form)
    if (!result.success) {
      setErrors(collectErrors(result))
      return
    }
    onSave(form)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Edit Lesson">
      <div className="flex flex-col gap-4">
        <Field label="Title" required>
          <Input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Lesson title..."
          />
          {errors.title && <p className="text-xs text-destructive mt-0.5">{errors.title}</p>}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <NativeSelect
              value={form.type}
              onChange={(e) => update("type", e.target.value as LessonType)}
            >
              <option value="video">Video</option>
              <option value="article">Article</option>
              <option value="quiz">Quiz</option>
              <option value="assignment">Assignment</option>
            </NativeSelect>
          </Field>
          <Field label="Duration">
            <Input
              value={form.duration ?? ""}
              onChange={(e) => update("duration", e.target.value)}
              placeholder="e.g. 12:30"
            />
          </Field>
        </div>

        <Field label="Description">
          <Textarea
            value={form.description ?? ""}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Brief description of this lesson..."
            className="min-h-20"
          />
        </Field>

        <Separator />

        {/* Type-specific content */}
        {form.type === "video" && (
          <div className="flex flex-col gap-3">
            <Field label="Video URL" required>
              <Input
                value={form.videoUrl ?? ""}
                onChange={(e) => update("videoUrl", e.target.value)}
                placeholder="https://..."
              />
              {errors.videoUrl && <p className="text-xs text-destructive mt-0.5">{errors.videoUrl}</p>}
            </Field>
            <DropZone
              label="Or drag and drop a video file"
              accept={{ "video/*": [] }}
              className="h-24"
              onFiles={(files) => { const f = files[0]; if (f) update("videoUrl", URL.createObjectURL(f)) }}
            />
          </div>
        )}

        {form.type === "article" && (
          <div className="flex flex-col gap-3">
            <Field label="Article Content">
              <Textarea
                value={form.articleContent ?? ""}
                onChange={(e) => update("articleContent", e.target.value)}
                placeholder="Write your article content here..."
                className="min-h-32"
              />
            </Field>
            <DropZone
              label="Upload images or attachments"
              accept={{ "image/*": [], "application/pdf": [".pdf"] }}
              className="h-20"
            />
          </div>
        )}

        {form.type === "quiz" && (
          <Card>
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Number of Questions" required>
                  <Input
                    type="number"
                    placeholder="10"
                    min={1}
                    value={form.numQuestions ?? ""}
                    onChange={(e) => update("numQuestions", e.target.value ? Number(e.target.value) : undefined)}
                  />
                  {errors.numQuestions && <p className="text-xs text-destructive mt-0.5">{errors.numQuestions}</p>}
                </Field>
                <Field label="Passing Score (%)" required>
                  <Input
                    type="number"
                    placeholder="70"
                    min={0}
                    max={100}
                    value={form.passingScore ?? ""}
                    onChange={(e) => update("passingScore", e.target.value ? Number(e.target.value) : undefined)}
                  />
                  {errors.passingScore && <p className="text-xs text-destructive mt-0.5">{errors.passingScore}</p>}
                </Field>
              </div>
              <Button variant="outline" size="sm" className="w-fit">
                <PlusIcon />
                Add Question
              </Button>
            </CardContent>
          </Card>
        )}

        {form.type === "assignment" && (
          <div className="flex flex-col gap-3">
            <Field label="Assignment Brief">
              <Textarea
                placeholder="Describe the assignment task..."
                className="min-h-24"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Max Score" required>
                <Input
                  type="number"
                  placeholder="100"
                  value={form.maxScore ?? ""}
                  onChange={(e) => update("maxScore", e.target.value ? Number(e.target.value) : undefined)}
                />
                {errors.maxScore && <p className="text-xs text-destructive mt-0.5">{errors.maxScore}</p>}
              </Field>
              <Field label="Days to Complete" required>
                <Input
                  type="number"
                  placeholder="7"
                  value={form.daysToComplete ?? ""}
                  onChange={(e) => update("daysToComplete", e.target.value ? Number(e.target.value) : undefined)}
                />
                {errors.daysToComplete && <p className="text-xs text-destructive mt-0.5">{errors.daysToComplete}</p>}
              </Field>
            </div>
            <DropZone
              label="Upload assignment template"
              className="h-20"
            />
          </div>
        )}

        <Separator />

        <Field
          label="Resources"
          hint="One resource per line. Students can download these materials."
        >
          <Textarea
            value={form.resources ?? ""}
            onChange={(e) => update("resources", e.target.value)}
            placeholder="https://example.com/slides.pdf&#10;https://example.com/code.zip"
            className="min-h-20"
          />
        </Field>

        {/* Action row */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <TrashIcon />
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </Sheet>
  )
}

// ============ COURSE EDITOR ============

function CourseEditor({
  course,
  onBack,
  onPreview,
  onPublish,
  onChange,
  courseErrors,
  setCourseErrors,
}: {
  course: Course
  onBack: () => void
  onPreview: () => void
  onPublish: () => void
  onChange: (course: Course) => void
  courseErrors: Record<string, string>
  setCourseErrors: (errors: Record<string, string>) => void
}) {
  const [tab, setTab] = useState("details")
  const [saved, setSaved] = useState(false)
  const [lessonSheet, setLessonSheet] = useState<{
    open: boolean
    moduleId: string | null
    lesson: Lesson | null
  }>({ open: false, moduleId: null, lesson: null })
  const [enrollment, setEnrollment] = useState<"open" | "approval" | "invite">(
    "open"
  )

  function updateField<K extends keyof Course>(key: K, value: Course[K]) {
    onChange({ ...course, [key]: value })
    const n = { ...courseErrors }
    delete n[key as string]
    setCourseErrors(n)
  }

  function validateCourse(): boolean {
    const result = courseDetailsSchema.safeParse(course)
    if (!result.success) {
      setCourseErrors(collectErrors(result))
      setTab("details")
      return false
    }
    setCourseErrors({})
    return true
  }

  function save() {
    if (!validateCourse()) return
    coursesStore.upsert(course)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
    setLessonSheet({ open: false, moduleId: null, lesson: null })
  }

  function openEditLesson(moduleId: string, lesson: Lesson) {
    setLessonSheet({ open: true, moduleId, lesson })
  }

  function saveLesson(updated: Lesson) {
    if (!lessonSheet.moduleId) return
    updateField(
      "modules",
      course.modules.map((m) =>
        m.id === lessonSheet.moduleId
          ? {
              ...m,
              lessons: m.lessons.map((l) =>
                l.id === updated.id ? updated : l
              ),
            }
          : m
      )
    )
    setLessonSheet({ open: false, moduleId: null, lesson: null })
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
            <Badge variant="secondary">
              <CircleDashedIcon className="mr-0.5 size-3" />
              Draft
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-emerald-600">✓ Saved</span>
          )}
          <Button variant="outline" size="sm" onClick={save}>
            Save Draft
          </Button>
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
          <div className="grid max-w-3xl grid-cols-3 gap-6">
            <div className="col-span-2 flex flex-col gap-5">
              <h2 className="text-sm font-semibold">Course Details</h2>

              <div className="flex flex-col gap-1.5">
                <Label>Thumbnail</Label>
                {course.thumbnail && (
                  <img
                    src={course.thumbnail}
                    alt="Thumbnail preview"
                    className="h-36 w-full rounded object-cover border border-border"
                  />
                )}
                <DropZone
                  label="Click or drag to upload thumbnail"
                  accept={{ "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] }}
                  maxSize={2 * 1024 * 1024}
                  className="h-36"
                  onFiles={(files) => { const f = files[0]; if (f) updateField("thumbnail", URL.createObjectURL(f)) }}
                />
              </div>

              <Field label="Course Title" required>
                <Input
                  value={course.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Enter course title..."
                />
                {courseErrors.title && <p className="text-xs text-destructive mt-0.5">{courseErrors.title}</p>}
              </Field>

              <Field label="Description" required>
                <Textarea
                  value={course.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe what students will learn..."
                  className="min-h-24"
                />
                {courseErrors.description && <p className="text-xs text-destructive mt-0.5">{courseErrors.description}</p>}
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

              <Field label="Instructor" required>
                <Input
                  value={course.instructor}
                  onChange={(e) => updateField("instructor", e.target.value)}
                  placeholder="Instructor name..."
                />
                {courseErrors.instructor && <p className="text-xs text-destructive mt-0.5">{courseErrors.instructor}</p>}
              </Field>
            </div>

            {/* Sidebar */}
            <div className="col-span-1 flex flex-col gap-4 pt-8">
              <Field label="Price (USD)">
                <Input
                  value={course.price ?? ""}
                  onChange={(e) => updateField("price", e.target.value)}
                  placeholder="e.g. 49"
                />
                {courseErrors.price && <p className="text-xs text-destructive mt-0.5">{courseErrors.price}</p>}
              </Field>

              <Field label="Duration">
                <NativeSelect
                  value={course.duration}
                  onChange={(e) => updateField("duration", e.target.value)}
                >
                  <option>1h – 3h</option>
                  <option>3h – 6h</option>
                  <option>6h – 10h</option>
                  <option>10h+</option>
                  {course.duration && !["1h – 3h","3h – 6h","6h – 10h","10h+"].includes(course.duration) && (
                    <option value={course.duration}>{course.duration}</option>
                  )}
                </NativeSelect>
              </Field>

              <Field label="Tags" hint="Comma-separated">
                <Input
                  value={course.tags ?? ""}
                  onChange={(e) => updateField("tags", e.target.value)}
                  placeholder="react, javascript, hooks"
                />
              </Field>
            </div>
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
                      <EditableModuleTitle
                        title={module.title}
                        onSave={(title) => updateModuleTitle(module.id, title)}
                      />
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
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
                        className="group flex cursor-pointer items-center gap-2 border-t border-border px-3 py-2 hover:bg-muted/20"
                        onClick={() => openEditLesson(module.id, lesson)}
                      >
                        <DotsSixVerticalIcon className="size-3 shrink-0 cursor-grab text-muted-foreground" />
                        <LessonIcon type={lesson.type} />
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="text-xs font-medium">
                            {lesson.title}
                          </span>
                          {lesson.description && (
                            <span className="truncate text-xs text-muted-foreground">
                              {lesson.description}
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {lessonTypeLabel[lesson.type]}
                        </span>
                        {lesson.duration && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {lesson.duration}
                          </span>
                        )}
                        <PencilSimpleIcon className="size-3 shrink-0 opacity-0 text-muted-foreground group-hover:opacity-100 transition-opacity" />
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

              <div className="flex flex-col gap-2">
                <RadioItem
                  id="enroll-open"
                  label="Open Enrollment"
                  description="Anyone can enroll without approval."
                  checked={enrollment === "open"}
                  onChange={() => setEnrollment("open")}
                />
                <RadioItem
                  id="enroll-approval"
                  label="Requires Approval"
                  description="Students must request access and be approved."
                  checked={enrollment === "approval"}
                  onChange={() => setEnrollment("approval")}
                />
                <RadioItem
                  id="enroll-invite"
                  label="Invite Only"
                  description="Only students with an invitation link can enroll."
                  checked={enrollment === "invite"}
                  onChange={() => setEnrollment("invite")}
                />
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

            <Separator />

            {/* Danger zone */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Danger Zone
              </p>
              <div className="rounded border border-destructive/30 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium">Archive Course</span>
                    <span className="text-xs text-muted-foreground">
                      Hide this course from students. Can be restored later.
                    </span>
                  </div>
                  <Button variant="outline" size="sm">
                    Archive
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium">Delete Course</span>
                    <span className="text-xs text-muted-foreground">
                      Permanently delete this course and all its content.
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lesson editor sheet */}
      <LessonEditorSheet
        open={lessonSheet.open}
        lesson={lessonSheet.lesson}
        onClose={() =>
          setLessonSheet({ open: false, moduleId: null, lesson: null })
        }
        onSave={saveLesson}
        onDelete={() =>
          lessonSheet.moduleId && lessonSheet.lesson &&
          deleteLesson(lessonSheet.moduleId, lessonSheet.lesson.id)
        }
      />
    </div>
  )
}

// ============ YOUTUBE HELPER ============

function getYoutubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
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
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null)
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
      <div className="bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 px-6 py-10">
        <div className="max-w-3xl">
          <div className="mb-3 flex items-center gap-2">
            <Badge className="bg-white/10 text-white border-white/20">
              {course.category}
            </Badge>
            <Badge className="bg-white/10 text-white border-white/20">
              {course.level}
            </Badge>
          </div>
          <h1 className="mb-3 text-2xl font-bold text-white">{course.title}</h1>
          <p className="mb-6 max-w-2xl text-sm leading-relaxed text-gray-300">
            {course.description}
          </p>
          <div className="mb-6 flex flex-wrap items-center gap-4 text-xs text-gray-400">
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
              <span className="font-medium text-white">{course.instructor}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {course.price && (
              <span className="text-xl font-bold text-white">
                ${course.price}
              </span>
            )}
            <Button className="bg-white text-gray-900 hover:bg-gray-100">
              Enroll Now
            </Button>
          </div>
          {course.thumbnail && (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="mt-6 h-48 max-w-md rounded-lg object-cover shadow-lg"
            />
          )}
        </div>
      </div>

      {/* What you'll learn */}
      <div className="border-b border-border px-6 py-8">
        <div className="max-w-3xl">
          <h2 className="mb-4 text-sm font-semibold">What you&apos;ll learn</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              "Understand core concepts and practical applications",
              "Build real-world projects from scratch",
              "Apply best practices used in production",
              "Gain hands-on experience with modern tooling",
            ].map((point) => (
              <div key={point} className="flex items-start gap-2">
                <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                <span className="text-xs text-muted-foreground">{point}</span>
              </div>
            ))}
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

                {module.lessons.map((lesson) => {
                  const isExpanded = expandedLessonId === lesson.id
                  return (
                    <div key={lesson.id} className="border-t border-border">
                      <div
                        className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-muted/20"
                        onClick={() => setExpandedLessonId(isExpanded ? null : lesson.id)}
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

                      {isExpanded && (
                        <div className="border-t border-border bg-muted/10 px-4 py-4">
                          {lesson.type === "video" && (
                            lesson.videoUrl ? (
                              (() => {
                                const embedUrl = getYoutubeEmbedUrl(lesson.videoUrl)
                                return embedUrl ? (
                                  <iframe
                                    src={embedUrl}
                                    className="w-full rounded aspect-video"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                ) : (
                                  <video controls src={lesson.videoUrl} className="w-full rounded" />
                                )
                              })()
                            ) : (
                              <p className="text-sm text-muted-foreground">No video uploaded yet.</p>
                            )
                          )}

                          {lesson.type === "article" && (
                            lesson.articleContent ? (
                              <div className="text-sm whitespace-pre-wrap">{lesson.articleContent}</div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No article content added yet.</p>
                            )
                          )}

                          {(lesson.type === "quiz" || lesson.type === "assignment") && (
                            <p className="text-sm text-muted-foreground">This content is not available in preview.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
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
  errors,
}: {
  course: Course
  form: PublishForm
  onFormChange: (form: PublishForm) => void
  onConfirm: () => void
  onCancel: () => void
  errors: Record<string, string>
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
            {errors.scheduleDate && (
              <p className="text-xs text-destructive mt-0.5">{errors.scheduleDate}</p>
            )}
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
  const [publishErrors, setPublishErrors] = useState<Record<string, string>>({})
  const [courseErrors, setCourseErrors] = useState<Record<string, string>>({})

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

  function openPublishDialog() {
    const result = courseDetailsSchema.safeParse(course)
    if (!result.success) {
      setCourseErrors(collectErrors(result))
      setView("editor")
      return
    }
    setCourseErrors({})
    setPublishForm({ mode: "immediate", scheduleDate: "" })
  }

  function handleConfirmPublish() {
    if (!publishForm) return
    const result = publishSchema.safeParse(publishForm)
    if (!result.success) {
      setPublishErrors(collectErrors(result))
      return
    }
    setPublishErrors({})
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
          onPublish={openPublishDialog}
          onChange={handleChange}
          courseErrors={courseErrors}
          setCourseErrors={setCourseErrors}
        />
      )}

      {view === "preview" && (
        <CoursePreview
          course={course}
          onBack={() => setView("editor")}
          onPublish={openPublishDialog}
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
            onFormChange={(f) => {
              setPublishForm(f)
              setPublishErrors({})
            }}
            onConfirm={handleConfirmPublish}
            onCancel={() => { setPublishForm(null); setPublishErrors({}) }}
            errors={publishErrors}
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
