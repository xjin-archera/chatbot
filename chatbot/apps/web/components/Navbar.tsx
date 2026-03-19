"use client"

import { DesktopIcon, MoonIcon, RobotIcon, SunIcon } from "@phosphor-icons/react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

const THEME_CYCLE = ["system", "light", "dark"] as const
type Theme = (typeof THEME_CYCLE)[number]

const THEME_ICONS: Record<Theme, React.ReactNode> = {
  system: <DesktopIcon className="size-4" />,
  light: <SunIcon className="size-4" />,
  dark: <MoonIcon className="size-4" />,
}

const THEME_LABELS: Record<Theme, string> = {
  system: "System theme",
  light: "Light theme",
  dark: "Dark theme",
}

export function Navbar({
  chatOpen,
  onToggleChat,
}: {
  chatOpen: boolean
  onToggleChat: () => void
}) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  function cycleTheme() {
    const current = (theme ?? "system") as Theme
    const idx = THEME_CYCLE.indexOf(current)
    const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length]!
    setTheme(next)
  }

  const currentTheme = (theme ?? "system") as Theme

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-4">
      <span className="text-sm font-semibold">Course Builder</span>
      <div className="flex items-center gap-1">
        <button
          onClick={cycleTheme}
          aria-label={mounted ? THEME_LABELS[currentTheme] : "Toggle theme"}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {mounted && THEME_ICONS[currentTheme]}
        </button>
        <button
          onClick={onToggleChat}
          aria-label="Toggle chat"
          className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted ${chatOpen ? "bg-muted text-foreground" : "text-muted-foreground"}`}
        >
          <RobotIcon className="size-5" />
        </button>
      </div>
    </header>
  )
}
