import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { ArrowLeft, Plus, Edit, Trash2, X, Check, ChevronDown, ChevronUp, SlidersHorizontal, ArrowUpDown } from "lucide-react"
import practiceSrc from "../../assets/Practice.svg"
import spinnerSrc from "../../assets/Circular-indeterminate progress indicator.svg"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import alertSrc from "../../assets/Alert.svg"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import {
  getQuestionSetById,
  getPracticeQuestionsByPractice,
  getQuestionById,
  deleteQuestion,
  updateQuestion,
  createQuestion,
  addQuestionToSet,
} from "../../api/courses.api"
import { Input } from "../../components/ui/input"
import { Select } from "../../components/ui/select"
import { Textarea } from "../../components/ui/textarea"
import type { PracticeQuestion, QuestionSetQuestion, QuestionDetail } from "../../types/course.types"

type QuestionType = "MCQ" | "TRUE_FALSE" | "SHORT" | "AUDIO"
type DifficultyLevel = "EASY" | "MEDIUM" | "HARD"
type GroupByOption = "none" | "type" | "difficulty"
type PointsSortOption = "asc" | "desc"

interface DraftOption {
  text: string
  isCorrect: boolean
}

interface QuestionDraft {
  questionText: string
  questionType: QuestionType
  difficultyLevel: DifficultyLevel
  points: number
  options: DraftOption[]
  tips: string
  explanation: string
  questionVoicePrompt: string
  sampleAnswerVoicePrompt: string
}

const typeLabels: Record<QuestionType, string> = {
  MCQ: "Multiple Choice",
  TRUE_FALSE: "True/False",
  SHORT: "Short Answer",
  AUDIO: "Audio",
}

const typeColors: Record<QuestionType, string> = {
  MCQ: "bg-blue-100 text-blue-700",
  TRUE_FALSE: "bg-purple-100 text-purple-700",
  SHORT: "bg-green-100 text-green-700",
  AUDIO: "bg-brand-100 text-brand-700",
}

