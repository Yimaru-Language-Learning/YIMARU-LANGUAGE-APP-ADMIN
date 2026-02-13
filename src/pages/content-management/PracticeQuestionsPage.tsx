import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, HelpCircle, Plus, Edit, Trash2, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { getPracticeQuestions, createPracticeQuestion, updatePracticeQuestion, deletePracticeQuestion } from "../../api/courses.api"
import { Input } from "../../components/ui/input"
import { Select } from "../../components/ui/select"
import type { PracticeQuestion } from "../../types/course.types"

type QuestionType = "MCQ" | "TRUE_FALSE" | "SHORT"

const typeLabels: Record<QuestionType, string> = {
  MCQ: "Multiple Choice",
  TRUE_FALSE: "True/False",
  SHORT: "Short Answer",
}

const typeColors: Record<QuestionType, string> = {
  MCQ: "bg-blue-100 text-blue-700",
  TRUE_FALSE: "bg-purple-100 text-purple-700",
  SHORT: "bg-green-100 text-green-700",
}

export function PracticeQuestionsPage() {
  const { categoryId, courseId, subCourseId, practiceId } = useParams()
  
  const [questions, setQuestions] = useState<PracticeQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [questionToEdit, setQuestionToEdit] = useState<PracticeQuestion | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<PracticeQuestion | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [questionText, setQuestionText] = useState("")
  const [questionType, setQuestionType] = useState<QuestionType>("MCQ")
  const [sampleAnswer, setSampleAnswer] = useState("")
  const [tips, setTips] = useState("")
  const [questionVoicePrompt, setQuestionVoicePrompt] = useState("")
  const [sampleAnswerVoicePrompt, setSampleAnswerVoicePrompt] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const backLink = `/content/category/${categoryId}/courses/${courseId}/sub-courses/${subCourseId}`

  const fetchQuestions = async () => {
    if (!practiceId) return

    try {
      const res = await getPracticeQuestions(Number(practiceId))
      setQuestions(res.data.data.questions ?? [])
    } catch (err) {
      console.error("Failed to fetch questions:", err)
      setError("Failed to load questions")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [practiceId])

  const handleAddQuestion = () => {
    setQuestionText("")
    setQuestionType("MCQ")
    setSampleAnswer("")
    setTips("")
    setQuestionVoicePrompt("")
    setSampleAnswerVoicePrompt("")
    setSaveError(null)
    setShowAddModal(true)
  }

  const handleSaveNewQuestion = async () => {
    if (!practiceId) return
    setSaving(true)
    setSaveError(null)
    try {
      await createPracticeQuestion({
        practice_id: Number(practiceId),
        question: questionText,
        type: questionType,
        sample_answer: sampleAnswer,
        tips,
        question_voice_prompt: questionVoicePrompt,
        sample_answer_voice_prompt: sampleAnswerVoicePrompt,
      })
      setShowAddModal(false)
      resetForm()
      await fetchQuestions()
    } catch (err) {
      console.error("Failed to create question:", err)
      setSaveError("Failed to create question")
    } finally {
      setSaving(false)
    }
  }

  const handleEditClick = (question: PracticeQuestion) => {
    setQuestionToEdit(question)
    setQuestionText(question.question)
    setQuestionType(question.type)
    setSampleAnswer(question.sample_answer)
    setTips(question.tips || "")
    setQuestionVoicePrompt(question.question_voice_prompt || "")
    setSampleAnswerVoicePrompt(question.sample_answer_voice_prompt || "")
    setSaveError(null)
    setShowEditModal(true)
  }

  const handleSaveEditQuestion = async () => {
    if (!questionToEdit) return
    setSaving(true)
    setSaveError(null)
    try {
      await updatePracticeQuestion(questionToEdit.id, {
        question: questionText,
        type: questionType,
        sample_answer: sampleAnswer,
        tips,
        question_voice_prompt: questionVoicePrompt,
        sample_answer_voice_prompt: sampleAnswerVoicePrompt,
      })
      setShowEditModal(false)
      setQuestionToEdit(null)
      resetForm()
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

  const handleConfirmDelete = async () => {
    if (!questionToDelete) return
    setDeleting(true)
    try {
      await deletePracticeQuestion(questionToDelete.id)
      setShowDeleteModal(false)
      setQuestionToDelete(null)
      await fetchQuestions()
    } catch (err) {
      console.error("Failed to delete question:", err)
    } finally {
      setDeleting(false)
    }
  }

  const resetForm = () => {
    setQuestionText("")
    setQuestionType("MCQ")
    setSampleAnswer("")
    setTips("")
    setQuestionVoicePrompt("")
    setSampleAnswerVoicePrompt("")
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-grayScale-200 border-t-brand-500" />
        <p className="mt-4 text-sm font-medium text-grayScale-500">Loading questions...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <X className="h-6 w-6 text-red-500" />
        </div>
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
            <h1 className="text-xl font-bold tracking-tight text-grayScale-900">Practice Questions</h1>
            <p className="mt-0.5 text-sm text-grayScale-500">{questions.length} questions available</p>
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
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-grayScale-100">
              <HelpCircle className="h-8 w-8 text-grayScale-300" />
            </div>
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
          {questions.map((question, index) => (
            <Card key={question.id} className="shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-600 shadow-sm">
                      {index + 1}
                    </div>
                    <Badge className={`${typeColors[question.type]} font-medium`}>
                      {typeLabels[question.type]}
                    </Badge>
                  </div>
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
                <CardTitle className="mt-3 text-base font-medium leading-relaxed">{question.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="rounded-lg border border-grayScale-100 bg-grayScale-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-grayScale-400">Sample Answer</p>
                  <p className="mt-2 text-sm leading-relaxed text-grayScale-700">{question.sample_answer}</p>
                </div>
                {question.tips && (
                  <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">💡 Tips</p>
                    <p className="mt-2 text-sm leading-relaxed text-amber-700">{question.tips}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Question Type</label>
                <Select value={questionType} onChange={(e) => setQuestionType(e.target.value as QuestionType)}>
                  <option value="MCQ">Multiple Choice</option>
                  <option value="TRUE_FALSE">True/False</option>
                  <option value="SHORT">Short Answer</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Question</label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter your question"
                  className="w-full rounded-lg border border-grayScale-200 px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Sample Answer</label>
                <textarea
                  value={sampleAnswer}
                  onChange={(e) => setSampleAnswer(e.target.value)}
                  placeholder="Enter the sample answer"
                  className="w-full rounded-lg border border-grayScale-200 px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Tips (Optional)</label>
                <textarea
                  value={tips}
                  onChange={(e) => setTips(e.target.value)}
                  placeholder="Enter helpful tips"
                  className="w-full rounded-lg border border-grayScale-200 px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Question Voice Prompt (Optional)</label>
                <Input
                  value={questionVoicePrompt}
                  onChange={(e) => setQuestionVoicePrompt(e.target.value)}
                  placeholder="Voice prompt for question"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Sample Answer Voice Prompt (Optional)</label>
                <Input
                  value={sampleAnswerVoicePrompt}
                  onChange={(e) => setSampleAnswerVoicePrompt(e.target.value)}
                  placeholder="Voice prompt for sample answer"
                />
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
                disabled={saving || !questionText.trim() || !sampleAnswer.trim()}
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Question Type</label>
                <Select value={questionType} onChange={(e) => setQuestionType(e.target.value as QuestionType)}>
                  <option value="MCQ">Multiple Choice</option>
                  <option value="TRUE_FALSE">True/False</option>
                  <option value="SHORT">Short Answer</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Question</label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter your question"
                  className="w-full rounded-lg border border-grayScale-200 px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Sample Answer</label>
                <textarea
                  value={sampleAnswer}
                  onChange={(e) => setSampleAnswer(e.target.value)}
                  placeholder="Enter the sample answer"
                  className="w-full rounded-lg border border-grayScale-200 px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Tips (Optional)</label>
                <textarea
                  value={tips}
                  onChange={(e) => setTips(e.target.value)}
                  placeholder="Enter helpful tips"
                  className="w-full rounded-lg border border-grayScale-200 px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Question Voice Prompt (Optional)</label>
                <Input
                  value={questionVoicePrompt}
                  onChange={(e) => setQuestionVoicePrompt(e.target.value)}
                  placeholder="Voice prompt for question"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Sample Answer Voice Prompt (Optional)</label>
                <Input
                  value={sampleAnswerVoicePrompt}
                  onChange={(e) => setSampleAnswerVoicePrompt(e.target.value)}
                  placeholder="Voice prompt for sample answer"
                />
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
                disabled={saving || !questionText.trim() || !sampleAnswer.trim()}
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
