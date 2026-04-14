import { useMemo, useRef, useState, type ChangeEvent } from "react"
import { ArrowLeft, ArrowRight, Check, GripVertical, Loader2, Plus, Rocket, Trash2, Upload } from "lucide-react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { addQuestionToSet, createLesson, createQuestion } from "../../api/courses.api"
import { uploadVideoFile } from "../../api/files.api"
import { PracticeQuestionEditorFields } from "../../components/content-management/PracticeQuestionEditorFields"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import type { QuestionOption } from "../../types/course.types"

type Step = 1 | 2 | 3 | 4
type QuestionType = "MCQ" | "TRUE_FALSE" | "SHORT" | "AUDIO"
type DifficultyLevel = "EASY" | "MEDIUM" | "HARD"
type ResultStatus = "success" | "error"

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
  imageUrl: string
}

const STEPS = [
  { number: 1, label: "Context" },
  { number: 2, label: "Questions" },
  { number: 3, label: "Review" },
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
    audioCorrectAnswerText: "",
    shortAnswers: [],
    imageUrl: "",
  }
}

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

function toVimeoEmbedUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl.trim())
    const host = parsed.hostname.toLowerCase()
    if (!host.includes("vimeo.com")) return null
    if (host.includes("player.vimeo.com") && parsed.pathname.includes("/video/")) return parsed.toString()
    const segments = parsed.pathname.split("/").filter(Boolean)
    const videoId = segments.find((segment) => /^\d+$/.test(segment))
    if (!videoId) return null
    const hash = parsed.searchParams.get("h")
    return hash
      ? `https://player.vimeo.com/video/${videoId}?h=${encodeURIComponent(hash)}`
      : `https://player.vimeo.com/video/${videoId}`
  } catch {
    return null
  }
}

function isDirectVideoFile(url: string): boolean {
  const clean = url.split("?")[0].toLowerCase()
  return /\.(mp4|webm|ogg|mov|m4v)$/.test(clean)
}

function stepNodeClass(active: boolean, completed: boolean): string {
  if (active) return "bg-grayScale-900 text-white ring-4 ring-grayScale-200"
  if (completed) return "bg-grayScale-700 text-white"
  return "border-2 border-grayScale-300 bg-white text-grayScale-400"
}

