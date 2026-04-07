import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, ChevronDown, Image as ImageIcon, Loader2, Mic, Plus, Trash2, Upload } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Stepper } from "../../components/ui/stepper"
import {
  addQuestionToSet,
  deleteQuestion,
  getCourseCategories,
  getCoursesByCategory,
  getQuestionById,
  getSubCoursesByCourse,
  createQuestion,
  createQuestionSet,
  getQuestions,
  updateQuestion,
} from "../../api/courses.api"
import { resolveFileUrl, uploadAudioFile, uploadImageFile, uploadVideoFile } from "../../api/files.api"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import type { Course, CourseCategory, QuestionDetail, SubCourse } from "../../types/course.types"
import { toast } from "sonner"

const MAX_AUDIO_SIZE_BYTES = 50 * 1024 * 1024
const ALLOWED_AUDIO_EXTENSIONS = new Set(["mp3", "wav", "ogg", "m4a", "aac", "webm", "flac"])
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"])
const SPEAKING_STEPS = ["Practice", "Questions", "Review"]

type SubCourseOption = {
  id: number
  title: string
  courseTitle: string
  categoryName: string
}

type RecordingField = "voice_prompt" | "sample_answer_voice_prompt"

type AudioQuestionDraft = {
  questionText: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
  points: number
  voicePrompt: string
  sampleAnswerVoicePrompt: string
  audioCorrectAnswerText: string
  imageUrl: string
  tips: string
  explanation: string
  voicePromptPreviewUrl: string
  samplePromptPreviewUrl: string
  imagePreviewUrl: string
  uploadingVoicePrompt: boolean
  uploadingSamplePrompt: boolean
  uploadingImage: boolean
  recordingVoicePrompt: boolean
  recordingSamplePrompt: boolean
}

const createEmptyDraft = (): AudioQuestionDraft => ({
  questionText: "",
  difficulty: "EASY",
  points: 1,
  voicePrompt: "",
  sampleAnswerVoicePrompt: "",
  audioCorrectAnswerText: "",
  imageUrl: "",
  tips: "",
  explanation: "",
  voicePromptPreviewUrl: "",
  samplePromptPreviewUrl: "",
  imagePreviewUrl: "",
  uploadingVoicePrompt: false,
  uploadingSamplePrompt: false,
  uploadingImage: false,
  recordingVoicePrompt: false,
  recordingSamplePrompt: false,
})

