"use client"

import { type Interrupt, type Message, type ToolCallWithResult, type UseAgentStream } from "@langchain/langgraph-sdk"
import { useStream } from "@langchain/langgraph-sdk/react"
import { useCallback, useMemo, useState } from "react"

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
  page_context?: { path: string }
}

const THREAD_STORAGE_KEY = "course_builder_thread_id"

function deriveToolCalls(messages: Message[]): ToolCallWithResult[] {
  const result: ToolCallWithResult[] = []
  // Build a map of tool_call_id -> ToolMessage for quick lookup
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
  sendMessage: (text: string, pathname: string) => void
  resumeWithApproval: () => void
  resumeWithRejection: () => void
  resumeWithEdit: (args: Record<string, unknown>) => void
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

  const agentStream = stream as unknown as UseAgentStream<AgentState>
  const messages = stream.messages
  const toolCalls = useMemo(
    () => agentStream.toolCalls ?? deriveToolCalls(messages),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [agentStream.toolCalls, messages]
  )

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
    sendMessage,
    resumeWithApproval,
    resumeWithRejection,
    resumeWithEdit,
  }
}
