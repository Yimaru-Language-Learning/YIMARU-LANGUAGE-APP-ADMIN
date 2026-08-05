import { notifyApiError } from "../../../../lib/apiErrors"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowRight, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { toast } from "sonner"
import { Button } from "../../../../components/ui/button"
import { Card } from "../../../../components/ui/card"
import { Input } from "../../../../components/ui/input"
import { SpinnerIcon } from "../../../../components/ui/spinner-icon"
import { practiceAlreadyLinkedToParent } from "../../../../lib/attachPracticeToParent"
import { fetchAllPractices } from "../../../../lib/fetchAllPractices"
import { formatPracticeParentsSummary } from "../../../../lib/practiceParents"
import { DEFAULT_TABLE_PAGE_SIZE, TABLE_PAGE_SIZE_OPTIONS } from "../../../../lib/tablePagination"
import type { ParentContextPractice, PracticeParent } from "../../../../types/course.types"
import { cn } from "../../../../lib/utils"
import { SearchHighlight, getSearchTokens } from "../../../../components/SearchHighlight"
import { UnassignedLabel } from "../../../../lib/displayValue"

interface SelectPracticeToAttachStepProps {
  targetParent: PracticeParent
  targetSummary: string
  selectedPracticeId: number | null
  onSelect: (practice: ParentContextPractice) => void
  nextStep: () => void
  onCancel: () => void
  variant?: "page" | "dialog"
  isExamPrep?: boolean
}

function publishStatusClass(status?: string | null): string {
  const s = (status || "").toUpperCase()
  if (s === "PUBLISHED") return "bg-[#F0FDF4] text-[#16A34A]"
  if (s === "DRAFT") return "bg-amber-50 text-amber-800"
  return "bg-grayScale-50 text-grayScale-600"
}

function matchesPracticeSearch(
  practice: ParentContextPractice,
  query: string,
): boolean {
  const tokens = getSearchTokens(query)
  if (tokens.length === 0) return true
  const haystack = [
    practice.title ?? "",
    practice.story_description ?? "",
    String(practice.id),
    String(practice.question_set_id),
    formatPracticeParentsSummary(practice.parents ?? [], { isExamPrep }),
  ]
    .join(" ")
    .toLowerCase()
  return tokens.every((token) => haystack.includes(token.toLowerCase()))
}

