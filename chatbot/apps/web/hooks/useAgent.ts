"use client"

import { type Interrupt, type Message } from "@langchain/langgraph-sdk"
import { useStream } from "@langchain/langgraph-sdk/react"
import { useCallback, useState } from "react"

type GuideStep = {
  id: string
  title: string
  description: string
  status: "pending" | "in_progress" | "done"
}

type AgentState = {
  messages: unknown[]
  guide_steps: GuideStep[]
  current_step_id: string | null
  course_id: string | null
  page_context?: { path: string }
}

const THREAD_STORAGE_KEY = "course_builder_thread_id"

type UseAgentReturn = {
  messages: Message[]
  guideSteps: GuideStep[]
  currentStepId: string | null
  courseId: string | null
  isLoading: boolean
  interrupt: Interrupt | undefined
  sendMessage: (text: string, pathname: string) => void
  resumeWithApproval: () => void
  resumeWithRejection: () => void
}

export function useAgent(): UseAgentReturn {
  const [threadId, setThreadId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem(THREAD_STORAGE_KEY)
  })

  const stream = useStream<AgentState>({
    apiUrl: "http://localhost:2024",
    assistantId: "course_builder",
    threadId,
    messagesKey: "messages",
    onThreadId: (id) => {
      setThreadId(id)
      localStorage.setItem(THREAD_STORAGE_KEY, id)
    },
  })

  console.log(stream.values.guide_steps)

  const sendMessage = useCallback(
    (text: string, pathname: string) => {
      stream.submit({
        messages: [{ type: "human", content: text }],
        page_context: { path: pathname },
      })
    },
    [stream]
  )

  const resumeWithApproval = useCallback(() => {
    stream.submit(null, { command: { resume: { action: "approve" } } })
  }, [stream])

  const resumeWithRejection = useCallback(() => {
    stream.submit(null, { command: { resume: { action: "reject" } } })
  }, [stream])

  return {
    messages: stream.messages,
    guideSteps: stream.values.guide_steps ?? [],
    currentStepId: stream.values.current_step_id ?? null,
    courseId: stream.values.course_id ?? null,
    isLoading: stream.isLoading,
    interrupt: stream.interrupt,
    sendMessage,
    resumeWithApproval,
    resumeWithRejection,
  }
}
