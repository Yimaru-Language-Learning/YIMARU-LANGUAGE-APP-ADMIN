import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Select } from "../../components/ui/select"
import { createQuestion, getQuestionById, updateQuestion } from "../../api/courses.api"
import {
  getQuestionTypeDefinitions,
  questionTypeDefinitionListLabel,
} from "../../api/questionTypeDefinitions.api"
import type { QuestionTypeDefinition } from "../../types/questionTypeDefinition.types"

type QuestionType = "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "AUDIO" | "DYNAMIC"
type Difficulty = "EASY" | "MEDIUM" | "HARD"
type QuestionStatus = "DRAFT" | "PUBLISHED" | "INACTIVE"

const defaultDynamicPayloadJson = `{
  "stimulus": [],
  "response": []
}`

interface Question {
  id?: number
  question: string
  type: QuestionType
  options: string[]
  correctAnswer: string
  points: number
  difficulty: Difficulty
  status: QuestionStatus
  tips: string
  explanation: string
  voicePrompt: string
  sampleAnswerVoicePrompt: string
  audioCorrectAnswerText: string
  /** Definition id as string for select value */
  questionTypeDefinitionId: string
  dynamicPayloadJson: string
}

const initialForm: Question = {
  question: "",
  type: "MCQ",
  options: ["", "", "", ""],
  correctAnswer: "",
  points: 1,
  difficulty: "EASY",
  status: "PUBLISHED",
  tips: "",
  explanation: "",
  voicePrompt: "",
  sampleAnswerVoicePrompt: "",
  audioCorrectAnswerText: "",
  questionTypeDefinitionId: "",
  dynamicPayloadJson: defaultDynamicPayloadJson,
}

