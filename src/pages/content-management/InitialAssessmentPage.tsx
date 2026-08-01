import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  ClipboardList,
  HelpCircle,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import {
  createAndAttachPlacementQuestion,
  detachPlacementQuestion,
  ensurePlacementAssessmentSet,
  getPlacementQuestionDetail,
  listPlacementQuestions,
  savePlacementAssessmentSet,
  type PlacementQuestionDetail,
  type PlacementQuestionRow,
} from "../../api/initial-assessment.api"
import { updateQuestion } from "../../api/courses.api"
import { notifyApiError } from "../../lib/apiErrors"
import { DEFAULT_TABLE_PAGE_SIZE } from "../../lib/tablePagination"
import { InitialAssessmentThresholdsTab } from "../settings/InitialAssessmentThresholdsTab"
import { TablePagination } from "../../components/admin/TablePagination"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"
import { Select } from "../../components/ui/select"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Textarea } from "../../components/ui/textarea"
import { ToggleSwitch } from "../../components/ui/toggle-switch"
import { cn } from "../../lib/utils"
import type { QuestionSetDetail } from "../../types/course.types"

type TabId = "set" | "questions" | "thresholds"
type DraftQuestionType = "MCQ" | "TRUE_FALSE"

interface DraftOption {
  text: string
  isCorrect: boolean
}

interface QuestionDraft {
  questionText: string
  questionType: DraftQuestionType
  difficulty: "EASY" | "MEDIUM" | "HARD"
  points: number
  options: DraftOption[]
  tips: string
  explanation: string
}

const emptyDraft = (): QuestionDraft => ({
  questionText: "",
  questionType: "MCQ",
  difficulty: "EASY",
  points: 1,
  options: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ],
  tips: "",
  explanation: "",
})

const typeColors: Record<string, string> = {
  MCQ: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  TRUE_FALSE: "bg-brand-100 text-brand-700 ring-1 ring-inset ring-brand-200",
  SHORT_ANSWER: "bg-mint-100 text-green-700 ring-1 ring-inset ring-green-200",
  SHORT: "bg-mint-100 text-green-700 ring-1 ring-inset ring-green-200",
  AUDIO: "bg-purple-100 text-purple-700 ring-1 ring-inset ring-purple-200",
  DYNAMIC: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200",
}

const typeLabels: Record<string, string> = {
  MCQ: "Multiple choice",
  TRUE_FALSE: "True / False",
  SHORT_ANSWER: "Short answer",
  SHORT: "Short answer",
  AUDIO: "Audio",
  DYNAMIC: "Dynamic",
}

const difficultyColors: Record<string, string> = {
  EASY: "bg-mint-50 text-green-700 ring-1 ring-inset ring-green-200",
  MEDIUM: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200",
  HARD: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
}

function draftFromQuestionDetail(q: PlacementQuestionDetail): QuestionDraft {
  const rawType = String(q.question_type ?? "MCQ").toUpperCase()
  const questionType: DraftQuestionType = rawType === "TRUE_FALSE" ? "TRUE_FALSE" : "MCQ"
  const difficulty =
    q.difficulty_level === "MEDIUM" || q.difficulty_level === "HARD"
      ? q.difficulty_level
      : q.difficulty_level === "EASY"
        ? "EASY"
        : "EASY"

  const sortedOptions = [...(q.options ?? [])].sort(
    (a, b) => Number(a.option_order ?? 0) - Number(b.option_order ?? 0),
  )

  let options: DraftOption[]
  if (questionType === "TRUE_FALSE") {
    const trueOpt = sortedOptions.find((o) => String(o.option_text).toLowerCase() === "true")
    const falseOpt = sortedOptions.find((o) => String(o.option_text).toLowerCase() === "false")
    const correctIsTrue = trueOpt?.is_correct
      ? true
      : falseOpt?.is_correct
        ? false
        : sortedOptions.find((o) => o.is_correct)?.option_text?.toLowerCase() !== "false"
    options = [
      { text: "True", isCorrect: correctIsTrue },
      { text: "False", isCorrect: !correctIsTrue },
    ]
  } else {
    options = sortedOptions.map((o) => ({
      text: String(o.option_text ?? ""),
      isCorrect: Boolean(o.is_correct),
    }))
    while (options.length < 2) {
      options.push({ text: "", isCorrect: false })
    }
    if (!options.some((o) => o.isCorrect) && options.length > 0) {
      options[0] = { ...options[0], isCorrect: true }
    }
  }

  return {
    questionText: String(q.question_text ?? ""),
    questionType,
    difficulty,
    points: Number(q.points ?? 1) || 1,
    options,
    tips: String(q.tips ?? ""),
    explanation: String(q.explanation ?? ""),
  }
}

