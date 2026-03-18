import { RobotIcon } from "@phosphor-icons/react"

export function Navbar({
  chatOpen,
  onToggleChat,
}: {
  chatOpen: boolean
  onToggleChat: () => void
}) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-4">
      <span className="text-sm font-semibold">Course Builder</span>
      <button
        onClick={onToggleChat}
        aria-label="Toggle chat"
        className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted ${chatOpen ? "bg-muted text-foreground" : "text-muted-foreground"}`}
      >
        <RobotIcon className="size-5" />
      </button>
    </header>
  )
}
