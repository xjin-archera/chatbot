"use client"

import { type Interrupt } from "@langchain/langgraph-sdk"
import { motion } from "motion/react"
import { Fragment, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"

type ProposedAction = {
  tool: string
  args: Record<string, unknown>
}

type ConfirmationPayload = {
  type?: string
  proposed_actions?: ProposedAction[]
}

type ConfirmationCardProps = {
  interrupt: Interrupt
  onApprove: () => void
  onReject: () => void
  onEdit: (editedArgs: Record<string, unknown>) => void
}

function humanize(str: string): string {
  return str
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function flattenArgs(
  args: Record<string, unknown>,
  prefix = ""
): Array<[string, string]> {
  const result: Array<[string, string]> = []
  for (const [key, value] of Object.entries(args)) {
    if (value == null) continue
    const fullKey = prefix ? `${prefix}_${key}` : key
    if (typeof value === "object" && !Array.isArray(value)) {
      result.push(...flattenArgs(value as Record<string, unknown>, fullKey))
    } else if (Array.isArray(value)) {
      result.push([fullKey, value.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v))).join(", ")])
    } else {
      result.push([fullKey, String(value)])
    }
  }
  return result
}

function parseActions(interrupt: Interrupt): ProposedAction[] {
  const raw = interrupt.value
  console.log("interrupt.value:", JSON.stringify(raw, null, 2))

  let payload: unknown = raw
  if (Array.isArray(payload)) {
    payload = payload[0]
  }

  if (payload && typeof payload === "object" && "proposed_actions" in payload) {
    return (payload as ConfirmationPayload).proposed_actions ?? []
  }

  if (payload && typeof payload === "object" && "tool" in payload) {
    return [payload as ProposedAction]
  }

  console.warn("Could not parse interrupt payload:", raw)
  return []
}

export function ConfirmationCard({ interrupt, onApprove, onReject, onEdit }: ConfirmationCardProps) {
  const actions = parseActions(interrupt)
  const [mode, setMode] = useState<"review" | "editing">("review")
  const [editedArgs, setEditedArgs] = useState<Record<string, Record<string, string>>>({})

  function enterEditMode() {
    const initial: Record<string, Record<string, string>> = {}
    for (const action of actions) {
      initial[action.tool] = Object.fromEntries(flattenArgs(action.args))
    }
    setEditedArgs(initial)
    setMode("editing")
  }

  function handleSaveAndApprove() {
    const merged: Record<string, unknown> = {}
    for (const argsMap of Object.values(editedArgs)) {
      Object.assign(merged, argsMap)
    }
    onEdit(merged)
  }

  if (mode === "editing") {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-amber-300 bg-amber-50/80 dark:bg-amber-950/20 dark:border-amber-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">✏️ Edit Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {actions.map((action, i) => (
              <div key={action.tool} className="flex flex-col gap-3">
                {i > 0 && <Separator />}
                <p className="text-xs font-semibold text-muted-foreground">{humanize(action.tool)}</p>
                {flattenArgs(action.args).map(([key]) => (
                  <div key={key} className="flex flex-col gap-1">
                    <Label className="text-xs">{humanize(key)}</Label>
                    <Input
                      className="text-xs"
                      value={editedArgs[action.tool]?.[key] ?? ""}
                      onChange={(e) =>
                        setEditedArgs((prev) => ({
                          ...prev,
                          [action.tool]: {
                            ...prev[action.tool],
                            [key]: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex gap-2 pt-2">
            <Button size="sm" variant="default" onClick={handleSaveAndApprove}>
              💾 Save & Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setMode("review")
                setEditedArgs({})
              }}
            >
              Cancel
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-amber-300 bg-amber-50/80 dark:bg-amber-950/20 dark:border-amber-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">⚡ Confirm Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {actions.map((action, i) => (
            <div key={action.tool} className="flex flex-col gap-2">
              {i > 0 && <Separator />}
              <p className="text-xs font-semibold text-muted-foreground">{humanize(action.tool)}</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                {flattenArgs(action.args).map(([key, value]) => (
                  <Fragment key={key}>
                    <dt className="text-xs font-medium text-muted-foreground">
                      {humanize(key)}
                    </dt>
                    <dd className="text-xs break-all">
                      {value}
                    </dd>
                  </Fragment>
                ))}
              </dl>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex gap-2 pt-2">
          <Button size="sm" variant="default" onClick={onApprove}>
            ✅ Approve
          </Button>
          <Button size="sm" variant="outline" onClick={enterEditMode}>
            ✏️ Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50"
            onClick={onReject}
          >
            ❌ Reject
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
