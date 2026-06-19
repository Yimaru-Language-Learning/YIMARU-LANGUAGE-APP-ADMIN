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
    <div className="px-4 py-4 border border-grayScale-200 flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC]">
      <div className="flex items-center gap-2">
        {onBack ? (
          <Button
            type="button"
            variant="outline"
            className="h-10 px-6 rounded-[6px] border-none shadow-none text-grayScale-600 font-bold hover:bg-grayScale-100"
            onClick={onBack}
            disabled={saving}
          >
            <ArrowLeft className="h-4 w-4 mr-2 inline" />
            Back
          </Button>
        ) : null}
      </div>
      <Button
        type="button"
        onClick={onNext}
        disabled={saving || nextDisabled}
        className="h-10 px-10 rounded-[6px] bg-[#9E2891] font-medium text-white shadow-lg shadow-brand-500/10 hover:bg-[#8A237E] disabled:opacity-50 transition-all flex items-center gap-3"
      >
        {nextLabel}
        <ArrowRight className="h-5 w-5" />
      </Button>
    </div>
  )
}
