import { useCallback, useEffect, useMemo, useState } from "react"
import { Library, Search } from "lucide-react"
import { toast } from "sonner"
import { getQuestions } from "../../../../api/courses.api"
import { SearchHighlight } from "../../../../components/SearchHighlight"
import { Button } from "../../../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog"
import { Input } from "../../../../components/ui/input"
import { getApiErrorMessage } from "../../../../lib/apiErrors"
import {
  buildQuestionBankSearchHaystack,
  getQuestionBankListLabels,
  matchesQuestionBankHaystack,
  normalizeQuestionBankItem,
  type QuestionBankListLabels,
} from "../../../../lib/questionBankDisplay"
import type { QuestionDetail } from "../../../../types/course.types"
import type { QuestionTypeDefinition } from "../../../../types/questionTypeDefinition.types"
import { cn } from "../../../../lib/utils"

const BANK_CACHE_TTL_MS = 5 * 60 * 1000
const BANK_PAGE_SIZE = 200

let bankCache: { fetchedAt: number; questions: QuestionDetail[] } | null = null
let bankFetchInFlight: Promise<QuestionDetail[]> | null = null

function unwrapQuestionsPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { questions?: unknown[] }).questions)
  ) {
    return (payload as { questions: unknown[] }).questions
  }
  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { Questions?: unknown[] }).Questions)
  ) {
    return (payload as { Questions: unknown[] }).Questions
  }
  return []
}

function readChunkTotal(payload: unknown, metaTotal?: number): number | undefined {
  if (typeof metaTotal === "number" && Number.isFinite(metaTotal)) return metaTotal
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return undefined
  const record = payload as Record<string, unknown>
  const direct = Number(record.total_count ?? record.TotalCount)
  if (Number.isFinite(direct)) return direct
  return undefined
}

async function fetchAllBankQuestions(): Promise<QuestionDetail[]> {
  const firstRes = await getQuestions({ limit: BANK_PAGE_SIZE, offset: 0 })
  const firstPayload = firstRes.data?.data as unknown
  const firstMeta = firstRes.data?.metadata as { total_count?: number } | null | undefined
  const firstRaw = unwrapQuestionsPayload(firstPayload)
  const firstChunk = firstRaw
    .map((row) => normalizeQuestionBankItem(row))
    .filter((row): row is QuestionDetail => row != null)

  const total =
    readChunkTotal(firstPayload, firstMeta?.total_count) ?? firstChunk.length

  if (firstRaw.length < BANK_PAGE_SIZE || firstChunk.length >= total) {
    return firstChunk
  }

  const offsets: number[] = []
  for (let offset = BANK_PAGE_SIZE; offset < total; offset += BANK_PAGE_SIZE) {
    offsets.push(offset)
  }

  const pages = await Promise.all(
    offsets.map(async (offset) => {
      const res = await getQuestions({ limit: BANK_PAGE_SIZE, offset })
      const payload = res.data?.data as unknown
      return unwrapQuestionsPayload(payload)
        .map((row) => normalizeQuestionBankItem(row))
        .filter((row): row is QuestionDetail => row != null)
    }),
  )

  return [...firstChunk, ...pages.flat()]
}

async function loadQuestionBank(options?: {
  force?: boolean
}): Promise<QuestionDetail[]> {
  const now = Date.now()
  if (
    !options?.force &&
    bankCache &&
    now - bankCache.fetchedAt < BANK_CACHE_TTL_MS
  ) {
    return bankCache.questions
  }
  if (bankFetchInFlight) return bankFetchInFlight

  bankFetchInFlight = fetchAllBankQuestions()
    .then((questions) => {
      bankCache = { fetchedAt: Date.now(), questions }
      return questions
    })
    .finally(() => {
      bankFetchInFlight = null
    })

  return bankFetchInFlight
}

interface BankListRow {
  question: QuestionDetail
  labels: QuestionBankListLabels
  haystack: string
}

interface QuestionBankAttachDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Question IDs already on this practice — hidden from selection. */
  excludeIds: number[]
  onAttach: (questions: QuestionDetail[]) => void
  typeDefinitions?: QuestionTypeDefinition[]
}

