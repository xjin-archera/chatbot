"use client"

import { zodResolver } from "@hookform/resolvers/zod"
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
import { Suspense, useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import useSWR, { useSWRConfig } from "swr"
import useSWRMutation from "swr/mutation"

import { DropZone } from "@/components/dropzone"
import { Field } from "@/components/field"
import { LessonIcon, lessonTypeLabel } from "@/components/lesson-icon"
import { NativeSelect } from "@/components/native-select"
import { RadioItem } from "@/components/radio-item"
import { Sheet } from "@/components/sheet"

import { courseDetailsSchema, lessonSchema, publishSchema } from "../schemas"
import {
  type Course,
  type Lesson,
  type Module,
  type PublishForm,
  type Question,
  coursesStore,
} from "../store"

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
      <PencilSimpleIcon className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
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
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<Lesson>({
    resolver: zodResolver(lessonSchema) as any,
    defaultValues: lesson ?? { id: "", title: "", type: "video" },
  })

  const type = watch("type")
  const questions = (watch("questions") ?? []) as Question[]

  // Reset when lesson changes
  const prevLessonIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (lesson && lesson.id !== prevLessonIdRef.current) {
      prevLessonIdRef.current = lesson.id
      reset(lesson)
    }
  }, [lesson, reset])

  // Keep numQuestions in sync with the questions array
  useEffect(() => {
    setValue("numQuestions", questions.length, { shouldValidate: false })
  }, [questions.length, setValue])

  function addQuestion() {
    const newQ: Question = {
      id: `q${Date.now()}`,
      text: "",
      options: [
        { id: "a", text: "" },
        { id: "b", text: "" },
        { id: "c", text: "" },
        { id: "d", text: "" },
      ],
    }
    setValue("questions", [...questions, newQ])
  }

  function removeQuestionAt(qi: number) {
    setValue(
      "questions",
      questions.filter((_, i) => i !== qi)
    )
  }

  function updateQuestionField(
    qi: number,
    key: "text" | "correctOptionId",
    value: string
  ) {
    const updated = [...questions]
    updated[qi] = { ...updated[qi]!, [key]: value } as Question
    setValue("questions", updated)
  }

  function updateOptionText(qi: number, optId: string, text: string) {
    const updated = [...questions]
    const q = updated[qi]!
    updated[qi] = {
      ...q,
      options: q.options.map((o) => (o.id === optId ? { ...o, text } : o)),
    }
    setValue("questions", updated)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Edit Lesson">
      <form
        onSubmit={handleSubmit((data) => onSave(data as Lesson))}
        className="flex flex-col gap-4"
      >
        {/* Hidden id field so the lesson id is included in submitted data */}
        <input type="hidden" {...register("id")} />

        <Field label="Title" required>
          <Input {...register("title")} placeholder="Lesson title..." />
          {errors.title && (
            <p className="mt-0.5 text-xs text-destructive">
              {errors.title.message}
            </p>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <NativeSelect {...register("type")}>
              <option value="video">Video</option>
              <option value="article">Article</option>
              <option value="quiz">Quiz</option>
              <option value="assignment">Assignment</option>
            </NativeSelect>
          </Field>
          <Field label="Duration">
            <Input {...register("duration")} placeholder="e.g. 12:30" />
          </Field>
        </div>

        <Field label="Description">
          <Textarea
            {...register("description")}
            placeholder="Brief description of this lesson..."
            className="min-h-20"
          />
        </Field>

        <Separator />

        {/* Type-specific content */}
        {type === "video" && (
          <div className="flex flex-col gap-3">
            <Field label="Video URL" required>
              <Input {...register("videoUrl")} placeholder="https://..." />
              {errors.videoUrl && (
                <p className="mt-0.5 text-xs text-destructive">
                  {errors.videoUrl.message}
                </p>
              )}
            </Field>
            <DropZone
              label="Or drag and drop a video file"
              accept={{ "video/*": [] }}
              className="h-24"
              onFiles={(files) => {
                const f = files[0]
                if (f) setValue("videoUrl", URL.createObjectURL(f))
              }}
            />
          </div>
        )}

        {type === "article" && (
          <div className="flex flex-col gap-3">
            <Field label="Article Content">
              <Textarea
                {...register("articleContent")}
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

        {type === "quiz" && (
          <Card>
            <CardContent className="flex flex-col gap-3 p-4">
              <Field label="Passing Score (%)" required>
                <Input
                  type="number"
                  placeholder="70"
                  min={0}
                  max={100}
                  {...register("passingScore", { valueAsNumber: true })}
                />
                {errors.passingScore && (
                  <p className="mt-0.5 text-xs text-destructive">
                    {errors.passingScore.message}
                  </p>
                )}
              </Field>

              {questions.map((q, qi) => (
                <div
                  key={q.id}
                  className="flex flex-col gap-2 rounded-md border border-border p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Question {qi + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeQuestionAt(qi)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Question text..."
                    value={q.text}
                    onChange={(e) =>
                      updateQuestionField(qi, "text", e.target.value)
                    }
                  />
                  <div className="mt-1 flex flex-col gap-1.5">
                    {q.options.map((opt) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.correctOptionId === opt.id}
                          onChange={() =>
                            updateQuestionField(qi, "correctOptionId", opt.id)
                          }
                          className="accent-primary"
                        />
                        <span className="w-4 text-xs font-medium text-muted-foreground uppercase">
                          {opt.id}
                        </span>
                        <Input
                          placeholder={`Option ${opt.id.toUpperCase()}...`}
                          value={opt.text}
                          onChange={(e) =>
                            updateOptionText(qi, opt.id, e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={addQuestion}
                >
                  <PlusIcon />
                  Add Question
                </Button>
                {errors.numQuestions && (
                  <p className="text-xs text-destructive">
                    {errors.numQuestions.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {type === "assignment" && (
          <div className="flex flex-col gap-3">
            <Field label="Assignment Brief">
              <Textarea
                {...register("assignmentBrief")}
                placeholder="Describe the assignment task..."
                className="min-h-24"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Max Score" required>
                <Input
                  type="number"
                  placeholder="100"
                  {...register("maxScore", { valueAsNumber: true })}
                />
                {errors.maxScore && (
                  <p className="mt-0.5 text-xs text-destructive">
                    {errors.maxScore.message}
                  </p>
                )}
              </Field>
              <Field label="Days to Complete" required>
                <Input
                  type="number"
                  placeholder="7"
                  {...register("daysToComplete", { valueAsNumber: true })}
                />
                {errors.daysToComplete && (
                  <p className="mt-0.5 text-xs text-destructive">
                    {errors.daysToComplete.message}
                  </p>
                )}
              </Field>
            </div>
            <DropZone label="Upload assignment template" className="h-20" />
          </div>
        )}

        <Separator />

        <Field
          label="Resources"
          hint="One resource per line. Students can download these materials."
        >
          <Textarea
            {...register("resources")}
            placeholder="https://example.com/slides.pdf&#10;https://example.com/code.zip"
            className="min-h-20"
          />
        </Field>

        {/* Action row */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <TrashIcon />
            Delete
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save
            </Button>
          </div>
        </div>
      </form>
    </Sheet>
  )
}

// ============ COURSE EDITOR ============

type CourseFields = Pick<
  Course,
  | "title"
  | "description"
  | "category"
  | "level"
  | "instructor"
  | "price"
  | "duration"
  | "tags"
  | "learningOutcomes"
  | "thumbnail"
>

function CourseEditor({
  course,
  onBack,
  onPreview,
  onPublish,
}: {
  course: Course
  onBack: () => void
  onPreview: (course: Course) => void
  onPublish: (course: Course) => void
}) {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<CourseFields>({
    resolver: zodResolver(courseDetailsSchema) as any,
    defaultValues: {
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      instructor: course.instructor,
      price: course.price,
      duration: course.duration,
      tags: course.tags,
      learningOutcomes: course.learningOutcomes,
      thumbnail: course.thumbnail,
    },
  })

  const isNew = /^c\d{10,}$/.test(course.id)
  const { mutate } = useSWRConfig()

  const { trigger: putDraft, isMutating: isSaving } = useSWRMutation(
    !isNew ? `/api/courses/${course.id}` : null,
    async (url, { arg }: { arg: Course }) => {
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: arg.title,
          description: arg.description,
          instructor: arg.instructor,
          duration: arg.duration,
          students: arg.students,
          category: arg.category,
          level: arg.level,
          price: arg.price,
          tags: arg.tags,
          thumbnail: arg.thumbnail,
          learningOutcomes: arg.learningOutcomes,
          status: arg.status,
          modules: arg.modules.map((m) => ({
            title: m.title,
            lessons: m.lessons.map((l) => ({ ...l })),
          })),
        }),
      })
      if (!res.ok) throw new Error("Failed to save draft")
      return res.json() as Promise<Course>
    }
  )

  const [tab, setTab] = useState("details")
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">(
    "idle"
  )
  const [modules, setModules] = useState<Module[]>(course.modules)
  const [lessonSheet, setLessonSheet] = useState<{
    open: boolean
    moduleId: string | null
    lesson: Lesson | null
  }>({ open: false, moduleId: null, lesson: null })
  const [enrollment, setEnrollment] = useState<"open" | "approval" | "invite">(
    "open"
  )

  function buildCourse(): Course {
    return { ...course, ...getValues(), modules }
  }

  async function save() {
    const updated = buildCourse()
    coursesStore.upsert(updated)
    if (!isNew) {
      try {
        await putDraft(updated)
        await mutate(`/api/courses/${course.id}`)
      } catch {
        setSaveStatus("error")
        setTimeout(() => setSaveStatus("idle"), 3000)
        return
      }
    }
    setSaveStatus("saved")
    setTimeout(() => setSaveStatus("idle"), 2000)
  }

  function handlePublishClick() {
    handleSubmit(() => {
      const updated = buildCourse()
      coursesStore.upsert(updated)
      onPublish(updated)
    })()
  }

  function addModule() {
    const newModule: Module = {
      id: `m${Date.now()}`,
      title: "New Module",
      lessons: [],
    }
    setModules((prev) => [...prev, newModule])
  }

  function deleteModule(moduleId: string) {
    setModules((prev) => prev.filter((m) => m.id !== moduleId))
  }

  function updateModuleTitle(moduleId: string, title: string) {
    setModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, title } : m))
    )
  }

  function addLesson(moduleId: string) {
    const newLesson: Lesson = {
      id: `l${Date.now()}`,
      title: "New Lesson",
      type: "video",
    }
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m
      )
    )
  }

  function deleteLesson(moduleId: string, lessonId: string) {
    setModules((prev) =>
      prev.map((m) =>
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
    setModules((prev) =>
      prev.map((m) =>
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

  // current thumbnail for preview (controlled via setValue)
  const thumbnail = getValues("thumbnail")

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
          {saveStatus === "saved" && (
            <span className="text-xs text-emerald-600">✓ Saved</span>
          )}
          {saveStatus === "error" && (
            <span className="text-xs text-destructive">Failed to save</span>
          )}
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={save}
            disabled={isSaving}
          >
            {isSaving ? "Saving…" : "Save Draft"}
          </Button>
          <Button variant="outline" size="sm" type="button" onClick={() => onPreview(buildCourse())}>
            <EyeIcon />
            Preview
          </Button>
          <Button size="sm" type="button" onClick={handlePublishClick}>
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
                {thumbnail && (
                  <img
                    src={thumbnail}
                    alt="Thumbnail preview"
                    className="h-36 w-full rounded border border-border object-cover"
                  />
                )}
                <DropZone
                  label="Click or drag to upload thumbnail"
                  accept={{
                    "image/png": [".png"],
                    "image/jpeg": [".jpg", ".jpeg"],
                  }}
                  maxSize={2 * 1024 * 1024}
                  className="h-36"
                  onFiles={(files) => {
                    const f = files[0]
                    if (f) setValue("thumbnail", URL.createObjectURL(f))
                  }}
                />
              </div>

              <Field label="Course Title" required>
                <Input
                  {...register("title")}
                  placeholder="Enter course title..."
                />
                {errors.title && (
                  <p className="mt-0.5 text-xs text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </Field>

              <Field label="Description" required>
                <Textarea
                  {...register("description")}
                  placeholder="Describe what students will learn..."
                  className="min-h-24"
                />
                {errors.description && (
                  <p className="mt-0.5 text-xs text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Category">
                  <NativeSelect {...register("category")}>
                    <option>Frontend Development</option>
                    <option>Backend Development</option>
                    <option>Programming</option>
                    <option>Design</option>
                    <option>Data Science</option>
                    <option>DevOps</option>
                  </NativeSelect>
                </Field>

                <Field label="Level">
                  <NativeSelect {...register("level")}>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </NativeSelect>
                </Field>
              </div>

              <Field label="Instructor" required>
                <Input
                  {...register("instructor")}
                  placeholder="Instructor name..."
                />
                {errors.instructor && (
                  <p className="mt-0.5 text-xs text-destructive">
                    {errors.instructor.message}
                  </p>
                )}
              </Field>
            </div>

            {/* Sidebar */}
            <div className="col-span-1 flex flex-col gap-4 pt-8">
              <Field label="Price (USD)">
                <Input {...register("price")} placeholder="e.g. 49" />
                {errors.price && (
                  <p className="mt-0.5 text-xs text-destructive">
                    {errors.price.message}
                  </p>
                )}
              </Field>

              <Field label="Duration">
                <NativeSelect {...register("duration")}>
                  <option>1h – 3h</option>
                  <option>3h – 6h</option>
                  <option>6h – 10h</option>
                  <option>10h+</option>
                  {course.duration &&
                    !["1h – 3h", "3h – 6h", "6h – 10h", "10h+"].includes(
                      course.duration
                    ) && (
                      <option value={course.duration}>{course.duration}</option>
                    )}
                </NativeSelect>
              </Field>

              <Field label="Tags" hint="Comma-separated">
                <Input
                  {...register("tags")}
                  placeholder="react, javascript, hooks"
                />
              </Field>
            </div>

            <Field
              label="What You'll Learn"
              hint="One outcome per line — shown on the course preview page"
            >
              <Textarea
                {...register("learningOutcomes")}
                placeholder={
                  "Understand core concepts and practical applications\nBuild real-world projects from scratch\nApply best practices used in production\nGain hands-on experience with modern tooling"
                }
                className="min-h-28"
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

            {modules.length === 0 ? (
              <div className="flex flex-col items-center justify-center border border-dashed border-border py-14 text-center">
                <BookOpenIcon className="mb-2 size-7 text-muted-foreground" />
                <p className="text-sm font-medium">No modules yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add a module to start building your curriculum
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {modules.map((module) => (
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
                        <PencilSimpleIcon className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
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
                <Input {...register("duration")} placeholder="e.g. 8h 30m" />
              </Field>
            </div>

            <Separator />

            {/* Danger zone */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Danger Zone
              </p>
              <div className="flex flex-col gap-3 rounded border border-destructive/30 p-4">
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
                    className="hover:text-destructive-foreground border-destructive/50 text-destructive hover:bg-destructive"
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
          lessonSheet.moduleId &&
          lessonSheet.lesson &&
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
  onPublish: (course: Course) => void
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
        <Button size="sm" onClick={() => onPublish(course)}>
          <RocketIcon />
          Publish
        </Button>
      </div>

      {/* Hero section */}
      <div className="bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 px-6 py-10">
        <div className="max-w-3xl">
          <div className="mb-3 flex items-center gap-2">
            <Badge className="border-white/20 bg-white/10 text-white">
              {course.category}
            </Badge>
            <Badge className="border-white/20 bg-white/10 text-white">
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
              <span className="font-medium text-white">
                {course.instructor}
              </span>
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
      {course.learningOutcomes && course.learningOutcomes.trim() && (
        <div className="border-b border-border px-6 py-8">
          <div className="max-w-3xl">
            <h2 className="mb-4 text-sm font-semibold">
              What you&apos;ll learn
            </h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {course.learningOutcomes
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((point) => (
                  <div key={point} className="flex items-start gap-2">
                    <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                    <span className="text-xs text-muted-foreground">
                      {point}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

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
                        onClick={() =>
                          setExpandedLessonId(isExpanded ? null : lesson.id)
                        }
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
                          {lesson.type === "video" &&
                            (lesson.videoUrl ? (
                              (() => {
                                const embedUrl = getYoutubeEmbedUrl(
                                  lesson.videoUrl
                                )
                                return embedUrl ? (
                                  <iframe
                                    src={embedUrl}
                                    className="aspect-video w-full rounded"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                ) : (
                                  <video
                                    controls
                                    src={lesson.videoUrl}
                                    className="w-full rounded"
                                  />
                                )
                              })()
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No video uploaded yet.
                              </p>
                            ))}

                          {lesson.type === "article" &&
                            (lesson.articleContent ? (
                              <div className="text-sm whitespace-pre-wrap">
                                {lesson.articleContent}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No article content added yet.
                              </p>
                            ))}

                          {lesson.type === "quiz" && (
                            <div className="flex flex-col gap-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-md border border-border p-3">
                                  <p className="text-xs text-muted-foreground">
                                    Questions
                                  </p>
                                  <p className="text-lg font-semibold">
                                    {lesson.numQuestions ?? "—"}
                                  </p>
                                </div>
                                <div className="rounded-md border border-border p-3">
                                  <p className="text-xs text-muted-foreground">
                                    Passing Score
                                  </p>
                                  <p className="text-lg font-semibold">
                                    {lesson.passingScore != null
                                      ? `${lesson.passingScore}%`
                                      : "—"}
                                  </p>
                                </div>
                              </div>
                              {lesson.description && (
                                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                                  {lesson.description}
                                </p>
                              )}
                            </div>
                          )}

                          {lesson.type === "assignment" && (
                            <div className="flex flex-col gap-3">
                              {lesson.assignmentBrief ? (
                                <div className="text-sm whitespace-pre-wrap">
                                  {lesson.assignmentBrief}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  No brief added yet.
                                </p>
                              )}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-md border border-border p-3">
                                  <p className="text-xs text-muted-foreground">
                                    Max Score
                                  </p>
                                  <p className="text-lg font-semibold">
                                    {lesson.maxScore ?? "—"}
                                  </p>
                                </div>
                                <div className="rounded-md border border-border p-3">
                                  <p className="text-xs text-muted-foreground">
                                    Days to Complete
                                  </p>
                                  <p className="text-lg font-semibold">
                                    {lesson.daysToComplete ?? "—"}
                                  </p>
                                </div>
                              </div>
                            </div>
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
  onSubmit,
  onCancel,
}: {
  course: Course
  onSubmit: (data: PublishForm) => Promise<void>
  onCancel: () => void
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PublishForm>({
    resolver: zodResolver(publishSchema),
    defaultValues: { mode: "immediate", scheduleDate: "" },
  })

  const mode = watch("mode")

  async function onFormSubmit(data: PublishForm) {
    try {
      await onSubmit(data)
    } catch {
      setError("root", { message: "Failed to publish. Please try again." })
    }
  }

  return (
    <DialogContent showCloseButton={false}>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <DialogHeader>
          <DialogTitle>Publish Course</DialogTitle>
          <DialogDescription>
            Make &ldquo;{course.title}&rdquo; available to students.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 py-4">
          <RadioItem
            id="publish-immediate"
            label="Publish immediately"
            description="Students can access the course right away."
            checked={mode === "immediate"}
            onChange={() => setValue("mode", "immediate")}
          />
          <RadioItem
            id="publish-schedule"
            label="Schedule for later"
            description="Choose a date and time to publish."
            checked={mode === "schedule"}
            onChange={() => setValue("mode", "schedule")}
          />
          {mode === "schedule" && (
            <div className="px-1 pt-1">
              <Input type="datetime-local" {...register("scheduleDate")} />
              {errors.scheduleDate && (
                <p className="mt-0.5 text-xs text-destructive">
                  {errors.scheduleDate.message}
                </p>
              )}
            </div>
          )}
          {errors.root && (
            <p className="mt-0.5 text-xs text-destructive">
              {errors.root.message}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            <CheckCircleIcon />
            {mode === "immediate" ? "Publish Now" : "Schedule"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

// ============ EDIT PAGE CONTENT ============

function EditPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id") ?? ""

  const isNew = /^c\d{10,}$/.test(id)

  const { data: apiCourse, isLoading } = useSWR<Course>(
    !isNew && id ? `/api/courses/${id}` : null,
    (url: string) =>
      fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r)))
  )

  const course = isNew ? coursesStore.getById(id) : apiCourse

  const { mutate } = useSWRConfig()

  const { trigger: publishNew } = useSWRMutation(
    "/api/courses",
    async (
      url,
      { arg }: { arg: { mode: string; scheduleDate?: string; course: Course } }
    ) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: arg.course.title,
          description: arg.course.description,
          instructor: arg.course.instructor,
          duration: arg.course.duration,
          students: arg.course.students,
          category: arg.course.category,
          level: arg.course.level,
          price: arg.course.price,
          tags: arg.course.tags,
          thumbnail: arg.course.thumbnail,
          learningOutcomes: arg.course.learningOutcomes,
          status: arg.mode === "immediate" ? "published" : "draft",
          modules: arg.course.modules.map((m) => ({
            title: m.title,
            lessons: m.lessons.map((l) => ({ ...l })),
          })),
        }),
      })
      if (!res.ok) throw new Error("Failed to publish course")
      return (await res.json()) as Course
    }
  )

  const { trigger: publishExisting } = useSWRMutation(
    id && !isNew ? `/api/courses/${id}` : null,
    async (
      url,
      { arg }: { arg: { mode: string; scheduleDate?: string; course: Course } }
    ) => {
      console.log(url)
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: arg.course.title,
          description: arg.course.description,
          instructor: arg.course.instructor,
          duration: arg.course.duration,
          students: arg.course.students,
          category: arg.course.category,
          level: arg.course.level,
          price: arg.course.price,
          tags: arg.course.tags,
          thumbnail: arg.course.thumbnail,
          learningOutcomes: arg.course.learningOutcomes,
          status: arg.mode === "immediate" ? "published" : "draft",
          modules: arg.course.modules.map((m) => ({
            title: m.title,
            lessons: m.lessons.map((l) => ({ ...l })),
          })),
        }),
      })
      if (!res.ok) throw new Error("Failed to publish course")
      return res.json() as Promise<Course>
    }
  )

  const [view, setView] = useState<"editor" | "preview">("editor")
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [courseToPublish, setCourseToPublish] = useState<Course | null>(null)
  const [courseForPreview, setCourseForPreview] = useState<Course | null>(null)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Course not found.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/courses")}
        >
          <ArrowLeftIcon />
          Back to Courses
        </Button>
      </div>
    )
  }

  function openPublishDialog(updated: Course) {
    setCourseToPublish(updated)
    setPublishDialogOpen(true)
  }

  async function handleSubmitPublish(data: PublishForm) {
    const target = courseToPublish ?? course
    if (!target) return
    if (isNew) {
      await publishNew({
        mode: data.mode,
        scheduleDate: data.scheduleDate,
        course: target,
      })
      coursesStore.delete(id)
    } else {
      await publishExisting({
        mode: data.mode,
        scheduleDate: data.scheduleDate,
        course: target,
      })
    }
    await mutate("/api/courses")
    setPublishDialogOpen(false)
    router.push("/courses")
  }

  return (
    <div className="min-h-screen bg-background">
      {view === "editor" && (
        <CourseEditor
          course={course}
          onBack={() => router.push("/courses")}
          onPreview={(updated) => { setCourseForPreview(updated); setView("preview") }}
          onPublish={openPublishDialog}
        />
      )}

      {view === "preview" && (
        <CoursePreview
          course={courseForPreview ?? course}
          onBack={() => setView("editor")}
          onPublish={openPublishDialog}
        />
      )}

      <Dialog
        open={publishDialogOpen}
        onOpenChange={(open) => !open && setPublishDialogOpen(false)}
      >
        {publishDialogOpen && (
          <PublishDialog
            course={course}
            onSubmit={handleSubmitPublish}
            onCancel={() => setPublishDialogOpen(false)}
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
