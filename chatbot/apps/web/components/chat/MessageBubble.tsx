"use client"

import { type Message, type ToolCallWithResult } from "@langchain/langgraph-sdk"
import { motion } from "motion/react"
import { Markdown } from "@/components/chat/Markdown"
import { SuggestionChips } from "@/components/chat/SuggestionChips"
import { ToolCallCard } from "@/components/chat/ToolCallCard"

type AiToolCall = { id: string; name: string; args: Record<string, unknown> }

type MessageBubbleProps = {
  msg: Message
  toolCalls?: ToolCallWithResult[]
  onSuggestionSelect?: (text: string) => void
  isLatest?: boolean
}

function getTextContent(content: Message["content"]): string {
  if (typeof content === "string") return content
  return content
    .filter((c) => c.type === "text")
    .map((c) => (c as { type: "text"; text: string }).text)
    .join("")
}

export function MessageBubble({ msg, toolCalls, onSuggestionSelect, isLatest }: MessageBubbleProps) {
  if (msg.type === "ai") {
    const text = getTextContent(msg.content)
    const aiToolCalls = (msg.tool_calls as AiToolCall[] | undefined) ?? []
    const messageToolCalls =
      toolCalls?.filter((tc) => aiToolCalls.find((t) => t.id === tc.call.id)) ?? []

    const suggestCall = aiToolCalls.find((tc) => tc.name === "suggest_options")
    const suggestions = suggestCall?.args as
      | { options: string[]; prompt_text: string; field_name: string }
      | undefined

    const visibleToolCalls = messageToolCalls.filter((tc) => tc.call.name !== "suggest_options")

    if (!text.trim() && visibleToolCalls.length === 0 && !suggestions) return null

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
        {visibleToolCalls.map((tc) => (
          <ToolCallCard key={tc.call.id} toolCall={tc} />
        ))}
        {suggestions && suggestions.options?.length > 0 && (
          <SuggestionChips
            options={suggestions.options}
            promptText={suggestions.prompt_text}
            onSelect={(option) => onSuggestionSelect?.(option)}
            disabled={!isLatest}
          />
        )}
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
