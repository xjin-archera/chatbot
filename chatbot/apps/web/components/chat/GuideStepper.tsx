"use client"

import { CaretDownIcon, CheckCircleIcon, CircleIcon } from "@phosphor-icons/react"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"

type GuideStep = {
  id: string
  title: string
  description: string
  status: "pending" | "active" | "completed"
}

type Props = {
  guideSteps: GuideStep[]
  currentStepId: string | null
  onStepClick: (stepId: string, stepTitle: string) => void
}

export function GuideStepper({ guideSteps, currentStepId, onStepClick }: Props) {
  const [open, setOpen] = useState(true)

  if (guideSteps.length === 0) return null

  const doneCount = guideSteps.filter((s) => s.status === "completed").length
  const activeStep = guideSteps.find(
    (s) => s.status === "active" || s.id === currentStepId
  )

  return (
    <div>
      {/* Header row — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-muted/50"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">Guide</span>
          <span className="text-xs text-muted-foreground">
            {doneCount}/{guideSteps.length}
          </span>
          {!open && activeStep && (
            <span className="max-w-[140px] truncate text-xs text-muted-foreground">
              · {activeStep.title}
            </span>
          )}
        </div>
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className="text-muted-foreground"
        >
          <CaretDownIcon className="size-3.5" />
        </motion.span>
      </button>

      {/* Collapsible step list */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="steps"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex max-h-44 flex-col overflow-y-auto px-4 pb-3 pt-1">
              {guideSteps.map((step, index) => {
                const isDone = step.status === "completed"
                const isActive =
                  step.status === "active" || step.id === currentStepId

                const clickable = isDone || isActive

                return (
                  <motion.div
                    layout
                    key={step.id}
                    className={`-mx-2 flex gap-2.5 rounded-md px-2 py-0.5 ${
                      clickable
                        ? "cursor-pointer"
                        : "cursor-not-allowed opacity-60"
                    }`}
                    whileHover={clickable ? { backgroundColor: "hsl(var(--muted) / 0.6)" } : {}}
                    onClick={clickable ? () => onStepClick(step.id, step.title) : undefined}
                  >
                    {/* Spine */}
                    <div className="flex flex-col items-center">
                      <div className="mt-0.5 shrink-0">
                        {isDone ? (
                          <CheckCircleIcon
                            className="size-4 text-green-500"
                            weight="fill"
                          />
                        ) : isActive ? (
                          <span className="relative flex size-4 items-center justify-center">
                            <span className="absolute inline-flex size-3 animate-ping rounded-full bg-indigo-400 opacity-60" />
                            <span className="relative inline-flex size-2 rounded-full bg-indigo-500" />
                          </span>
                        ) : (
                          <CircleIcon className="size-4 text-muted-foreground/40" />
                        )}
                      </div>
                      {index < guideSteps.length - 1 && (
                        <div
                          className="mt-1 w-px flex-1 bg-border"
                          style={{ minHeight: 8 }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="pb-3">
                      <p
                        className={`text-xs font-medium leading-4 ${
                          isDone
                            ? "text-muted-foreground line-through"
                            : isActive
                              ? "text-foreground"
                              : "text-muted-foreground"
                        }`}
                      >
                        <span className="mr-1 text-muted-foreground/50">
                          {index + 1}.
                        </span>
                        {step.title}
                      </p>
                      <AnimatePresence initial={false}>
                        {isActive && step.description && (
                          <motion.p
                            key="desc"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-0.5 overflow-hidden text-xs text-muted-foreground"
                          >
                            {step.description}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
