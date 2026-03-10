import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Search, Edit, Trash2, HelpCircle, X } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Select } from "../../components/ui/select"
import { Textarea } from "../../components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { deleteQuestion, getQuestionById, getQuestions, updateQuestion } from "../../api/courses.api"
import type { QuestionDetail } from "../../types/course.types"

type QuestionTypeFilter = "all" | "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "AUDIO"
type DifficultyFilter = "all" | "EASY" | "MEDIUM" | "HARD"
type StatusFilter = "all" | "DRAFT" | "PUBLISHED" | "INACTIVE"
type QuestionTypeEdit = "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "AUDIO"

interface EditOption {
  option_text: string
  option_order: number
  is_correct: boolean
}

const typeLabels: Record<string, string> = {
  MCQ: "Multiple Choice",
  TRUE_FALSE: "True/False",
  SHORT_ANSWER: "Short Answer",
  SHORT: "Short Answer",
  AUDIO: "Audio",
}

const typeColors: Record<string, string> = {
  MCQ: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  TRUE_FALSE: "bg-brand-100 text-brand-600 ring-1 ring-inset ring-brand-200",
  SHORT_ANSWER: "bg-mint-100 text-green-700 ring-1 ring-inset ring-green-200",
  SHORT: "bg-mint-100 text-green-700 ring-1 ring-inset ring-green-200",
  AUDIO: "bg-purple-100 text-purple-700 ring-1 ring-inset ring-purple-200",
}

