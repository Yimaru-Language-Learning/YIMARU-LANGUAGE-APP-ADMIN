import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Search, Edit, Trash2, HelpCircle, X, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import spinnerSrc from "../../assets/Circular-indeterminate progress indicator.svg"
import { Button } from "../../components/ui/button"
import { AdminFiltersPanel } from "../../components/filters/AdminFiltersPanel"
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
import { countActiveFilters } from "../../lib/adminFilterUtils"
import type { QuestionDetail } from "../../types/course.types"
import { cn } from "../../lib/utils"
import { PageBackLink } from "../../components/navigation/PageBackLink"
import { TABLE_PAGE_SIZE_OPTIONS } from "../../lib/tablePagination"

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
  const safePage = Math.min(page, totalPages)
  const startEntry = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1
  const endEntry = Math.min(safePage * pageSize, totalCount)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1, 2, 3)
      if (safePage > 4) pages.push("...")
      if (safePage > 3 && safePage < totalPages - 2) pages.push(safePage)
      if (safePage < totalPages - 3) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }

  const clearFilters = () => {
    setTypeFilter("all")
    setDifficultyFilter("all")
    setStatusFilter("all")
    setPage(1)
  }

  const activeFilterCount = countActiveFilters([
    { value: typeFilter, defaultValue: "all" },
    { value: difficultyFilter, defaultValue: "all" },
    { value: statusFilter, defaultValue: "all" },
  ])

  return (
    <div className="space-y-8">
      <PageBackLink fallbackTo="/content" label="Back" />
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
          <AdminFiltersPanel
            className="border-0 shadow-none"
            activeFilterCount={activeFilterCount}
            onClearFilters={clearFilters}
            summary={`Showing ${paginatedQuestions.length} of ${totalCount} questions`}
            search={
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-300" />
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 transition-colors focus:border-brand-300 focus:ring-brand-200"
                />
              </div>
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as QuestionTypeFilter)
                  setPage(1)
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
                  setPage(1)
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
                  setPage(1)
                }}
              >
                <option value="all">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </div>
          </AdminFiltersPanel>

          <div className="min-w-0 overflow-hidden rounded-xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={isAllCurrentPageSelected}
                      onChange={toggleSelectAllCurrentPage}
                      aria-label="Select all questions on current page"
                    />
                  </TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Difficulty</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <img src={spinnerSrc} alt="" className="h-6 w-6 animate-spin" />
                        <span className="text-sm text-grayScale-400">Loading questions...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredQuestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <HelpCircle className="h-8 w-8 text-grayScale-200" />
                        <div>
                          <p className="text-sm font-medium text-grayScale-500">No questions found</p>
                          <p className="mt-1 text-xs text-grayScale-400">Try adjusting your filters</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedQuestions.map((question) => (
                    <TableRow
                      key={question.id}
                      onClick={() => openDetails(question.id)}
                      className="group cursor-pointer"
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
                        {question.status || "unassigned"}
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
                  ))
                )}
              </TableBody>
            </Table>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-grayScale-500">
              <div className="flex items-center gap-2">
                <span>Showing</span>
                <span className="font-medium text-grayScale-600">
                  {startEntry}-{endEntry}
                </span>
                <span>of</span>
                <span className="font-medium text-grayScale-600">{totalCount}</span>
                <span className="mr-4">entries</span>
                <span className="border-l pl-4">Rows per page</span>
                <div className="relative">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setPage(1)
                    }}
                    className="h-8 appearance-none rounded-md border bg-white pl-2 pr-7 text-sm font-medium text-grayScale-600 focus:outline-none"
                  >
                    {TABLE_PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-grayScale-400" />
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => safePage > 1 && setPage(safePage - 1)}
                  disabled={safePage === 1}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md border bg-white text-grayScale-500",
                    safePage === 1 && "cursor-not-allowed opacity-50",
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {getPageNumbers().map((n, idx) =>
                  typeof n === "string" ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-grayScale-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      className={cn(
                        "h-8 w-8 rounded-md border text-sm font-medium",
                        n === safePage
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "bg-white text-grayScale-600 hover:bg-grayScale-50",
                      )}
                    >
                      {n}
                    </button>
                  ),
                )}
                <button
                  onClick={() => safePage < totalPages && setPage(safePage + 1)}
                  disabled={safePage === totalPages}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md border bg-white text-grayScale-500",
                    safePage === totalPages && "cursor-not-allowed opacity-50",
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-4 py-4 sm:px-6">
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
            <div className="flex items-center justify-between border-b border-grayScale-100 px-4 py-4 sm:px-6">
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
                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <p><span className="font-medium">ID:</span> {detailData.id}</p>
                    <p><span className="font-medium">Type:</span> {typeLabels[detailData.question_type] || detailData.question_type}</p>
                    <p><span className="font-medium">Difficulty:</span> {detailData.difficulty_level || "unassigned"}</p>
                    <p><span className="font-medium">Points:</span> {detailData.points ?? 0}</p>
                    <p><span className="font-medium">Status:</span> {detailData.status || "unassigned"}</p>
                    <p><span className="font-medium">Created:</span> {detailData.created_at || "unassigned"}</p>
                  </div>
                  {detailData.explanation ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-grayScale-500">Explanation</p>
                      <p className="mt-1 text-sm text-grayScale-700">{detailData.explanation}</p>
                    </div>
                  ) : null}
                  {detailData.tips ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-grayScale-500">Tips</p>
                      <p className="mt-1 text-sm text-grayScale-700">{detailData.tips}</p>
                    </div>
                  ) : null}
                  {detailData.audio_correct_answer_text ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-grayScale-500">Audio Correct Answer Text</p>
                      <p className="mt-1 text-sm text-grayScale-700">{detailData.audio_correct_answer_text}</p>
                    </div>
                  ) : null}
                  {detailData.voice_prompt ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-grayScale-500">Voice Prompt</p>
                      <p className="mt-1 break-all text-xs text-grayScale-500">{detailData.voice_prompt}</p>
                      <audio controls src={detailData.voice_prompt} className="mt-2 h-10 w-full max-w-md" />
                    </div>
                  ) : null}
                  {detailData.sample_answer_voice_prompt ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-grayScale-500">Sample Answer Voice Prompt</p>
                      <p className="mt-1 break-all text-xs text-grayScale-500">{detailData.sample_answer_voice_prompt}</p>
                      <audio controls src={detailData.sample_answer_voice_prompt} className="mt-2 h-10 w-full max-w-md" />
                    </div>
                  ) : null}
                  {detailData.image_url ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-grayScale-500">Image</p>
                      <p className="mt-1 break-all text-xs text-grayScale-500">{detailData.image_url}</p>
                      <img
                        src={detailData.image_url}
                        alt="Question reference"
                        className="mt-2 h-28 w-28 rounded-md border border-grayScale-200 object-cover"
                      />
                    </div>
                  ) : null}
                  {Array.isArray(detailData.short_answers) && detailData.short_answers.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-grayScale-500">Short Answers</p>
                      <div className="mt-2 space-y-1 text-sm text-grayScale-700">
                        {detailData.short_answers.map((answer, index) => {
                          const value =
                            typeof answer === "string"
                              ? answer
                              : (answer as { acceptable_answer?: string }).acceptable_answer || ""
                          return (
                            <p key={`${value}-${index}`} className="rounded-md border border-grayScale-200 bg-grayScale-50 px-2 py-1">
                              {value || "unassigned"}
                            </p>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}
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
            <div className="flex items-center justify-between border-b border-grayScale-100 px-4 py-4 sm:px-6">
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
