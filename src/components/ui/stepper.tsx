import { cn } from "../../lib/utils";

export interface StepperProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("flex w-full items-start justify-between", className)}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCurrent = stepNumber === currentStep;

        return (
          <div
            key={step}
            className="flex-1 relative flex flex-col items-center group"
          >
            {/* Connector Line - floats between circles with gap on both sides */}
            {index < steps.length - 1 && (
              <div
                className="absolute top-4 h-[1.5px] bg-grayScale-200 z-0"
                style={{ left: "calc(50% + 24px)", right: "calc(-50% + 24px)" }}
              />
            )}

            {/* Circle */}
            <div
              className={cn(
                "relative z-10 grid h-8 w-8 place-items-center rounded-full border-2 text-sm font-bold transition-all duration-300 mb-3",
                isCurrent
                  ? "border-brand-500 bg-brand-500 text-white shadow-md scale-110"
                  : "border-grayScale-100 bg-white text-grayScale-400 font-medium",
              )}
            >
              {stepNumber}
            </div>

            {/* Label */}
            <span
              className={cn(
                "relative z-10 text-[12px] font-bold transition-colors duration-300",
                isCurrent ? "text-brand-500" : "text-grayScale-400 font-medium",
              )}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}
