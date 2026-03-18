"use client"

import { PaperPlaneTiltIcon, XIcon } from "@phosphor-icons/react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { useState } from "react"

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState("")

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

      {/* Messages — scrollable, fills remaining height */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        <p className="text-center text-xs text-muted-foreground">
          Ask anything about your courses.
        </p>
      </div>

      {/* Input row */}
      <div className="flex shrink-0 items-center gap-2 border-t p-3">
        <Input
          className="flex-1 text-sm"
          placeholder="Type a message…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && message.trim()) {
              e.preventDefault()
              // TODO: send message
              setMessage("")
            }
          }}
        />
        <Button size="sm" disabled={!message.trim()}>
          <PaperPlaneTiltIcon className="size-4" />
        </Button>
      </div>
    </>
  )
}
