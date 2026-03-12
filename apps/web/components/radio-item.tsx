import { cn } from "@workspace/ui/lib/utils"

export function RadioItem({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string
  label: string
  description?: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded border p-3 transition-colors",
        checked
          ? "border-ring/50 bg-muted/40"
          : "border-border hover:bg-muted/20"
      )}
    >
      <input
        type="radio"
        id={id}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 accent-primary"
      />
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium">{label}</span>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </div>
    </label>
  )
}
