"use client"

import { PaperPlaneTiltIcon, XIcon } from "@phosphor-icons/react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { type Course } from "@/app/courses/store"
import { useAgent, type PageContext } from "@/hooks/useAgent"
import { ConfirmationCard } from "@/components/chat/ConfirmationCard"
import { GuideStepper } from "@/components/chat/GuideStepper"
import { MessageBubble } from "@/components/chat/MessageBubble"

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    guideSteps,
    currentStepId,
    courseId,
    interrupt,
    resumeWithApproval,
    resumeWithRejection,
    resumeWithEdit,
    toolCalls,
    threadExists,
  } = useAgent()

  const [draft, setDraft] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const wasAutoStarted = useRef(false)

  // Fetch current course if on edit page
  const editingCourseId = searchParams.get("id")
  const { data: currentCourse } = useSWR<Course>(
    editingCourseId ? `/api/courses/${editingCourseId}` : null,
    (url: string) => fetch(url).then((r) => r.json())
  )

  function buildPageContext(): PageContext {
    const ctx: PageContext = {
      path: pathname,
      pageTitle: typeof document !== "undefined" ? document.title : "",
    }
    if (currentCourse) {
      ctx.courseId = currentCourse.id
      ctx.courseTitle = currentCourse.title
      ctx.modulesCount = currentCourse.modules?.length ?? 0
      ctx.lessonsCount =
        currentCourse.modules?.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0) ?? 0
      ctx.courseStatus = currentCourse.status
    } else if (courseId) {
      ctx.courseId = courseId
    }
    return ctx
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-start on first open (no existing thread)
  const hasInitialized = useRef(false)
  useEffect(() => {
    if (!hasInitialized.current && messages.length === 0 && !isLoading && !threadExists) {
      hasInitialized.current = true
      wasAutoStarted.current = true
      sendMessage("Hi, I'd like to create a new course", buildPageContext())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, isLoading, threadExists])

  // Auto-navigate after course creation
  const prevCourseIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (courseId && courseId !== prevCourseIdRef.current) {
      prevCourseIdRef.current = courseId
      setTimeout(() => {
        router.push(`/courses/edit?id=${courseId}`)
      }, 500)
    }
  }, [courseId, router])

  // Auto-navigate based on active step
  const prevStepRef = useRef<string | null>(null)
  useEffect(() => {
    if (currentStepId && currentStepId !== prevStepRef.current) {
      const prevStep = prevStepRef.current
      prevStepRef.current = currentStepId
      if (!prevStep) return
      if (courseId) {
        switch (currentStepId) {
          case "add_module":
          case "add_lesson":
          case "publish":
            if (pathname !== "/courses/edit" || searchParams.get("id") !== courseId) {
              router.push(`/courses/edit?id=${courseId}`)
            }
            break
        }
      }
    }
  }, [currentStepId, courseId, router, pathname, searchParams])

  function handleSend() {
    const text = draft.trim()
    if (!text || isLoading) return
    sendMessage(text, buildPageContext())
    setDraft("")
  }

  return (
    <>
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <p className="text-sm font-semibold">Course Assistant</p>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted"
          aria-label="Close chat"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      {/* Guide stepper */}
      <GuideStepper
        guideSteps={guideSteps}
        currentStepId={currentStepId}
        onStepClick={(_, stepTitle) =>
          sendMessage(`I'd like to work on: ${stepTitle}`, buildPageContext())
        }
      />
      {guideSteps.length > 0 && <div className="shrink-0 border-t" />}

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground">
            Ask anything about your courses.
          </p>
        )}
        {!!error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Something went wrong. Please try again.
          </div>
        )}
        {(() => {
          const filtered = messages.filter((msg, i) => {
            if (msg.type === "tool") return false
            // Hide the silent auto-start human message
            if (wasAutoStarted.current && i === 0 && msg.type === "human") return false
            return true
          })
          return filtered.map((msg, i) => {
            const hasHumanAfter = filtered.slice(i + 1).some((m) => m.type === "human")
            return (
              <MessageBubble
                key={msg.id ?? i}
                msg={msg}
                toolCalls={toolCalls}
                onSuggestionSelect={(text) => sendMessage(text, buildPageContext())}
                isLatest={!hasHumanAfter}
              />
            )
          })
        })()}
        {interrupt && (
          <ConfirmationCard
            interrupt={interrupt}
            onApprove={resumeWithApproval}
            onReject={resumeWithRejection}
            onEdit={resumeWithEdit}
          />
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-muted px-3 py-2">
              <span className="flex gap-1 text-muted-foreground">
                <span className="animate-bounce [animation-delay:0ms]">·</span>
                <span className="animate-bounce [animation-delay:150ms]">·</span>
                <span className="animate-bounce [animation-delay:300ms]">·</span>
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="flex shrink-0 items-center gap-2 border-t p-3">
        <Input
          className="flex-1 text-sm"
          placeholder="Type a message…"
          value={draft}
          disabled={!!interrupt}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <Button size="sm" disabled={!draft.trim() || isLoading || !!interrupt} onClick={handleSend}>
          <PaperPlaneTiltIcon className="size-4" />
        </Button>
      </div>
    </>
  )
}