export function AddQuestionPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEditing = !!id

  const [formData, setFormData] = useState<Question>(initialForm)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [typeDefinitions, setTypeDefinitions] = useState<QuestionTypeDefinition[]>([])

  useEffect(() => {
    const loadQuestion = async () => {
      if (!isEditing || !id) return
      setLoading(true)
      try {
        const res = await getQuestionById(Number(id))
        const q = res.data.data
        const mappedType: QuestionType =
          q.question_type === "MCQ" ||
          q.question_type === "TRUE_FALSE" ||
          q.question_type === "SHORT_ANSWER" ||
          q.question_type === "AUDIO" ||
          q.question_type === "DYNAMIC"
            ? q.question_type
            : "MCQ"
        const shortAnswer = Array.isArray(q.short_answers) && q.short_answers.length > 0
          ? typeof q.short_answers[0] === "string"
            ? String(q.short_answers[0] || "")
            : String((q.short_answers[0] as { acceptable_answer?: string }).acceptable_answer || "")
          : ""
        setFormData({
          id: q.id,
          question: q.question_text || "",
          type: mappedType,
          options: (q.options ?? [])
            .slice()
            .sort((a, b) => a.option_order - b.option_order)
            .map((o) => o.option_text) || ["", "", "", ""],
          correctAnswer:
            mappedType === "SHORT_ANSWER"
              ? shortAnswer
              : mappedType === "AUDIO"
                ? q.audio_correct_answer_text || ""
                : (q.options ?? []).find((o) => o.is_correct)?.option_text || "",
          points: q.points ?? 1,
          difficulty:
            q.difficulty_level === "EASY" || q.difficulty_level === "MEDIUM" || q.difficulty_level === "HARD"
              ? q.difficulty_level
              : "EASY",
          status:
            q.status === "DRAFT" || q.status === "PUBLISHED" || q.status === "INACTIVE"
              ? q.status
              : "PUBLISHED",
          tips: q.tips || "",
          explanation: q.explanation || "",
          voicePrompt: q.voice_prompt || "",
          sampleAnswerVoicePrompt: q.sample_answer_voice_prompt || "",
          audioCorrectAnswerText: q.audio_correct_answer_text || "",
          questionTypeDefinitionId:
            mappedType === "DYNAMIC" && q.question_type_definition_id != null
              ? String(q.question_type_definition_id)
              : "",
          dynamicPayloadJson:
            mappedType === "DYNAMIC" && q.dynamic_payload
              ? JSON.stringify(q.dynamic_payload, null, 2)
              : defaultDynamicPayloadJson,
        })
      } catch (error) {
        console.error("Failed to load question:", error)
        toast.error("Failed to load question details")
      } finally {
        setLoading(false)
      }
    }
    loadQuestion()
  }, [isEditing, id])

  useEffect(() => {
    if (formData.type !== "DYNAMIC") return
    let cancelled = false
    ;(async () => {
      try {
        const rows = await getQuestionTypeDefinitions({ include_system: true })
        if (!cancelled) setTypeDefinitions(Array.isArray(rows) ? rows : [])
      } catch {
        if (!cancelled) setTypeDefinitions([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [formData.type])

  const handleTypeChange = (type: QuestionType) => {
    setFormData((prev) => {
      if (type === "TRUE_FALSE") {
        return {
          ...prev,
          type,
          options: ["True", "False"],
          correctAnswer: prev.correctAnswer === "True" || prev.correctAnswer === "False" ? prev.correctAnswer : "",
        }
      } else if (type === "DYNAMIC") {
        return {
          ...prev,
          type,
          options: [],
          correctAnswer: "",
          questionTypeDefinitionId: "",
          dynamicPayloadJson: defaultDynamicPayloadJson,
        }
      } else if (type === "SHORT_ANSWER" || type === "AUDIO") {
        return {
          ...prev,
          type,
          options: [],
          correctAnswer: type === "AUDIO" ? prev.audioCorrectAnswerText : prev.correctAnswer,
        }
      } else {
        return {
          ...prev,
          type,
          options: prev.options.length > 0 ? prev.options : ["", "", "", ""],
        }
      }
    })
  }

  const handleOptionChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newOptions = [...prev.options]
      newOptions[index] = value
      return { ...prev, options: newOptions }
    })
  }

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, ""],
    }))
  }

  const removeOption = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.question.trim()) {
      toast.error("Missing question", {
        description: "Please enter a question before saving.",
      })
      return
    }

    if (formData.type === "MCQ" || formData.type === "TRUE_FALSE") {
      if (!formData.correctAnswer) {
        toast.error("Missing correct answer", {
          description: "Select the correct answer for this question.",
        })
        return
      }
      if (formData.type === "MCQ") {
        const hasEmptyOptions = formData.options.some((opt) => !opt.trim())
        if (hasEmptyOptions) {
          toast.error("Incomplete options", {
            description: "Fill in all answer options for this multiple choice question.",
          })
          return
        }
      }
    } else if (formData.type === "SHORT_ANSWER") {
      if (!formData.correctAnswer.trim()) {
        toast.error("Missing correct answer", {
          description: "Enter the expected correct answer.",
        })
        return
      }
    } else if (formData.type === "AUDIO") {
      if (!formData.voicePrompt.trim() || !formData.sampleAnswerVoicePrompt.trim() || !formData.audioCorrectAnswerText.trim()) {
        toast.error("Missing audio fields", {
          description: "Voice prompt, sample answer voice prompt, and audio correct answer text are required for AUDIO questions.",
        })
        return
      }
    } else if (formData.type === "DYNAMIC") {
      const defId = Number(formData.questionTypeDefinitionId)
      if (!Number.isFinite(defId) || defId < 1) {
        toast.error("Definition required", { description: "Select a question type definition." })
        return
      }
      try {
        const parsed = JSON.parse(formData.dynamicPayloadJson || "{}") as {
          stimulus?: unknown
          response?: unknown
        }
        if (!Array.isArray(parsed.stimulus) || !Array.isArray(parsed.response)) {
          toast.error("Invalid dynamic payload", {
            description: 'JSON must include "stimulus" and "response" arrays.',
          })
          return
        }
      } catch {
        toast.error("Invalid JSON", { description: "Fix the dynamic content JSON before saving." })
        return
      }
    }

    setSubmitting(true)
    try {
      const optionsPayload =
        formData.type === "MCQ" || formData.type === "TRUE_FALSE"
          ? formData.options
              .filter((o) => o.trim())
              .map((optionText, index) => ({
                option_text: optionText.trim(),
                option_order: index + 1,
                is_correct: optionText === formData.correctAnswer,
              }))
          : undefined
      const shortAnswersPayload =
        formData.type === "SHORT_ANSWER"
          ? [
              { acceptable_answer: formData.correctAnswer.trim(), match_type: "EXACT" as const },
              { acceptable_answer: formData.correctAnswer.trim(), match_type: "CASE_INSENSITIVE" as const },
            ]
          : undefined
      let dynamicPayload: { stimulus: unknown[]; response: unknown[] } | undefined
      if (formData.type === "DYNAMIC") {
        try {
          dynamicPayload = JSON.parse(formData.dynamicPayloadJson) as {
            stimulus: unknown[]
            response: unknown[]
          }
        } catch {
          dynamicPayload = { stimulus: [], response: [] }
        }
      }

      const payload = {
        question_text: formData.question,
        question_type: formData.type,
        status: formData.status,
        difficulty_level: formData.difficulty,
        points: formData.points,
        tips: formData.tips || undefined,
        explanation: formData.explanation || undefined,
        options: optionsPayload,
        short_answers: shortAnswersPayload,
        voice_prompt: formData.type === "AUDIO" ? formData.voicePrompt : formData.voicePrompt || undefined,
        sample_answer_voice_prompt:
          formData.type === "AUDIO" ? formData.sampleAnswerVoicePrompt : formData.sampleAnswerVoicePrompt || undefined,
        audio_correct_answer_text:
          formData.type === "AUDIO" ? formData.audioCorrectAnswerText : undefined,
        ...(formData.type === "DYNAMIC" && dynamicPayload
          ? {
              question_type_definition_id: Number(formData.questionTypeDefinitionId),
              dynamic_payload: dynamicPayload,
            }
          : {}),
      }
      if (isEditing && id) {
        await updateQuestion(Number(id), payload)
      } else {
        await createQuestion(payload)
      }
      toast.success(isEditing ? "Question updated" : "Question created", {
        description: isEditing
          ? "The question has been updated successfully."
          : "Your new question has been created.",
      })
      navigate("/content/questions")
    } catch (error) {
      console.error("Failed to save question:", error)
      toast.error("Failed to save question")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/content/questions")}
          className="h-9 w-9 shrink-0 rounded-lg bg-grayScale-50 hover:bg-brand-500/10 hover:text-brand-500"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight text-grayScale-800 sm:text-xl">
            {isEditing ? "Edit Question" : "Add New Question"}
          </h1>
          <p className="mt-0.5 text-xs text-grayScale-500 sm:text-sm">
            {isEditing ? "Update fields below" : "Create a bank question"}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        {loading && (
          <Card className="mb-2 border border-grayScale-200">
            <CardContent className="py-2.5 text-xs text-grayScale-500">Loading…</CardContent>
          </Card>
        )}
        <form onSubmit={handleSubmit}>
          <Card className="rounded-lg border border-grayScale-100 shadow-sm">
            <CardHeader className="space-y-0 px-4 py-3 sm:px-5">
              <CardTitle className="text-base font-semibold text-grayScale-700">Question details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-grayScale-600">
                  Question Type
                </label>
                <Select
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                  className="h-9 text-sm"
                >
                  <option value="MCQ">Multiple Choice</option>
                  <option value="TRUE_FALSE">True/False</option>
                  <option value="SHORT_ANSWER">Short Answer</option>
                  <option value="AUDIO">Audio</option>
                  <option value="DYNAMIC">Dynamic (schema-driven)</option>
                </Select>
              </div>

              {formData.type === "DYNAMIC" && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-grayScale-600">
                      Question type definition <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.questionTypeDefinitionId}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, questionTypeDefinitionId: e.target.value }))
                      }
                      required
                      className="h-9 text-sm"
                    >
                      <option value="">Select definition…</option>
                      {typeDefinitions.map((d) => (
                        <option key={d.id} value={String(d.id)}>
                          {questionTypeDefinitionListLabel(d)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-grayScale-600">
                      Dynamic content (JSON) <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={formData.dynamicPayloadJson}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dynamicPayloadJson: e.target.value }))}
                      rows={7}
                      className="min-h-0 font-mono text-[11px] leading-snug"
                      spellCheck={false}
                    />
                  </div>
                </>
              )}

              <hr className="border-grayScale-100" />

              <div>
                <label htmlFor="question" className="mb-1 block text-xs font-medium text-grayScale-600">
                  {formData.type === "DYNAMIC" ? "Title / stem" : "Question"}
                </label>
                <Textarea
                  id="question"
                  placeholder="Enter your question here..."
                  value={formData.question}
                  onChange={(e) => setFormData((prev) => ({ ...prev, question: e.target.value }))}
                  rows={2}
                  className="min-h-[72px] text-sm"
                  required
                />
              </div>

              {/* Options for Multiple Choice */}
              {(formData.type === "MCQ" || formData.type === "TRUE_FALSE") && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-grayScale-600">Options</label>
                  <div className="space-y-1.5">
                    {formData.options.map((option, index) => (
                      <div key={index} className="group flex items-center gap-1.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-grayScale-100 text-[10px] font-medium text-grayScale-500">
                          {index + 1}
                        </span>
                        <Input
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          disabled={formData.type === "TRUE_FALSE"}
                          className="h-9 text-sm"
                          required
                        />
                        {formData.type === "MCQ" && formData.options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(index)}
                            className="h-8 w-8 shrink-0 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {formData.type === "MCQ" && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addOption}
                        className="mt-0.5 h-9 w-full border-dashed border-grayScale-200 text-xs text-grayScale-500 hover:border-brand-500/30 hover:text-brand-500"
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Add option
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <hr className="border-grayScale-100" />

              {/* Correct Answer */}
              {formData.type !== "DYNAMIC" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-grayScale-600">
                  {formData.type === "AUDIO" ? "Audio correct answer" : "Correct answer"}
                </label>
                {formData.type === "MCQ" || formData.type === "TRUE_FALSE" ? (
                  <Select
                    value={formData.correctAnswer}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, correctAnswer: e.target.value }))
                    }
                    className="h-9 text-sm"
                    required
                  >
                    <option value="">Select correct answer</option>
                    {formData.options.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Textarea
                    placeholder={formData.type === "AUDIO" ? "Expected spoken answer…" : "Correct answer…"}
                    value={formData.type === "AUDIO" ? formData.audioCorrectAnswerText : formData.correctAnswer}
                    onChange={(e) =>
                      setFormData((prev) =>
                        formData.type === "AUDIO"
                          ? { ...prev, audioCorrectAnswerText: e.target.value }
                          : { ...prev, correctAnswer: e.target.value },
                      )
                    }
                    rows={2}
                    className="min-h-[60px] text-sm"
                    required
                  />
                )}
              </div>
              )}

              <hr className="border-grayScale-100" />

              {/* Points and Difficulty side by side */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <div>
                  <label htmlFor="points" className="mb-1 block text-xs font-medium text-grayScale-600">
                    Points
                  </label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    className="h-9 text-sm"
                    value={formData.points}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, points: parseInt(e.target.value) || 1 }))
                    }
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-grayScale-600">Difficulty</label>
                  <Select
                    value={formData.difficulty}
                    onChange={(e) => setFormData((prev) => ({ ...prev, difficulty: e.target.value as Difficulty }))}
                    className="h-9 text-sm"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </Select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="mb-1 block text-xs font-medium text-grayScale-600">Status</label>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as QuestionStatus }))}
                  className="h-9 text-sm"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="INACTIVE">Inactive</option>
                </Select>
              </div>

              {(formData.type === "AUDIO" || formData.type === "SHORT_ANSWER") && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-grayScale-600">
                      Voice prompt{formData.type === "AUDIO" ? "" : " (opt.)"}
                    </label>
                    <Textarea
                      value={formData.voicePrompt}
                      onChange={(e) => setFormData((prev) => ({ ...prev, voicePrompt: e.target.value }))}
                      rows={2}
                      placeholder="URL or key…"
                      className="min-h-[60px] text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-grayScale-600">
                      Sample answer (voice){formData.type === "AUDIO" ? "" : " (opt.)"}
                    </label>
                    <Textarea
                      value={formData.sampleAnswerVoicePrompt}
                      onChange={(e) => setFormData((prev) => ({ ...prev, sampleAnswerVoicePrompt: e.target.value }))}
                      rows={2}
                      placeholder="URL or key…"
                      className="min-h-[60px] text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-grayScale-600">Tips (opt.)</label>
                  <Input
                    value={formData.tips}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tips: e.target.value }))}
                    placeholder="Short tip"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-grayScale-600">Explanation (opt.)</label>
                  <Textarea
                    value={formData.explanation}
                    onChange={(e) => setFormData((prev) => ({ ...prev, explanation: e.target.value }))}
                    rows={2}
                    placeholder="Why this answer"
                    className="min-h-[60px] text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-grayScale-100 pt-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/content/questions")}
                  className="h-9 w-full text-sm sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || loading}
                  className="h-9 w-full bg-brand-500 text-sm text-white hover:bg-brand-600 sm:w-auto"
                >
                  {isEditing ? "Update" : "Create"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