export function QuestionBankAttachDialog({
  open,
  onOpenChange,
  excludeIds,
  onAttach,
  typeDefinitions = [],
}: QuestionBankAttachDialogProps) {
  const [loading, setLoading] = useState(false)
  const [attaching, setAttaching] = useState(false)
  const [questions, setQuestions] = useState<QuestionDetail[]>(
    () => bankCache?.questions ?? [],
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const excluded = useMemo(() => new Set(excludeIds.filter((id) => id > 0)), [excludeIds])

  const hydrateBank = useCallback(async () => {
    const hasWarmCache =
      bankCache != null && Date.now() - bankCache.fetchedAt < BANK_CACHE_TTL_MS
    if (hasWarmCache && bankCache) {
      setQuestions(bankCache.questions)
      setLoading(false)
      return
    }

    setLoading(!(bankCache && bankCache.questions.length > 0))
    try {
      const rows = await loadQuestionBank()
      setQuestions(rows)
    } catch (error) {
      console.error("Failed to load question bank:", error)
      toast.error("Could not load question bank", {
        description: getApiErrorMessage(error, "Try again in a moment."),
      })
      if (!bankCache?.questions.length) setQuestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setSearchQuery("")
    setSelectedIds([])
    void hydrateBank()
  }, [open, hydrateBank])

  /** Client-side index: load once from API, filter locally as the user types. */
  const searchableRows = useMemo((): BankListRow[] => {
    return questions
      .filter((q) => !excluded.has(q.id))
      .map((question) => ({
        question,
        labels: getQuestionBankListLabels(question, typeDefinitions),
        haystack: buildQuestionBankSearchHaystack(question, typeDefinitions),
      }))
  }, [questions, excluded, typeDefinitions])

  const filtered = useMemo(() => {
    return searchableRows.filter((row) =>
      matchesQuestionBankHaystack(row.haystack, searchQuery),
    )
  }, [searchableRows, searchQuery])

  const toggleId = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleAttach = () => {
    if (selectedIds.length === 0) return
    setAttaching(true)
    try {
      const byId = new Map(questions.map((q) => [q.id, q]))
      const details = selectedIds
        .map((id) => byId.get(id))
        .filter((q): q is QuestionDetail => q != null)
      if (details.length === 0) {
        throw new Error("Could not resolve the selected questions")
      }
      onAttach(details)
      onOpenChange(false)
    } catch (error) {
      toast.error("Could not attach questions", {
        description: getApiErrorMessage(error, "Try again."),
      })
    } finally {
      setAttaching(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border-grayScale-200 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-grayScale-100 px-5 py-4 pr-12 text-left sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-grayScale-900">
            <Library className="h-5 w-5 text-brand-500" />
            Attach from question bank
          </DialogTitle>
          <DialogDescription className="text-sm text-grayScale-600">
            Pick existing questions to include in this practice. Search filters this list on your
            device — matching words are highlighted as you type.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-5 py-4 sm:px-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to filter by question text, type, or difficulty…"
              className="h-10 rounded-xl border-grayScale-200 pl-9"
              autoFocus
            />
          </div>
          <p className="text-xs text-grayScale-500">
            {selectedIds.length > 0
              ? `${selectedIds.length} selected`
              : loading
                ? "Loading…"
                : searchQuery.trim()
                  ? `${filtered.length} of ${searchableRows.length} match`
                  : `${filtered.length} available`}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto border-y border-grayScale-100 px-2 sm:px-3">
          {loading ? (
            <p className="px-3 py-8 text-center text-sm text-grayScale-500">
              Loading question bank…
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-grayScale-500">
              No matching questions in the bank.
            </p>
          ) : (
            <ul className="space-y-1 py-2">
              {filtered.map(({ question: q, labels }) => {
                const checked = selectedIds.includes(q.id)
                return (
                  <li key={q.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                        checked
                          ? "border-brand-200 bg-brand-100/50 ring-1 ring-brand-200"
                          : "border-transparent hover:bg-grayScale-50",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 shrink-0 rounded border-grayScale-300 accent-[#9E2891]"
                        checked={checked}
                        onChange={() => toggleId(q.id)}
                      />
                      <span className="min-w-0 flex-1 space-y-1.5">
                        <span className="line-clamp-2 block text-sm font-medium text-grayScale-800">
                          <SearchHighlight
                            text={labels.preview}
                            query={searchQuery}
                            highlightClassName="rounded-sm bg-amber-200 px-0.5 text-grayScale-900"
                          />
                        </span>
                        {labels.responsePreview ? (
                          <span className="line-clamp-1 block text-xs text-grayScale-600">
                            <SearchHighlight
                              text={labels.responsePreview}
                              query={searchQuery}
                              highlightClassName="rounded-sm bg-amber-200 px-0.5 text-grayScale-900"
                            />
                          </span>
                        ) : null}
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-grayScale-700 ring-1 ring-grayScale-200">
                            <SearchHighlight
                              text={labels.typeLabel}
                              query={searchQuery}
                              highlightClassName="rounded-sm bg-amber-200 px-0.5 text-grayScale-900"
                            />
                          </span>
                          {labels.difficultyLabel ? (
                            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
                              <SearchHighlight
                                text={labels.difficultyLabel}
                                query={searchQuery}
                                highlightClassName="rounded-sm bg-amber-200 px-0.5 text-grayScale-900"
                              />
                            </span>
                          ) : null}
                          {labels.statusLabel &&
                          labels.statusLabel.toLowerCase() !== "published" ? (
                            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                              <SearchHighlight
                                text={labels.statusLabel}
                                query={searchQuery}
                                highlightClassName="rounded-sm bg-amber-200 px-0.5 text-grayScale-900"
                              />
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <DialogFooter className="flex-row justify-end gap-2 border-t border-grayScale-100 px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={() => onOpenChange(false)}
            disabled={attaching}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-lg bg-brand-500 text-white hover:bg-brand-600"
            onClick={handleAttach}
            disabled={attaching || selectedIds.length === 0}
          >
            {attaching
              ? "Attaching…"
              : `Attach${selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
