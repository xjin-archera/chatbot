"use client"

import { useState } from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable"
import { ChatPanel } from "./chat/ChatPanel"
import { Navbar } from "./Navbar"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar chatOpen={chatOpen} onToggleChat={() => setChatOpen((v) => !v)} />

      {/* Content row below navbar */}
      {chatOpen ? (
        <ResizablePanelGroup orientation="horizontal" className="flex-1 overflow-hidden">
          <ResizablePanel defaultSize="65%">
            <div className="h-full overflow-y-auto">{children}</div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize="35%" minSize="20%" maxSize="50%" className="border-l bg-background">
            <div className="flex h-full flex-col overflow-hidden">
              <ChatPanel onClose={() => setChatOpen(false)} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="flex-1 overflow-y-auto">{children}</div>
      )}
    </div>
  )
}