export function AddNewLessonPage() {
  const { categoryId, courseId, subModuleId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const introVideoFileInputRef = useRef<HTMLInputElement>(null)

  const backTo = useMemo(() => {
    if (location.pathname.includes("/content/human-language/") && location.pathname.includes("/sub-module/")) {
      return `/content/human-language/${categoryId}/${courseId}/sub-module/${subModuleId}`
    }
    return `/content/category/${categoryId}/courses/${courseId}/sub-modules/${subModuleId}`
  }, [categoryId, courseId, subModuleId, location.pathname])

  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)
  const [resultStatus, setResultStatus] = useState<ResultStatus | null>(null)
  const [resultMessage, setResultMessage] = useState("")

  const [lessonTitle, setLessonTitle] = useState("")
  const [lessonDescription, setLessonDescription] = useState("")
  const [introVideoUrl, setIntroVideoUrl] = useState("")
  const [uploadingIntroVideo, setUploadingIntroVideo] = useState(false)
  const [importingIntroVideoUrl, setImportingIntroVideoUrl] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([createEmptyQuestion("1")])

  const handleNext = () => setCurrentStep((s) => (s < 3 ? ((s + 1) as Step) : s))
  const handleBack = () => setCurrentStep((s) => (s > 1 ? ((s - 1) as Step) : s))

  const handleIntroVideoFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setUploadingIntroVideo(true)
    try {
      const uploadRes = await uploadVideoFile(file, {
        title: lessonTitle.trim() || file.name.replace(/\.[^.]+$/, "") || "Lesson intro",
        description: lessonDescription.trim() || undefined,
      })
      const finalUrl = introVideoUrlFromUploadResponse(uploadRes.data?.data)
      if (!finalUrl) throw new Error("Missing uploaded video url")
      setIntroVideoUrl(finalUrl)
      toast.success("Intro video uploaded")
    } catch (error) {
      console.error("Failed to upload lesson intro video:", error)
      toast.error("Failed to upload intro video")
    } finally {
      setUploadingIntroVideo(false)
    }
  }

  const handleImportIntroVideoFromUrl = async () => {
    const source = introVideoUrl.trim()
    if (!source || !/^https?:\/\//i.test(source)) return
    const vimeoEmbed = toVimeoEmbedUrl(source)
    if (vimeoEmbed) {
      setIntroVideoUrl(vimeoEmbed)
      return
    }

    setImportingIntroVideoUrl(true)
    try {
      const uploadRes = await uploadVideoFile(source, {
        title: lessonTitle.trim() || "Lesson intro",
        description: lessonDescription.trim() || undefined,
      })
      const finalUrl = introVideoUrlFromUploadResponse(uploadRes.data?.data)
      if (!finalUrl) throw new Error("Missing uploaded video url")
      setIntroVideoUrl(finalUrl)
      toast.success("Intro video URL imported", { description: "Processed via /files/upload." })
    } catch (error) {
      console.error("Failed to import intro video URL:", error)
      toast.error("Failed to import intro video URL")
    } finally {
      setImportingIntroVideoUrl(false)
    }
  }

  const introVideoPreview = useMemo(() => {
    const raw = introVideoUrl.trim()
    if (!raw) return null
    const vimeoEmbedUrl = toVimeoEmbedUrl(raw)
    if (vimeoEmbedUrl) return { kind: "vimeo" as const, url: vimeoEmbedUrl }
    if (isDirectVideoFile(raw)) return { kind: "video" as const, url: raw }
    return null
  }, [introVideoUrl])

  const addQuestion = () => setQuestions((prev) => [...prev, createEmptyQuestion(String(Date.now()))])
  const removeQuestion = (id: string) => setQuestions((prev) => (prev.length > 1 ? prev.filter((q) => q.id !== id) : prev))
  const updateQuestion = (id: string, updates: Partial<Question>) =>
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)))

  const saveLesson = async (status: "DRAFT" | "PUBLISHED") => {
    if (!subModuleId) {
      toast.error("Missing sub-module id")
      return
    }
    setSaving(true)
    try {
      const lessonRes = await createLesson({
        sub_module_id: Number(subModuleId),
        title: lessonTitle.trim() || "Untitled Lesson",
        description: lessonDescription.trim() || undefined,
        intro_video_url: introVideoUrl.trim() || undefined,
        status,
      })

      const questionSetId = lessonRes.data?.data?.id
      if (questionSetId) {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i]
          if (!q.questionText.trim()) continue
          const options: QuestionOption[] =
            q.questionType === "MCQ"
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
            image_url: q.imageUrl.trim() || undefined,
            short_answers: q.shortAnswers.length > 0 ? q.shortAnswers : undefined,
          })
          const questionId = qRes.data?.data?.id
          if (questionId) {
            await addQuestionToSet(questionSetId, { question_id: questionId, display_order: i + 1 })
          }
        }
      }

      setResultStatus("success")
      setResultMessage(status === "PUBLISHED" ? "Lesson published successfully." : "Lesson saved as draft.")
      setCurrentStep(4)
    } catch (error) {
      console.error("Failed to save lesson:", error)
      setResultStatus("error")
      setResultMessage(error instanceof Error ? error.message : "Failed to save lesson")
      setCurrentStep(4)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
      <div className="space-y-5 sm:space-y-6">
        {currentStep !== 4 ? (
          <>
            <Link
              to={backTo}
              className="group inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-grayScale-600 transition-colors hover:bg-brand-50 hover:text-brand-600"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Back to Sub-course
            </Link>
            <div className="border-b border-grayScale-100 pb-6 sm:pb-8">
              <h1 className="text-2xl font-bold tracking-tight text-grayScale-900 sm:text-3xl">Add New Lesson</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-grayScale-500 sm:text-[15px]">
                Create a lesson backed by `question_sets` and attach it through `sub_module_lessons`.
              </p>
            </div>
            <div className="flex items-center justify-center rounded-2xl border border-grayScale-100 bg-grayScale-50/40 px-3 py-4 sm:px-6 sm:py-5">
              {STEPS.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold shadow-sm sm:h-10 sm:w-10 sm:text-sm ${stepNodeClass(
                        currentStep === step.number,
                        currentStep > step.number,
                      )}`}
                    >
                      {currentStep > step.number ? <Check className="h-4 w-4" /> : step.number}
                    </div>
                    <span className="mt-2 text-xs font-semibold text-grayScale-500">{step.label}</span>
                  </div>
                  {index < STEPS.length - 1 ? (
                    <div className={`mx-4 h-0.5 w-20 ${currentStep > step.number ? "bg-grayScale-700" : "bg-grayScale-200"}`} />
                  ) : null}
                </div>
              ))}
            </div>
          </>
        ) : null}

        {currentStep === 1 ? (
          <Card className="overflow-hidden border-grayScale-200/80 shadow-sm">
            <div className="border-b border-grayScale-100 bg-gradient-to-r from-grayScale-50/80 to-white px-5 py-5 sm:px-8 sm:py-6">
              <h2 className="text-lg font-semibold tracking-tight text-grayScale-900 sm:text-xl">Step 1: Context</h2>
              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-grayScale-500">
                Define lesson metadata that will be stored in the linked question set.
              </p>
            </div>
            <div className="p-5 sm:p-8 lg:p-10">
            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Lesson title</label>
                <Input
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="Enter lesson title"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Description</label>
                <textarea
                  value={lessonDescription}
                  onChange={(e) => setLessonDescription(e.target.value)}
                  className="min-h-[96px] w-full rounded-lg border border-grayScale-200 px-3 py-2.5 text-sm transition-colors focus:border-grayScale-400 focus:outline-none focus:ring-2 focus:ring-grayScale-100"
                  placeholder="Enter lesson description"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Intro video URL (optional)</label>
                <Input
                  value={introVideoUrl}
                  onChange={(e) => setIntroVideoUrl(e.target.value)}
                  onBlur={() => void handleImportIntroVideoFromUrl()}
                  placeholder="https://..."
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  className="font-mono text-[13px]"
                />
                <input
                  ref={introVideoFileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleIntroVideoFileChange}
                  disabled={uploadingIntroVideo || importingIntroVideoUrl}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => introVideoFileInputRef.current?.click()}
                    disabled={uploadingIntroVideo || importingIntroVideoUrl}
                    className="gap-1.5"
                  >
                    {uploadingIntroVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploadingIntroVideo ? "Uploading..." : "Upload video from computer"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleImportIntroVideoFromUrl()}
                    disabled={uploadingIntroVideo || importingIntroVideoUrl || !introVideoUrl.trim()}
                  >
                    {importingIntroVideoUrl ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        Importing URL...
                      </>
                    ) : (
                      "Import video from URL"
                    )}
                  </Button>
                  {introVideoUrl.trim() ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setIntroVideoUrl("")}>
                      Clear URL
                    </Button>
                  ) : null}
                </div>
                {introVideoPreview ? (
                  <div className="rounded-xl border border-grayScale-200 bg-grayScale-50/40 p-3">
                    <p className="mb-2 text-xs font-medium text-grayScale-500">Preview</p>
                    {introVideoPreview.kind === "vimeo" ? (
                      <div className="overflow-hidden rounded-lg border border-grayScale-200 bg-black">
                        <iframe
                          src={introVideoPreview.url}
                          title="Intro video preview"
                          className="aspect-video w-full"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <video
                        controls
                        src={introVideoPreview.url}
                        className="aspect-video w-full rounded-lg border border-grayScale-200 bg-black"
                      />
                    )}
                  </div>
                ) : null}
              </div>
            </div>
            </div>
            <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-grayScale-100 bg-grayScale-50/30 px-5 py-4 sm:flex-row sm:items-center sm:px-8 sm:py-5">
              <Button variant="ghost" onClick={() => navigate(backTo)} className="sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleNext}>
                Next: Questions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        ) : null}

        {currentStep === 2 ? (
          <div className="space-y-5">
            {questions.map((question, index) => (
              <Card key={question.id} className="border border-grayScale-200/90 border-l-4 border-l-grayScale-700 p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-grayScale-400" />
                    <span className="font-semibold">Question {index + 1}</span>
                  </div>
                  <button type="button" onClick={() => removeQuestion(question.id)} className="text-grayScale-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <PracticeQuestionEditorFields
                  value={{
                    questionText: question.questionText,
                    questionType: question.questionType,
                    difficultyLevel: question.difficultyLevel,
                    points: question.points,
                    tips: question.tips,
                    explanation: question.explanation,
                    options: question.options,
                    voicePrompt: question.voicePrompt,
                    sampleAnswerVoicePrompt: question.sampleAnswerVoicePrompt,
                    audioCorrectAnswerText: question.audioCorrectAnswerText,
                    shortAnswer: question.shortAnswers[0] ?? "",
                    imageUrl: question.imageUrl,
                  }}
                  onChange={(next) =>
                    updateQuestion(question.id, {
                      questionText: next.questionText,
                      questionType: next.questionType as QuestionType,
                      difficultyLevel: next.difficultyLevel as DifficultyLevel,
                      points: next.points,
                      tips: next.tips,
                      explanation: next.explanation,
                      options: next.options,
                      voicePrompt: next.voicePrompt,
                      sampleAnswerVoicePrompt: next.sampleAnswerVoicePrompt,
                      audioCorrectAnswerText: next.audioCorrectAnswerText,
                      shortAnswers: next.shortAnswer.trim() ? [next.shortAnswer.trim()] : [],
                      imageUrl: next.imageUrl,
                    })
                  }
                  mediaBusy={saving}
                />
              </Card>
            ))}
            <Button variant="outline" onClick={addQuestion} className="w-full border-dashed">
              <Plus className="mr-2 h-4 w-4" />
              Add another question
            </Button>
            <div className="flex items-center justify-between rounded-2xl border border-grayScale-200/80 bg-grayScale-50/30 px-4 py-4 sm:px-6 sm:py-5">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleNext}>
                Next: Review
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}

        {currentStep === 3 ? (
          <Card className="overflow-hidden border-grayScale-200/80 shadow-sm">
            <div className="border-b border-grayScale-100 bg-gradient-to-r from-grayScale-50/80 to-white px-5 py-5 sm:px-8 sm:py-6">
              <h2 className="text-lg font-semibold tracking-tight text-grayScale-900 sm:text-xl">Step 3: Review & publish</h2>
            </div>
            <div className="p-5 sm:p-8">
            <div className="mt-4 space-y-2 text-sm text-grayScale-700">
              <p><span className="font-medium">Question set title:</span> {lessonTitle || "Untitled Lesson"}</p>
              <p><span className="font-medium">Question set description:</span> {lessonDescription || "—"}</p>
              <p><span className="font-medium">Sub-module lesson intro video:</span> {introVideoUrl || "—"}</p>
              <p><span className="font-medium">Questions:</span> {questions.length}</p>
            </div>
            </div>
            <div className="flex items-center justify-between border-t border-grayScale-100 bg-grayScale-50/30 px-5 py-4 sm:px-8 sm:py-5">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => void saveLesson("DRAFT")} disabled={saving}>
                  {saving ? "Saving..." : "Save as Draft"}
                </Button>
                <Button onClick={() => void saveLesson("PUBLISHED")} disabled={saving}>
                  <Rocket className="mr-2 h-4 w-4" />
                  {saving ? "Publishing..." : "Publish Now"}
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        {currentStep === 4 && resultStatus ? (
          <div className="flex flex-col items-center py-16">
            <h2 className="text-2xl font-bold text-grayScale-900">
              {resultStatus === "success" ? "Lesson saved successfully!" : "Lesson save failed"}
            </h2>
            <p className="mt-3 text-sm text-grayScale-500">{resultMessage}</p>
            <div className="mt-6 flex gap-3">
              <Button onClick={() => navigate(backTo)}>Go back to course</Button>
              {resultStatus === "success" ? (
                <Button variant="outline" onClick={() => navigate(0)}>
                  Add another lesson
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
