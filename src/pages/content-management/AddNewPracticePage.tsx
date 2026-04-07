import { useMemo, useRef, useState, type ChangeEvent } from "react"
import { Link, useLocation, useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight, ChevronDown, Grid3X3, Check, Plus, Trash2, GripVertical, X, Edit, Rocket, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Card } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { createQuestionSet, createQuestion, addQuestionToSet } from "../../api/courses.api"
import { uploadVideoFile } from "../../api/files.api"
import { Select } from "../../components/ui/select"
import type { QuestionOption } from "../../types/course.types"

type Step = 1 | 2 | 3 | 4 | 5
type ResultStatus = "success" | "error"
type QuestionType = "MCQ" | "TRUE_FALSE" | "SHORT" | "AUDIO"
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
  audioCorrectAnswerText: string
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

/** Prefer direct storage URL; for Vimeo pipeline match SubCourseContentPage player URL shape. */
function introVideoUrlFromUploadResponse(data: { url?: string; embed_url?: string } | undefined): string | null {
  if (!data) return null
  const pageUrl = data.url?.trim()
  const embedUrl = data.embed_url?.trim()
  if (embedUrl) {
    const hashFromUrl = pageUrl ? pageUrl.split("/").filter(Boolean).at(-1) : undefined
    return hashFromUrl ? `${embedUrl}?h=${hashFromUrl}` : embedUrl
  }
  return pageUrl || null
}

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
    audioCorrectAnswerText: "",
    shortAnswers: [],
  }
}

