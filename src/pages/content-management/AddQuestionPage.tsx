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

type QuestionType = "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "AUDIO"
type Difficulty = "EASY" | "MEDIUM" | "HARD"
type QuestionStatus = "DRAFT" | "PUBLISHED" | "INACTIVE"

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
}

export function AddQuestionPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEditing = !!id

  const [formData, setFormData] = useState<Question>(initialForm)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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
          q.question_type === "AUDIO"
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

  const handleTypeChange = (type: QuestionType) => {
    setFormData((prev) => {
      if (type === "TRUE_FALSE") {
        return {
          ...prev,
          type,
          options: ["True", "False"],
          correctAnswer: prev.correctAnswer === "True" || prev.correctAnswer === "False" ? prev.correctAnswer : "",
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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/content/questions")}
          className="rounded-lg bg-grayScale-50 hover:bg-brand-500/10 hover:text-brand-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-grayScale-600">
            {isEditing ? "Edit Question" : "Add New Question"}
          </h1>
          <p className="mt-1 text-sm text-grayScale-400">
            {isEditing ? "Update the question details below" : "Fill in the details to create a new question"}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {loading && (
          <Card className="mb-4 border border-grayScale-200">
            <CardContent className="py-4 text-sm text-grayScale-500">Loading question details...</CardContent>
          </Card>
        )}
        <form onSubmit={handleSubmit}>
          <Card className="shadow-sm border border-grayScale-100 rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-grayScale-600">Question Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-7">
              {/* Question Type */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                  Question Type
                </label>
                <Select
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                >
                  <option value="MCQ">Multiple Choice</option>
                  <option value="TRUE_FALSE">True/False</option>
                  <option value="SHORT_ANSWER">Short Answer</option>
                  <option value="AUDIO">Audio</option>
                </Select>
              </div>

              <hr className="border-grayScale-100" />

              {/* Question Text */}
              <div>
                <label htmlFor="question" className="mb-1.5 block text-sm font-medium text-grayScale-500">
                  Question
                </label>
                <Textarea
                  id="question"
                  placeholder="Enter your question here..."
                  value={formData.question}
                  onChange={(e) => setFormData((prev) => ({ ...prev, question: e.target.value }))}
                  rows={3}
                  required
                />
              </div>

              {/* Options for Multiple Choice */}
              {(formData.type === "MCQ" || formData.type === "TRUE_FALSE") && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                    Options
                  </label>
                  <div className="space-y-3">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2 group">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-grayScale-50 text-grayScale-400 text-xs font-medium flex items-center justify-center">
                          {index + 1}
                        </span>
                        <Input
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          disabled={formData.type === "TRUE_FALSE"}
                          required
                        />
                        {formData.type === "MCQ" && formData.options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(index)}
                            className="opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {formData.type === "MCQ" && (
                      <Button type="button" variant="outline" onClick={addOption} className="w-full mt-1 border-dashed border-grayScale-200 text-grayScale-400 hover:text-brand-500 hover:border-brand-500/30">
                        <Plus className="h-4 w-4" />
                        Add Option
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <hr className="border-grayScale-100" />

              {/* Correct Answer */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                  {formData.type === "AUDIO" ? "Audio Correct Answer Text" : "Correct Answer"}
                </label>
                {formData.type === "MCQ" || formData.type === "TRUE_FALSE" ? (
                  <Select
                    value={formData.correctAnswer}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, correctAnswer: e.target.value }))
                    }
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
                    placeholder={formData.type === "AUDIO" ? "Enter audio correct answer text..." : "Enter the correct answer..."}
                    value={formData.type === "AUDIO" ? formData.audioCorrectAnswerText : formData.correctAnswer}
                    onChange={(e) =>
                      setFormData((prev) =>
                        formData.type === "AUDIO"
                          ? { ...prev, audioCorrectAnswerText: e.target.value }
                          : { ...prev, correctAnswer: e.target.value },
                      )
                    }
                    rows={2}
                    required
                  />
                )}
              </div>

              <hr className="border-grayScale-100" />

              {/* Points and Difficulty side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Points */}
                <div>
                  <label htmlFor="points" className="mb-1.5 block text-sm font-medium text-grayScale-500">
                    Points
                  </label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    value={formData.points}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, points: parseInt(e.target.value) || 1 }))
                    }
                    required
                  />
                </div>

                {/* Difficulty */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                    Difficulty (Optional)
                  </label>
                  <Select
                    value={formData.difficulty}
                    onChange={(e) => setFormData((prev) => ({ ...prev, difficulty: e.target.value as Difficulty }))}
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </Select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                  Status
                </label>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as QuestionStatus }))}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="INACTIVE">Inactive</option>
                </Select>
              </div>

              {(formData.type === "AUDIO" || formData.type === "SHORT_ANSWER") && (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                      Voice Prompt{formData.type === "AUDIO" ? "" : " (Optional)"}
                    </label>
                    <Textarea
                      value={formData.voicePrompt}
                      onChange={(e) => setFormData((prev) => ({ ...prev, voicePrompt: e.target.value }))}
                      rows={2}
                      placeholder="Please say your answer..."
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                      Sample Answer Voice Prompt{formData.type === "AUDIO" ? "" : " (Optional)"}
                    </label>
                    <Textarea
                      value={formData.sampleAnswerVoicePrompt}
                      onChange={(e) => setFormData((prev) => ({ ...prev, sampleAnswerVoicePrompt: e.target.value }))}
                      rows={2}
                      placeholder="Sample spoken answer..."
                    />
                  </div>
                </>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-500">Tips (Optional)</label>
                <Input
                  value={formData.tips}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tips: e.target.value }))}
                  placeholder="Helpful tip for learners"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-500">Explanation (Optional)</label>
                <Textarea
                  value={formData.explanation}
                  onChange={(e) => setFormData((prev) => ({ ...prev, explanation: e.target.value }))}
                  rows={2}
                  placeholder="Explain why the answer is correct"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-grayScale-100">
                <Button type="button" variant="outline" onClick={() => navigate("/content/questions")} className="w-full sm:w-auto hover:bg-grayScale-50">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || loading} className="bg-brand-500 hover:bg-brand-600 text-white w-full sm:w-auto shadow-sm hover:shadow-md transition-all">
                  {isEditing ? "Update Question" : "Create Question"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