export function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionDetail[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<QuestionTypeFilter>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([])
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailData, setDetailData] = useState<QuestionDetail | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editQuestionText, setEditQuestionText] = useState("")
  const [editQuestionType, setEditQuestionType] = useState<QuestionTypeEdit>("MCQ")
  const [editDifficulty, setEditDifficulty] = useState("EASY")
  const [editPoints, setEditPoints] = useState(1)
  const [editStatus, setEditStatus] = useState("PUBLISHED")
  const [editTips, setEditTips] = useState("")
  const [editExplanation, setEditExplanation] = useState("")
  const [editVoicePrompt, setEditVoicePrompt] = useState("")
  const [editSampleAnswerVoicePrompt, setEditSampleAnswerVoicePrompt] = useState("")
  const [editShortAnswer, setEditShortAnswer] = useState("")
  const [editOptions, setEditOptions] = useState<EditOption[]>([
    { option_text: "", option_order: 1, is_correct: true },
    { option_text: "", option_order: 2, is_correct: false },
  ])

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const batchSize = 100
      let nextOffset = 0
      let allRows: QuestionDetail[] = []
      let expectedTotal = Number.POSITIVE_INFINITY

      while (allRows.length < expectedTotal) {
        const res = await getQuestions({
          question_type: typeFilter === "all" ? undefined : typeFilter,
          difficulty: difficultyFilter === "all" ? undefined : difficultyFilter,
          status: statusFilter === "all" ? undefined : statusFilter,
          limit: batchSize,
          offset: nextOffset,
        })

        const payload = res.data?.data as unknown
        const meta = res.data?.metadata as { total_count?: number } | null | undefined

        let chunk: QuestionDetail[] = []
        let chunkTotal: number | undefined

        if (Array.isArray(payload)) {
          chunk = payload as QuestionDetail[]
          chunkTotal = meta?.total_count
        } else if (
          payload &&
          typeof payload === "object" &&
          Array.isArray((payload as { questions?: unknown[] }).questions)
        ) {
          const data = payload as { questions: QuestionDetail[]; total_count?: number }
          chunk = data.questions
          chunkTotal = data.total_count ?? meta?.total_count
        }

        allRows = [...allRows, ...chunk]
        if (typeof chunkTotal === "number" && Number.isFinite(chunkTotal)) {
          expectedTotal = chunkTotal
        }

        if (chunk.length < batchSize) break
        nextOffset += chunk.length
      }

      setQuestions(allRows)
    } catch (error) {
      console.error("Failed to fetch questions:", error)
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }, [typeFilter, difficultyFilter, statusFilter])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  useEffect(() => {
    setPage(1)
    setSelectedIds([])
  }, [searchQuery, pageSize, typeFilter, difficultyFilter, statusFilter])

  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions
    return questions.filter((q) =>
      q.question_text.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [questions, searchQuery])

  const paginatedQuestions = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredQuestions.slice(start, start + pageSize)
  }, [filteredQuestions, page, pageSize])

  const handleDeleteRequest = (ids: number[]) => {
    setPendingDeleteIds(ids)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (pendingDeleteIds.length === 0) return
    setDeleting(true)
    try {
      await Promise.all(pendingDeleteIds.map((id) => deleteQuestion(id)))
      setDeleteDialogOpen(false)
      setPendingDeleteIds([])
      setSelectedIds((prev) => prev.filter((id) => !pendingDeleteIds.includes(id)))
      await fetchQuestions()
    } catch (error) {
      console.error("Failed to delete question(s):", error)
    } finally {
      setDeleting(false)
    }
  }

  const openDetails = async (id: number) => {
    setDetailsOpen(true)
    setDetailLoading(true)
    setDetailData(null)
    try {
      const res = await getQuestionById(id)
      setDetailData(res.data.data)
    } catch (error) {
      console.error("Failed to fetch question details:", error)
    } finally {
      setDetailLoading(false)
    }
  }

  const openEdit = async (id: number) => {
    setEditOpen(true)
    setDetailLoading(true)
    setActiveQuestionId(id)
    try {
      const res = await getQuestionById(id)
      const q = res.data.data
      setDetailData(q)
      setEditQuestionText(q.question_text || "")
      setEditQuestionType((q.question_type as QuestionTypeEdit) || "MCQ")
      setEditDifficulty((q.difficulty_level as string) || "EASY")
      setEditPoints(q.points ?? 1)
      setEditStatus(q.status || "PUBLISHED")
      setEditTips(q.tips || "")
      setEditExplanation(q.explanation || "")
      setEditVoicePrompt(q.voice_prompt || "")
      setEditSampleAnswerVoicePrompt(q.sample_answer_voice_prompt || "")
      const incomingShort = Array.isArray(q.short_answers) && q.short_answers.length > 0
        ? typeof q.short_answers[0] === "string"
          ? String(q.short_answers[0] || "")
          : String((q.short_answers[0] as { acceptable_answer?: string }).acceptable_answer || "")
        : ""
      setEditShortAnswer(incomingShort)
      const mappedOptions =
        (q.options ?? [])
          .slice()
          .sort((a, b) => a.option_order - b.option_order)
          .map((opt) => ({
            option_text: opt.option_text,
            option_order: opt.option_order,
            is_correct: opt.is_correct,
          })) || []
      setEditOptions(
        mappedOptions.length > 0
          ? mappedOptions
          : [
              { option_text: "", option_order: 1, is_correct: true },
              { option_text: "", option_order: 2, is_correct: false },
            ],
      )
    } catch (error) {
      console.error("Failed to fetch question for edit:", error)
    } finally {
      setDetailLoading(false)
    }
  }

  const saveEdit = async () => {
    if (!activeQuestionId) return
    setSavingEdit(true)
    try {
      const normalizedOptions = editOptions
        .filter((o) => o.option_text.trim())
        .map((o, idx) => ({
          option_text: o.option_text.trim(),
          option_order: idx + 1,
          is_correct: o.is_correct,
        }))
      await updateQuestion(activeQuestionId, {
        question_text: editQuestionText,
        question_type: editQuestionType,
        difficulty_level: editDifficulty,
        points: editPoints,
        status: editStatus,
        tips: editTips || undefined,
        explanation: editExplanation || undefined,
        voice_prompt: editVoicePrompt || undefined,
        sample_answer_voice_prompt: editSampleAnswerVoicePrompt || undefined,
        options:
          editQuestionType === "SHORT_ANSWER"
            ? undefined
            : normalizedOptions,
        short_answers:
          editQuestionType === "SHORT_ANSWER"
            ? [
                { acceptable_answer: editShortAnswer, match_type: "EXACT" },
                { acceptable_answer: editShortAnswer, match_type: "CASE_INSENSITIVE" },
              ]
            : undefined,
      })
      setEditOpen(false)
      await fetchQuestions()
    } catch (error) {
      console.error("Failed to update question:", error)
    } finally {
      setSavingEdit(false)
    }
  }

  const toggleOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id],
    )
  }

  const currentPageIds = paginatedQuestions.map((q) => q.id)
  const isAllCurrentPageSelected =
    currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id))

  const toggleSelectAllCurrentPage = () => {
    setSelectedIds((prev) => {
      if (isAllCurrentPageSelected) {
        return prev.filter((id) => !currentPageIds.includes(id))
      }
      const merged = new Set([...prev, ...currentPageIds])
      return Array.from(merged)
    })
  }

  const totalCount = filteredQuestions.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const canGoPrev = page > 1
  const canGoNext = page < totalPages

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-grayScale-600">
            Questions
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-grayScale-400">
            Create and manage your question bank
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            disabled={selectedIds.length === 0}
            onClick={() => handleDeleteRequest(selectedIds)}
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected ({selectedIds.length})
          </Button>
          <Link to="/content/questions/add" className="w-full sm:w-auto">
            <Button className="w-full bg-brand-500 hover:bg-brand-600 sm:w-auto">
              <Plus className="h-4 w-4" />
              Add New Question
            </Button>
          </Link>
        </div>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="border-b border-grayScale-200 pb-4">
          <CardTitle className="text-base font-semibold text-grayScale-600">
            Question Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          {/* Search and Filters */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-300" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 transition-colors focus:border-brand-300 focus:ring-brand-200"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as QuestionTypeFilter)
                }}
              >
                <option value="all">All Types</option>
                <option value="MCQ">Multiple Choice</option>
                <option value="TRUE_FALSE">True/False</option>
                <option value="SHORT_ANSWER">Short Answer</option>
                <option value="AUDIO">Audio</option>
              </Select>
              <Select
                value={difficultyFilter}
                onChange={(e) => {
                  setDifficultyFilter(e.target.value as DifficultyFilter)
                }}
              >
                <option value="all">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </Select>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as StatusFilter)
                }}
              >
                <option value="all">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
              <Select
                value={String(pageSize)}
                onChange={(e) => {
                  const next = Number(e.target.value)
                  setPageSize(next)
                  setPage(1)
                }}
              >
                <option value="10">10 / page</option>
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
              </Select>
            </div>
          </div>

          {/* Results count */}
          <div className="text-xs font-medium text-grayScale-400">
            Showing {paginatedQuestions.length} of {totalCount} questions
          </div>

          {/* Questions Table */}
          {loading ? (
            <div className="flex items-center justify-center rounded-lg border border-grayScale-200 py-16">
              <p className="text-sm text-grayScale-500">Loading questions...</p>
            </div>
          ) : filteredQuestions.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-grayScale-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-grayScale-100 hover:bg-grayScale-100">
                    <TableHead className="w-10 py-3 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                      <input
                        type="checkbox"
                        checked={isAllCurrentPageSelected}
                        onChange={toggleSelectAllCurrentPage}
                        aria-label="Select all questions on current page"
                      />
                    </TableHead>
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                      Question
                    </TableHead>
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                      Type
                    </TableHead>
                    <TableHead className="hidden py-3 text-xs font-semibold uppercase tracking-wider text-grayScale-500 md:table-cell">
                      Difficulty
                    </TableHead>
                    <TableHead className="hidden py-3 text-xs font-semibold uppercase tracking-wider text-grayScale-500 md:table-cell">
                      Status
                    </TableHead>
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                      Points
                    </TableHead>
                    <TableHead className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedQuestions.map((question, index) => (
                    <TableRow
                      key={question.id}
                      onClick={() => openDetails(question.id)}
                      className={`cursor-pointer transition-colors hover:bg-brand-100/30 ${
                        index % 2 === 0 ? "bg-white" : "bg-grayScale-100/50"
                      }`}
                    >
                      <TableCell className="py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(question.id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleOne(question.id)}
                          aria-label={`Select question ${question.id}`}
                        />
                      </TableCell>
                      <TableCell className="max-w-md py-3.5">
                        <div className="truncate text-sm font-medium text-grayScale-600">
                          {question.question_text}
                        </div>
                        {question.question_type === "MCQ" && (question.options?.length ?? 0) > 0 && (
                          <div className="mt-1 truncate text-xs text-grayScale-400">
                            Options: {question.options?.map((opt) => opt.option_text).join(", ")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Badge className={`text-xs font-medium ${typeColors[question.question_type] || "bg-grayScale-100 text-grayScale-600"}`}>
                          {typeLabels[question.question_type] || question.question_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden py-3.5 md:table-cell">
                        {question.difficulty_level && (
                          <Badge
                            variant={
                              question.difficulty_level === "EASY"
                                ? "default"
                                : question.difficulty_level === "MEDIUM"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {question.difficulty_level}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden py-3.5 text-sm text-grayScale-500 md:table-cell">
                        {question.status || "—"}
                      </TableCell>
                      <TableCell className="py-3.5 text-sm font-semibold text-grayScale-600">
                        {question.points ?? 0}
                      </TableCell>
                      <TableCell className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-grayScale-400 hover:bg-brand-100/50 hover:text-brand-500"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEdit(question.id)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-grayScale-400 hover:bg-red-50 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteRequest([question.id])
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-grayScale-200 py-20 text-center">
              <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-grayScale-100 to-grayScale-200">
                <HelpCircle className="h-8 w-8 text-grayScale-400" />
              </div>
              <p className="text-base font-semibold text-grayScale-600">
                No questions found
              </p>
              <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-grayScale-400">
                Try adjusting your search or filter criteria to find what you're
                looking for.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-grayScale-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-grayScale-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!canGoPrev}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!canGoNext}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-grayScale-900">
                Delete {pendingDeleteIds.length > 1 ? "Questions" : "Question"}
              </h2>
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-6">
              <p className="text-sm leading-relaxed text-grayScale-600">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-grayScale-800">
                  {pendingDeleteIds.length} question{pendingDeleteIds.length > 1 ? "s" : ""}
                </span>
                ? This action cannot be undone.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button className="bg-red-500 hover:bg-red-600" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {detailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-grayScale-900">Question Details</h2>
              <button
                onClick={() => setDetailsOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-6">
              {detailLoading || !detailData ? (
                <p className="text-sm text-grayScale-500">Loading details...</p>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-grayScale-500">Question</p>
                    <p className="mt-1 text-sm text-grayScale-700">{detailData.question_text}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <p><span className="font-medium">Type:</span> {typeLabels[detailData.question_type] || detailData.question_type}</p>
                    <p><span className="font-medium">Difficulty:</span> {detailData.difficulty_level || "—"}</p>
                    <p><span className="font-medium">Points:</span> {detailData.points ?? 0}</p>
                    <p><span className="font-medium">Status:</span> {detailData.status || "—"}</p>
                  </div>
                  {(detailData.options ?? []).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-grayScale-500">Options</p>
                      <div className="mt-2 space-y-2">
                        {(detailData.options ?? [])
                          .slice()
                          .sort((a, b) => a.option_order - b.option_order)
                          .map((opt) => (
                            <div
                              key={`${opt.option_order}-${opt.option_text}`}
                              className={`rounded-md border px-3 py-2 text-sm ${
                                opt.is_correct ? "border-green-200 bg-green-50 text-green-700" : "border-grayScale-200 bg-grayScale-50 text-grayScale-600"
                              }`}
                            >
                              {opt.option_order}. {opt.option_text}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-grayScale-900">Edit Question</h2>
              <button
                onClick={() => setEditOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-grayScale-600">Question Text</label>
                <Textarea value={editQuestionText} onChange={(e) => setEditQuestionText(e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <Select value={editQuestionType} onChange={(e) => setEditQuestionType(e.target.value as QuestionTypeEdit)}>
                  <option value="MCQ">Multiple Choice</option>
                  <option value="TRUE_FALSE">True/False</option>
                  <option value="SHORT_ANSWER">Short Answer</option>
                  <option value="AUDIO">Audio</option>
                </Select>
                <Select value={editDifficulty} onChange={(e) => setEditDifficulty(e.target.value)}>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </Select>
                <Input type="number" min={1} value={editPoints} onChange={(e) => setEditPoints(Number(e.target.value) || 1)} />
                <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="INACTIVE">Inactive</option>
                </Select>
              </div>
              {editQuestionType !== "SHORT_ANSWER" && editQuestionType !== "AUDIO" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-grayScale-600">Options</label>
                  {editOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={opt.is_correct}
                        onChange={() =>
                          setEditOptions((prev) =>
                            prev.map((item, i) => ({ ...item, is_correct: i === idx })),
                          )
                        }
                      />
                      <Input
                        value={opt.option_text}
                        onChange={(e) =>
                          setEditOptions((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, option_text: e.target.value } : item,
                            ),
                          )
                        }
                        placeholder={`Option ${idx + 1}`}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEditOptions((prev) => [
                        ...prev,
                        { option_text: "", option_order: prev.length + 1, is_correct: false },
                      ])
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Add Option
                  </Button>
                </div>
              )}
              {editQuestionType === "SHORT_ANSWER" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-grayScale-600">Short Answer</label>
                  <Input value={editShortAnswer} onChange={(e) => setEditShortAnswer(e.target.value)} />
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input value={editTips} onChange={(e) => setEditTips(e.target.value)} placeholder="Tips (optional)" />
                <Input value={editExplanation} onChange={(e) => setEditExplanation(e.target.value)} placeholder="Explanation (optional)" />
                <Input value={editVoicePrompt} onChange={(e) => setEditVoicePrompt(e.target.value)} placeholder="Voice prompt (optional)" />
                <Input value={editSampleAnswerVoicePrompt} onChange={(e) => setEditSampleAnswerVoicePrompt(e.target.value)} placeholder="Sample answer voice prompt (optional)" />
              </div>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={savingEdit}>
                Cancel
              </Button>
              <Button className="bg-brand-500 hover:bg-brand-600" onClick={saveEdit} disabled={savingEdit}>
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
