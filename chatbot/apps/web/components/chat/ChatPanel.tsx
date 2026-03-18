"use client"

import { PaperPlaneTiltIcon, XIcon } from "@phosphor-icons/react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useAgent } from "@/hooks/useAgent"

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const pathname = usePathname()
  const { messages, isLoading, sendMessage } = useAgent()
  const [draft, setDraft] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handleSend() {
    const text = draft.trim()
    if (!text || isLoading) return
    sendMessage(text, pathname)
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

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground">
            Ask anything about your courses.
          </p>
        )}
        {messages.map((msg, i) => {
          const isHuman = msg.type === "human"
          const content =
            typeof msg.content === "string"
              ? msg.content
              : JSON.stringify(msg.content)
          return (
            <div
              key={msg.id ?? i}
              className={`flex ${isHuman ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  isHuman
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {content}
              </div>
            </div>
          )
        })}
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
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <Button size="sm" disabled={!draft.trim() || isLoading} onClick={handleSend}>
          <PaperPlaneTiltIcon className="size-4" />
        </Button>
      </div>
    </>
  )
}
