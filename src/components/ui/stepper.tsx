import { cn } from "../../lib/utils";

export interface StepperProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  const safeCurrent = Math.min(Math.max(currentStep, 1), Math.max(steps.length, 1));
  const currentLabel = steps[safeCurrent - 1] ?? "";

  return (
    <div className={cn("w-full min-w-0", className)}>
      {/* Compact mobile summary */}
      <div className="mb-3 flex items-center justify-between gap-3 sm:hidden">
        <p className="min-w-0 truncate text-sm font-semibold text-brand-600">
          {currentLabel}
        </p>
        <p className="shrink-0 text-xs font-medium text-grayScale-400">
          Step {safeCurrent} of {steps.length}
        </p>
      </div>

      <div className="flex w-full min-w-0 items-start justify-between gap-1 sm:gap-0">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCurrent = stepNumber === safeCurrent;
          const isComplete = stepNumber < safeCurrent;

          return (
            <div
              key={`${step}-${stepNumber}`}
              className="relative flex min-w-0 flex-1 flex-col items-center"
            >
              {index < steps.length - 1 ? (
                <div
                  className={cn(
                    "absolute top-3.5 z-0 h-[1.5px] sm:top-4",
                    isComplete ? "bg-brand-400" : "bg-grayScale-200 dark:bg-grayScale-300",
                  )}
                  style={{ left: "calc(50% + 1rem)", right: "calc(-50% + 1rem)" }}
                  aria-hidden
                />
              ) : null}

              <div
                className={cn(
                  "relative z-10 mb-2 grid h-7 w-7 place-items-center rounded-full border-2 text-xs font-bold transition-all duration-300 sm:mb-3 sm:h-8 sm:w-8 sm:text-sm",
                  isCurrent
                    ? "scale-105 border-brand-500 bg-brand-500 text-white shadow-md sm:scale-110"
                    : isComplete
                      ? "border-brand-400 bg-brand-50 text-brand-600"
                      : "border-grayScale-100 bg-white font-medium text-grayScale-400 dark:border-grayScale-300 dark:bg-grayScale-100 dark:text-grayScale-500",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {stepNumber}
              </div>

              <span
                className={cn(
                  "relative z-10 hidden max-w-full px-0.5 text-center text-[11px] font-bold leading-tight transition-colors duration-300 sm:line-clamp-2 sm:block sm:text-[12px]",
                  isCurrent
                    ? "text-brand-500"
                    : "font-medium text-grayScale-400 dark:text-grayScale-500",
                )}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