export function AddNewPracticePage() {
  const { categoryId, courseId, subCourseId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)
  const source = searchParams.get("source")
  const backTo = useMemo(() => {
    if (source === "human-language") return "/content/human-language"
    return `/content/category/${categoryId}/courses/${courseId}/sub-courses/${subCourseId}`
  }, [source, categoryId, courseId, subCourseId])
  
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)

  // Step 1: Context
  const [selectedProgram] = useState("Intermediate")
  const [selectedCourse] = useState("B2")
  const [practiceTitle, setPracticeTitle] = useState("")
  const [practiceDescription, setPracticeDescription] = useState("")
  const [introVideoUrl, setIntroVideoUrl] = useState("")
  const [uploadingIntroVideo, setUploadingIntroVideo] = useState(false)
  const introVideoFileInputRef = useRef<HTMLInputElement>(null)
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
    navigate(backTo)
  }

  const handleIntroVideoFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setUploadingIntroVideo(true)
    try {
      const uploadRes = await uploadVideoFile(file, {
        title: practiceTitle.trim() || file.name.replace(/\.[^.]+$/, "") || "Practice intro",
        description: practiceDescription.trim() || undefined,
      })
      const finalUrl = introVideoUrlFromUploadResponse(uploadRes.data?.data)
      if (!finalUrl) throw new Error("Missing uploaded video url")
      setIntroVideoUrl(finalUrl)
      toast.success("Intro video uploaded", { description: "The URL has been filled in for you." })
    } catch (error) {
      console.error("Failed to upload intro video:", error)
      toast.error("Failed to upload intro video")
    } finally {
      setUploadingIntroVideo(false)
    }
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
        set_type: "PRACTICE",
        owner_type: "SUB_COURSE",
        owner_id: Number(subCourseId),
        ...(practiceDescription.trim() ? { description: practiceDescription.trim() } : {}),
        ...(persona?.name ? { persona: persona.name } : {}),
        shuffle_questions: shuffleQuestions,
        status,
        passing_score: passingScore,
        time_limit_minutes: timeLimitMinutes,
        ...(introVideoUrl.trim() ? { intro_video_url: introVideoUrl.trim() } : {}),
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
            audio_correct_answer_text: q.audioCorrectAnswerText || undefined,
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
    <div className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
      <div className="space-y-5 sm:space-y-6">
      {currentStep !== 5 && (
        <>
          {/* Back Link */}
          <Link
            to={backTo}
            className="group inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-grayScale-600 transition-colors hover:bg-brand-50 hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Sub-course
          </Link>

          {/* Header */}
          <div className="border-b border-grayScale-100 pb-6 sm:pb-8">
            <h1 className="text-2xl font-bold tracking-tight text-grayScale-900 sm:text-3xl">Add New Practice</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-grayScale-500 sm:text-[15px]">
              Create a new immersive practice session for students.
            </p>
          </div>
        </>
      )}

      {/* Step Tracker */}
      {currentStep !== 5 && (
      <div className="flex items-center justify-center rounded-2xl border border-grayScale-100 bg-grayScale-50/40 px-3 py-4 sm:px-6 sm:py-5">
        {STEPS.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold shadow-sm transition-all duration-300 sm:h-10 sm:w-10 sm:text-sm ${
                  currentStep === step.number
                    ? "bg-brand-500 text-white ring-4 ring-brand-100"
                    : currentStep > step.number
                    ? "bg-brand-500 text-white"
                    : "border-2 border-grayScale-300 bg-white text-grayScale-400"
                }`}
              >
                {currentStep > step.number ? <Check className="h-4 w-4" /> : step.number}
              </div>
              <span
                className={`mt-2 max-w-[4.5rem] text-center text-[10px] font-semibold uppercase tracking-wide sm:mt-2.5 sm:max-w-none sm:text-xs sm:normal-case sm:tracking-wide ${
                  currentStep === step.number
                    ? "text-brand-600"
                    : currentStep > step.number
                    ? "text-brand-500"
                    : "text-grayScale-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`mx-2 h-0.5 w-10 shrink-0 rounded-full transition-colors duration-300 sm:mx-4 sm:w-20 md:w-28 lg:w-36 xl:w-44 ${
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
        <Card className="overflow-hidden border-grayScale-200/80 shadow-sm">
          <div className="border-b border-grayScale-100 bg-gradient-to-r from-grayScale-50/80 to-white px-5 py-5 sm:px-8 sm:py-6">
            <h2 className="text-lg font-semibold tracking-tight text-grayScale-900 sm:text-xl">Step 1: Context</h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-grayScale-500">
              Define details and rules for this practice. Curriculum context is shown on the right.
            </p>
          </div>

          <div className="p-5 sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
              <div className="space-y-6 lg:col-span-7">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-grayScale-700">Practice Title</label>
                  <Input
                    value={practiceTitle}
                    onChange={(e) => setPracticeTitle(e.target.value)}
                    placeholder="Enter practice title"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-grayScale-700">Description</label>
                  <textarea
                    value={practiceDescription}
                    onChange={(e) => setPracticeDescription(e.target.value)}
                    placeholder="Enter practice description"
                    className="min-h-[88px] w-full rounded-lg border border-grayScale-200 px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-grayScale-700">
                    Intro video URL <span className="font-normal text-grayScale-400">(optional)</span>
                  </label>
                  <Input
                    value={introVideoUrl}
                    onChange={(e) => setIntroVideoUrl(e.target.value)}
                    placeholder="https://…"
                    type="url"
                    inputMode="url"
                    autoComplete="off"
                    className="h-11 font-mono text-[13px]"
                  />
                  <input
                    ref={introVideoFileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleIntroVideoFileChange}
                    disabled={uploadingIntroVideo}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingIntroVideo}
                      onClick={() => introVideoFileInputRef.current?.click()}
                      className="gap-1.5"
                    >
                      {uploadingIntroVideo ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {uploadingIntroVideo ? "Uploading…" : "Upload video from computer"}
                    </Button>
                    {introVideoUrl.trim() ? (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setIntroVideoUrl("")}>
                        Clear URL
                      </Button>
                    ) : null}
                  </div>
                  <p className="text-xs leading-relaxed text-grayScale-500">
                    Paste a link or upload from your computer; uploads go through the file service (optional, not tied to sub-course video rows).
                  </p>
                </div>
              </div>

              <aside className="space-y-5 lg:col-span-5">
                <div className="rounded-xl border border-grayScale-200 bg-grayScale-50/40 p-5 shadow-sm ring-1 ring-grayScale-100/80">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-grayScale-500">Scoring & behavior</h3>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-grayScale-700">Passing score</label>
                      <Input
                        type="number"
                        value={passingScore}
                        onChange={(e) => setPassingScore(Number(e.target.value))}
                        placeholder="50"
                        min={0}
                        max={100}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-grayScale-700">Time (min)</label>
                      <Input
                        type="number"
                        value={timeLimitMinutes}
                        onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                        placeholder="60"
                        min={0}
                        className="h-10"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-grayScale-200/80 bg-white px-4 py-3">
                    <label className="text-sm font-medium text-grayScale-700">Shuffle questions</label>
                    <button
                      type="button"
                      onClick={() => setShuffleQuestions(!shuffleQuestions)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        shuffleQuestions ? "bg-brand-500" : "bg-grayScale-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${
                          shuffleQuestions ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-grayScale-200 bg-white p-5 shadow-sm ring-1 ring-grayScale-100/80">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-grayScale-500">Curriculum context</h3>
                  <p className="mt-1 text-xs text-grayScale-400">Read-only for this flow.</p>
                  <div className="mt-4 space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-grayScale-700">
                        Program{" "}
                        <span className="rounded bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-500">Auto</span>
                      </label>
                      <div className="flex items-center gap-3 rounded-lg border border-dashed border-grayScale-200 bg-grayScale-50/50 px-3 py-2.5">
                        <Grid3X3 className="h-4 w-4 shrink-0 text-grayScale-400" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-grayScale-700">{selectedProgram}</span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-grayScale-300" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-grayScale-700">
                        Course{" "}
                        <span className="rounded bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-500">Auto</span>
                      </label>
                      <div className="flex items-center gap-3 rounded-lg border border-dashed border-grayScale-200 bg-grayScale-50/50 px-3 py-2.5">
                        <Grid3X3 className="h-4 w-4 shrink-0 text-grayScale-400" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-grayScale-700">{selectedCourse}</span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-grayScale-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>

          <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-grayScale-100 bg-grayScale-50/30 px-5 py-4 sm:flex-row sm:items-center sm:px-8 sm:py-5">
            <Button variant="ghost" onClick={handleCancel} className="sm:w-auto">
              Cancel
            </Button>
            <Button className="w-full bg-brand-500 hover:bg-brand-600 sm:w-auto sm:min-w-[180px]" onClick={handleNext}>
              {getNextButtonLabel()}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 2 && (
        <Card className="overflow-hidden border-grayScale-200/80 shadow-sm">
          <div className="border-b border-grayScale-100 bg-gradient-to-r from-grayScale-50/80 to-white px-5 py-5 sm:px-8 sm:py-6">
            <h2 className="text-lg font-semibold tracking-tight text-grayScale-900 sm:text-xl">Step 2: Persona</h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-grayScale-500">
              Choose the character students will interact with in this practice.
            </p>
          </div>

          <div className="p-5 sm:p-8 lg:p-10">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
            {PERSONAS.map((persona) => (
              <button
                key={persona.id}
                onClick={() => setSelectedPersona(persona.id)}
                className={`group relative flex flex-col items-center rounded-xl border-2 p-6 transition-all duration-200 ${
                  selectedPersona === persona.id
                    ? "border-brand-500 bg-brand-50 shadow-md shadow-brand-100"
                    : "border-grayScale-200 bg-white hover:border-brand-300 hover:shadow-sm"
                }`}
              >
                {selectedPersona === persona.id && (
                  <div className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}
                <div className={`mb-3 h-20 w-20 overflow-hidden rounded-full bg-grayScale-100 ring-2 transition-all duration-200 ${
                  selectedPersona === persona.id ? "ring-brand-300 ring-offset-2" : "ring-transparent group-hover:ring-grayScale-200"
                }`}>
                  <img
                    src={persona.avatar}
                    alt={persona.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className={`text-sm font-semibold transition-colors ${
                  selectedPersona === persona.id ? "text-brand-600" : "text-grayScale-900"
                }`}>{persona.name}</span>
              </button>
            ))}
          </div>
          </div>

          <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-grayScale-100 bg-grayScale-50/30 px-5 py-4 sm:flex-row sm:items-center sm:px-8 sm:py-5">
            <Button variant="outline" onClick={handleBack} className="sm:w-auto">
              Back
            </Button>
            <Button className="w-full bg-brand-500 hover:bg-brand-600 sm:w-auto sm:min-w-[180px]" onClick={handleNext}>
              {getNextButtonLabel()}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 3 && (
        <div className="w-full space-y-6">
          <div className="rounded-2xl border border-grayScale-200/80 bg-gradient-to-r from-grayScale-50/80 to-white px-5 py-5 shadow-sm sm:px-8 sm:py-6">
            <h2 className="text-lg font-semibold tracking-tight text-grayScale-900 sm:text-xl">Step 3: Questions</h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-grayScale-500">
              Add MCQ, True/False, Short Answer, or Audio items. Use the full width for stems and options.
            </p>
          </div>

          <div className="space-y-4 sm:space-y-5">
            {questions.map((question, index) => (
              <Card key={question.id} className="border border-grayScale-200/90 border-l-4 border-l-brand-500 p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6 lg:p-8">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 cursor-grab text-grayScale-300 transition-colors hover:text-grayScale-500" />
                    <span className="text-base font-semibold text-grayScale-900">Question {index + 1}</span>
                  </div>
                  <button
                    onClick={() => removeQuestion(question.id)}
                    className="rounded-lg p-1.5 text-grayScale-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5 space-y-5">
                  {/* Question Text */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
                      Question Text
                    </label>
                    <textarea
                      value={question.questionText}
                      onChange={(e) => updateQuestion(question.id, { questionText: e.target.value })}
                      placeholder="Enter your question..."
                      className="w-full rounded-lg border border-grayScale-200 px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
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
                        <option value="AUDIO">Audio</option>
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
                    <div className="space-y-3 rounded-lg bg-grayScale-50/50 p-4">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
                        Options
                      </label>
                      <div className="space-y-2.5">
                        {question.options.map((option, optIdx) => (
                          <div key={optIdx} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors ${
                            option.isCorrect ? "border-green-200 bg-green-50/50" : "border-grayScale-200 bg-white"
                          }`}>
                            <button
                              type="button"
                              onClick={() => setCorrectOption(question.id, optIdx)}
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
                              onChange={(e) => updateOption(question.id, optIdx, { text: e.target.value })}
                              placeholder={`Option ${optIdx + 1}`}
                              className="flex-1 border-0 bg-transparent shadow-none focus:ring-0"
                            />
                            {question.options.length > 2 && (
                              <button
                                onClick={() => removeOption(question.id, optIdx)}
                                className="rounded-lg p-1 text-grayScale-400 transition-colors hover:bg-red-50 hover:text-red-500"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addOption(question.id)}
                          className="mt-1 flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-brand-500 transition-colors hover:bg-brand-50 hover:text-brand-600"
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

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
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

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
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

                  {question.questionType === "AUDIO" && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
                        Audio Correct Answer Text
                      </label>
                      <Input
                        value={question.audioCorrectAnswerText}
                        onChange={(e) => updateQuestion(question.id, { audioCorrectAnswerText: e.target.value })}
                        placeholder="Expected correct answer text for audio response"
                      />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <div>
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-200/90 bg-brand-50/20 px-4 py-3.5 text-sm font-semibold text-brand-600 transition-all hover:border-brand-300 hover:bg-brand-50/60 hover:text-brand-700 sm:py-3"
            >
              <Plus className="h-4 w-4" />
              Add another question
            </button>
          </div>

          <div className="flex flex-col-reverse items-stretch justify-between gap-3 rounded-2xl border border-grayScale-200/80 bg-grayScale-50/30 px-4 py-4 sm:flex-row sm:items-center sm:px-6 sm:py-5">
            <Button variant="outline" onClick={handleBack} className="sm:w-auto">
              Back
            </Button>
            <Button className="w-full bg-brand-500 hover:bg-brand-600 sm:w-auto sm:min-w-[180px]" onClick={handleNext}>
              {getNextButtonLabel()}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="w-full space-y-6">
          <div className="rounded-2xl border border-grayScale-200/80 bg-gradient-to-r from-grayScale-50/80 to-white px-5 py-5 shadow-sm sm:px-8 sm:py-6">
            <h2 className="text-lg font-semibold tracking-tight text-grayScale-900 sm:text-xl">Step 4: Review & publish</h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-grayScale-500">
              Confirm context, persona, and questions before saving or publishing.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
          {/* Basic Information Card */}
          <Card className="overflow-hidden border-grayScale-200/80 p-0 shadow-sm">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-6 py-4">
              <h3 className="font-semibold text-grayScale-900">Basic Information</h3>
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium text-brand-500 transition-colors hover:bg-brand-50 hover:text-brand-600"
              >
                <Edit className="h-3.5 w-3.5" />
                Edit
              </button>
            </div>
            <div className="divide-y divide-grayScale-100">
              <div className="flex justify-between px-6 py-3.5 odd:bg-grayScale-50/50">
                <span className="text-sm text-grayScale-500">Title</span>
                <span className="text-sm font-medium text-grayScale-900">{practiceTitle || "Untitled Practice"}</span>
              </div>
              <div className="flex justify-between bg-grayScale-50/50 px-6 py-3.5">
                <span className="text-sm text-grayScale-500">Description</span>
                <span className="max-w-[min(28rem,55%)] text-right text-sm leading-relaxed text-grayScale-700">{practiceDescription || "—"}</span>
              </div>
              <div className="flex justify-between px-6 py-3.5">
                <span className="text-sm text-grayScale-500">Intro video URL</span>
                <span className="max-w-[min(28rem,55%)] break-all text-right text-sm text-grayScale-700">
                  {introVideoUrl.trim() || "—"}
                </span>
              </div>
              <div className="flex justify-between bg-grayScale-50/50 px-6 py-3.5">
                <span className="text-sm text-grayScale-500">Passing Score</span>
                <span className="text-sm font-medium text-grayScale-900">{passingScore}%</span>
              </div>
              <div className="flex justify-between px-6 py-3.5">
                <span className="text-sm text-grayScale-500">Time Limit</span>
                <span className="text-sm font-medium text-grayScale-900">{timeLimitMinutes} minutes</span>
              </div>
              <div className="flex justify-between bg-grayScale-50/50 px-6 py-3.5">
                <span className="text-sm text-grayScale-500">Shuffle Questions</span>
                <span className="text-sm font-medium text-grayScale-900">{shuffleQuestions ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between px-6 py-3.5">
                <span className="text-sm text-grayScale-500">Persona</span>
                <div className="flex items-center gap-2">
                  {selectedPersona && (
                    <div className="h-6 w-6 overflow-hidden rounded-full bg-grayScale-100 ring-2 ring-brand-100">
                      <img
                        src={PERSONAS.find(p => p.id === selectedPersona)?.avatar}
                        alt="Persona"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <span className="text-sm font-medium text-brand-600">
                    {PERSONAS.find(p => p.id === selectedPersona)?.name || "None selected"}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Questions Review */}
          <Card className="overflow-hidden border-grayScale-200/80 p-0 shadow-sm lg:min-h-0">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <h3 className="font-semibold text-grayScale-900">Questions</h3>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-600">
                  {questions.length}
                </span>
              </div>
              <button
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium text-brand-500 transition-colors hover:bg-brand-50 hover:text-brand-600"
              >
                <Edit className="h-3.5 w-3.5" />
                Edit
              </button>
            </div>
            <div className="max-h-[min(70vh,52rem)] space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
              {questions.map((question, index) => (
                <div key={question.id} className="rounded-xl border border-grayScale-200 bg-grayScale-50/20 p-4 transition-colors hover:border-grayScale-300 sm:p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-600">
                      {index + 1}
                    </span>
                    <div className="flex-1 space-y-2.5">
                      <p className="text-sm font-medium leading-relaxed text-grayScale-900">{question.questionText}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                          {question.questionType === "MCQ"
                            ? "Multiple Choice"
                            : question.questionType === "TRUE_FALSE"
                              ? "True/False"
                              : question.questionType === "AUDIO"
                                ? "Audio"
                                : "Short Answer"}
                        </span>
                        <span className="rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600">
                          {question.difficultyLevel}
                        </span>
                        <span className="rounded-md bg-grayScale-100 px-2 py-0.5 text-xs font-medium text-grayScale-600">{question.points} pt{question.points !== 1 ? "s" : ""}</span>
                      </div>
                      {question.questionType === "MCQ" && question.options.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {question.options.map((opt, i) => (
                            <div
                              key={i}
                              className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm ${
                                opt.isCorrect ? "bg-green-50 font-medium text-green-700" : "text-grayScale-600"
                              }`}
                            >
                              {opt.isCorrect && <Check className="h-3.5 w-3.5" />}
                              {opt.text || `Option ${i + 1}`}
                            </div>
                          ))}
                        </div>
                      )}
                      {question.tips && (
                        <p className="rounded-md bg-amber-50 px-2.5 py-1.5 text-xs text-amber-600">💡 Tip: {question.tips}</p>
                      )}
                      {question.explanation && (
                        <p className="rounded-md bg-grayScale-50 px-2.5 py-1.5 text-xs text-grayScale-500">Explanation: {question.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          </div>

          {saveError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-600">{saveError}</p>
            </div>
          )}

          <div className="flex flex-col-reverse items-stretch justify-between gap-3 rounded-2xl border border-grayScale-200/80 bg-grayScale-50/30 px-4 py-4 sm:flex-row sm:items-center sm:px-6 sm:py-5">
            <Button variant="outline" onClick={handleBack} className="sm:w-auto">
              Back
            </Button>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={handleSaveAsDraft} disabled={saving} className="sm:min-w-[140px]">
                {saving ? "Saving..." : "Save as Draft"}
              </Button>
              <Button className="bg-brand-500 hover:bg-brand-600 sm:min-w-[160px]" onClick={handlePublish} disabled={saving}>
                <Rocket className="mr-2 h-4 w-4" />
                {saving ? "Publishing..." : "Publish Now"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Result */}
      {currentStep === 5 && resultStatus && (
        <div className="flex flex-col items-center justify-center px-4 py-20">
          {resultStatus === "success" ? (
            <>
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200 shadow-lg shadow-brand-100/50">
                <svg viewBox="0 0 24 24" className="h-16 w-16 text-brand-500" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h2 className="mt-8 text-center text-2xl font-bold tracking-tight text-grayScale-900">
                Practice Published Successfully!
              </h2>
              <p className="mt-3 text-center text-sm text-grayScale-500">{resultMessage}</p>
              <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
                <Button
                  className="w-full bg-brand-500 hover:bg-brand-600"
                  onClick={() => navigate(backTo)}
                >
                  Go back to Course
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-brand-500 text-brand-500 hover:bg-brand-50"
                  onClick={() => {
                    setCurrentStep(1)
                    setPracticeTitle("")
                    setPracticeDescription("")
                    setIntroVideoUrl("")
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
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 shadow-lg shadow-amber-100/50">
                <svg viewBox="0 0 24 24" className="h-16 w-16 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h2 className="mt-8 text-center text-2xl font-bold tracking-tight text-grayScale-900">
                Publish Error!
              </h2>
              <p className="mt-3 max-w-md text-center text-sm text-grayScale-500">{resultMessage}</p>
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
    </div>
  )
}
