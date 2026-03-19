"use client"

import { type Message } from "@langchain/langgraph-sdk"
import { motion } from "motion/react"
import { Markdown } from "@/components/chat/Markdown"

function getTextContent(content: Message["content"]): string {
  if (typeof content === "string") return content
  return content
    .filter((c) => c.type === "text")
    .map((c) => (c as { type: "text"; text: string }).text)
    .join("")
}

export function MessageBubble({ msg }: { msg: Message }) {
  if (msg.type === "ai") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-start"
      >
        <div className="max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
          <Markdown>{getTextContent(msg.content)}</Markdown>
        </div>
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
