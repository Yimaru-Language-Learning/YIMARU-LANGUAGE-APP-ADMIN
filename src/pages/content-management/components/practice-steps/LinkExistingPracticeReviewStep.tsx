import { useMemo } from "react"
import { Loader2, Rocket } from "lucide-react"
import { Button } from "../../../../components/ui/button"
import { Card } from "../../../../components/ui/card"
import {
  mergedParentsForAttach,
  practiceAlreadyLinkedToParent,
} from "../../../../lib/attachPracticeToParent"
import { dedupeParents } from "../../../../lib/practiceParents"
import {
  formatPracticeParentDisplayLabel,
  formatPracticeParentsDisplaySummary,
  type PracticeParentTitleHints,
} from "../../../../lib/practiceParentTitles"
import type { ParentContextPractice, PracticeParent } from "../../../../types/course.types"
import { cn } from "../../../../lib/utils"
import { usePracticeParentTitles } from "../../../../hooks/usePracticeParentTitles"

interface LinkExistingPracticeReviewStepProps {
  practice: ParentContextPractice
  targetParent: PracticeParent
  targetSummary: string
  titleHints?: PracticeParentTitleHints
  saving?: boolean
  onBack: () => void
  onConfirm: () => void
  variant?: "page" | "dialog"
}

function ParentsSummaryValue({
  loading,
  text,
}: {
  loading: boolean
  text: string
}) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-2 text-grayScale-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading locations…
      </span>
    )
  }
  return <>{text}</>
}

export function LinkExistingPracticeReviewStep({
  practice,
  targetParent,
  targetSummary,
  titleHints,
  saving = false,
  onBack,
  onConfirm,
  variant = "page",
}: LinkExistingPracticeReviewStepProps) {
  const currentParentList = useMemo(
    () => dedupeParents(practice.parents ?? []),
    [practice.parents],
  )
  const afterParentList = useMemo(
    () => mergedParentsForAttach(practice, targetParent),
    [practice, targetParent],
  )
  const parentsToResolve = useMemo(
    () => dedupeParents([...currentParentList, ...afterParentList, targetParent]),
    [currentParentList, afterParentList, targetParent],
  )

  const { titles, loading: titlesLoading } = usePracticeParentTitles(
    parentsToResolve,
    titleHints,
  )

  const currentParents = formatPracticeParentsDisplaySummary(currentParentList, titles)
  const afterParents = formatPracticeParentsDisplaySummary(afterParentList, titles)
  const attachToLabel = titlesLoading
    ? targetSummary
    : formatPracticeParentDisplayLabel(targetParent, titles)
  const alreadyLinked = practiceAlreadyLinkedToParent(practice, targetParent)
  const isDialog = variant === "dialog"

  const reviewCard = (
    <Card
      className={cn(
        "overflow-hidden border-grayScale-200 bg-white shadow-sm",
        isDialog ? "rounded-xl p-5" : "rounded-2xl p-6",
      )}
    >
      <h2
        className={cn(
          "font-bold text-grayScale-900",
          isDialog ? "text-lg" : "text-xl",
        )}
      >
        Review attachment
      </h2>
      <p className="mt-1 text-sm text-grayScale-500">
        Confirm linking this practice to the selected content location.
      </p>

      <dl className="mt-6 space-y-4 text-sm">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-grayScale-500">
            Practice
          </dt>
          <dd className="mt-1 font-semibold text-grayScale-900">
            {practice.title?.trim() || `Practice #${practice.id}`}
          </dd>
          <dd className="mt-0.5 font-mono text-xs text-grayScale-500">
            #{practice.id} · question set #{practice.question_set_id}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-grayScale-500">
            Attach to
          </dt>
          <dd className="mt-1 font-medium text-brand-700">
            <ParentsSummaryValue loading={titlesLoading} text={attachToLabel} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-grayScale-500">
            Current locations
          </dt>
          <dd className="mt-1 text-grayScale-700">
            <ParentsSummaryValue loading={titlesLoading} text={currentParents} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-grayScale-500">
            After attachment
          </dt>
          <dd className="mt-1 font-medium text-grayScale-900">
            <ParentsSummaryValue loading={titlesLoading} text={afterParents} />
          </dd>
        </div>
      </dl>

      {alreadyLinked ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          This practice is already linked to this location.
        </div>
      ) : null}
    </Card>
  )

  const actions = (
    <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        disabled={saving}
        className="h-10 rounded-[6px] border-grayScale-200 bg-white px-8 text-sm font-bold text-grayScale-600"
      >
        Back
      </Button>
      <Button
        type="button"
        onClick={onConfirm}
        disabled={saving || alreadyLinked || titlesLoading}
        className="h-10 gap-2 rounded-[6px] bg-brand-500 px-8 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Linking…
          </>
        ) : (
          <>
            <Rocket className="h-4 w-4" />
            Link practice
          </>
        )}
      </Button>
    </div>
  )

  if (isDialog) {
    return (
      <div className="space-y-5">
        {reviewCard}
        {actions}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {reviewCard}
      {actions}
    </div>
  )
}