function draftsEqual(a: QuestionDraft, b: QuestionDraft): boolean {
  if (
    a.questionText !== b.questionText ||
    a.questionType !== b.questionType ||
    a.difficulty !== b.difficulty ||
    a.points !== b.points ||
    a.tips !== b.tips ||
    a.explanation !== b.explanation ||
    a.options.length !== b.options.length
  ) {
    return false
  }
  return a.options.every(
    (opt, i) => opt.text === b.options[i]?.text && opt.isCorrect === b.options[i]?.isCorrect,
  )
}

function normalizeTimeLimitValue(raw: number | null | undefined): string {
  return raw != null && raw > 0 ? String(raw) : ""
}

export function InitialAssessmentPage() {
  const [tab, setTab] = useState<TabId>("set")
  const [loading, setLoading] = useState(true)
  const [savingSet, setSavingSet] = useState(false)
  const [setDetail, setSetDetail] = useState<QuestionSetDetail | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("PLACEMENT")
  const [status, setStatus] = useState("DRAFT")
  const [shuffle, setShuffle] = useState(false)
  const [timeLimit, setTimeLimit] = useState<string>("")

  const [questions, setQuestions] = useState<PlacementQuestionRow[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null)
  const [editingStatus, setEditingStatus] = useState<string>("PUBLISHED")
  const [formLoading, setFormLoading] = useState(false)
  const [draft, setDraft] = useState<QuestionDraft>(emptyDraft)
  const [draftBaseline, setDraftBaseline] = useState<QuestionDraft>(emptyDraft)
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PlacementQuestionRow | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null)
  const [questionsPage, setQuestionsPage] = useState(1)
  const [questionsPageSize, setQuestionsPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE)
  const [questionsSearch, setQuestionsSearch] = useState("")

  const setFormDirty = useMemo(() => {
    if (!setDetail) return false
    const savedTitle = setDetail.title || "Initial Placement Assessment"
    const savedDescription = setDetail.description || "PLACEMENT"
    const savedShuffle = Boolean(setDetail.shuffle_questions)
    const savedTimeLimit = normalizeTimeLimitValue(setDetail.time_limit_minutes)
    return (
      title.trim() !== savedTitle.trim() ||
      (description.trim() || "PLACEMENT") !== savedDescription.trim() ||
      shuffle !== savedShuffle ||
      timeLimit.trim() !== savedTimeLimit
    )
  }, [setDetail, title, description, shuffle, timeLimit])

  const questionFormDirty = useMemo(() => !draftsEqual(draft, draftBaseline), [draft, draftBaseline])

  const loadSet = useCallback(async () => {
    setLoading(true)
    try {
      const detail = await ensurePlacementAssessmentSet()
      setSetDetail(detail)
      setTitle(detail.title || "Initial Placement Assessment")
      setDescription(detail.description || "PLACEMENT")
      setStatus(String(detail.status || "DRAFT").toUpperCase())
      setShuffle(Boolean(detail.shuffle_questions))
      setTimeLimit(normalizeTimeLimitValue(detail.time_limit_minutes))
    } catch (e) {
      console.error(e)
      notifyApiError(e, "Failed to load placement assessment")
      setSetDetail(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadQuestions = useCallback(async (setId: number) => {
    setQuestionsLoading(true)
    try {
      const rows = await listPlacementQuestions(setId)
      setQuestions(rows)
    } catch (e) {
      console.error(e)
      notifyApiError(e, "Failed to load placement questions")
      setQuestions([])
    } finally {
      setQuestionsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSet()
  }, [loadSet])

  useEffect(() => {
    if (setDetail?.id && (tab === "questions" || tab === "set")) {
      void loadQuestions(setDetail.id)
    }
  }, [setDetail?.id, tab, loadQuestions])

  const totalPoints = useMemo(
    () => questions.reduce((sum, q) => sum + (Number.isFinite(q.points) ? q.points : 0), 0),
    [questions],
  )

  const questionsSorted = useMemo(
    () =>
      [...questions].sort(
        (a, b) =>
          a.displayOrder - b.displayOrder ||
          a.questionId - b.questionId,
      ),
    [questions],
  )

  const filteredQuestions = useMemo(() => {
    const q = questionsSearch.trim().toLowerCase()
    if (!q) return questionsSorted
    return questionsSorted.filter((row) => {
      const typeLabel = (typeLabels[row.questionType] ?? row.questionType).toLowerCase()
      const haystack = [
        row.questionText,
        String(row.questionId),
        row.questionType,
        typeLabel,
        row.difficultyLevel,
        row.status,
        String(row.points),
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [questionsSorted, questionsSearch])

  const questionsPageCount = Math.max(1, Math.ceil(filteredQuestions.length / questionsPageSize))
  const safeQuestionsPage = Math.min(questionsPage, questionsPageCount)
  const paginatedQuestions = useMemo(() => {
    const start = (safeQuestionsPage - 1) * questionsPageSize
    return filteredQuestions.slice(start, start + questionsPageSize)
  }, [filteredQuestions, safeQuestionsPage, questionsPageSize])
  const questionsStartEntry =
    filteredQuestions.length === 0 ? 0 : (safeQuestionsPage - 1) * questionsPageSize + 1
  const questionsEndEntry = Math.min(safeQuestionsPage * questionsPageSize, filteredQuestions.length)

  useEffect(() => {
    setQuestionsPage(1)
  }, [questionsPageSize, setDetail?.id, questionsSearch])

  const handleSaveSet = async () => {
    if (!setDetail) return
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }
    setSavingSet(true)
    try {
      const updated = await savePlacementAssessmentSet(setDetail.id, {
        title: title.trim(),
        description: description.trim() || "PLACEMENT",
        status,
        shuffle_questions: shuffle,
        time_limit_minutes: timeLimit.trim() ? Number(timeLimit) : null,
        owner_type: "STANDALONE",
        owner_id: null,
        set_type: "INITIAL_ASSESSMENT",
      })
      setSetDetail(updated)
      toast.success("Placement set saved")
    } catch (e) {
      notifyApiError(e, "Failed to save placement set")
    } finally {
      setSavingSet(false)
    }
  }

  const handlePublishToggle = async (nextPublished: boolean) => {
    if (!setDetail) return
    if (nextPublished && questions.length === 0) {
      toast.error("Add at least one question before publishing")
      setTab("questions")
      return
    }
    const publishedCount = questions.filter(
      (q) => String(q.status).toUpperCase() === "PUBLISHED",
    ).length
    if (nextPublished && publishedCount === 0) {
      toast.error("Publish at least one question before going live — draft questions are hidden from the app")
      setTab("questions")
      return
    }
    setSavingSet(true)
    try {
      const nextStatus = nextPublished ? "PUBLISHED" : "DRAFT"
      const updated = await savePlacementAssessmentSet(setDetail.id, {
        title: title.trim() || setDetail.title,
        description: description.trim() || "PLACEMENT",
        status: nextStatus,
        shuffle_questions: shuffle,
        time_limit_minutes: timeLimit.trim() ? Number(timeLimit) : null,
        owner_type: "STANDALONE",
        set_type: "INITIAL_ASSESSMENT",
      })
      setSetDetail(updated)
      setStatus(nextStatus)
      toast.success(nextPublished ? "Placement assessment published" : "Placement assessment unpublished")
    } catch (e) {
      notifyApiError(e, "Failed to update publish status")
    } finally {
      setSavingSet(false)
    }
  }

  const closeQuestionForm = () => {
    setAddOpen(false)
    setEditingQuestionId(null)
    setEditingStatus("PUBLISHED")
    const blank = emptyDraft()
    setDraft(blank)
    setDraftBaseline(blank)
    setFormLoading(false)
  }

  const openCreateQuestion = () => {
    setEditingQuestionId(null)
    setEditingStatus("PUBLISHED")
    const blank = emptyDraft()
    setDraft(blank)
    setDraftBaseline(blank)
    setAddOpen(true)
  }

  const openEditQuestion = async (questionId: number) => {
    setEditingQuestionId(questionId)
    const blank = emptyDraft()
    setDraft(blank)
    setDraftBaseline(blank)
    setAddOpen(true)
    setFormLoading(true)
    try {
      const detail = await getPlacementQuestionDetail(questionId)
      const questionType = String(detail.question_type ?? "").toUpperCase()
      if (questionType !== "MCQ" && questionType !== "TRUE_FALSE") {
        toast.error("Only multiple choice and true/false questions can be edited here")
        closeQuestionForm()
        return
      }
      setEditingStatus(
        detail.status && detail.status !== "unassigned" ? detail.status : "DRAFT",
      )
      const nextDraft = draftFromQuestionDetail(detail)
      setDraft(nextDraft)
      setDraftBaseline(nextDraft)
    } catch (e) {
      notifyApiError(e, "Failed to load question")
      closeQuestionForm()
    } finally {
      setFormLoading(false)
    }
  }

  const validateDraft = (): string | null => {
    if (!draft.questionText.trim()) return "Question text is required"
    if (draft.points < 1) return "Points must be at least 1"
    const filled = draft.options.filter((o) => o.text.trim())
    if (filled.length < 2) return "Add at least two options"
    if (!filled.some((o) => o.isCorrect)) return "Mark one correct option"
    return null
  }

  const buildQuestionPayload = () => ({
    question_text: draft.questionText.trim(),
    question_type: draft.questionType,
    difficulty_level: draft.difficulty,
    points: draft.points,
    status: editingQuestionId != null ? editingStatus : "PUBLISHED",
    tips: draft.tips.trim() || undefined,
    explanation: draft.explanation.trim() || undefined,
    options: draft.options
      .filter((o) => o.text.trim())
      .map((o, idx) => ({
        option_order: idx + 1,
        option_text: o.text.trim(),
        is_correct: o.isCorrect,
      })),
  })

  const handleSaveQuestion = async () => {
    if (!setDetail) return
    const error = validateDraft()
    if (error) {
      toast.error(error)
      return
    }
    setSavingQuestion(true)
    try {
      const payload = buildQuestionPayload()
      if (editingQuestionId != null) {
        await updateQuestion(editingQuestionId, payload)
        toast.success("Question updated")
      } else {
        await createAndAttachPlacementQuestion(setDetail.id, payload)
        toast.success("Question added to placement set")
      }
      closeQuestionForm()
      await loadQuestions(setDetail.id)
      await loadSet()
    } catch (e) {
      notifyApiError(e, editingQuestionId != null ? "Failed to update question" : "Failed to add question")
    } finally {
      setSavingQuestion(false)
    }
  }

  const handleRemoveQuestion = async (questionId: number) => {
    if (!setDetail) return
    setRemovingId(questionId)
    try {
      await detachPlacementQuestion(setDetail.id, questionId)
      toast.success("Question removed from placement set")
      setPendingDelete(null)
      await loadQuestions(setDetail.id)
      await loadSet()
    } catch (e) {
      notifyApiError(e, "Failed to remove question")
    } finally {
      setRemovingId(null)
    }
  }

  const handleToggleQuestionStatus = async (row: PlacementQuestionRow) => {
    const currentlyPublished = String(row.status).toUpperCase() === "PUBLISHED"
    const nextStatus = currentlyPublished ? "DRAFT" : "PUBLISHED"
    setStatusUpdatingId(row.questionId)
    try {
      const detail = await getPlacementQuestionDetail(row.questionId)
      const questionType =
        String(detail.question_type).toUpperCase() === "TRUE_FALSE" ? "TRUE_FALSE" : "MCQ"
      const difficulty =
        detail.difficulty_level === "MEDIUM" || detail.difficulty_level === "HARD"
          ? detail.difficulty_level
          : "EASY"
      const questionText =
        detail.question_text.trim() ||
        row.questionText.trim() ||
        `Question #${row.questionId}`

      await updateQuestion(row.questionId, {
        question_text: questionText,
        question_type: questionType,
        difficulty_level: difficulty,
        points: detail.points || row.points || 1,
        status: nextStatus,
        tips: detail.tips.trim() || undefined,
        explanation: detail.explanation.trim() || undefined,
        options:
          detail.options.length > 0
            ? detail.options.map((o, idx) => ({
                option_order: o.option_order || idx + 1,
                option_text: o.option_text,
                is_correct: o.is_correct,
              }))
            : undefined,
      })

      setQuestions((prev) =>
        prev.map((q) =>
          q.questionId === row.questionId ? { ...q, status: nextStatus } : q,
        ),
      )
      toast.success(
        nextStatus === "PUBLISHED"
          ? "Question published for the placement test"
          : "Question set to draft (hidden from the app)",
      )
    } catch (e) {
      notifyApiError(e, "Failed to update question status")
    } finally {
      setStatusUpdatingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[420px] items-center justify-center">
        <SpinnerIcon className="h-8 w-8 text-brand-500" />
      </div>
    )
  }

  if (!setDetail) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-semibold text-grayScale-800">Could not load placement assessment</p>
        <Button className="mt-4" onClick={() => void loadSet()}>
          Retry
        </Button>
      </div>
    )
  }

  const published = status === "PUBLISHED"

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-grayScale-400">
            Content
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-grayScale-900">
            Initial placement assessment
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-grayScale-500">
            Manage the single learner placement test, its questions, and the A1–C2 score thresholds used
            when grading submissions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={published ? "success" : "secondary"}>
            {published ? "Published" : "Draft"}
          </Badge>
          <div className="flex items-center gap-2 rounded-xl border border-grayScale-200 bg-white px-3 py-2">
            <span className="text-xs font-medium text-grayScale-500">Live for learners</span>
            <ToggleSwitch
              checked={published}
              onCheckedChange={() => void handlePublishToggle(!published)}
              disabled={savingSet}
              aria-label="Publish placement assessment"
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void loadSet()} disabled={loading}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Card className="rounded-xl border-grayScale-200/70 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <ClipboardList className="h-5 w-5 text-brand-500" />
            <div>
              <div className="text-xs text-grayScale-400">Questions</div>
              <div className="text-lg font-semibold text-grayScale-900">
                {setDetail.question_count ?? questions.length}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-grayScale-200/70 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-5 w-5 text-mint-500" />
            <div>
              <div className="text-xs text-grayScale-400">Total points</div>
              <div className="text-lg font-semibold text-grayScale-900">{totalPoints}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-grayScale-100">
        {(
          [
            { id: "set", label: "Placement set" },
            { id: "questions", label: "Questions" },
            { id: "thresholds", label: "Score thresholds" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              tab === item.id
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-grayScale-500 hover:text-grayScale-700",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "set" && (
        <Card className="rounded-xl border-grayScale-200/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-base font-bold">Placement set settings</CardTitle>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleSaveSet()}
              disabled={savingSet || !setFormDirty}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {savingSet ? "Saving…" : "Save"}
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-grayScale-400">Title</span>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-grayScale-400">
                Description
              </span>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description for admins"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-grayScale-400">
                Time limit (minutes)
              </span>
              <Input
                type="number"
                min={0}
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                placeholder="Optional"
              />
            </label>
            <div className="flex items-end justify-between rounded-xl border border-grayScale-200 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-grayScale-800">Shuffle questions</div>
                <div className="text-xs text-grayScale-400">Randomize order for each learner attempt</div>
              </div>
              <ToggleSwitch checked={shuffle} onCheckedChange={() => setShuffle((v) => !v)} />
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "questions" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-grayScale-900">Placement questions</h2>
              <p className="text-sm text-grayScale-500">
                Multiple choice and true/false only. Publish each question so it appears in the mobile
                placement test.
              </p>
            </div>
            <Button type="button" size="sm" onClick={openCreateQuestion}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add question
            </Button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
            <Input
              value={questionsSearch}
              onChange={(e) => setQuestionsSearch(e.target.value)}
              placeholder="Search by text, ID, type, difficulty, or status…"
              className="pl-9"
              aria-label="Search placement questions"
            />
          </div>

          <div className="min-w-0 overflow-hidden rounded-xl border border-grayScale-200 bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-grayScale-50/80 hover:bg-grayScale-50/80">
                  <TableHead className="w-14">#</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead className="hidden sm:table-cell w-[140px]">Type</TableHead>
                  <TableHead className="hidden md:table-cell w-[110px]">Difficulty</TableHead>
                  <TableHead className="hidden lg:table-cell w-20 text-right">Points</TableHead>
                  <TableHead className="w-[120px]">Published</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questionsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-14 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <SpinnerIcon className="h-7 w-7 text-brand-500" />
                        <span className="text-sm text-grayScale-400">Loading questions…</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : questionsSorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-14 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <HelpCircle className="h-8 w-8 text-grayScale-200" />
                        <div>
                          <p className="text-sm font-medium text-grayScale-500">No questions yet</p>
                          <p className="mt-1 text-xs text-grayScale-400">
                            Add multiple choice or true/false items to get started.
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredQuestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-14 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Search className="h-8 w-8 text-grayScale-200" />
                        <div>
                          <p className="text-sm font-medium text-grayScale-500">No matching questions</p>
                          <p className="mt-1 text-xs text-grayScale-400">
                            Try a different search, or clear the search box.
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedQuestions.map((q, idx) => (
                    <TableRow key={`${q.setItemId}-${q.questionId}`} className="group">
                      <TableCell className="font-medium text-grayScale-400">
                        {(safeQuestionsPage - 1) * questionsPageSize + idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0 max-w-xl">
                          <p className="line-clamp-2 text-sm font-medium text-grayScale-800">
                            {q.questionText}
                          </p>
                          <p className="mt-0.5 text-xs text-grayScale-400 sm:hidden">
                            {typeLabels[q.questionType] ?? q.questionType}
                            {" · "}
                            {q.points} pts
                          </p>
                          <p className="mt-0.5 text-xs text-grayScale-400">ID #{q.questionId}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                            typeColors[q.questionType] ?? "bg-grayScale-100 text-grayScale-600",
                          )}
                        >
                          {typeLabels[q.questionType] ?? q.questionType}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize",
                            difficultyColors[String(q.difficultyLevel).toUpperCase()] ??
                              "bg-grayScale-100 text-grayScale-600",
                          )}
                        >
                          {(() => {
                            const value = String(q.difficultyLevel ?? "").trim()
                            if (!value || value === "unassigned" || value === "-") return "unassigned"
                            return value.toLowerCase()
                          })()}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-right font-medium text-grayScale-700 lg:table-cell">
                        {Number.isFinite(q.points) ? q.points : "unassigned"}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <ToggleSwitch
                            checked={String(q.status).toUpperCase() === "PUBLISHED"}
                            disabled={statusUpdatingId === q.questionId}
                            onCheckedChange={() => void handleToggleQuestionStatus(q)}
                            aria-label={
                              String(q.status).toUpperCase() === "PUBLISHED"
                                ? `Unpublish question ${q.questionId}`
                                : `Publish question ${q.questionId}`
                            }
                          />
                          <span className="text-xs text-grayScale-500">
                            {String(q.status).toUpperCase() === "PUBLISHED" ? "Live" : "Draft"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => void openEditQuestion(q.questionId)}
                            aria-label={`Edit question ${q.questionId}`}
                          >
                            <Pencil className="h-3.5 w-3.5 text-grayScale-500" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={removingId === q.questionId}
                            onClick={() => setPendingDelete(q)}
                            aria-label={`Remove question ${q.questionId}`}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              startEntry={questionsStartEntry}
              endEntry={questionsEndEntry}
              totalCount={filteredQuestions.length}
              pageSize={questionsPageSize}
              onPageSizeChange={(size) => {
                setQuestionsPageSize(size)
                setQuestionsPage(1)
              }}
              currentPage={safeQuestionsPage}
              totalPages={questionsPageCount}
              onPageChange={setQuestionsPage}
              disabled={questionsLoading}
            />
          </div>
        </div>
      )}

      {tab === "thresholds" && <InitialAssessmentThresholdsTab />}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-5 py-4">
              <h3 className="text-base font-semibold text-grayScale-900">
                {editingQuestionId != null ? "Edit placement question" : "Add placement question"}
              </h3>
              <button
                type="button"
                onClick={closeQuestionForm}
                className="rounded-lg p-1 hover:bg-grayScale-100"
                disabled={savingQuestion}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {formLoading ? (
              <div className="flex h-56 items-center justify-center">
                <SpinnerIcon className="h-7 w-7 text-brand-500" />
              </div>
            ) : (
              <>
                <div className="space-y-4 p-5">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-grayScale-400">Type</span>
                    <Select
                      value={draft.questionType}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          questionType: e.target.value as DraftQuestionType,
                          options:
                            e.target.value === "TRUE_FALSE"
                              ? [
                                  { text: "True", isCorrect: true },
                                  { text: "False", isCorrect: false },
                                ]
                              : emptyDraft().options,
                        }))
                      }
                    >
                      <option value="MCQ">Multiple choice</option>
                      <option value="TRUE_FALSE">True / False</option>
                    </Select>
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-grayScale-400">
                      Question text
                    </span>
                    <Textarea
                      rows={3}
                      value={draft.questionText}
                      onChange={(e) => setDraft((d) => ({ ...d, questionText: e.target.value }))}
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-grayScale-400">
                        Difficulty
                      </span>
                      <Select
                        value={draft.difficulty}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            difficulty: e.target.value as QuestionDraft["difficulty"],
                          }))
                        }
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </Select>
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-grayScale-400">
                        Points
                      </span>
                      <Input
                        type="number"
                        min={1}
                        value={draft.points}
                        onChange={(e) => setDraft((d) => ({ ...d, points: Number(e.target.value) || 1 }))}
                      />
                    </label>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-grayScale-400">
                      Options
                    </div>
                    {draft.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correct-option"
                          checked={opt.isCorrect}
                          onChange={() =>
                            setDraft((d) => ({
                              ...d,
                              options: d.options.map((o, i) => ({ ...o, isCorrect: i === idx })),
                            }))
                          }
                        />
                        <Input
                          value={opt.text}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              options: d.options.map((o, i) =>
                                i === idx ? { ...o, text: e.target.value } : o,
                              ),
                            }))
                          }
                          placeholder={`Option ${idx + 1}`}
                          disabled={draft.questionType === "TRUE_FALSE"}
                        />
                      </div>
                    ))}
                  </div>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-grayScale-400">
                      Tips
                    </span>
                    <Input
                      value={draft.tips}
                      onChange={(e) => setDraft((d) => ({ ...d, tips: e.target.value }))}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-grayScale-400">
                      Explanation
                    </span>
                    <Textarea
                      rows={2}
                      value={draft.explanation}
                      onChange={(e) => setDraft((d) => ({ ...d, explanation: e.target.value }))}
                    />
                  </label>
                </div>
                <div className="flex justify-end gap-2 border-t border-grayScale-100 px-5 py-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeQuestionForm}
                    disabled={savingQuestion}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleSaveQuestion()}
                    disabled={savingQuestion || formLoading || !questionFormDirty}
                  >
                    {savingQuestion
                      ? "Saving…"
                      : editingQuestionId != null
                        ? "Save changes"
                        : "Add question"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Dialog
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open && removingId == null) setPendingDelete(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove question?</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `Remove “${pendingDelete.questionText}” from this placement set? The question stays in the library.`
                : "Remove this question from the placement set?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 border-t border-grayScale-100 px-6 py-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={removingId != null}
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pendingDelete == null || removingId != null}
              onClick={() => {
                if (pendingDelete) void handleRemoveQuestion(pendingDelete.questionId)
              }}
            >
              {removingId != null ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
