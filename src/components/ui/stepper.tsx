import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "../../lib/utils"

export interface StepperProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("flex w-full items-center", className)}>
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const isCompleted = stepNumber < currentStep
        const isCurrent = stepNumber === currentStep

        return (
          <React.Fragment key={step}>
            <div className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-full border-2 text-sm font-semibold transition-colors",
                    isCompleted && "border-brand-500 bg-brand-500 text-white",
                    // Active step should be visually prominent.
                    isCurrent && "border-brand-500 bg-brand-500 text-white",
                    !isCompleted && !isCurrent && "border-grayScale-300 bg-white text-grayScale-400",
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : stepNumber}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium",
                    isCurrent && "text-brand-600",
                    !isCurrent && "text-grayScale-500",
                  )}
                >
                  {step}
                </span>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  // Keep the connector visually continuous with the step circles.
                  "mx-2 h-0.5 flex-1",
                  // Color the track up to the current step.
                  isCompleted || isCurrent ? "bg-brand-500" : "bg-grayScale-200",
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

