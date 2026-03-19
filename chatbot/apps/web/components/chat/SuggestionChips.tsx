"use client"

import { motion } from "motion/react"
import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"

type SuggestionChipsProps = {
  options: string[]
  promptText: string
  onSelect: (option: string) => void
  disabled?: boolean
}

export function SuggestionChips({ options, onSelect, disabled }: SuggestionChipsProps) {
  const [selected, setSelected] = useState<string | null>(null)

  function handleSelect(option: string) {
    if (disabled || selected !== null) return
    setSelected(option)
    onSelect(option)
  }

  return (
    <motion.div
      className="w-full max-w-[85%] px-12"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
        <CarouselContent className="-ml-2">
          {options.map((option) => {
            const isSelected = selected === option
            const isDisabled = disabled || (selected !== null && !isSelected)

            return (
              <CarouselItem key={option} className="pl-2 basis-full">
                <Button
                  size="sm"
                  variant={isSelected ? "default" : "outline"}
                  disabled={isDisabled}
                  onClick={() => handleSelect(option)}
                  className="w-full text-xs overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  <span className="block overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {option}
                  </span>
                </Button>
              </CarouselItem>
            )
          })}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </motion.div>
  )
}
