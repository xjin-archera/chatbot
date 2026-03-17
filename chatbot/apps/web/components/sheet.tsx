"use client"

import { XIcon } from "@phosphor-icons/react"
import { Button } from "@workspace/ui/components/button"

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  if (!open) return null

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l bg-background"
        style={{ animation: "slideIn 0.2s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3.5">
          <span className="text-sm font-semibold">{title}</span>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <XIcon />
          </Button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </>
  )
}
