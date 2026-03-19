"use client"

import { type Interrupt, type Message, type ToolCallWithResult, type UseAgentStream } from "@langchain/langgraph-sdk"
import { useStream } from "@langchain/langgraph-sdk/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { mutate as swrMutate } from "swr"

export type PageContext = {
  path: string
  pageTitle?: string
  courseId?: string
  courseTitle?: string
  modulesCount?: number
  lessonsCount?: number
  courseStatus?: string
}

type GuideStep = {
  id: string
  title: string
  description: string
  status: "pending" | "active" | "completed"
}

type AgentState = {
  messages: unknown[]
  guide_steps: GuideStep[]
  current_step_id: string | null
  course_id: string | null
  page_context?: PageContext
}

const THREAD_STORAGE_KEY = "course_builder_thread_id"

function deriveToolCalls(messages: Message[]): ToolCallWithResult[] {
  const result: ToolCallWithResult[] = []
  const toolMsgMap = new Map<string, Message>()
  for (const msg of messages) {
    if (msg.type === "tool" && "tool_call_id" in msg) {
      toolMsgMap.set(msg.tool_call_id as string, msg)
    }
  }
  for (const msg of messages) {
    if (msg.type !== "ai") continue
    const toolCalls = (msg as { tool_calls?: Array<{ id: string; name: string; args: Record<string, unknown> }> }).tool_calls
    if (!toolCalls?.length) continue
    for (let index = 0; index < toolCalls.length; index++) {
      const call = toolCalls[index]
      if (!call) continue
      const resultMsg = toolMsgMap.get(call.id)
      result.push({
        id: call.id,
        call,
        result: resultMsg as ToolCallWithResult["result"],
        aiMessage: msg as ToolCallWithResult["aiMessage"],
        index,
        state: resultMsg ? "completed" : "pending",
      })
    }
  }
  return result
}

type UseAgentReturn = {
  messages: Message[]
  guideSteps: GuideStep[]
  currentStepId: string | null
  courseId: string | null
  isLoading: boolean
  interrupt: Interrupt | undefined
  toolCalls: ToolCallWithResult[]
  threadExists: boolean
  sendMessage: (text: string, pageContext: PageContext) => void
  resumeWithApproval: () => void
  resumeWithRejection: () => void
  resumeWithEdit: (args: Record<string, unknown>) => void
}

export function useAgent(): UseAgentReturn {
  const [threadId, setThreadId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem(THREAD_STORAGE_KEY)
  })

  const [threadExists] = useState(() => {
    if (typeof window === "undefined") return false
    return !!localStorage.getItem(THREAD_STORAGE_KEY)
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

  // Revalidate all course SWR keys when the agent finishes loading
  const prevLoadingRef = useRef(false)
  useEffect(() => {
    if (prevLoadingRef.current && !stream.isLoading) {
      swrMutate(
        (key: unknown) => typeof key === "string" && key.startsWith("/api/courses"),
        undefined,
        { revalidate: true }
      )
    }
    prevLoadingRef.current = stream.isLoading
  }, [stream.isLoading])

  const agentStream = stream as unknown as UseAgentStream<AgentState>
  const messages = stream.messages
  const toolCalls = useMemo(
    () => agentStream.toolCalls ?? deriveToolCalls(messages),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [agentStream.toolCalls, messages]
  )

  const sendMessage = useCallback(
    (text: string, pageContext: PageContext) => {
      stream.submit({
        messages: [{ type: "human", content: text }],
        page_context: pageContext,
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

  const resumeWithEdit = useCallback(
    (args: Record<string, unknown>) => {
      stream.submit(null, { command: { resume: { action: "edit", args } } })
    },
    [stream]
  )

  return {
    messages: stream.messages,
    guideSteps: stream.values.guide_steps ?? [],
    currentStepId: stream.values.current_step_id ?? null,
    courseId: stream.values.course_id ?? null,
    isLoading: stream.isLoading,
    interrupt: stream.interrupt,
    toolCalls,
    threadExists,
    sendMessage,
    resumeWithApproval,
    resumeWithRejection,
    resumeWithEdit,
  }
}
