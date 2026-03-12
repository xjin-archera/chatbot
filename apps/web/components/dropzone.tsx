"use client"

import { UploadIcon } from "@phosphor-icons/react"
import { useCallback, useState } from "react"
import { useDropzone, type Accept } from "react-dropzone"

import { cn } from "@workspace/ui/lib/utils"

export function DropZone({
  label,
  accept,
  maxSize,
  className,
  onFiles,
}: {
  label: string
  accept?: Accept
  maxSize?: number
  className?: string
  onFiles?: (files: File[]) => void
}) {
  const [accepted, setAccepted] = useState<File[]>([])

  const onDrop = useCallback(
    (files: File[]) => {
      setAccepted(files)
      onFiles?.(files)
    },
    [onFiles]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-border text-muted-foreground transition-colors",
        isDragActive
          ? "border-ring/60 bg-muted/30"
          : "hover:border-ring/50 hover:bg-muted/20",
        className
      )}
    >
      <input {...getInputProps()} />
      <UploadIcon className="size-4" />
      {accepted.length > 0 ? (
        <p className="max-w-full truncate px-2 text-xs font-medium text-foreground">
          {accepted.map((f) => f.name).join(", ")}
        </p>
      ) : (
        <p className="text-xs">
          {isDragActive ? "Drop here…" : label}
        </p>
      )}
    </div>
  )
}
