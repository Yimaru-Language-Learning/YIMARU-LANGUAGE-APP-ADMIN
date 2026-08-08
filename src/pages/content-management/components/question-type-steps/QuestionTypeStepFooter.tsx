import { ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "../../../../components/ui/button"

interface QuestionTypeStepFooterProps {
  onNext: () => void
  nextLabel: string
  onBack?: () => void
  saving?: boolean
  nextDisabled?: boolean
}

export function QuestionTypeStepFooter({
  onNext,
  nextLabel,
  onBack,
  saving = false,
  nextDisabled = false,
}: QuestionTypeStepFooterProps) {
  return (
    <div className="flex flex-col-reverse gap-3 border border-grayScale-200 bg-[#F8FAFC] px-4 py-4 dark:bg-grayScale-100 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        {onBack ? (
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full rounded-[6px] border-none px-6 font-bold text-grayScale-600 shadow-none hover:bg-grayScale-100 sm:w-auto"
            onClick={onBack}
            disabled={saving}
          >
            <ArrowLeft className="mr-2 inline h-4 w-4" />
            Back
          </Button>
        ) : null}
      </div>
      <Button
        type="button"
        onClick={onNext}
        disabled={saving || nextDisabled}
        className="flex h-10 w-full items-center justify-center gap-3 rounded-[6px] bg-[#9E2891] px-8 font-medium text-white shadow-lg shadow-brand-500/10 transition-all hover:bg-[#8A237E] disabled:opacity-50 sm:w-auto sm:px-10"
      >
        {nextLabel}
        <ArrowRight className="h-5 w-5" />
      </Button>
    </div>
  )
}
