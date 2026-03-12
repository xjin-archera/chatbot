"use client"

import {
  BookOpenIcon,
  ChartBarIcon,
  ClockIcon,
  FileTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@phosphor-icons/react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { type Course, type CourseStatus, coursesStore, useCourses } from "./store"

export default function CoursesPage() {
  const router = useRouter()
  const courses = useCourses()
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
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpenIcon className="mb-3 size-8 text-muted-foreground" />
          <p className="text-sm font-medium">No courses found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try adjusting your search or filter
          </p>
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
                <div className="shrink-0 text-right">
                  {course.price && (
                    <p className="text-sm font-medium">${course.price}</p>
                  )}
                  {course.students > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {course.students.toLocaleString()} students
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
