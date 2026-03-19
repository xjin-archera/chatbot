"use client"

import { type Message, type ToolCallWithResult } from "@langchain/langgraph-sdk"
import { motion } from "motion/react"
import { Markdown } from "@/components/chat/Markdown"
import { ToolCallCard } from "@/components/chat/ToolCallCard"

type MessageBubbleProps = {
  msg: Message
  toolCalls?: ToolCallWithResult[]
}

function getTextContent(content: Message["content"]): string {
  if (typeof content === "string") return content
  return content
    .filter((c) => c.type === "text")
    .map((c) => (c as { type: "text"; text: string }).text)
    .join("")
}

export function MessageBubble({ msg, toolCalls }: MessageBubbleProps) {
  if (msg.type === "ai") {
    const text = getTextContent(msg.content)
    const aiToolCallIds = (msg.tool_calls as Array<{ id: string }> | undefined) ?? []
    const messageToolCalls =
      toolCalls?.filter((tc) => aiToolCallIds.find((t) => t.id === tc.call.id)) ?? []

    if (!text.trim() && messageToolCalls.length === 0) return null

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-start gap-2"
      >
        {text.trim() && (
          <div className="max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
            <Markdown>{text}</Markdown>
          </div>
        )}
        {messageToolCalls.map((tc) => (
          <ToolCallCard key={tc.call.id} toolCall={tc} />
        ))}
      </motion.div>
    )
  }

  if (msg.type === "human") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
          {getTextContent(msg.content)}
        </div>
      </motion.div>
    )
  }

  return null
}
