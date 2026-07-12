import { notifyApiError } from "../../../lib/apiErrors"
import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronDown, ChevronLeft, ChevronRight, GraduationCap, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"
import { getQuestionTypeDefinitionPractices } from "../../../api/questionTypeDefinitions.api"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import { SpinnerIcon } from "../../../components/ui/spinner-icon"
import { cn } from "../../../lib/utils"
import { resolveQuestionTypeDefinitionPracticeEditPath } from "../../../lib/questionTypeDefinitionPracticeEditPath"
import {
  formatPracticeLocation,
  isQuestionTypeDefinitionPracticeUnlinked,
} from "../../../lib/questionTypeDefinitionPractices"
import { DEFAULT_TABLE_PAGE_SIZE, TABLE_PAGE_SIZE_OPTIONS } from "../../../lib/tablePagination"
import type {
  QuestionTypeDefinition,
  QuestionTypeDefinitionPractice,
} from "../../../types/questionTypeDefinition.types"

function formatDate(iso?: string): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString()
}

function publishStatusClass(status?: string): string {
  const s = (status || "").toUpperCase()
  if (s === "PUBLISHED") return "bg-[#F0FDF4] text-[#16A34A]"
  if (s === "DRAFT") return "bg-amber-50 text-amber-800"
  return "bg-grayScale-50 text-grayScale-600"
}

