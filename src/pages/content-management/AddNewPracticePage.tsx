import { useState } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight, ChevronDown, Grid3X3, Check, Plus, Trash2, GripVertical, X, Edit, Rocket } from "lucide-react"
import { Card } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { createQuestionSet, createQuestion, addQuestionToSet } from "../../api/courses.api"
import { Select } from "../../components/ui/select"
import type { QuestionOption } from "../../types/course.types"

type Step = 1 | 2 | 3 | 4 | 5
type ResultStatus = "success" | "error"
type QuestionType = "MCQ" | "TRUE_FALSE" | "SHORT"
type DifficultyLevel = "EASY" | "MEDIUM" | "HARD"

interface Persona {
  id: string
  name: string
  avatar: string
}

interface MCQOption {
  text: string
  isCorrect: boolean
}

interface Question {
  id: string
  questionText: string
  questionType: QuestionType
  difficultyLevel: DifficultyLevel
  points: number
  tips: string
  explanation: string
  options: MCQOption[]
  voicePrompt: string
  sampleAnswerVoicePrompt: string
  shortAnswers: string[]
}

const PERSONAS: Persona[] = [
  { id: "1", name: "Dawit", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dawit" },
  { id: "2", name: "Mahlet", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mahlet" },
  { id: "3", name: "Amanuel", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amanuel" },
  { id: "4", name: "Bethel", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bethel" },
  { id: "5", name: "Liya", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Liya" },
  { id: "6", name: "Aseffa", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aseffa" },
  { id: "7", name: "Hana", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hana" },
  { id: "8", name: "Nahom", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nahom" },
]

const STEPS = [
  { number: 1, label: "Context" },
  { number: 2, label: "Persona" },
  { number: 3, label: "Questions" },
  { number: 4, label: "Review" },
]

function createEmptyQuestion(id: string): Question {
  return {
    id,
    questionText: "",
    questionType: "MCQ",
    difficultyLevel: "EASY",
    points: 1,
    tips: "",
    explanation: "",
    options: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
    voicePrompt: "",
    sampleAnswerVoicePrompt: "",
    shortAnswers: [],
  }
}

export function AddNewPracticePage() {
  const { categoryId, courseId, subCourseId } = useParams()
  const navigate = useNavigate()
  
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)

  // Step 1: Context
  const [selectedProgram] = useState("Intermediate")
  const [selectedCourse] = useState("B2")
  const [practiceTitle, setPracticeTitle] = useState("")
  const [practiceDescription, setPracticeDescription] = useState("")
  const [shuffleQuestions, setShuffleQuestions] = useState(false)
  const [passingScore, setPassingScore] = useState(50)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(60)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [resultStatus, setResultStatus] = useState<ResultStatus | null>(null)
  const [resultMessage, setResultMessage] = useState("")

  // Step 2: Persona
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null)

  // Step 3: Questions
  const [questions, setQuestions] = useState<Question[]>([
    createEmptyQuestion("1"),
  ])

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step)
    }
  }

  const handleCancel = () => {
    navigate(`/content/category/${categoryId}/courses/${courseId}/sub-courses/${subCourseId}`)
  }

  const addQuestion = () => {
    setQuestions([...questions, createEmptyQuestion(String(Date.now()))])
  }

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id))
    }
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q))
  }

  const updateOption = (questionId: string, optionIndex: number, updates: Partial<MCQOption>) => {
    setQuestions(questions.map(q => {
      if (q.id !== questionId) return q
      const newOptions = q.options.map((opt, i) => i === optionIndex ? { ...opt, ...updates } : opt)
      return { ...q, options: newOptions }
    }))
  }

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id !== questionId) return q
      return { ...q, options: [...q.options, { text: "", isCorrect: false }] }
    }))
  }

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.id !== questionId) return q
      return { ...q, options: q.options.filter((_, i) => i !== optionIndex) }
    }))
  }

  const setCorrectOption = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.id !== questionId) return q
      return { ...q, options: q.options.map((opt, i) => ({ ...opt, isCorrect: i === optionIndex })) }
    }))
  }

  const saveQuestionSet = async (status: "DRAFT" | "PUBLISHED") => {
    setSaving(true)
    setSaveError(null)
    try {
      const persona = PERSONAS.find(p => p.id === selectedPersona)
      const setRes = await createQuestionSet({
        title: practiceTitle || "Untitled Practice",
        description: practiceDescription,
        set_type: "PRACTICE",
        owner_type: "SUB_COURSE",
        owner_id: Number(subCourseId),
        persona: persona?.name,
        shuffle_questions: shuffleQuestions,
        status,
        passing_score: passingScore,
        time_limit_minutes: timeLimitMinutes,
      })

      const questionSetId = setRes.data?.data?.id
      if (questionSetId) {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i]
          if (!q.questionText.trim()) continue

          const options: QuestionOption[] = q.questionType === "MCQ"
            ? q.options.map((opt, idx) => ({
                option_order: idx + 1,
                option_text: opt.text,
                is_correct: opt.isCorrect,
              }))
            : []

          const qRes = await createQuestion({
            question_text: q.questionText,
            question_type: q.questionType,
            difficulty_level: q.difficultyLevel,
            points: q.points,
            tips: q.tips || undefined,
            explanation: q.explanation || undefined,
            status: "PUBLISHED",
            options: options.length > 0 ? options : undefined,
            voice_prompt: q.voicePrompt || undefined,
            sample_answer_voice_prompt: q.sampleAnswerVoicePrompt || undefined,
            short_answers: q.shortAnswers.length > 0 ? q.shortAnswers : undefined,
          })

          const questionId = qRes.data?.data?.id
          if (questionId) {
            await addQuestionToSet(questionSetId, {
              display_order: i + 1,
              question_id: questionId,
            })
          }
        }
      }

      setResultStatus("success")
      setResultMessage(
        status === "PUBLISHED"
          ? "Your speaking practice is now active."
          : "Your practice has been saved as a draft."
      )
      setCurrentStep(5)
    } catch (err: unknown) {
      console.error("Failed to save practice:", err)
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred."
      setResultStatus("error")
      setResultMessage(errorMsg)
      setCurrentStep(5)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAsDraft = () => saveQuestionSet("DRAFT")
  const handlePublish = () => saveQuestionSet("PUBLISHED")

  const getNextButtonLabel = () => {
    switch (currentStep) {
      case 1: return "Next: Persona"
      case 2: return "Next: Questions"
      case 3: return "Next: Review"
      default: return "Next"
    }
  }

  return (
    <div className="space-y-6">
      {currentStep !== 5 && (
        <>
          {/* Back Link */}
          <Link
            to={`/content/category/${categoryId}/courses/${courseId}/sub-courses/${subCourseId}`}
            className="inline-flex items-center gap-2 text-sm text-grayScale-600 hover:text-grayScale-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sub-course
          </Link>

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-grayScale-900">Add New Practice</h1>
            <p className="mt-1 text-sm text-grayScale-500">
              Create a new immersive practice session for students.
            </p>
          </div>
        </>
      )}

      {/* Step Tracker */}
      {currentStep !== 5 && (
      <div className="flex items-center justify-center py-6">
        {STEPS.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  currentStep === step.number
                    ? "bg-brand-500 text-white"
                    : currentStep > step.number
                    ? "bg-brand-500 text-white"
                    : "border-2 border-grayScale-300 text-grayScale-400"
                }`}
              >
                {currentStep > step.number ? <Check className="h-4 w-4" /> : step.number}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  currentStep === step.number ? "text-brand-500" : "text-grayScale-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`mx-4 h-0.5 w-32 ${
                  currentStep > step.number ? "bg-brand-500" : "bg-grayScale-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      )}

      {/* Step Content */}
      {currentStep === 1 && (
        <Card className="mx-auto max-w-2xl p-8">
          <h2 className="text-lg font-semibold text-grayScale-900">Step 1: Context Definition</h2>
          <p className="mt-1 text-sm text-grayScale-500">
            Define the educational level and curriculum module for this practice.
          </p>

          <div className="mt-8 space-y-6">
            {/* Practice Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-grayScale-700">Practice Title</label>
              <Input
                value={practiceTitle}
                onChange={(e) => setPracticeTitle(e.target.value)}
                placeholder="Enter practice title"
              />
            </div>

            {/* Practice Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-grayScale-700">Description</label>
              <textarea
                value={practiceDescription}
                onChange={(e) => setPracticeDescription(e.target.value)}
                placeholder="Enter practice description"
                className="w-full rounded-lg border border-grayScale-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Passing Score */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Passing Score</label>
                <Input
                  type="number"
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                  placeholder="50"
                  min={0}
                  max={100}
                />
              </div>

              {/* Time Limit */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Time Limit (minutes)</label>
                <Input
                  type="number"
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  placeholder="60"
                  min={0}
                />
              </div>
            </div>

            {/* Shuffle Questions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShuffleQuestions(!shuffleQuestions)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  shuffleQuestions ? "bg-brand-500" : "bg-grayScale-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    shuffleQuestions ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <label className="text-sm font-medium text-grayScale-700">Shuffle Questions</label>
            </div>

            {/* Program */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-grayScale-700">
                Program <span className="text-brand-500">(Auto-selected)</span>
              </label>
              <div className="flex items-center gap-3 rounded-lg border border-grayScale-200 px-4 py-3">
                <Grid3X3 className="h-5 w-5 text-grayScale-400" />
                <span className="flex-1 text-sm">{selectedProgram}</span>
                <ChevronDown className="h-5 w-5 text-grayScale-400" />
              </div>
            </div>

            {/* Course */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-grayScale-700">
                Course <span className="text-brand-500">(Auto-selected)</span>
              </label>
              <div className="flex items-center gap-3 rounded-lg border border-grayScale-200 px-4 py-3">
                <Grid3X3 className="h-5 w-5 text-grayScale-400" />
                <span className="flex-1 text-sm">{selectedCourse}</span>
                <ChevronDown className="h-5 w-5 text-grayScale-400" />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between border-t pt-6">
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button className="bg-brand-500 hover:bg-brand-600" onClick={handleNext}>
              {getNextButtonLabel()}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 2 && (
        <div className="mx-auto max-w-4xl">
          <h2 className="text-xl font-semibold text-grayScale-900">Select Personas</h2>
          <p className="mt-1 text-sm text-grayScale-500">
            Choose the characters that will participate in this practice scenario. Students will interact with these personas.
          </p>

          <div className="mt-8 grid grid-cols-4 gap-4">
            {PERSONAS.map((persona) => (
              <button
                key={persona.id}
                onClick={() => setSelectedPersona(persona.id)}
                className={`relative flex flex-col items-center rounded-xl border-2 p-6 transition-all ${
                  selectedPersona === persona.id
                    ? "border-brand-500 bg-brand-50"
                    : "border-grayScale-200 hover:border-grayScale-300"
                }`}
              >
                {selectedPersona === persona.id && (
                  <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white">
                    <Check className="h-3 w-3" />
                  </div>
                )}
                <div className="mb-3 h-20 w-20 overflow-hidden rounded-full bg-grayScale-100">
                  <img
                    src={persona.avatar}
                    alt={persona.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="font-medium text-grayScale-900">{persona.name}</span>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button className="bg-brand-500 hover:bg-brand-600" onClick={handleNext}>
              {getNextButtonLabel()}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="mx-auto max-w-4xl">
          <h2 className="text-xl font-semibold text-grayScale-900">Create Practice Questions</h2>
          <p className="mt-1 text-sm text-grayScale-500">
            Add questions to your practice. Support for MCQ, True/False, and Short Answer types.
          </p>

          <div className="mt-6 space-y-4">
            {questions.map((question, index) => (
              <Card key={question.id} className="border-l-4 border-l-brand-500 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 cursor-grab text-grayScale-400" />
                    <span className="font-medium text-grayScale-900">Question {index + 1}</span>
                  </div>
                  <button
                    onClick={() => removeQuestion(question.id)}
                    className="rounded p-1 text-grayScale-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  {/* Question Text */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
                      Question Text
                    </label>
                    <textarea
                      value={question.questionText}
                      onChange={(e) => updateQuestion(question.id, { questionText: e.target.value })}
                      placeholder="Enter your question..."
                      className="w-full rounded-lg border border-grayScale-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {/* Question Type */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
                        Type
                      </label>
                      <Select
                        value={question.questionType}
                        onChange={(e) => updateQuestion(question.id, { questionType: e.target.value as QuestionType })}
                      >
                        <option value="MCQ">Multiple Choice</option>
                        <option value="TRUE_FALSE">True/False</option>
                        <option value="SHORT">Short Answer</option>
                      </Select>
                    </div>

                    {/* Difficulty */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
                        Difficulty
                      </label>
                      <Select
                        value={question.difficultyLevel}
                        onChange={(e) => updateQuestion(question.id, { difficultyLevel: e.target.value as DifficultyLevel })}
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </Select>
                    </div>

                    {/* Points */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
                        Points
                      </label>
                      <Input
                        type="number"
                        value={question.points}
                        onChange={(e) => updateQuestion(question.id, { points: Number(e.target.value) || 1 })}
                        min={1}
                      />
                    </div>
                  </div>

                  {/* MCQ Options */}
                  {question.questionType === "MCQ" && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
                        Options
                      </label>
                      <div className="space-y-2">
                        {question.options.map((option, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setCorrectOption(question.id, optIdx)}
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                option.isCorrect
                                  ? "border-green-500 bg-green-500 text-white"
                                  : "border-grayScale-300 hover:border-brand-400"
                              }`}
                            >
                              {option.isCorrect && <Check className="h-3 w-3" />}
                            </button>
                            <Input
                              value={option.text}
                              onChange={(e) => updateOption(question.id, optIdx, { text: e.target.value })}
                              placeholder={`Option ${optIdx + 1}`}
                              className="flex-1"
                            />
                            {question.options.length > 2 && (
                              <button
                                onClick={() => removeOption(question.id, optIdx)}
                                className="rounded p-1 text-grayScale-400 hover:bg-red-50 hover:text-red-500"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addOption(question.id)}
                          className="flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600"
                        >
                          <Plus className="h-4 w-4" />
                          Add Option
                        </button>
                      </div>
                      <p className="text-xs text-grayScale-400">Click the circle to mark the correct answer.</p>
                    </div>
                  )}

                  {/* TRUE_FALSE Options */}
                  {question.questionType === "TRUE_FALSE" && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
                        Correct Answer
                      </label>
                      <div className="flex gap-3">
                        {["True", "False"].map((val, i) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => updateQuestion(question.id, {
                              options: [
                                { text: "True", isCorrect: i === 0 },
                                { text: "False", isCorrect: i === 1 },
                              ],
                            })}
                            className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                              question.options[i]?.isCorrect
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

                  <div className="grid grid-cols-2 gap-4">
                    {/* Tips */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
                        Tips (Optional)
                      </label>
                      <Input
                        value={question.tips}
                        onChange={(e) => updateQuestion(question.id, { tips: e.target.value })}
                        placeholder="Helpful tip for the student"
                      />
                    </div>

                    {/* Explanation */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
                        Explanation (Optional)
                      </label>
                      <Input
                        value={question.explanation}
                        onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                        placeholder="Why this is the correct answer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Voice Prompt */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
                        Voice Prompt (Optional)
                      </label>
                      <Input
                        value={question.voicePrompt}
                        onChange={(e) => updateQuestion(question.id, { voicePrompt: e.target.value })}
                        placeholder="Voice prompt text"
                      />
                    </div>

                    {/* Sample Answer Voice Prompt */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
                        Sample Answer Voice Prompt (Optional)
                      </label>
                      <Input
                        value={question.sampleAnswerVoicePrompt}
                        onChange={(e) => updateQuestion(question.id, { sampleAnswerVoicePrompt: e.target.value })}
                        placeholder="Sample answer voice prompt"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Add Button */}
          <div className="mt-4">
            <button
              onClick={addQuestion}
              className="flex items-center gap-2 text-sm font-medium text-brand-500 hover:text-brand-600"
            >
              <Plus className="h-4 w-4" />
              Add New Question
            </button>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button className="bg-brand-500 hover:bg-brand-600" onClick={handleNext}>
              {getNextButtonLabel()}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="mx-auto max-w-4xl">
          <h2 className="text-xl font-semibold text-grayScale-900">Review & Publish</h2>
          <p className="mt-1 text-sm text-grayScale-500">
            Review your practice details before saving.
          </p>

          {/* Basic Information Card */}
          <Card className="mt-6 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-grayScale-900">Basic Information</h3>
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-grayScale-500">Title</span>
                <span className="text-sm font-medium text-grayScale-900">{practiceTitle || "Untitled Practice"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-grayScale-500">Description</span>
                <span className="max-w-sm text-right text-sm text-grayScale-700">{practiceDescription || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-grayScale-500">Passing Score</span>
                <span className="text-sm font-medium text-grayScale-900">{passingScore}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-grayScale-500">Time Limit</span>
                <span className="text-sm font-medium text-grayScale-900">{timeLimitMinutes} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-grayScale-500">Shuffle Questions</span>
                <span className="text-sm font-medium text-grayScale-900">{shuffleQuestions ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-grayScale-500">Persona</span>
                <div className="flex items-center gap-2">
                  {selectedPersona && (
                    <div className="h-6 w-6 overflow-hidden rounded-full bg-grayScale-100">
                      <img
                        src={PERSONAS.find(p => p.id === selectedPersona)?.avatar}
                        alt="Persona"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <span className="text-sm font-medium text-brand-500">
                    {PERSONAS.find(p => p.id === selectedPersona)?.name || "None selected"}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Questions Review */}
          <Card className="mt-6 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-grayScale-900">Questions</h3>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-grayScale-100 text-xs">
                  {questions.length}
                </span>
              </div>
              <button
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="rounded-lg border border-grayScale-200 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-brand-100 text-xs font-semibold text-brand-600">
                      {index + 1}
                    </span>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium text-grayScale-900">{question.questionText}</p>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                          {question.questionType === "MCQ" ? "Multiple Choice" : question.questionType === "TRUE_FALSE" ? "True/False" : "Short Answer"}
                        </span>
                        <span className="rounded bg-purple-50 px-2 py-0.5 text-xs text-purple-600">
                          {question.difficultyLevel}
                        </span>
                        <span className="text-xs text-grayScale-500">{question.points} pt{question.points !== 1 ? "s" : ""}</span>
                      </div>
                      {question.questionType === "MCQ" && question.options.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {question.options.map((opt, i) => (
                            <div
                              key={i}
                              className={`flex items-center gap-2 rounded px-2 py-1 text-sm ${
                                opt.isCorrect ? "bg-green-50 text-green-700 font-medium" : "text-grayScale-600"
                              }`}
                            >
                              {opt.isCorrect && <Check className="h-3 w-3" />}
                              {opt.text || `Option ${i + 1}`}
                            </div>
                          ))}
                        </div>
                      )}
                      {question.tips && (
                        <p className="text-xs text-amber-600">Tip: {question.tips}</p>
                      )}
                      {question.explanation && (
                        <p className="text-xs text-grayScale-500">Explanation: {question.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {saveError && (
            <p className="mt-4 text-sm text-red-500">{saveError}</p>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSaveAsDraft} disabled={saving}>
                {saving ? "Saving..." : "Save as Draft"}
              </Button>
              <Button className="bg-brand-500 hover:bg-brand-600" onClick={handlePublish} disabled={saving}>
                <Rocket className="mr-2 h-4 w-4" />
                {saving ? "Publishing..." : "Publish Now"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Result */}
      {currentStep === 5 && resultStatus && (
        <div className="flex flex-col items-center justify-center py-20">
          {resultStatus === "success" ? (
            <>
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-brand-100">
                <svg viewBox="0 0 24 24" className="h-14 w-14 text-brand-500" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h2 className="mt-8 text-2xl font-bold text-grayScale-900">
                Practice Published Successfully!
              </h2>
              <p className="mt-2 text-sm text-grayScale-500">{resultMessage}</p>
              <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
                <Button
                  className="w-full bg-brand-500 hover:bg-brand-600"
                  onClick={() => navigate(`/content/category/${categoryId}/courses/${courseId}/sub-courses/${subCourseId}`)}
                >
                  Go back to Sub-course
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-brand-500 text-brand-500 hover:bg-brand-50"
                  onClick={() => {
                    setCurrentStep(1)
                    setPracticeTitle("")
                    setPracticeDescription("")
                    setShuffleQuestions(false)
                    setPassingScore(50)
                    setTimeLimitMinutes(60)
                    setSelectedPersona(null)
                    setQuestions([createEmptyQuestion("1")])
                    setSaveError(null)
                    setResultStatus(null)
                    setResultMessage("")
                  }}
                >
                  Add Another Practice
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-amber-100">
                <svg viewBox="0 0 24 24" className="h-14 w-14 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h2 className="mt-8 text-2xl font-bold text-grayScale-900">
                Publish Error!
              </h2>
              <p className="mt-2 text-sm text-grayScale-500">{resultMessage}</p>
              <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
                <Button
                  className="w-full bg-brand-500 hover:bg-brand-600"
                  onClick={() => {
                    setCurrentStep(4)
                    setResultStatus(null)
                  }}
                >
                  Try Again
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