export function PracticeQuestionsPage() {
  const { categoryId, courseId, subCourseId, practiceId } = useParams()
  const location = useLocation()
  
  const [questions, setQuestions] = useState<PracticeQuestion[]>([])
  const [practiceTitle, setPracticeTitle] = useState("Practice Questions")
  const [practiceDescription, setPracticeDescription] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [questionToEdit, setQuestionToEdit] = useState<PracticeQuestion | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<PracticeQuestion | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null)
  const [questionDetailsById, setQuestionDetailsById] = useState<Record<number, QuestionDetail>>({})
  const [loadingDetailIds, setLoadingDetailIds] = useState<Record<number, boolean>>({})
  const [groupBy, setGroupBy] = useState<GroupByOption>("none")
  const [pointsSort, setPointsSort] = useState<PointsSortOption>("desc")
  const [pageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalQuestions, setTotalQuestions] = useState(0)

  const [draft, setDraft] = useState<QuestionDraft>({
    questionText: "",
    questionType: "MCQ",
    difficultyLevel: "EASY",
    points: 1,
    options: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
    tips: "",
    explanation: "",
    questionVoicePrompt: "",
    sampleAnswerVoicePrompt: "",
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const backLink = useMemo(() => {
    if (location.pathname.includes("/content/human-language/") && location.pathname.includes("/sub-module/")) {
      return `/content/human-language/${categoryId}/${courseId}/sub-module/${subCourseId}`
    }
    return `/content/category/${categoryId}/courses/${courseId}/sub-courses/${subCourseId}`
  }, [location.pathname, categoryId, courseId, subCourseId])

  const buildDefaultOptions = (type: QuestionType, sampleAnswerText?: string): DraftOption[] => {
    if (type === "TRUE_FALSE") {
      const normalized = sampleAnswerText?.trim().toLowerCase()
      const isTrue = normalized === "true"
      const isFalse = normalized === "false"
      return [
        { text: "True", isCorrect: isTrue },
        { text: "False", isCorrect: isFalse },
      ]
    }

    return [
      { text: sampleAnswerText?.trim() || "", isCorrect: !!sampleAnswerText?.trim() },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ]
  }

  const resetDraft = () => {
    setDraft({
      questionText: "",
      questionType: "MCQ",
      difficultyLevel: "EASY",
      points: 1,
      options: buildDefaultOptions("MCQ"),
      tips: "",
      explanation: "",
      questionVoicePrompt: "",
      sampleAnswerVoicePrompt: "",
    })
  }

  const getResolvedSampleAnswer = () => {
    // For SHORT questions, backend still expects sample_answer.
    // Use explanation when provided, otherwise send a neutral placeholder.
    if (draft.questionType === "SHORT") return draft.explanation.trim() || "N/A"
    const correctOption = draft.options.find((opt) => opt.isCorrect && opt.text.trim())
    return correctOption?.text.trim() || ""
  }

  const toCreateQuestionType = (type: QuestionType) =>
    type === "SHORT" ? "SHORT_ANSWER" : type

  const isDraftValid = () => {
    if (!draft.questionText.trim()) return false
    if (draft.questionType === "SHORT") return true
    if (draft.questionType === "MCQ") {
      const nonEmpty = draft.options.filter((opt) => opt.text.trim())
      if (nonEmpty.length < 2) return false
    }
    return !!getResolvedSampleAnswer()
  }

  const handleDraftTypeChange = (type: QuestionType) => {
    setDraft((prev) => ({
      ...prev,
      questionType: type,
      options: buildDefaultOptions(type),
    }))
  }

  const updateDraftOption = (index: number, patch: Partial<DraftOption>) => {
    setDraft((prev) => ({
      ...prev,
      options: prev.options.map((opt, idx) => (idx === index ? { ...opt, ...patch } : opt)),
    }))
  }

  const setDraftCorrectOption = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      options: prev.options.map((opt, idx) => ({ ...opt, isCorrect: idx === index })),
    }))
  }

  const addDraftOption = () => {
    setDraft((prev) => ({
      ...prev,
      options: [...prev.options, { text: "", isCorrect: false }],
    }))
  }

  const removeDraftOption = (index: number) => {
    setDraft((prev) => {
      if (prev.options.length <= 2) return prev
      const nextOptions = prev.options.filter((_, idx) => idx !== index)
      const hasCorrect = nextOptions.some((opt) => opt.isCorrect)
      return {
        ...prev,
        options: hasCorrect
          ? nextOptions
          : nextOptions.map((opt, idx) => ({ ...opt, isCorrect: idx === 0 })),
      }
    })
  }

  const fetchQuestions = useCallback(async (page: number = currentPage) => {
    if (!practiceId) return

    try {
      const safePage = page < 1 ? 1 : page
      const offset = (safePage - 1) * pageSize
      const [detailRes, questionsRes] = await Promise.all([
        getQuestionSetById(Number(practiceId)),
        getPracticeQuestionsByPractice(Number(practiceId), { limit: pageSize, offset }),
      ])
      const detail = detailRes.data?.data
      setPracticeTitle(detail?.title || "Practice Questions")
      setPracticeDescription(detail?.description || "")

      const payload = questionsRes.data?.data
      const mappedQuestions: PracticeQuestion[] = (payload?.questions ?? []).map(
        (question: QuestionSetQuestion) => ({
          id: question.question_id || question.id,
          practice_id: question.set_id,
          question: question.question_text || "",
          points: question.points ?? 0,
          difficulty_level: question.difficulty_level || "",
          question_voice_prompt: question.voice_prompt || "",
          sample_answer_voice_prompt: question.sample_answer_voice_prompt || "",
          sample_answer: question.audio_correct_answer_text || question.explanation || "",
          tips: question.tips || "",
          type:
            question.question_type === "MCQ" ||
            question.question_type === "TRUE_FALSE" ||
            question.question_type === "SHORT" ||
            question.question_type === "AUDIO"
              ? question.question_type
              : question.question_type === "SHORT_ANSWER"
                ? "SHORT"
              : "MCQ",
        }),
      )
      setQuestions(mappedQuestions)
      setTotalQuestions(payload?.total_count ?? mappedQuestions.length)
      setCurrentPage(safePage)
    } catch (err) {
      console.error("Failed to fetch questions:", err)
      setError("Failed to load questions")
    } finally {
      setLoading(false)
    }
  }, [practiceId, currentPage, pageSize])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const handleAddQuestion = () => {
    resetDraft()
    setSaveError(null)
    setShowAddModal(true)
  }

  const handleSaveNewQuestion = async () => {
    if (!practiceId) return
    setSaving(true)
    setSaveError(null)
    try {
      const resolvedSampleAnswer = getResolvedSampleAnswer()
      const createRes = await createQuestion({
        question_text: draft.questionText,
        question_type: toCreateQuestionType(draft.questionType),
        status: "PUBLISHED",
        difficulty_level: draft.difficultyLevel,
        points: draft.points,
        tips: draft.tips || undefined,
        explanation: draft.explanation || undefined,
        voice_prompt: draft.questionVoicePrompt || undefined,
        sample_answer_voice_prompt: draft.sampleAnswerVoicePrompt || undefined,
        options:
          draft.questionType === "SHORT"
            ? undefined
            : draft.options
                .filter((opt) => opt.text.trim())
                .map((opt, idx) => ({
                  option_order: idx + 1,
                  option_text: opt.text.trim(),
                  is_correct: opt.isCorrect,
                })),
        short_answers:
          draft.questionType === "SHORT"
            ? [
                {
                  acceptable_answer: resolvedSampleAnswer,
                  match_type: "EXACT",
                },
                {
                  acceptable_answer: resolvedSampleAnswer,
                  match_type: "CASE_INSENSITIVE",
                },
              ]
            : undefined,
      })
      const createdQuestionId = createRes.data?.data?.id
      if (!createdQuestionId) throw new Error("Question created but no question ID returned.")
      await addQuestionToSet(Number(practiceId), { question_id: createdQuestionId })
      setShowAddModal(false)
      resetDraft()
      await fetchQuestions()
    } catch (err) {
      console.error("Failed to create question:", err)
      setSaveError("Failed to create question")
    } finally {
      setSaving(false)
    }
  }

  const handleEditClick = async (question: PracticeQuestion) => {
    setQuestionToEdit(question)
    const fallbackDraft: QuestionDraft = {
      questionText: question.question,
      questionType: question.type,
      difficultyLevel: "EASY",
      points: 1,
      options: buildDefaultOptions(question.type, question.sample_answer),
      tips: question.tips || "",
      explanation: question.sample_answer || "",
      questionVoicePrompt: question.question_voice_prompt || "",
      sampleAnswerVoicePrompt: question.sample_answer_voice_prompt || "",
    }
    setDraft(fallbackDraft)
    setSaveError(null)
    try {
      const detailRes = await getQuestionById(question.id)
      const detail = detailRes.data?.data
      if (detail) {
        const normalizedType: QuestionType =
          detail.question_type === "MCQ" ||
          detail.question_type === "TRUE_FALSE" ||
          detail.question_type === "SHORT"
            ? detail.question_type
            : detail.question_type === "SHORT_ANSWER"
              ? "SHORT"
              : "MCQ"
        const detailOptions = (detail.options ?? [])
          .slice()
          .sort((a, b) => (a.option_order ?? 0) - (b.option_order ?? 0))
          .map((opt) => ({
            text: opt.option_text || "",
            isCorrect: !!opt.is_correct,
          }))
        const shortAnswerFromDetail = Array.isArray(detail.short_answers)
          ? typeof detail.short_answers[0] === "string"
            ? String(detail.short_answers[0] || "")
            : String((detail.short_answers[0] as { acceptable_answer?: string })?.acceptable_answer || "")
          : ""
        setDraft({
          questionText: detail.question_text || fallbackDraft.questionText,
          questionType: normalizedType,
          difficultyLevel:
            detail.difficulty_level === "EASY" ||
            detail.difficulty_level === "MEDIUM" ||
            detail.difficulty_level === "HARD"
              ? detail.difficulty_level
              : "EASY",
          points: detail.points && detail.points > 0 ? detail.points : 1,
          options:
            normalizedType === "SHORT"
              ? buildDefaultOptions("SHORT")
              : detailOptions.length > 0
                ? detailOptions
                : buildDefaultOptions(normalizedType, question.sample_answer),
          tips: detail.tips || "",
          explanation: detail.explanation || shortAnswerFromDetail || fallbackDraft.explanation,
          questionVoicePrompt: detail.voice_prompt || "",
          sampleAnswerVoicePrompt: detail.sample_answer_voice_prompt || "",
        })
      }
    } catch (err) {
      console.error("Failed to fetch question details:", err)
    } finally {
      setShowEditModal(true)
    }
  }

  const handleSaveEditQuestion = async () => {
    if (!questionToEdit) return
    setSaving(true)
    setSaveError(null)
    try {
      const resolvedSampleAnswer = getResolvedSampleAnswer()
      await updateQuestion(questionToEdit.id, {
        question_text: draft.questionText,
        question_type: toCreateQuestionType(draft.questionType),
        status: "PUBLISHED",
        difficulty_level: draft.difficultyLevel,
        points: draft.points,
        tips: draft.tips || undefined,
        explanation: draft.explanation || undefined,
        voice_prompt: draft.questionVoicePrompt || undefined,
        sample_answer_voice_prompt: draft.sampleAnswerVoicePrompt || undefined,
        options:
          draft.questionType === "SHORT"
            ? undefined
            : draft.options
                .filter((opt) => opt.text.trim())
                .map((opt, idx) => ({
                  option_order: idx + 1,
                  option_text: opt.text.trim(),
                  is_correct: opt.isCorrect,
                })),
        short_answers:
          draft.questionType === "SHORT"
            ? [
                {
                  acceptable_answer: resolvedSampleAnswer,
                  match_type: "EXACT",
                },
                {
                  acceptable_answer: resolvedSampleAnswer,
                  match_type: "CASE_INSENSITIVE",
                },
              ]
            : undefined,
      })
      setShowEditModal(false)
      setQuestionToEdit(null)
      resetDraft()
      await fetchQuestions()
    } catch (err) {
      console.error("Failed to update question:", err)
      setSaveError("Failed to update question")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (question: PracticeQuestion) => {
    setQuestionToDelete(question)
    setShowDeleteModal(true)
  }

  const loadQuestionDetails = async (questionId: number) => {
    if (questionDetailsById[questionId] || loadingDetailIds[questionId]) return
    setLoadingDetailIds((prev) => ({ ...prev, [questionId]: true }))
    try {
      const detailRes = await getQuestionById(questionId)
      const detail = detailRes.data?.data
      if (detail) {
        setQuestionDetailsById((prev) => ({ ...prev, [questionId]: detail }))
      }
    } catch (err) {
      console.error("Failed to fetch question details:", err)
    } finally {
      setLoadingDetailIds((prev) => ({ ...prev, [questionId]: false }))
    }
  }

  const handleToggleDetails = (questionId: number) => {
    setExpandedQuestionId((prev) => {
      const next = prev === questionId ? null : questionId
      if (next === questionId) {
        void loadQuestionDetails(questionId)
      }
      return next
    })
  }

  const groupedQuestions = useMemo(() => {
    const sorted = [...questions].sort((a, b) => {
      const aPoints = a.points ?? 0
      const bPoints = b.points ?? 0
      return pointsSort === "asc" ? aPoints - bPoints : bPoints - aPoints
    })

    if (groupBy === "none") {
      return [{ key: "all", label: "All Questions", items: sorted }]
    }

    const groups = new Map<string, PracticeQuestion[]>()
    sorted.forEach((question) => {
      const label =
        groupBy === "type" ? typeLabels[question.type] : question.difficulty_level || "Unspecified"
      if (!groups.has(label)) groups.set(label, [])
      groups.get(label)?.push(question)
    })

    return Array.from(groups.entries()).map(([label, items], index) => ({
      key: `${groupBy}-${label}-${index}`,
      label,
      items,
    }))
  }, [questions, groupBy, pointsSort])

  const handleConfirmDelete = async () => {
    if (!questionToDelete) return
    setDeleting(true)
    try {
      await deleteQuestion(questionToDelete.id)
      setShowDeleteModal(false)
      setQuestionToDelete(null)
      await fetchQuestions()
    } catch (err) {
      console.error("Failed to delete question:", err)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <img src={spinnerSrc} alt="" className="h-8 w-8 animate-spin" />
        <p className="mt-4 text-sm font-medium text-grayScale-500">Loading questions...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <img src={alertSrc} alt="" className="h-12 w-12" />
        <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={backLink}
            className="group grid h-9 w-9 place-items-center rounded-lg bg-grayScale-100 text-grayScale-500 transition-all hover:bg-brand-100 hover:text-brand-600 hover:shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-grayScale-900">{practiceTitle}</h1>
            {practiceDescription && (
              <p className="mt-0.5 text-sm text-grayScale-500">{practiceDescription}</p>
            )}
            <p className="mt-0.5 text-sm text-grayScale-500">{questions.length} questions on this page</p>
            <p className="mt-0.5 text-xs text-grayScale-400">
              Total: {totalQuestions} question{totalQuestions === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <Button className="bg-brand-500 hover:bg-brand-600" onClick={handleAddQuestion}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Question
        </Button>
      </div>

      {questions.length === 0 ? (
        <Card className="border-2 border-dashed border-grayScale-200 shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <img src={practiceSrc} alt="" className="h-20 w-20" />
            <p className="mt-4 text-sm font-medium text-grayScale-600">No questions found for this practice</p>
            <p className="mt-1 text-xs text-grayScale-400">Get started by adding your first question</p>
            <Button variant="outline" className="mt-6 border-brand-200 text-brand-600 hover:bg-brand-50" onClick={handleAddQuestion}>
              <Plus className="mr-2 h-4 w-4" />
              Add your first question
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-grayScale-200 bg-gradient-to-br from-white to-grayScale-50 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-100 text-brand-600">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-grayScale-700">Question Controls</p>
                  <p className="text-xs text-grayScale-500">Group and sort the list quickly</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-grayScale-200 bg-white px-2.5 py-1 font-medium text-grayScale-600">
                  Group: {groupBy === "none" ? "None" : groupBy === "type" ? "Type" : "Difficulty"}
                </span>
                <span className="rounded-full border border-grayScale-200 bg-white px-2.5 py-1 font-medium text-grayScale-600">
                  Points: {pointsSort === "desc" ? "High to Low" : "Low to High"}
                </span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 rounded-xl border border-grayScale-200 bg-white p-3">
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Group Questions By
                </label>
                <Select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupByOption)}>
                  <option value="none">No Grouping</option>
                  <option value="type">Type</option>
                  <option value="difficulty">Difficulty</option>
                </Select>
              </div>
              <div className="space-y-1.5 rounded-xl border border-grayScale-200 bg-white p-3">
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  Sort By Points
                </label>
                <Select value={pointsSort} onChange={(e) => setPointsSort(e.target.value as PointsSortOption)}>
                  <option value="desc">High to Low</option>
                  <option value="asc">Low to High</option>
                </Select>
              </div>
            </div>
          </div>

          {groupedQuestions.map((group) => (
            <div key={group.key} className="space-y-3">
              {groupBy !== "none" && (
                <div className="flex items-center justify-between rounded-md bg-grayScale-100 px-3 py-2">
                  <p className="text-sm font-semibold text-grayScale-700">{group.label}</p>
                  <p className="text-xs text-grayScale-500">{group.items.length} question(s)</p>
                </div>
              )}
              {group.items.map((question) => (
                <Card key={question.id} className="shadow-sm transition-shadow hover:shadow-md">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="line-clamp-2 text-base font-medium leading-relaxed text-grayScale-900">
                          {question.question}
                        </CardTitle>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-grayScale-500">
                          <span className="rounded-md bg-grayScale-100 px-2 py-1">
                            Type: {typeLabels[question.type]}
                          </span>
                          <span className="rounded-md bg-grayScale-100 px-2 py-1">
                            Points: {question.points ?? 0}
                          </span>
                          <span className="rounded-md bg-grayScale-100 px-2 py-1">
                            Difficulty: {question.difficulty_level || "—"}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => handleToggleDetails(question.id)}
                      >
                        {expandedQuestionId === question.id ? "Hide Details" : "Details"}
                        {expandedQuestionId === question.id ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  {expandedQuestionId === question.id && (
                    <CardContent className="space-y-3 border-t border-grayScale-100 pt-4">
                      <div className="flex items-center justify-between">
                        <Badge className={`${typeColors[question.type]} font-medium`}>
                          {typeLabels[question.type]}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-grayScale-400 hover:text-brand-600"
                            onClick={() => handleEditClick(question)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-grayScale-400 hover:bg-red-50 hover:text-red-500"
                            onClick={() => handleDeleteClick(question)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="rounded-lg border border-grayScale-100 bg-grayScale-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-grayScale-400">Sample Answer</p>
                        <p className="mt-2 text-sm leading-relaxed text-grayScale-700">{question.sample_answer}</p>
                      </div>
                      {question.type === "MCQ" && (
                        <div className="rounded-lg border border-grayScale-100 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-grayScale-400">Options</p>
                          {loadingDetailIds[question.id] ? (
                            <p className="mt-2 text-sm text-grayScale-500">Loading options...</p>
                          ) : (questionDetailsById[question.id]?.options ?? []).length > 0 ? (
                            <div className="mt-3 space-y-2">
                              {(questionDetailsById[question.id]?.options ?? [])
                                .slice()
                                .sort((a, b) => a.option_order - b.option_order)
                                .map((option) => (
                                  <div
                                    key={`${question.id}-${option.option_order}-${option.option_text}`}
                                    className={`rounded-md border px-3 py-2 text-sm ${
                                      option.is_correct
                                        ? "border-green-200 bg-green-50 text-green-700"
                                        : "border-grayScale-200 bg-grayScale-50 text-grayScale-600"
                                    }`}
                                  >
                                    <span className="font-medium">{option.option_order}.</span>{" "}
                                    {option.option_text}
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-grayScale-500">No options available.</p>
                          )}
                        </div>
                      )}
                      {question.tips && (
                        <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">💡 Tips</p>
                          <p className="mt-2 text-sm leading-relaxed text-amber-700">{question.tips}</p>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ))}
          {totalQuestions > pageSize && (
            <div className="flex items-center justify-between rounded-xl border border-grayScale-200 bg-white px-4 py-3">
              <p className="text-sm text-grayScale-500">
                Page {currentPage} of {Math.max(1, Math.ceil(totalQuestions / pageSize))}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => void fetchQuestions(currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= Math.ceil(totalQuestions / pageSize)}
                  onClick={() => void fetchQuestions(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && questionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-grayScale-900">Delete Question</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-6">
              <p className="text-sm leading-relaxed text-grayScale-600">
                Are you sure you want to delete this question? This action cannot be undone.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button className="bg-red-500 hover:bg-red-600" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-grayScale-900">Add New Question</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="rounded-xl border-l-2 border-l-brand-500 border border-grayScale-200 p-4">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
                      Question Text
                    </label>
                    <Textarea
                      value={draft.questionText}
                      onChange={(e) => setDraft((prev) => ({ ...prev, questionText: e.target.value }))}
                      placeholder="Enter your question..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">Type</label>
                      <Select value={draft.questionType} onChange={(e) => handleDraftTypeChange(e.target.value as QuestionType)}>
                        <option value="MCQ">Multiple Choice</option>
                        <option value="TRUE_FALSE">True/False</option>
                        <option value="SHORT">Short Answer</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">Difficulty</label>
                      <Select
                        value={draft.difficultyLevel}
                        onChange={(e) =>
                          setDraft((prev) => ({ ...prev, difficultyLevel: e.target.value as DifficultyLevel }))
                        }
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">Points</label>
                      <Input
                        type="number"
                        min={1}
                        value={draft.points}
                        onChange={(e) =>
                          setDraft((prev) => ({ ...prev, points: Number(e.target.value) || 1 }))
                        }
                      />
                    </div>
                  </div>

                  {draft.questionType === "MCQ" && (
                    <div className="space-y-3 rounded-lg bg-grayScale-50/50 p-4">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">Options</label>
                      <div className="space-y-2.5">
                        {draft.options.map((option, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors ${
                              option.isCorrect ? "border-green-200 bg-green-50/50" : "border-grayScale-200 bg-white"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setDraftCorrectOption(index)}
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                                option.isCorrect
                                  ? "border-green-500 bg-green-500 text-white shadow-sm"
                                  : "border-grayScale-300 hover:border-brand-400 hover:shadow-sm"
                              }`}
                            >
                              {option.isCorrect && <Check className="h-3 w-3" />}
                            </button>
                            <Input
                              value={option.text}
                              onChange={(e) => updateDraftOption(index, { text: e.target.value })}
                              placeholder={`Option ${index + 1}`}
                              className="flex-1 border-0 bg-transparent shadow-none focus:ring-0"
                            />
                            {draft.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeDraftOption(index)}
                                className="rounded-lg p-1 text-grayScale-400 transition-colors hover:bg-red-50 hover:text-red-500"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addDraftOption}
                          className="mt-1 flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-brand-500 transition-colors hover:bg-brand-50 hover:text-brand-600"
                        >
                          <Plus className="h-4 w-4" />
                          Add Option
                        </button>
                      </div>
                      <p className="text-xs text-grayScale-400">Click the circle to mark the correct answer.</p>
                    </div>
                  )}

                  {draft.questionType === "TRUE_FALSE" && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
                        Correct Answer
                      </label>
                      <div className="flex gap-3">
                        {["True", "False"].map((val, i) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                options: [
                                  { text: "True", isCorrect: i === 0 },
                                  { text: "False", isCorrect: i === 1 },
                                ],
                              }))
                            }
                            className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                              draft.options[i]?.isCorrect
                                ? "border-green-500 bg-green-50 text-green-700"
                                : "border-grayScale-200 text-grayScale-600 hover:border-grayScale-300"
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">Tips (Optional)</label>
                      <Input
                        value={draft.tips}
                        onChange={(e) => setDraft((prev) => ({ ...prev, tips: e.target.value }))}
                        placeholder="Helpful tip for the student"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
                        Explanation (Optional)
                      </label>
                      <Input
                        value={draft.explanation}
                        onChange={(e) => setDraft((prev) => ({ ...prev, explanation: e.target.value }))}
                        placeholder="Why this is the correct answer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
                        Voice Prompt (Optional)
                      </label>
                      <Input
                        value={draft.questionVoicePrompt}
                        onChange={(e) => setDraft((prev) => ({ ...prev, questionVoicePrompt: e.target.value }))}
                        placeholder="Voice prompt text"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
                        Sample Answer Voice Prompt (Optional)
                      </label>
                      <Input
                        value={draft.sampleAnswerVoicePrompt}
                        onChange={(e) => setDraft((prev) => ({ ...prev, sampleAnswerVoicePrompt: e.target.value }))}
                        placeholder="Sample answer voice prompt"
                      />
                    </div>
                  </div>
                </div>
              </div>
              {saveError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  <p className="text-sm font-medium text-red-600">{saveError}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={saving}>
                Cancel
              </Button>
              <Button
                className="bg-brand-500 hover:bg-brand-600"
                onClick={handleSaveNewQuestion}
                disabled={saving || !isDraftValid()}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && questionToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-grayScale-900">Edit Question</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="rounded-xl border-l-2 border-l-brand-500 border border-grayScale-200 p-4">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
                      Question Text
                    </label>
                    <Textarea
                      value={draft.questionText}
                      onChange={(e) => setDraft((prev) => ({ ...prev, questionText: e.target.value }))}
                      placeholder="Enter your question..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">Type</label>
                      <Select value={draft.questionType} onChange={(e) => handleDraftTypeChange(e.target.value as QuestionType)}>
                        <option value="MCQ">Multiple Choice</option>
                        <option value="TRUE_FALSE">True/False</option>
                        <option value="SHORT">Short Answer</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">Difficulty</label>
                      <Select
                        value={draft.difficultyLevel}
                        onChange={(e) =>
                          setDraft((prev) => ({ ...prev, difficultyLevel: e.target.value as DifficultyLevel }))
                        }
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">Points</label>
                      <Input
                        type="number"
                        min={1}
                        value={draft.points}
                        onChange={(e) =>
                          setDraft((prev) => ({ ...prev, points: Number(e.target.value) || 1 }))
                        }
                      />
                    </div>
                  </div>

                  {draft.questionType === "MCQ" && (
                    <div className="space-y-3 rounded-lg bg-grayScale-50/50 p-4">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">Options</label>
                      <div className="space-y-2.5">
                        {draft.options.map((option, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors ${
                              option.isCorrect ? "border-green-200 bg-green-50/50" : "border-grayScale-200 bg-white"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setDraftCorrectOption(index)}
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                                option.isCorrect
                                  ? "border-green-500 bg-green-500 text-white shadow-sm"
                                  : "border-grayScale-300 hover:border-brand-400 hover:shadow-sm"
                              }`}
                            >
                              {option.isCorrect && <Check className="h-3 w-3" />}
                            </button>
                            <Input
                              value={option.text}
                              onChange={(e) => updateDraftOption(index, { text: e.target.value })}
                              placeholder={`Option ${index + 1}`}
                              className="flex-1 border-0 bg-transparent shadow-none focus:ring-0"
                            />
                            {draft.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeDraftOption(index)}
                                className="rounded-lg p-1 text-grayScale-400 transition-colors hover:bg-red-50 hover:text-red-500"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addDraftOption}
                          className="mt-1 flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-brand-500 transition-colors hover:bg-brand-50 hover:text-brand-600"
                        >
                          <Plus className="h-4 w-4" />
                          Add Option
                        </button>
                      </div>
                      <p className="text-xs text-grayScale-400">Click the circle to mark the correct answer.</p>
                    </div>
                  )}

                  {draft.questionType === "TRUE_FALSE" && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
                        Correct Answer
                      </label>
                      <div className="flex gap-3">
                        {["True", "False"].map((val, i) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                options: [
                                  { text: "True", isCorrect: i === 0 },
                                  { text: "False", isCorrect: i === 1 },
                                ],
                              }))
                            }
                            className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                              draft.options[i]?.isCorrect
                                ? "border-green-500 bg-green-50 text-green-700"
                                : "border-grayScale-200 text-grayScale-600 hover:border-grayScale-300"
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">Tips (Optional)</label>
                      <Input
                        value={draft.tips}
                        onChange={(e) => setDraft((prev) => ({ ...prev, tips: e.target.value }))}
                        placeholder="Helpful tip for the student"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
                        Explanation (Optional)
                      </label>
                      <Input
                        value={draft.explanation}
                        onChange={(e) => setDraft((prev) => ({ ...prev, explanation: e.target.value }))}
                        placeholder="Why this is the correct answer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
                        Voice Prompt (Optional)
                      </label>
                      <Input
                        value={draft.questionVoicePrompt}
                        onChange={(e) => setDraft((prev) => ({ ...prev, questionVoicePrompt: e.target.value }))}
                        placeholder="Voice prompt text"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
                        Sample Answer Voice Prompt (Optional)
                      </label>
                      <Input
                        value={draft.sampleAnswerVoicePrompt}
                        onChange={(e) => setDraft((prev) => ({ ...prev, sampleAnswerVoicePrompt: e.target.value }))}
                        placeholder="Sample answer voice prompt"
                      />
                    </div>
                  </div>
                </div>
              </div>
              {saveError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  <p className="text-sm font-medium text-red-600">{saveError}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={saving}>
                Cancel
              </Button>
              <Button
                className="bg-brand-500 hover:bg-brand-600"
                onClick={handleSaveEditQuestion}
                disabled={saving || !isDraftValid()}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