interface QuestionTypeDefinitionPracticesDialogProps {
  definition: QuestionTypeDefinition | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuestionTypeDefinitionPracticesDialog({
  definition,
  open,
  onOpenChange,
}: QuestionTypeDefinitionPracticesDialogProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [practices, setPractices] = useState<QuestionTypeDefinitionPractice[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE)
  const [offset, setOffset] = useState(0)
  const [editingPracticeId, setEditingPracticeId] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!definition) return
    setLoading(true)
    try {
      const result = await getQuestionTypeDefinitionPractices(definition.id, {
        limit: pageSize,
        offset,
      })
      setPractices(result.practices)
      setTotalCount(result.total_count)
    } catch (e) {
      console.error(e)
      notifyApiError(e, "Failed to load practices for this definition")
      setPractices([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [definition, offset, pageSize])

  useEffect(() => {
    if (!open || !definition) return
    void load()
  }, [open, definition, load])

  useEffect(() => {
    if (!open) {
      setOffset(0)
      setPageSize(DEFAULT_TABLE_PAGE_SIZE)
      setPractices([])
      setTotalCount(0)
      setEditingPracticeId(null)
    }
  }, [open])

  const handleCreatePractice = () => {
    if (!definition) return
    onOpenChange(false)
    navigate(`/new-content/question-types/${definition.id}/create-practice`)
  }

  const handleEditPractice = async (practice: QuestionTypeDefinitionPractice) => {
    setEditingPracticeId(practice.practice_id)
    try {
      const path = await resolveQuestionTypeDefinitionPracticeEditPath(practice)
      if (!path) {
        notifyApiError(e, "Could not open practice editor")
        return
      }
      onOpenChange(false)
      navigate(path)
    } catch (e) {
      console.error(e)
      notifyApiError(e, "Failed to open practice editor")
    } finally {
      setEditingPracticeId(null)
    }
  }

  const canPrev = offset > 0
  const canNext = offset + pageSize < totalCount
  const pageStart = totalCount === 0 ? 0 : offset + 1
  const pageEnd = Math.min(offset + practices.length, totalCount)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden rounded-2xl border-grayScale-200 p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b border-grayScale-100 px-4 py-4 pr-14 sm:px-6 text-left">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-grayScale-900">
            <GraduationCap className="h-5 w-5 text-brand-600 shrink-0" aria-hidden />
            Practices using this definition
          </DialogTitle>
          {definition ? (
            <DialogDescription className="text-left text-grayScale-600">
              <span className="font-semibold text-grayScale-800">{definition.display_name}</span>
              <span className="mx-1.5 text-grayScale-300">·</span>
              <span className="font-mono text-xs text-grayScale-500">
                #{definition.id} · {definition.key}
              </span>
            </DialogDescription>
          ) : null}
          {definition ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                className="rounded-[8px] bg-brand-600 hover:bg-brand-500"
                onClick={handleCreatePractice}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Create practice
              </Button>
            </div>
          ) : null}
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16">
              <SpinnerIcon className="h-8 w-8 text-brand-500" />
              <p className="text-sm text-grayScale-500">Loading practices…</p>
            </div>
          ) : practices.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-grayScale-100 text-grayScale-400">
                <GraduationCap className="h-7 w-7" aria-hidden />
              </div>
              <p className="text-sm font-semibold text-grayScale-700">
                No practices use this question type yet.
              </p>
              <p className="max-w-sm text-xs text-grayScale-500">
                Create a practice shell and add questions built from this definition.
              </p>
              {definition ? (
                <Button
                  type="button"
                  size="sm"
                  className="mt-2 rounded-[8px] bg-brand-600 hover:bg-brand-500"
                  onClick={handleCreatePractice}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create practice with this type
                </Button>
              ) : null}
            </div>
          ) : (
            <ul className="divide-y divide-grayScale-100 overflow-y-auto px-2 py-2">
              {practices.map((practice) => {
                const location = formatPracticeLocation(practice)
                const isUnlinked = isQuestionTypeDefinitionPracticeUnlinked(practice)
                return (
                <li key={`${practice.practice_kind}-${practice.practice_id}`} className="px-4 py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1.5">
                      <p className="text-sm font-semibold text-grayScale-900 leading-snug">{practice.title}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-grayScale-500">
                        <span className="font-mono">practice #{practice.practice_id}</span>
                        <span className="text-grayScale-300">·</span>
                        <span className="font-mono">set #{practice.question_set_id}</span>
                        <span className="text-grayScale-300">·</span>
                        <span
                          className={cn(isUnlinked && "italic text-amber-700")}
                        >
                          {location}
                        </span>
                      </div>
                      {practice.story_description?.trim() ? (
                        <p className="line-clamp-2 text-xs text-grayScale-500">{practice.story_description}</p>
                      ) : null}
                      <p className="text-[11px] text-grayScale-400">Created {formatDate(practice.created_at)}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-[8px] border-grayScale-200 px-3 text-xs font-semibold"
                        disabled={editingPracticeId === practice.practice_id}
                        onClick={() => void handleEditPractice(practice)}
                      >
                        {editingPracticeId === practice.practice_id ? (
                          <SpinnerIcon className="mr-1.5 h-3.5 w-3.5" />
                        ) : (
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Edit practice
                      </Button>
                      <Badge
                        className={cn(
                          "border-none px-2.5 py-0.5 text-[11px] font-bold shadow-none",
                          publishStatusClass(practice.publish_status),
                        )}
                      >
                        {practice.publish_status || "—"}
                      </Badge>
                      <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider">
                        {practice.matching_question_count} matching question
                        {practice.matching_question_count === 1 ? "" : "s"}
                      </Badge>
                    </div>
                  </div>
                </li>
              )})}
            </ul>
          )}
        </div>

        {!loading && totalCount > 0 ? (
          <div className="shrink-0 border-t border-grayScale-200 bg-grayScale-50/80 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs text-grayScale-500">
                <span>
                  Showing {pageStart}–{pageEnd} of {totalCount}
                </span>
                <span className="hidden h-4 w-px bg-grayScale-200 sm:inline" />
                <span className="flex items-center gap-2">
                  Per page
                  <div className="relative">
                    <select
                      value={pageSize}
                      disabled={loading}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                        setOffset(0)
                      }}
                      className="h-8 appearance-none rounded-[8px] border border-grayScale-200 bg-white pl-2.5 pr-8 text-sm font-medium text-grayScale-600 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    >
                      {TABLE_PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
                  </div>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-[8px] border-grayScale-200"
                  disabled={!canPrev || loading}
                  onClick={() => setOffset((o) => Math.max(0, o - pageSize))}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-[8px] border-grayScale-200"
                  disabled={!canNext || loading}
                  onClick={() => setOffset((o) => o + pageSize)}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
