"use client"

import { type Spec, JSONUIProvider, Renderer } from "@json-render/react"
import { motion } from "motion/react"
import { registry } from "./registry"

type CoursePreviewRendererProps = {
  spec: { root: string; elements: Record<string, unknown> }
  isLoading?: boolean
}

export function CoursePreviewRenderer({ spec, isLoading }: CoursePreviewRendererProps) {
  const safeSpec = (() => {
    if (!spec?.root || !spec?.elements) return null
    const rootEl = spec.elements[spec.root] as { type?: string; props?: unknown } | undefined
    if (!rootEl?.type || rootEl?.props == null) return null

    const safeElements: Record<string, unknown> = {}
    for (const [key, el] of Object.entries(spec.elements)) {
      const element = el as { type?: string; props?: unknown } | undefined
      if (element?.type && element?.props != null) {
        safeElements[key] = element
      }
    }
    return { root: spec.root, elements: safeElements } as unknown as Spec
  })()

  if (!safeSpec) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-2 max-w-[90%]"
    >
      <JSONUIProvider registry={registry}>
        <Renderer spec={safeSpec} registry={registry} loading={isLoading} />
      </JSONUIProvider>
    </motion.div>
  )
}
