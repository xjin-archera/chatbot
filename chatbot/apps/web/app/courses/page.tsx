"use client"

import {
  BookOpenIcon,
  ChartBarIcon,
  ClockIcon,
  DotsThreeVerticalIcon,
  FileTextIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
  WarningIcon,
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
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { useRouter } from "next/navigation"
import { useState } from "react"
import useSWR from "swr"

import useSWRMutation from "swr/mutation"

import { type Course, type CourseStatus, coursesStore } from "./store"

function CourseRowMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void
  onDelete: () => void
}) {
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null)

  function handleOpen(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setAnchor({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        className="flex items-center justify-center rounded p-1 hover:bg-muted"
        onClick={handleOpen}
        aria-label="Course options"
      >
        <DotsThreeVerticalIcon className="size-4" />
      </button>

      {anchor && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setAnchor(null)}
          />
          <div
            className="fixed z-20 w-36 rounded-md border bg-popover py-1 shadow-md"
            style={{ top: anchor.top, right: anchor.right }}
          >
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted"
              onClick={() => { setAnchor(null); onEdit() }}
            >
              <PencilSimpleIcon className="size-3.5" />
              Edit
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-muted"
              onClick={() => { setAnchor(null); onDelete() }}
            >
              <TrashIcon className="size-3.5" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function CoursesPage() {
  const router = useRouter()
  const { data: courses = [], isLoading, mutate } = useSWR<Course[]>("/api/courses", (url: string) => fetch(url).then((r) => r.json()))
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | CourseStatus>("all")
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null)

  const { trigger: deleteCourse, isMutating: isDeleting } = useSWRMutation(
    deleteTarget ? `/api/courses/${deleteTarget.id}` : null,
    async (url) => {
      const res = await fetch(url, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete course")
    }
  )

  const filtered = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === "all" || c.status === filter
    return matchesSearch && matchesFilter
  })

  const totalLessons = (course: Course) =>
    course.modules.reduce((acc, m) => acc + m.lessons.length, 0)

  function handleSelectCourse(course: Course) {
    router.push(`/courses/edit?id=${course.id}`)
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
    coursesStore.upsert(newCourse)
    router.push(`/courses/edit?id=${newCourse.id}`)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        {/* Header skeleton */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
            <div className="h-3 w-48 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-8 w-28 rounded bg-muted animate-pulse" />
        </div>
        {/* Skeleton cards */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border p-5 flex items-center gap-5">
            <div className="w-20 h-14 rounded-lg bg-muted animate-pulse shrink-0" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-3.5 w-1/3 rounded bg-muted animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
              <div className="h-3 w-1/4 rounded bg-muted animate-pulse" />
            </div>
            <div className="h-6 w-16 rounded bg-muted animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="flex flex-col gap-6 p-6">
        {/* Keep header so user can still create */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-base font-semibold">Courses</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Manage and publish your course content
            </p>
          </div>
          <Button onClick={handleNewCourse} size="sm">
            <PlusIcon />
            New Course
          </Button>
        </div>
        {/* Blank state */}
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <BookOpenIcon className="size-8 text-muted-foreground/60" />
          </div>
          <div>
            <p className="text-sm font-semibold">No courses yet</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs">
              Create your first course to start building and publishing content for your students.
            </p>
          </div>
          <Button onClick={handleNewCourse} size="sm">
            <PlusIcon />
            Create your first course
          </Button>
        </div>
      </div>
    )
  }

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
        <Button onClick={handleNewCourse} size="sm">
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

      {/* Course list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <MagnifyingGlassIcon className="size-8 text-muted-foreground/60" />
          <div>
            <p className="text-sm font-medium">No matching courses</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try adjusting your search or filter to find what you're looking for.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col space-y-3">
          {filtered.map((course) => (
            <Card
              key={course.id}
              className="cursor-pointer transition-all hover:ring-1 hover:ring-ring/30"
              onClick={() => handleSelectCourse(course)}
            >
              <div className="flex items-center gap-5 p-5">
                {/* Thumbnail */}
                <div className="w-20 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <BookOpenIcon className="size-6 text-muted-foreground/40" />
                </div>

                {/* Info */}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium leading-tight">
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

                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {course.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ChartBarIcon className="size-3" />
                      {course.modules.length} module{course.modules.length !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileTextIcon className="size-3" />
                      {totalLessons(course)} lesson{totalLessons(course) !== 1 ? "s" : ""}
                    </span>
                    <span>{course.level}</span>
                    {course.duration && (
                      <span className="flex items-center gap-1">
                        <ClockIcon className="size-3" />
                        {course.duration}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right column */}
                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    {course.price && (
                      <p className="text-sm font-medium">${course.price}</p>
                    )}
                    {course.students > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {course.students.toLocaleString()} students
                      </p>
                    )}
                  </div>
                  <CourseRowMenu
                    onEdit={() => handleSelectCourse(course)}
                    onDelete={() => setDeleteTarget(course)}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WarningIcon className="size-4 text-destructive" />
              Delete course
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.title || "this course"}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={async () => {
                await deleteCourse()
                await mutate()
                setDeleteTarget(null)
              }}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