function normalizeObjectKey(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed
  const protocolMatch = trimmed.match(/^[a-z]+:\/\//i)
  if (protocolMatch) {
    return trimmed.replace(/^[a-z]+:\/\//i, "")
  }
  return trimmed
}

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

export function SpeakingPage() {
  const [audioQuestions, setAudioQuestions] = useState<QuestionDetail[]>([])
  const [audioPreviewByQuestionId, setAudioPreviewByQuestionId] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [openCreate, setOpenCreate] = useState(false)

  const [setTitle, setSetTitle] = useState("")
  const [setDescription, setSetDescription] = useState("")
  const [introVideoUrl, setIntroVideoUrl] = useState("")
  const [uploadingIntroVideo, setUploadingIntroVideo] = useState(false)
  const introVideoFileInputRef = useRef<HTMLInputElement>(null)
  const [subCourseId, setSubCourseId] = useState("")
  const [subCourseOptions, setSubCourseOptions] = useState<SubCourseOption[]>([])
  const [subCourseLoading, setSubCourseLoading] = useState(false)
  const [subCourseSearch, setSubCourseSearch] = useState("")
  const [subCourseMenuOpen, setSubCourseMenuOpen] = useState(false)
  const [setStatus, setSetStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT")
  const [currentStep, setCurrentStep] = useState(1)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [selectedQuestionDetail, setSelectedQuestionDetail] = useState<QuestionDetail | null>(null)
  const [detailVoiceUrl, setDetailVoiceUrl] = useState("")
  const [detailSampleVoiceUrl, setDetailSampleVoiceUrl] = useState("")
  const [detailImageUrl, setDetailImageUrl] = useState("")
  const [detailEditing, setDetailEditing] = useState(false)
  const [detailSaving, setDetailSaving] = useState(false)
  const [detailDeleting, setDetailDeleting] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; text: string } | null>(null)
  const [detailForm, setDetailForm] = useState({
    question_text: "",
    question_type: "AUDIO" as "AUDIO",
    difficulty_level: "EASY" as "EASY" | "MEDIUM" | "HARD",
    points: 1,
    explanation: "",
    tips: "",
    voice_prompt: "",
    sample_answer_voice_prompt: "",
    image_url: "",
    status: "DRAFT" as "DRAFT" | "PUBLISHED" | "INACTIVE",
    audio_correct_answer_text: "",
  })

  const [questionDrafts, setQuestionDrafts] = useState<AudioQuestionDraft[]>([createEmptyDraft()])
  const [recordingModal, setRecordingModal] = useState<{
    draftIndex: number
    field: RecordingField
    levels: number[]
    label: string
    elapsedSeconds: number
    isPaused: boolean
  } | null>(null)
  const activeRecordingRef = useRef<{
    recorder: MediaRecorder
    stream: MediaStream
    chunks: BlobPart[]
    audioContext: AudioContext
    analyser: AnalyserNode
    rafId: number | null
    draftIndex: number
    field: RecordingField
    shouldUpload: boolean
    isPaused: boolean
    startedAtMs: number
    pausedTotalMs: number
    pauseStartedAtMs: number | null
  } | null>(null)

  const resolvePreviewUrl = useCallback(async (value: string) => {
    if (!value.trim()) return ""
    if (value.startsWith("http://") || value.startsWith("https://")) return value

    const key = normalizeObjectKey(value)
    if (!key) return ""

    const res = await resolveFileUrl(key)
    return res.data?.data?.url ?? ""
  }, [])

  const fetchAudioQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const batchSize = 100
      let nextOffset = 0
      let expectedTotal = Number.POSITIVE_INFINITY
      let allRows: QuestionDetail[] = []

      while (allRows.length < expectedTotal) {
        const res = await getQuestions({
          question_type: "AUDIO",
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

      setAudioQuestions(allRows)
    } catch (error) {
      console.error("Failed to fetch audio questions:", error)
      setAudioQuestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAudioQuestions()
  }, [fetchAudioQuestions])

  useEffect(() => {
    let cancelled = false
    const fetchSubCourseOptions = async () => {
      setSubCourseLoading(true)
      try {
        const categoriesRes = await getCourseCategories()
        const categories = categoriesRes.data?.data?.categories ?? []
        if (categories.length === 0) {
          if (!cancelled) setSubCourseOptions([])
          return
        }

        const coursesByCategoryResponses = await Promise.all(
          categories.map(async (category: CourseCategory) => {
            const res = await getCoursesByCategory(category.id)
            return {
              category,
              courses: res.data?.data?.courses ?? [],
            }
          }),
        )

        const courseRecords = coursesByCategoryResponses.flatMap(({ category, courses }) =>
          courses.map((course: Course) => ({ category, course })),
        )

        const subCourseResponses = await Promise.all(
          courseRecords.map(async ({ category, course }) => {
            const res = await getSubCoursesByCourse(course.id)
            const subCourses = res.data?.data?.sub_courses ?? []
            return subCourses.map((subCourse: SubCourse) => ({
              id: subCourse.id,
              title: subCourse.title,
              courseTitle: course.title,
              categoryName: category.name,
            }))
          }),
        )

        const options = subCourseResponses
          .flat()
          .sort((a, b) => a.title.localeCompare(b.title))
        if (!cancelled) setSubCourseOptions(options)
      } catch (error) {
        console.error("Failed to load course options:", error)
        if (!cancelled) setSubCourseOptions([])
      } finally {
        if (!cancelled) setSubCourseLoading(false)
      }
    }
    fetchSubCourseOptions()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const withVoice = audioQuestions.filter((q) => Boolean(q.voice_prompt))
    if (withVoice.length === 0) {
      setAudioPreviewByQuestionId({})
      return
    }

    const resolveAll = async () => {
      const entries = await Promise.all(
        withVoice.map(async (question) => {
          try {
            const url = await resolvePreviewUrl(question.voice_prompt ?? "")
            return [question.id, url] as const
          } catch {
            return [question.id, ""] as const
          }
        }),
      )
      if (!cancelled) {
        setAudioPreviewByQuestionId(Object.fromEntries(entries))
      }
    }

    resolveAll()
    return () => {
      cancelled = true
    }
  }, [audioQuestions, resolvePreviewUrl])

  const resetCreateForm = () => {
    setSetTitle("")
    setSetDescription("")
    setIntroVideoUrl("")
    setSubCourseId("")
    setSetStatus("DRAFT")
    setQuestionDrafts([createEmptyDraft()])
  }

  const handleIntroVideoFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setUploadingIntroVideo(true)
    try {
      const uploadRes = await uploadVideoFile(file, {
        title: setTitle.trim() || file.name.replace(/\.[^.]+$/, "") || "Speaking intro",
        description: setDescription.trim() || undefined,
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

  const canCreate = useMemo(() => {
    const hasQuestionWithText = questionDrafts.some((draft) => draft.questionText.trim().length > 0)
    return setTitle.trim().length > 0 && subCourseId.trim().length > 0 && hasQuestionWithText
  }, [setTitle, subCourseId, questionDrafts])
  const canProceedToQuestions = useMemo(
    () => setTitle.trim().length > 0 && subCourseId.trim().length > 0,
    [setTitle, subCourseId],
  )
  const questionsWithText = useMemo(
    () => questionDrafts.filter((draft) => draft.questionText.trim().length > 0),
    [questionDrafts],
  )
  const canProceedToReview = questionsWithText.length > 0
  const selectedSubCourseOption = useMemo(
    () => subCourseOptions.find((option) => option.id === Number(subCourseId)),
    [subCourseId, subCourseOptions],
  )
  const filteredSubCourseOptions = useMemo(() => {
    const q = subCourseSearch.trim().toLowerCase()
    if (!q) return subCourseOptions
    return subCourseOptions.filter((option) => {
      const haystack = `${option.title} ${option.courseTitle} ${option.categoryName} ${option.id}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [subCourseOptions, subCourseSearch])

  const updateDraft = (index: number, updater: (draft: AudioQuestionDraft) => AudioQuestionDraft) => {
    setQuestionDrafts((prev) => prev.map((draft, idx) => (idx === index ? updater(draft) : draft)))
  }

  const uploadAudioForDraft = useCallback(
    async (file: File, field: "voice_prompt" | "sample_answer_voice_prompt", draftIndex: number) => {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? ""
      if (!ALLOWED_AUDIO_EXTENSIONS.has(extension)) {
        toast.error("Unsupported audio format")
        return
      }
      if (file.size > MAX_AUDIO_SIZE_BYTES) {
        toast.error("Audio file must be 50MB or less")
        return
      }

      updateDraft(draftIndex, (draft) =>
        field === "voice_prompt"
          ? { ...draft, uploadingVoicePrompt: true }
          : { ...draft, uploadingSamplePrompt: true },
      )

      try {
        const res = await uploadAudioFile(file)
        const objectKey = res.data?.data?.object_key?.trim()
        const immediateUrl = res.data?.data?.url?.trim() ?? ""
        if (!objectKey) throw new Error("Missing uploaded audio object key")

        if (field === "voice_prompt") {
          updateDraft(draftIndex, (draft) => ({
            ...draft,
            voicePrompt: objectKey,
            voicePromptPreviewUrl: immediateUrl || draft.voicePromptPreviewUrl,
          }))
          if (!immediateUrl) {
            const resolvedUrl = await resolvePreviewUrl(objectKey)
            updateDraft(draftIndex, (draft) => ({ ...draft, voicePromptPreviewUrl: resolvedUrl }))
          }
        } else {
          updateDraft(draftIndex, (draft) => ({
            ...draft,
            sampleAnswerVoicePrompt: objectKey,
            samplePromptPreviewUrl: immediateUrl || draft.samplePromptPreviewUrl,
          }))
          if (!immediateUrl) {
            const resolvedUrl = await resolvePreviewUrl(objectKey)
            updateDraft(draftIndex, (draft) => ({ ...draft, samplePromptPreviewUrl: resolvedUrl }))
          }
        }
        toast.success("Audio uploaded successfully")
      } catch (error) {
        console.error("Failed to upload audio:", error)
        toast.error("Failed to upload audio file")
      } finally {
        updateDraft(draftIndex, (draft) =>
          field === "voice_prompt"
            ? { ...draft, uploadingVoicePrompt: false }
            : { ...draft, uploadingSamplePrompt: false },
        )
      }
    },
    [resolvePreviewUrl],
  )

  const handleAudioUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    field: "voice_prompt" | "sample_answer_voice_prompt",
    draftIndex: number,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return
    await uploadAudioForDraft(file, field, draftIndex)
    event.target.value = ""
  }

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>, draftIndex: number) => {
    const file = event.target.files?.[0]
    if (!file) return

    const extension = file.name.split(".").pop()?.toLowerCase() ?? ""
    if (!ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
      toast.error("Unsupported image format")
      event.target.value = ""
      return
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error("Image file must be 10MB or less")
      event.target.value = ""
      return
    }

    updateDraft(draftIndex, (draft) => ({ ...draft, uploadingImage: true }))
    try {
      const res = await uploadImageFile(file)
      const uploadedUrl = res.data?.data?.url?.trim()
      if (!uploadedUrl) throw new Error("Missing uploaded image url")
      const resolved = uploadedUrl
      updateDraft(draftIndex, (draft) => ({
        ...draft,
        imageUrl: uploadedUrl,
        imagePreviewUrl: resolved,
      }))
      toast.success("Image uploaded successfully")
    } catch (error) {
      console.error("Failed to upload image:", error)
      toast.error("Failed to upload image")
    } finally {
      updateDraft(draftIndex, (draft) => ({ ...draft, uploadingImage: false }))
      event.target.value = ""
    }
  }

  const handleResolveManualAudioPreview = async (
    field: "voice_prompt" | "sample_answer_voice_prompt",
    draftIndex: number,
  ) => {
    const selectedDraft = questionDrafts[draftIndex]
    if (!selectedDraft) return
    const rawValue = field === "voice_prompt" ? selectedDraft.voicePrompt : selectedDraft.sampleAnswerVoicePrompt
    if (!rawValue.trim()) {
      updateDraft(draftIndex, (draft) =>
        field === "voice_prompt"
          ? { ...draft, voicePromptPreviewUrl: "" }
          : { ...draft, samplePromptPreviewUrl: "" },
      )
      return
    }
    try {
      const url = await resolvePreviewUrl(rawValue)
      updateDraft(draftIndex, (draft) =>
        field === "voice_prompt"
          ? { ...draft, voicePromptPreviewUrl: url }
          : { ...draft, samplePromptPreviewUrl: url },
      )
    } catch (error) {
      console.error("Failed to resolve audio preview URL:", error)
      toast.error("Could not resolve audio preview URL")
    }
  }

  const handleResolveManualImagePreview = async (draftIndex: number) => {
    const draft = questionDrafts[draftIndex]
    if (!draft) return
    if (!draft.imageUrl.trim()) {
      updateDraft(draftIndex, (current) => ({ ...current, imagePreviewUrl: "" }))
      return
    }
    try {
      const resolved = await resolvePreviewUrl(draft.imageUrl)
      updateDraft(draftIndex, (current) => ({ ...current, imagePreviewUrl: resolved }))
    } catch (error) {
      console.error("Failed to resolve image preview URL:", error)
      toast.error("Could not resolve image preview URL")
    }
  }

  const stopActiveRecording = async (saveRecording: boolean) => {
    const active = activeRecordingRef.current
    if (!active) return
    active.shouldUpload = saveRecording
    if (active.recorder.state !== "inactive") {
      active.recorder.stop()
      return
    }
    if (!saveRecording) {
      active.stream.getTracks().forEach((track) => track.stop())
      if (active.rafId) cancelAnimationFrame(active.rafId)
      await active.audioContext.close().catch(() => undefined)
      activeRecordingRef.current = null
      setRecordingModal(null)
    }
  }

  const togglePauseRecording = () => {
    const active = activeRecordingRef.current
    if (!active) return
    if (active.recorder.state === "recording") {
      active.recorder.pause()
      active.isPaused = true
      active.pauseStartedAtMs = Date.now()
      setRecordingModal((prev) => (prev ? { ...prev, isPaused: true } : prev))
      return
    }
    if (active.recorder.state === "paused") {
      active.recorder.resume()
      if (active.pauseStartedAtMs) {
        active.pausedTotalMs += Date.now() - active.pauseStartedAtMs
      }
      active.pauseStartedAtMs = null
      active.isPaused = false
      setRecordingModal((prev) => (prev ? { ...prev, isPaused: false } : prev))
    }
  }

  const startRecording = async (field: RecordingField, draftIndex: number) => {
    if (activeRecordingRef.current) {
      toast.error("Finish current recording first")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const label = field === "voice_prompt" ? "Voice Prompt" : "Sample Answer"
      const animateLevels = () => {
        const active = activeRecordingRef.current
        if (!active) return
        const now = Date.now()
        const effectiveElapsedMs =
          now -
          active.startedAtMs -
          active.pausedTotalMs -
          (active.isPaused && active.pauseStartedAtMs ? now - active.pauseStartedAtMs : 0)
        const elapsedSeconds = Math.max(0, Math.floor(effectiveElapsedMs / 1000))

        if (!active.isPaused) {
          analyser.getByteFrequencyData(dataArray)
          const barCount = 32
          const binsPerBar = Math.max(1, Math.floor(dataArray.length / barCount))
          const nextLevels = Array.from({ length: barCount }, (_, barIdx) => {
            const start = barIdx * binsPerBar
            const end = Math.min(dataArray.length, start + binsPerBar)
            if (start >= end) return 0.05
            let sum = 0
            for (let i = start; i < end; i += 1) sum += dataArray[i]
            const avg = sum / (end - start)
            // Slight boost curve for clearer realtime movement.
            const normalized = Math.min(1, Math.pow(avg / 180, 0.85))
            return Math.max(0.04, normalized)
          })
          setRecordingModal((prev) => {
            if (!prev || prev.draftIndex !== draftIndex || prev.field !== field) return prev
            return { ...prev, levels: nextLevels, elapsedSeconds }
          })
        } else {
          setRecordingModal((prev) => {
            if (!prev || prev.draftIndex !== draftIndex || prev.field !== field) return prev
            return { ...prev, elapsedSeconds }
          })
        }

        if (activeRecordingRef.current) {
          activeRecordingRef.current.rafId = requestAnimationFrame(animateLevels)
        }
      }

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }

      recorder.onstop = async () => {
        const active = activeRecordingRef.current
        if (!active) return
        const shouldUpload = active.shouldUpload
        active.stream.getTracks().forEach((track) => track.stop())
        if (active.rafId) cancelAnimationFrame(active.rafId)
        await active.audioContext.close().catch(() => undefined)
        activeRecordingRef.current = null
        setRecordingModal(null)

        if (shouldUpload) {
          const blob = new Blob(chunks, { type: "audio/webm" })
          const fileName =
            field === "voice_prompt"
              ? `voice-prompt-${Date.now()}.webm`
              : `sample-answer-${Date.now()}.webm`
          const recordedFile = new File([blob], fileName, { type: "audio/webm" })
          await uploadAudioForDraft(recordedFile, field, draftIndex)
        }

        updateDraft(draftIndex, (draft) =>
          field === "voice_prompt"
            ? { ...draft, recordingVoicePrompt: false }
            : { ...draft, recordingSamplePrompt: false },
        )
      }

      setRecordingModal({
        draftIndex,
        field,
        levels: Array.from({ length: 32 }, () => 0.05),
        label,
        elapsedSeconds: 0,
        isPaused: false,
      })
      recorder.start()
      activeRecordingRef.current = {
        recorder,
        stream,
        chunks,
        audioContext,
        analyser,
        rafId: null,
        draftIndex,
        field,
        shouldUpload: true,
        isPaused: false,
        startedAtMs: Date.now(),
        pausedTotalMs: 0,
        pauseStartedAtMs: null,
      }
      animateLevels()
      updateDraft(draftIndex, (draft) =>
        field === "voice_prompt"
          ? { ...draft, recordingVoicePrompt: true }
          : { ...draft, recordingSamplePrompt: true },
      )
    } catch (error) {
      console.error("Microphone access failed:", error)
      toast.error("Unable to access microphone")
    }
  }

  useEffect(() => {
    return () => {
      const active = activeRecordingRef.current
      if (!active) return
      active.shouldUpload = false
      if (active.recorder.state !== "inactive") active.recorder.stop()
      active.stream.getTracks().forEach((track) => track.stop())
      if (active.rafId) cancelAnimationFrame(active.rafId)
      active.audioContext.close().catch(() => undefined)
    }
  }, [])

  const handleCreateSpeakingPractice = async () => {
    if (!canCreate) return
    const parsedSubCourseId = Number(subCourseId)
    if (!Number.isFinite(parsedSubCourseId) || parsedSubCourseId <= 0) {
      toast.error("Please enter a valid Course ID")
      return
    }
    const draftsToCreate = questionDrafts.filter((draft) => draft.questionText.trim().length > 0)
    if (draftsToCreate.length === 0) {
      toast.error("Add at least one AUDIO question")
      return
    }

    setSaving(true)
    try {
      // 1) Create speaking practice set.
      const setRes = await createQuestionSet({
        title: setTitle.trim(),
        ...(setDescription.trim() ? { description: setDescription.trim() } : {}),
        set_type: "PRACTICE",
        owner_type: "SUB_COURSE",
        owner_id: parsedSubCourseId,
        status: setStatus,
        ...(introVideoUrl.trim() ? { intro_video_url: introVideoUrl.trim() } : {}),
      })

      const setId = setRes.data?.data?.id
      if (!setId) throw new Error("Question set creation failed: missing set ID")

      // 2) Create all AUDIO questions then attach in sequence.
      for (const [idx, draft] of draftsToCreate.entries()) {
        const questionRes = await createQuestion({
          question_text: draft.questionText.trim(),
          question_type: "AUDIO",
          status: setStatus,
          difficulty_level: draft.difficulty || undefined,
          points: Number.isFinite(draft.points) && draft.points > 0 ? draft.points : 1,
          voice_prompt: draft.voicePrompt.trim() || undefined,
          sample_answer_voice_prompt: draft.sampleAnswerVoicePrompt.trim() || undefined,
          audio_correct_answer_text: draft.audioCorrectAnswerText.trim() || undefined,
          image_url: draft.imageUrl.trim() || undefined,
          explanation: draft.explanation.trim() || undefined,
          tips: draft.tips.trim() || undefined,
        })

        const questionId = questionRes.data?.data?.id
        if (!questionId) throw new Error("Question creation failed: missing question ID")

        // 3) Attach each question to created set with display order.
        await addQuestionToSet(setId, {
          question_id: questionId,
          display_order: idx + 1,
        })
      }

      setOpenCreate(false)
      setCurrentStep(1)
      resetCreateForm()
      toast.success(`Speaking practice created with ${draftsToCreate.length} AUDIO question(s)`)
      await fetchAudioQuestions()
    } catch (error) {
      console.error("Failed to create speaking practice:", error)
      toast.error("Failed to create speaking practice")
    } finally {
      setSaving(false)
    }
  }

  const handleOpenQuestionDetail = async (questionId: number) => {
    setDetailOpen(true)
    setDetailLoading(true)
    setSelectedQuestionDetail(null)
    setDetailVoiceUrl("")
    setDetailSampleVoiceUrl("")
    setDetailImageUrl("")
    try {
      const res = await getQuestionById(questionId)
      const detail = res.data?.data ?? null
      setSelectedQuestionDetail(detail)
      if (detail) {
        setDetailForm({
          question_text: detail.question_text ?? "",
          question_type: "AUDIO",
          difficulty_level:
            (detail.difficulty_level as "EASY" | "MEDIUM" | "HARD") || "EASY",
          points: Number(detail.points) > 0 ? Number(detail.points) : 1,
          explanation: detail.explanation ?? "",
          tips: detail.tips ?? "",
          voice_prompt: detail.voice_prompt ?? "",
          sample_answer_voice_prompt: detail.sample_answer_voice_prompt ?? "",
          image_url: detail.image_url ?? "",
          status:
            (detail.status as "DRAFT" | "PUBLISHED" | "INACTIVE") || "DRAFT",
          audio_correct_answer_text: detail.audio_correct_answer_text ?? "",
        })
        setDetailEditing(false)
        const [voice, sample, image] = await Promise.all([
          resolvePreviewUrl(detail.voice_prompt ?? ""),
          resolvePreviewUrl(detail.sample_answer_voice_prompt ?? ""),
          resolvePreviewUrl(detail.image_url ?? ""),
        ])
        setDetailVoiceUrl(voice)
        setDetailSampleVoiceUrl(sample)
        setDetailImageUrl(image)
      }
    } catch (error) {
      console.error("Failed to fetch question detail:", error)
      toast.error("Failed to load question detail")
      setDetailOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const refreshSelectedQuestionDetail = async (questionId: number) => {
    const res = await getQuestionById(questionId)
    const detail = res.data?.data ?? null
    setSelectedQuestionDetail(detail)
    if (detail) {
      const [voice, sample, image] = await Promise.all([
        resolvePreviewUrl(detail.voice_prompt ?? ""),
        resolvePreviewUrl(detail.sample_answer_voice_prompt ?? ""),
        resolvePreviewUrl(detail.image_url ?? ""),
      ])
      setDetailVoiceUrl(voice)
      setDetailSampleVoiceUrl(sample)
      setDetailImageUrl(image)
      setDetailForm({
        question_text: detail.question_text ?? "",
        question_type: "AUDIO",
        difficulty_level:
          (detail.difficulty_level as "EASY" | "MEDIUM" | "HARD") || "EASY",
        points: Number(detail.points) > 0 ? Number(detail.points) : 1,
        explanation: detail.explanation ?? "",
        tips: detail.tips ?? "",
        voice_prompt: detail.voice_prompt ?? "",
        sample_answer_voice_prompt: detail.sample_answer_voice_prompt ?? "",
        image_url: detail.image_url ?? "",
        status:
          (detail.status as "DRAFT" | "PUBLISHED" | "INACTIVE") || "DRAFT",
        audio_correct_answer_text: detail.audio_correct_answer_text ?? "",
      })
    }
  }

  const handleUpdateQuestionDetail = async () => {
    if (!selectedQuestionDetail) return
    setDetailSaving(true)
    try {
      await updateQuestion(selectedQuestionDetail.id, {
        question_text: detailForm.question_text.trim(),
        question_type: "AUDIO",
        difficulty_level: detailForm.difficulty_level,
        points: Number.isFinite(detailForm.points) && detailForm.points > 0 ? detailForm.points : 1,
        explanation: detailForm.explanation.trim() || undefined,
        tips: detailForm.tips.trim() || undefined,
        voice_prompt: detailForm.voice_prompt.trim() || undefined,
        sample_answer_voice_prompt: detailForm.sample_answer_voice_prompt.trim() || undefined,
        image_url: detailForm.image_url.trim() || undefined,
        status: detailForm.status,
        audio_correct_answer_text: detailForm.audio_correct_answer_text.trim() || undefined,
      })
      await refreshSelectedQuestionDetail(selectedQuestionDetail.id)
      await fetchAudioQuestions()
      setDetailEditing(false)
      toast.success("AUDIO question updated")
    } catch (error) {
      console.error("Failed to update AUDIO question:", error)
      toast.error("Failed to update AUDIO question")
    } finally {
      setDetailSaving(false)
    }
  }

  const handleDeleteQuestionDetail = async () => {
    const targetId = deleteTarget?.id ?? selectedQuestionDetail?.id
    if (!targetId) return
    setDetailDeleting(true)
    try {
      await deleteQuestion(targetId)
      setConfirmDeleteOpen(false)
      setDeleteTarget(null)
      setDetailOpen(false)
      setSelectedQuestionDetail(null)
      await fetchAudioQuestions()
      toast.success("AUDIO question deleted")
    } catch (error) {
      console.error("Failed to delete AUDIO question:", error)
      toast.error("Failed to delete AUDIO question")
    } finally {
      setDetailDeleting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-10 sm:space-y-8 sm:pb-12">
      <div className="flex flex-col gap-4 border-b border-grayScale-100 pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-grayScale-900 sm:text-3xl">
            Speaking
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-grayScale-500 sm:text-[15px]">
            Create and manage speaking practice sessions for your learners.
          </p>
        </div>
        <Button
          className="h-11 w-full shrink-0 bg-brand-500 px-5 shadow-sm hover:bg-brand-600 sm:w-auto"
          onClick={() => {
            setOpenCreate(true)
            setCurrentStep(1)
          }}
        >
          <Plus className="h-4 w-4" />
          Add New Speaking Practice
        </Button>
      </div>

      {!openCreate && (
        <Card className="overflow-hidden border-grayScale-200/80 shadow-sm">
          <CardHeader className="border-b border-grayScale-100 bg-gradient-to-r from-grayScale-50/80 to-white px-5 py-4 sm:px-6 sm:py-5">
            <CardTitle className="text-base font-semibold text-grayScale-900 sm:text-lg">
              AUDIO questions
            </CardTitle>
            <p className="mt-1 text-xs font-normal text-grayScale-500 sm:text-sm">
              Tap a row to view details. Speaking practices create AUDIO question sets linked to a sub-course.
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-6 pt-5 sm:px-6">
            {loading ? (
              <div className="flex flex-col items-center gap-2 py-14 text-center text-sm text-grayScale-500">
                <SpinnerIcon className="h-5 w-5" />
                Loading audio questions...
              </div>
            ) : audioQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-grayScale-200 bg-grayScale-50/30 py-16 text-center">
                <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 shadow-sm ring-4 ring-brand-500/10">
                  <Mic className="h-8 w-8 text-brand-600" />
                </div>
                <h3 className="text-base font-semibold text-grayScale-800">No audio questions yet</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-grayScale-500">
                  Create a speaking practice to automatically create and attach an AUDIO question.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {audioQuestions.map((question, idx) => (
                  <div
                    key={question.id}
                    className={`cursor-pointer rounded-xl border px-4 py-3.5 transition-all sm:px-5 ${
                      idx % 2 === 0 ? "border-grayScale-200 bg-white" : "border-grayScale-100 bg-grayScale-50/80"
                    } hover:border-brand-300 hover:bg-brand-50/40 hover:shadow-sm`}
                    onClick={() => handleOpenQuestionDetail(question.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium leading-snug text-grayScale-800">{question.question_text}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={(event) => {
                          event.stopPropagation()
                          setDeleteTarget({ id: question.id, text: question.question_text })
                          setConfirmDeleteOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-md bg-brand-100 px-2 py-0.5 font-medium text-brand-800">AUDIO</span>
                      <span className="rounded-md bg-grayScale-100 px-2 py-1 text-grayScale-600">
                        Difficulty: {question.difficulty_level || "—"}
                      </span>
                      <span className="rounded-md bg-grayScale-100 px-2 py-1 text-grayScale-600">
                        Points: {question.points ?? 0}
                      </span>
                      <span className="rounded-md bg-grayScale-100 px-2 py-1 text-grayScale-600">
                        Status: {question.status || "—"}
                      </span>
                    </div>
                    {question.voice_prompt ? (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-grayScale-500">Voice prompt preview</p>
                        {audioPreviewByQuestionId[question.id] ? (
                          <audio controls src={audioPreviewByQuestionId[question.id]} className="h-10 w-full max-w-sm" />
                        ) : (
                          <p className="text-xs text-grayScale-400">Unable to resolve audio URL.</p>
                        )}
                      </div>
                    ) : null}
                    {question.audio_correct_answer_text ? (
                      <p className="mt-2 text-xs text-grayScale-500">
                        <span className="font-medium text-grayScale-600">Correct answer text:</span>{" "}
                        {question.audio_correct_answer_text}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {detailOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
          onClick={() => setDetailOpen(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-grayScale-200/80 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-grayScale-100 bg-gradient-to-r from-grayScale-50/90 to-white px-5 py-4 sm:px-6">
              <h3 className="text-base font-semibold text-grayScale-900 sm:text-lg">AUDIO question</h3>
              <div className="flex items-center gap-2">
                {!detailLoading && selectedQuestionDetail && !detailEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setDetailEditing(true)}>
                    Edit
                  </Button>
                ) : null}
                {!detailLoading && selectedQuestionDetail ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                      setDeleteTarget({
                        id: selectedQuestionDetail.id,
                        text: selectedQuestionDetail.question_text,
                      })
                      setConfirmDeleteOpen(true)
                    }}
                  >
                    Delete
                  </Button>
                ) : null}
                <Button variant="outline" size="sm" onClick={() => setDetailOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
              {detailLoading ? (
                <div className="flex items-center justify-center py-10">
                  <SpinnerIcon className="h-5 w-5" />
                </div>
              ) : selectedQuestionDetail && detailEditing ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-grayScale-500">Question Text</label>
                    <Textarea
                      value={detailForm.question_text}
                      onChange={(e) =>
                        setDetailForm((prev) => ({ ...prev, question_text: e.target.value }))
                      }
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-grayScale-500">Difficulty</label>
                      <select
                        value={detailForm.difficulty_level}
                        onChange={(e) =>
                          setDetailForm((prev) => ({
                            ...prev,
                            difficulty_level: e.target.value as "EASY" | "MEDIUM" | "HARD",
                          }))
                        }
                        className="h-10 w-full rounded-md border border-grayScale-200 px-3 text-sm"
                      >
                        <option value="EASY">EASY</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HARD">HARD</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-grayScale-500">Points</label>
                      <Input
                        type="number"
                        min={1}
                        value={detailForm.points}
                        onChange={(e) =>
                          setDetailForm((prev) => ({ ...prev, points: Number(e.target.value) || 1 }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-grayScale-500">Voice Prompt URL</label>
                    <Input
                      value={detailForm.voice_prompt}
                      onChange={(e) =>
                        setDetailForm((prev) => ({ ...prev, voice_prompt: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-grayScale-500">Sample Answer Voice Prompt URL</label>
                    <Input
                      value={detailForm.sample_answer_voice_prompt}
                      onChange={(e) =>
                        setDetailForm((prev) => ({
                          ...prev,
                          sample_answer_voice_prompt: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-grayScale-500">Image URL</label>
                    <Input
                      value={detailForm.image_url}
                      onChange={(e) =>
                        setDetailForm((prev) => ({ ...prev, image_url: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-grayScale-500">Audio Correct Answer Text</label>
                    <Textarea
                      value={detailForm.audio_correct_answer_text}
                      onChange={(e) =>
                        setDetailForm((prev) => ({
                          ...prev,
                          audio_correct_answer_text: e.target.value,
                        }))
                      }
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-grayScale-500">Explanation</label>
                    <Textarea
                      value={detailForm.explanation}
                      onChange={(e) =>
                        setDetailForm((prev) => ({ ...prev, explanation: e.target.value }))
                      }
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-grayScale-500">Tips</label>
                    <Textarea
                      value={detailForm.tips}
                      onChange={(e) =>
                        setDetailForm((prev) => ({ ...prev, tips: e.target.value }))
                      }
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-grayScale-500">Status</label>
                    <select
                      value={detailForm.status}
                      onChange={(e) =>
                        setDetailForm((prev) => ({
                          ...prev,
                          status: e.target.value as "DRAFT" | "PUBLISHED" | "INACTIVE",
                        }))
                      }
                      className="h-10 w-full rounded-md border border-grayScale-200 px-3 text-sm"
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="PUBLISHED">PUBLISHED</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 border-t border-grayScale-100 pt-3">
                    <Button
                      variant="outline"
                      onClick={() => setDetailEditing(false)}
                      disabled={detailSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-brand-500 hover:bg-brand-600"
                      onClick={handleUpdateQuestionDetail}
                      disabled={detailSaving || !detailForm.question_text.trim()}
                    >
                      {detailSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </>
              ) : selectedQuestionDetail ? (
                <>
                  <div>
                    <p className="text-xs font-medium text-grayScale-500">Question Text</p>
                    <p className="mt-1 text-sm text-grayScale-700">{selectedQuestionDetail.question_text}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-medium text-grayScale-500">Status</p>
                      <p className="mt-1 text-grayScale-700">{selectedQuestionDetail.status || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-grayScale-500">Points</p>
                      <p className="mt-1 text-grayScale-700">{selectedQuestionDetail.points ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-grayScale-500">Difficulty</p>
                      <p className="mt-1 text-grayScale-700">{selectedQuestionDetail.difficulty_level || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-grayScale-500">Type</p>
                      <p className="mt-1 text-grayScale-700">{selectedQuestionDetail.question_type || "—"}</p>
                    </div>
                  </div>
                  {selectedQuestionDetail.audio_correct_answer_text ? (
                    <div>
                      <p className="text-xs font-medium text-grayScale-500">Audio Correct Answer Text</p>
                      <p className="mt-1 text-sm text-grayScale-700">
                        {selectedQuestionDetail.audio_correct_answer_text}
                      </p>
                    </div>
                  ) : null}
                  {selectedQuestionDetail.explanation ? (
                    <div>
                      <p className="text-xs font-medium text-grayScale-500">Explanation</p>
                      <p className="mt-1 text-sm text-grayScale-700">{selectedQuestionDetail.explanation}</p>
                    </div>
                  ) : null}
                  {selectedQuestionDetail.tips ? (
                    <div>
                      <p className="text-xs font-medium text-grayScale-500">Tips</p>
                      <p className="mt-1 text-sm text-grayScale-700">{selectedQuestionDetail.tips}</p>
                    </div>
                  ) : null}
                  {detailVoiceUrl ? (
                    <div>
                      <p className="text-xs font-medium text-grayScale-500">Voice Prompt</p>
                      <audio controls src={detailVoiceUrl} className="mt-1 h-10 w-full" />
                    </div>
                  ) : null}
                  {detailSampleVoiceUrl ? (
                    <div>
                      <p className="text-xs font-medium text-grayScale-500">Sample Answer Voice Prompt</p>
                      <audio controls src={detailSampleVoiceUrl} className="mt-1 h-10 w-full" />
                    </div>
                  ) : null}
                  {detailImageUrl ? (
                    <div>
                      <p className="text-xs font-medium text-grayScale-500">Image</p>
                      <img
                        src={detailImageUrl}
                        alt="Question reference"
                        className="mt-1 h-32 w-32 rounded-md border border-grayScale-200 object-cover"
                      />
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="py-6 text-sm text-grayScale-500">Question details unavailable.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmDeleteOpen && (deleteTarget || selectedQuestionDetail) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-grayScale-200/80 bg-white shadow-2xl">
            <div className="border-b border-grayScale-100 bg-gradient-to-r from-red-50/50 to-white px-5 py-4">
              <h3 className="text-base font-semibold text-grayScale-900">Delete AUDIO question</h3>
            </div>
            <div className="space-y-2 px-5 py-4">
              <p className="text-sm leading-relaxed text-grayScale-600">
                This action cannot be undone. The question will be removed permanently.
              </p>
              <p className="line-clamp-3 rounded-lg bg-grayScale-50 px-3 py-2 text-xs text-grayScale-600">
                {deleteTarget?.text ?? selectedQuestionDetail?.question_text}
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-grayScale-100 bg-grayScale-50/30 px-5 py-4">
              <Button
                variant="outline"
                onClick={() => {
                  setConfirmDeleteOpen(false)
                  setDeleteTarget(null)
                }}
                disabled={detailDeleting}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600"
                onClick={handleDeleteQuestionDetail}
                disabled={detailDeleting}
              >
                {detailDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {openCreate && (
        <div className="space-y-6">
          <Card className="overflow-hidden border-grayScale-200/80 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-grayScale-100 bg-gradient-to-r from-grayScale-50/80 to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full shrink-0 border-grayScale-200 text-grayScale-700 sm:w-auto"
                onClick={() => setOpenCreate(false)}
                disabled={saving}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to list
              </Button>
              <p className="text-center text-xs text-grayScale-500 sm:text-left sm:text-sm">
                New speaking practice · {SPEAKING_STEPS[currentStep - 1] ?? ""}
              </p>
            </div>
            <div className="px-4 py-5 sm:px-6 sm:py-6">
              <div className="rounded-2xl border border-grayScale-100 bg-grayScale-50/40 px-3 py-4 sm:px-5">
                <Stepper steps={SPEAKING_STEPS} currentStep={currentStep} />
              </div>
            </div>
          </Card>

          {currentStep === 1 && (
            <Card className="w-full overflow-hidden border-grayScale-200/80 shadow-sm">
              <div className="border-b border-grayScale-100 bg-gradient-to-r from-grayScale-50/80 to-white px-5 py-5 sm:px-8 sm:py-6">
                <h2 className="text-lg font-semibold tracking-tight text-grayScale-900 sm:text-xl">Step 1: Practice context</h2>
                <p className="mt-1.5 max-w-3xl text-sm text-grayScale-500">
                  Title, description, optional intro video, sub-course, and publish status for this speaking practice.
                </p>
              </div>
              <div className="p-5 sm:p-8 lg:p-10">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
                  <div className="space-y-5 lg:col-span-7">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-grayScale-700">Practice title</label>
                      <Input
                        value={setTitle}
                        onChange={(e) => setSetTitle(e.target.value)}
                        placeholder="Speaking practice title"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-grayScale-700">Description (optional)</label>
                      <Textarea
                        value={setDescription}
                        onChange={(e) => setSetDescription(e.target.value)}
                        rows={3}
                        placeholder="Brief description"
                        className="min-h-[88px]"
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
                        Paste a link or upload from your computer; uploads use the same file service as elsewhere. Optional, not tied to sub-course video rows.
                      </p>
                    </div>
                  </div>
                  <aside className="space-y-4 lg:col-span-5">
                    <div className="rounded-xl border border-grayScale-200 bg-grayScale-50/40 p-5 shadow-sm ring-1 ring-grayScale-100/80">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-grayScale-500">Sub-course & status</h3>
                      <p className="mt-1 text-xs text-grayScale-400">Choose where this practice is attached.</p>
                      <div className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-grayScale-700">Sub-course</label>
                  <DropdownMenu open={subCourseMenuOpen} onOpenChange={setSubCourseMenuOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 w-full justify-between rounded-xl border-grayScale-200 bg-white px-3 text-sm font-normal text-grayScale-600 hover:bg-grayScale-50"
                      >
                        <span className="truncate">
                          {selectedSubCourseOption
                            ? `${selectedSubCourseOption.title} (#${selectedSubCourseOption.id})`
                            : subCourseLoading
                              ? "Loading courses..."
                              : "Select course"}
                        </span>
                        <ChevronDown className="h-4 w-4 text-grayScale-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[420px] max-w-[90vw] p-2">
                      <Input
                        value={subCourseSearch}
                        onChange={(e) => setSubCourseSearch(e.target.value)}
                        placeholder="Search course, course, category..."
                        className="mb-2 h-9"
                      />
                      <div className="max-h-64 overflow-auto">
                        {filteredSubCourseOptions.length === 0 ? (
                          <p className="px-2 py-2 text-sm text-grayScale-400">No courses found</p>
                        ) : (
                          <DropdownMenuRadioGroup
                            value={subCourseId}
                            onValueChange={(value) => {
                              setSubCourseId(value)
                              setSubCourseMenuOpen(false)
                            }}
                          >
                            {filteredSubCourseOptions.map((option) => (
                              <DropdownMenuRadioItem key={option.id} value={String(option.id)}>
                                <div className="flex min-w-0 flex-col">
                                  <span className="truncate">{option.title}</span>
                                  <span className="text-xs text-grayScale-400">
                                    {option.categoryName} / {option.courseTitle} / ID: {option.id}
                                  </span>
                                </div>
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-grayScale-700">Set status</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 w-full justify-between rounded-xl border-grayScale-200 bg-white px-3 text-sm font-normal text-grayScale-600 hover:bg-grayScale-50"
                      >
                        <span>{setStatus}</span>
                        <ChevronDown className="h-4 w-4 text-grayScale-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[220px]">
                      <DropdownMenuRadioGroup
                        value={setStatus}
                        onValueChange={(value) => setSetStatus(value as "DRAFT" | "PUBLISHED")}
                      >
                        <DropdownMenuRadioItem value="PUBLISHED">PUBLISHED</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="DRAFT">DRAFT</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                      </div>
                    </div>
                  </aside>
                </div>
                <div className="mt-8 flex flex-col-reverse gap-3 border-t border-grayScale-100 bg-grayScale-50/30 px-0 py-4 sm:flex-row sm:justify-end sm:px-0 sm:py-5">
                <Button variant="outline" onClick={() => setOpenCreate(false)} disabled={saving} className="sm:w-auto">
                  Cancel
                </Button>
                <Button
                  className="bg-brand-500 hover:bg-brand-600 sm:min-w-[180px]"
                  onClick={() => setCurrentStep(2)}
                  disabled={!canProceedToQuestions}
                >
                  Next: Questions
                </Button>
              </div>
              </div>
            </Card>
          )}

          {currentStep === 2 && (
            <Card className="w-full overflow-hidden border-grayScale-200/80 shadow-sm">
              <div className="border-b border-grayScale-100 bg-gradient-to-r from-grayScale-50/80 to-white px-5 py-5 sm:px-8 sm:py-6">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-grayScale-900 sm:text-xl">Step 2: AUDIO questions</h2>
                  <p className="mt-1 max-w-3xl text-sm text-grayScale-500">
                    Build each question with voice prompts, optional media, and answer guidance.
                  </p>
                </div>
              </div>
              <div className="p-5 sm:p-8">
              <div className="rounded-xl border border-grayScale-200 bg-grayScale-50/30 p-4 sm:p-5">
                <div className="space-y-5">
                  {questionDrafts.map((draft, draftIndex) => (
                    <div key={draftIndex} className="rounded-2xl border border-grayScale-200 border-l-4 border-l-brand-500 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6">
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-brand-100 px-2 py-1 text-xs font-semibold tracking-wide text-brand-700">
                            AUDIO
                          </span>
                          <p className="text-sm font-semibold text-grayScale-900">Question {draftIndex + 1}</p>
                        </div>
                        {questionDrafts.length > 1 ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() =>
                              setQuestionDrafts((prev) => prev.filter((_, idx) => idx !== draftIndex))
                            }
                            disabled={saving}
                          >
                            Remove
                          </Button>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-sm font-medium text-grayScale-600">Question Text</label>
                          <Textarea
                            value={draft.questionText}
                            onChange={(e) =>
                              updateDraft(draftIndex, (prev) => ({ ...prev, questionText: e.target.value }))
                            }
                            rows={2}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-grayScale-600">Difficulty</label>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-11 w-full justify-between rounded-xl border-grayScale-200 bg-white px-3 text-sm font-normal text-grayScale-600 hover:bg-grayScale-50"
                              >
                                <span>{draft.difficulty}</span>
                                <ChevronDown className="h-4 w-4 text-grayScale-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[220px]">
                              <DropdownMenuRadioGroup
                                value={draft.difficulty}
                                onValueChange={(value) =>
                                  updateDraft(draftIndex, (prev) => ({
                                    ...prev,
                                    difficulty: value as "EASY" | "MEDIUM" | "HARD",
                                  }))
                                }
                              >
                                <DropdownMenuRadioItem value="EASY">EASY</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="MEDIUM">MEDIUM</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="HARD">HARD</DropdownMenuRadioItem>
                              </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-grayScale-600">Points</label>
                          <Input
                            type="number"
                            min={1}
                            value={draft.points}
                            onChange={(e) =>
                              updateDraft(draftIndex, (prev) => ({
                                ...prev,
                                points: Number(e.target.value) || 1,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-sm font-medium text-grayScale-600">Voice Prompt (optional)</label>
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-grayScale-200 px-3 py-2 text-sm text-grayScale-600 hover:bg-grayScale-50">
                                {draft.uploadingVoicePrompt ? (
                                  <SpinnerIcon className="h-4 w-4" />
                                ) : (
                                  <Upload className="h-4 w-4" />
                                )}
                                Upload Voice Prompt
                                <input
                                  type="file"
                                  accept=".mp3,.wav,.ogg,.m4a,.aac,.webm,.flac,audio/*"
                                  className="hidden"
                                  onChange={(event) => handleAudioUpload(event, "voice_prompt", draftIndex)}
                                  disabled={draft.uploadingVoicePrompt || saving}
                                />
                              </label>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-9 px-3 text-xs"
                                onClick={() => startRecording("voice_prompt", draftIndex)}
                                disabled={draft.uploadingVoicePrompt || saving || Boolean(recordingModal)}
                              >
                                {draft.recordingVoicePrompt ? "Recording..." : "Record Voice Prompt"}
                              </Button>
                              <span className="text-xs text-grayScale-400">Max 50MB</span>
                            </div>
                            <Input
                              value={draft.voicePrompt}
                              onChange={(e) =>
                                updateDraft(draftIndex, (prev) => ({ ...prev, voicePrompt: e.target.value }))
                              }
                              onBlur={() => handleResolveManualAudioPreview("voice_prompt", draftIndex)}
                              placeholder="Audio object_key (or URL)"
                            />
                            {draft.voicePromptPreviewUrl ? (
                              <audio controls src={draft.voicePromptPreviewUrl} className="h-10 w-full max-w-md" />
                            ) : null}
                          </div>
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-sm font-medium text-grayScale-600">Sample Answer Voice (optional)</label>
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-grayScale-200 px-3 py-2 text-sm text-grayScale-600 hover:bg-grayScale-50">
                                {draft.uploadingSamplePrompt ? (
                                  <SpinnerIcon className="h-4 w-4" />
                                ) : (
                                  <Upload className="h-4 w-4" />
                                )}
                                Upload Sample Answer
                                <input
                                  type="file"
                                  accept=".mp3,.wav,.ogg,.m4a,.aac,.webm,.flac,audio/*"
                                  className="hidden"
                                  onChange={(event) =>
                                    handleAudioUpload(event, "sample_answer_voice_prompt", draftIndex)
                                  }
                                  disabled={draft.uploadingSamplePrompt || saving}
                                />
                              </label>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-9 px-3 text-xs"
                                onClick={() => startRecording("sample_answer_voice_prompt", draftIndex)}
                                disabled={draft.uploadingSamplePrompt || saving || Boolean(recordingModal)}
                              >
                                {draft.recordingSamplePrompt ? "Recording..." : "Record Sample Answer"}
                              </Button>
                              <span className="text-xs text-grayScale-400">Max 50MB</span>
                            </div>
                            <Input
                              value={draft.sampleAnswerVoicePrompt}
                              onChange={(e) =>
                                updateDraft(draftIndex, (prev) => ({
                                  ...prev,
                                  sampleAnswerVoicePrompt: e.target.value,
                                }))
                              }
                              onBlur={() =>
                                handleResolveManualAudioPreview("sample_answer_voice_prompt", draftIndex)
                              }
                              placeholder="Audio object_key (or URL)"
                            />
                            {draft.samplePromptPreviewUrl ? (
                              <audio controls src={draft.samplePromptPreviewUrl} className="h-10 w-full max-w-md" />
                            ) : null}
                          </div>
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-sm font-medium text-grayScale-600">Correct Answer Text (optional)</label>
                          <Textarea
                            value={draft.audioCorrectAnswerText}
                            onChange={(e) =>
                              updateDraft(draftIndex, (prev) => ({
                                ...prev,
                                audioCorrectAnswerText: e.target.value,
                              }))
                            }
                            rows={2}
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-sm font-medium text-grayScale-600">Image URL (optional)</label>
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-grayScale-200 px-3 py-2 text-sm text-grayScale-600 hover:bg-grayScale-50">
                                {draft.uploadingImage ? (
                                  <SpinnerIcon className="h-4 w-4" />
                                ) : (
                                  <ImageIcon className="h-4 w-4" />
                                )}
                                Upload Image
                                <input
                                  type="file"
                                  accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
                                  className="hidden"
                                  onChange={(event) => handleImageUpload(event, draftIndex)}
                                  disabled={draft.uploadingImage || saving}
                                />
                              </label>
                              <span className="text-xs text-grayScale-400">Max 10MB</span>
                            </div>
                            <Input
                              value={draft.imageUrl}
                              onChange={(e) =>
                                updateDraft(draftIndex, (prev) => ({ ...prev, imageUrl: e.target.value }))
                              }
                              onBlur={() => handleResolveManualImagePreview(draftIndex)}
                              placeholder="Image URL (https://...)"
                            />
                            {draft.imagePreviewUrl ? (
                              <img
                                src={draft.imagePreviewUrl}
                                alt="Uploaded preview"
                                className="h-28 w-28 rounded-md border border-grayScale-200 object-cover"
                              />
                            ) : null}
                          </div>
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-sm font-medium text-grayScale-600">Tips (optional)</label>
                          <Textarea
                            value={draft.tips}
                            onChange={(e) =>
                              updateDraft(draftIndex, (prev) => ({ ...prev, tips: e.target.value }))
                            }
                            rows={2}
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-sm font-medium text-grayScale-600">Explanation (optional)</label>
                          <Textarea
                            value={draft.explanation}
                            onChange={(e) =>
                              updateDraft(draftIndex, (prev) => ({ ...prev, explanation: e.target.value }))
                            }
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </div>
              <div className="border-t border-grayScale-100 bg-white px-5 py-4 sm:px-8">
                <div className="flex flex-col gap-3 rounded-xl border border-dashed border-grayScale-200 bg-grayScale-50/40 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                  <p className="text-xs text-grayScale-500 sm:text-sm">
                    Need another item? Add a new AUDIO question to the end of the list.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-brand-200 text-brand-700 hover:bg-brand-50 hover:text-brand-800"
                    onClick={() => setQuestionDrafts((prev) => [...prev, createEmptyDraft()])}
                    disabled={saving}
                  >
                    <Plus className="h-4 w-4" />
                    Add question
                  </Button>
                </div>
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 bg-grayScale-50/30 px-5 py-4 sm:flex-row sm:justify-end sm:px-8 sm:py-5">
                <Button variant="outline" onClick={() => setCurrentStep(1)} disabled={saving} className="sm:w-auto">
                  Back
                </Button>
                <Button
                  className="bg-brand-500 hover:bg-brand-600 sm:min-w-[180px]"
                  onClick={() => setCurrentStep(3)}
                  disabled={!canProceedToReview}
                >
                  Next: Review
                </Button>
              </div>
            </Card>
          )}

          {currentStep === 3 && (
            <Card className="w-full overflow-hidden border-grayScale-200/80 shadow-sm">
              <div className="border-b border-grayScale-100 bg-gradient-to-r from-grayScale-50/80 to-white px-5 py-5 sm:px-8 sm:py-6">
                <h2 className="text-lg font-semibold tracking-tight text-grayScale-900 sm:text-xl">Step 3: Review & publish</h2>
                <p className="mt-1.5 max-w-3xl text-sm text-grayScale-500">
                  Confirm practice metadata and each AUDIO question before publishing.
                </p>
              </div>
              <div className="space-y-6 p-5 sm:p-8">
                <div className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
                <div className="rounded-xl border border-grayScale-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-grayScale-500">Practice</h3>
                  <div className="grid grid-cols-1 gap-3 text-sm text-grayScale-600 sm:grid-cols-2">
                    <p><span className="font-medium">Title:</span> {setTitle || "—"}</p>
                    <p><span className="font-medium">Course ID:</span> {subCourseId || "—"}</p>
                    <p className="sm:col-span-2"><span className="font-medium">Description:</span> {setDescription || "—"}</p>
                    <p className="sm:col-span-2 break-all">
                      <span className="font-medium">Intro video URL:</span> {introVideoUrl.trim() || "—"}
                    </p>
                    <p><span className="font-medium">Status:</span> {setStatus}</p>
                  </div>
                </div>

                <div className="flex max-h-[min(70vh,48rem)] min-h-0 flex-col rounded-xl border border-grayScale-200 bg-grayScale-50/20 p-4 shadow-sm sm:p-5">
                  <h3 className="mb-3 shrink-0 text-sm font-semibold uppercase tracking-wide text-grayScale-500">
                    Questions ({questionsWithText.length})
                  </h3>
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                    {questionsWithText.map((draft, idx) => (
                      <div key={idx} className="rounded-lg border border-grayScale-200 bg-white p-3 text-sm shadow-sm">
                        <p className="font-medium text-grayScale-700">
                          {idx + 1}. {draft.questionText}
                        </p>
                        <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-grayScale-600 sm:grid-cols-2">
                          <p><span className="font-medium text-grayScale-700">Question Type:</span> AUDIO</p>
                          <p><span className="font-medium text-grayScale-700">Difficulty:</span> {draft.difficulty}</p>
                          <p><span className="font-medium text-grayScale-700">Points:</span> {draft.points}</p>
                          <p><span className="font-medium text-grayScale-700">Status:</span> {setStatus}</p>
                          <p className="sm:col-span-2">
                            <span className="font-medium text-grayScale-700">Voice Prompt:</span>{" "}
                            {draft.voicePrompt.trim() || "—"}
                          </p>
                          <p className="sm:col-span-2">
                            <span className="font-medium text-grayScale-700">Sample Answer Voice Prompt:</span>{" "}
                            {draft.sampleAnswerVoicePrompt.trim() || "—"}
                          </p>
                          <p className="sm:col-span-2">
                            <span className="font-medium text-grayScale-700">Image URL:</span>{" "}
                            {draft.imageUrl.trim() || "—"}
                          </p>
                          <p className="sm:col-span-2">
                            <span className="font-medium text-grayScale-700">Audio Correct Answer Text:</span>{" "}
                            {draft.audioCorrectAnswerText.trim() || "—"}
                          </p>
                          <p className="sm:col-span-2">
                            <span className="font-medium text-grayScale-700">Tips:</span>{" "}
                            {draft.tips.trim() || "—"}
                          </p>
                          <p className="sm:col-span-2">
                            <span className="font-medium text-grayScale-700">Explanation:</span>{" "}
                            {draft.explanation.trim() || "—"}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3">
                          {draft.voicePromptPreviewUrl ? (
                            <audio controls src={draft.voicePromptPreviewUrl} className="h-9 w-full max-w-sm" />
                          ) : null}
                          {draft.samplePromptPreviewUrl ? (
                            <audio controls src={draft.samplePromptPreviewUrl} className="h-9 w-full max-w-sm" />
                          ) : null}
                          {draft.imagePreviewUrl ? (
                            <img
                              src={draft.imagePreviewUrl}
                              alt="Question preview"
                              className="h-20 w-20 rounded-md border border-grayScale-200 object-cover"
                            />
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 bg-grayScale-50/30 px-5 py-4 sm:flex-row sm:justify-end sm:px-8 sm:py-5">
              <Button variant="outline" onClick={() => setCurrentStep(2)} disabled={saving} className="sm:w-auto">
                Back
              </Button>
              <Button className="bg-brand-500 hover:bg-brand-600 sm:min-w-[200px]" disabled={!canCreate || saving} onClick={handleCreateSpeakingPractice}>
                {saving ? "Publishing..." : "Publish speaking practice"}
              </Button>
            </div>
            </Card>
          )}
        </div>
      )}

      {recordingModal ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-grayScale-200/80 bg-white p-6 shadow-2xl">
            <p className="text-center text-base font-semibold text-grayScale-900">
              Recording {recordingModal.label}
            </p>
            <p className="mt-1 text-center text-xs text-grayScale-500">
              Speak clearly. The bars reflect your input level in real time.
            </p>
            <div className="mt-3 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
                REC{" "}
                {`${Math.floor(recordingModal.elapsedSeconds / 60)
                  .toString()
                  .padStart(2, "0")}:${(recordingModal.elapsedSeconds % 60)
                  .toString()
                  .padStart(2, "0")}`}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-4 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700 shadow-sm">
                <Mic className="h-5 w-5" />
              </div>
              <div className="grid h-16 w-full grid-cols-32 items-end gap-[3px] overflow-hidden">
                {recordingModal.levels.map((level, idx) => {
                  const segmentCount = 9
                  const activeSegments = Math.max(1, Math.min(segmentCount, Math.round(level * segmentCount)))
                  return (
                    <div key={idx} className="flex h-full w-full flex-col-reverse gap-[2px]">
                      {Array.from({ length: segmentCount }, (_, segmentIdx) => (
                        <div
                          key={segmentIdx}
                          className="h-[5px] rounded-[2px]"
                          style={{
                            background:
                              segmentIdx < activeSegments
                                ? "linear-gradient(180deg, #9E2891 0%, #6A1B9A 100%)"
                                : "rgba(189, 189, 189, 0.35)",
                          }}
                        />
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-grayScale-200 text-grayScale-700 hover:bg-grayScale-50"
                onClick={() => void stopActiveRecording(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-grayScale-200 text-grayScale-700 hover:bg-grayScale-50"
                onClick={togglePauseRecording}
              >
                {recordingModal.isPaused ? "Continue" : "Pause"}
              </Button>
              <Button
                type="button"
                className="bg-brand-500 text-white hover:bg-brand-600"
                onClick={() => void stopActiveRecording(true)}
              >
                Stop & Save
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
