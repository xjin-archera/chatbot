"use client"

import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"
import { ChatPanel } from "./chat/ChatPanel"
import { Navbar } from "./Navbar"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar chatOpen={chatOpen} onToggleChat={() => setChatOpen((v) => !v)} />

      {/* Content row below navbar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main area — shrinks when chat opens */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* Chat panel — animates in/out from the right */}
        <AnimatePresence initial={false}>
          {chatOpen && (
            <motion.div
              key="chat"
              className="flex w-[400px] shrink-0 flex-col border-l bg-background"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 250 }}
            >
              <ChatPanel onClose={() => setChatOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