export function SelectPracticeToAttachStep({
  targetParent,
  targetSummary,
  selectedPracticeId,
  onSelect,
  nextStep,
  onCancel,
  variant = "page",
  isExamPrep = false,
}: SelectPracticeToAttachStepProps) {
  const isDialog = variant === "dialog"
  const [loading, setLoading] = useState(true)
  const [allPractices, setAllPractices] = useState<ParentContextPractice[]>([])
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE)
  const [offset, setOffset] = useState(0)
  const [searchInput, setSearchInput] = useState("")
  const [unlinkedOnly, setUnlinkedOnly] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const practices = await fetchAllPractices(unlinkedOnly, { isExamPrep })
      setAllPractices(practices)
    } catch (e) {
      notifyApiError(e, "Could not load practices")
      setAllPractices([])
    } finally {
      setLoading(false)
    }
  }, [unlinkedOnly, isExamPrep])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setOffset(0)
  }, [searchInput, unlinkedOnly, pageSize])

  const filteredPractices = useMemo(
    () => allPractices.filter((practice) => matchesPracticeSearch(practice, searchInput)),
    [allPractices, searchInput],
  )

  const totalCount = filteredPractices.length
  const practices = useMemo(
    () => filteredPractices.slice(offset, offset + pageSize),
    [filteredPractices, offset, pageSize],
  )

  const pageStart = totalCount === 0 ? 0 : offset + 1
  const pageEnd = Math.min(offset + practices.length, totalCount)
  const canPrev = offset > 0
  const canNext = offset + pageSize < totalCount

  const canContinue = selectedPracticeId != null

  const header = (
    <div
      className={cn(
        "border-b border-grayScale-50",
        isDialog ? "px-5 py-4" : "px-8 pt-8 pb-4",
      )}
    >
      <h2
        className={cn(
          "font-bold leading-none text-grayScale-900",
          isDialog ? "text-lg" : "text-xl",
        )}
      >
        Select a practice
      </h2>
      <p className={cn("text-grayScale-600", isDialog ? "mt-1 text-sm" : "mt-3 text-base")}>
        Link an existing practice to{" "}
        <span className="font-medium text-grayScale-800">{targetSummary}</span>.
      </p>
    </div>
  )

  const filters = (
    <div
      className={cn(
        "space-y-4 border-b border-grayScale-100",
        isDialog ? "px-5 py-3" : "px-8 py-5",
      )}
    >
      <div className="relative min-w-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by title, id, or location…"
          className="h-10 rounded-[8px] border-grayScale-200 pl-9"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-grayScale-500">Show:</span>
        <button
          type="button"
          onClick={() => setUnlinkedOnly(false)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
            !unlinkedOnly
              ? "bg-brand-500 text-white"
              : "bg-grayScale-100 text-grayScale-600 hover:bg-grayScale-200",
          )}
        >
          All practices
        </button>
        <button
          type="button"
          onClick={() => setUnlinkedOnly(true)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
            unlinkedOnly
              ? "bg-brand-500 text-white"
              : "bg-grayScale-100 text-grayScale-600 hover:bg-grayScale-200",
          )}
        >
          Unlinked only
        </button>
      </div>
    </div>
  )

  const listBody = (
    <div className={cn(isDialog ? "min-h-[220px]" : "min-h-[280px]")}>
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16">
          <SpinnerIcon className="h-8 w-8 text-brand-500" />
          <p className="text-sm text-grayScale-500">Loading practices…</p>
        </div>
      ) : practices.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <p className="text-sm font-semibold text-grayScale-700">No practices found</p>
          <p className="max-w-sm text-xs text-grayScale-500">
            {unlinkedOnly
              ? isExamPrep
                ? "No unlinked Duolingo/IELTS practices match your search. Try all practices or create a new shell first."
                : "No unlinked practices match your search. Try all practices or create a new shell from Question Types."
              : "Try a different search, switch to unlinked only, or create a new practice instead."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-grayScale-100">
          {practices.map((practice) => {
            const alreadyLinked = practiceAlreadyLinkedToParent(practice, targetParent)
            const isSelected = practice.id === selectedPracticeId
            const parentsLabel = formatPracticeParentsSummary(practice.parents ?? [])
            return (
              <li key={practice.id}>
                <button
                  type="button"
                  disabled={alreadyLinked}
                  onClick={() => onSelect(practice)}
                  className={cn(
                    "flex w-full flex-col gap-2 text-left transition-colors sm:flex-row sm:items-start sm:justify-between",
                    isDialog ? "px-5 py-3.5" : "px-8 py-4",
                    alreadyLinked
                      ? "cursor-not-allowed bg-grayScale-50/80 opacity-60"
                      : isSelected
                        ? "bg-brand-50/60"
                        : "hover:bg-grayScale-50",
                  )}
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="text-sm font-semibold leading-snug text-grayScale-900">
                      <SearchHighlight
                        text={practice.title?.trim() || `Practice #${practice.id}`}
                        query={searchInput}
                      />
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-grayScale-500">
                      <span className="font-mono">
                        <SearchHighlight text={`#${practice.id}`} query={searchInput} />
                      </span>
                      <span className="text-grayScale-300">·</span>
                      <span className="font-mono">
                        <SearchHighlight
                          text={`set #${practice.question_set_id}`}
                          query={searchInput}
                        />
                      </span>
                      <span className="text-grayScale-300">·</span>
                      <span>
                        <SearchHighlight text={parentsLabel} query={searchInput} />
                      </span>
                    </div>
                    {practice.story_description?.trim() ? (
                      <p className="line-clamp-2 text-xs text-grayScale-500">
                        <SearchHighlight
                          text={practice.story_description}
                          query={searchInput}
                        />
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                        publishStatusClass(practice.publish_status),
                      )}
                    >
                      {practice.publish_status?.trim() ? (
                        practice.publish_status
                      ) : (
                        <UnassignedLabel />
                      )}
                    </span>
                    {alreadyLinked ? (
                      <span className="text-[11px] font-semibold text-brand-600">
                        Already linked
                      </span>
                    ) : isSelected ? (
                      <span className="text-[11px] font-semibold text-brand-600">Selected</span>
                    ) : null}
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )

  const pagination =
    !loading && totalCount > 0 ? (
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 border-t border-grayScale-100 text-xs text-grayScale-500",
          isDialog ? "px-5 py-2.5" : "px-8 py-3",
        )}
      >
        <span>
          Showing {pageStart}–{pageEnd} of {totalCount}
        </span>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="h-8 rounded-[8px] border border-grayScale-200 bg-white px-2 text-xs"
          >
            {TABLE_PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={!canPrev}
            onClick={() => setOffset((o) => Math.max(0, o - pageSize))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={!canNext}
            onClick={() => setOffset((o) => o + pageSize)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    ) : null

  const footer = (
    <div
      className={cn(
        "flex items-center justify-between border-t border-grayScale-100",
        isDialog
          ? "bg-grayScale-50/60 px-5 py-3.5"
          : "bg-[#F8FAFC] p-4 px-12",
      )}
    >
      <button
        type="button"
        className={cn(
          "text-grayScale-500 transition-colors hover:text-grayScale-700",
          isDialog ? "text-sm" : "text-[14px] font-bold",
        )}
        onClick={onCancel}
      >
        Cancel
      </button>
      <Button
        type="button"
        disabled={!canContinue}
        onClick={nextStep}
        className={cn(
          "bg-brand-500 font-bold text-white hover:bg-brand-600 disabled:opacity-50",
          isDialog
            ? "h-10 rounded-[6px] px-8 text-sm"
            : "flex h-10 items-center gap-2 rounded-[6px] px-10 text-[14px] transition-all active:scale-95",
        )}
      >
        Next: Review
        <ArrowRight className={cn(isDialog ? "ml-2 h-4 w-4" : "h-5 w-5")} />
      </Button>
    </div>
  )

  if (isDialog) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {header}
        {filters}
        <div className="min-h-0 flex-1 overflow-y-auto">{listBody}</div>
        {pagination}
        {footer}
      </div>
    )
  }

  return (
    <Card className="animate-in fade-in overflow-hidden rounded-2xl border-grayScale-300 bg-white shadow-sm duration-500">
      {header}
      <div className="relative" aria-hidden="true">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-grayScale-200" />
        </div>
        <div className="relative flex justify-center">
          <div className="h-[0.5px] w-full rounded-full opacity-20" style={{ background: "gray" }} />
        </div>
      </div>
      {filters}
      {listBody}
      {pagination}
      {footer}
    </Card>
  )
}
