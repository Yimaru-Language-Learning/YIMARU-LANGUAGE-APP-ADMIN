import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react"
import { Check, Image as ImageIcon, Mic, Plus, Upload, X } from "lucide-react"
import { toast } from "sonner"
import { resolveMediaPreviewUrl } from "../../lib/practiceMedia"
import { uploadAudioFile, uploadImageFile } from "../../api/files.api"
import {
  getQuestionTypeDefinitionById,
  getQuestionTypeDefinitions,
  questionTypeDefinitionListLabel,
} from "../../api/questionTypeDefinitions.api"
import type { QuestionTypeDefinition } from "../../types/questionTypeDefinition.types"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Select } from "../ui/select"
import { Button } from "../ui/button"
import { SpinnerIcon } from "../ui/spinner-icon"
import { cn } from "../../lib/utils"
import { ResolvedAudio } from "../media/ResolvedAudio"
import { ResolvedImage } from "../media/ResolvedImage"
import { DynamicSchemaSlotField } from "./DynamicSchemaSlotField"

export type PracticeQuestionEditorType = "MCQ" | "TRUE_FALSE" | "SHORT" | "AUDIO" | "DYNAMIC"
export type PracticeQuestionEditorDifficulty = "EASY" | "MEDIUM" | "HARD"

export interface PracticeQuestionOptionDraft {
  text: string
  isCorrect: boolean
}

type RecordingField = "voice_prompt" | "sample_answer_voice_prompt"

const MAX_AUDIO_SIZE_BYTES = 50 * 1024 * 1024
const ALLOWED_AUDIO_EXTENSIONS = new Set(["mp3", "wav", "ogg", "m4a", "aac", "webm", "flac"])
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"])

export interface PracticeQuestionDynamicRow {
  id: string
  kind: string
  label?: string
  required?: boolean
}

export interface PracticeQuestionEditorValue {
  questionText: string
  questionType: PracticeQuestionEditorType
  difficultyLevel: PracticeQuestionEditorDifficulty
  points: number
  tips: string
  explanation: string
  options: PracticeQuestionOptionDraft[]
  voicePrompt: string
  sampleAnswerVoicePrompt: string
  audioCorrectAnswerText: string
  shortAnswer: string
  /** Stored URL or object key; same semantics as Speaking practice editor */
  imageUrl: string
  /** When `questionType` is DYNAMIC — definition used to shape `dynamic_payload` */
  questionTypeDefinitionId: number | null
  dynamicStimulusRows: PracticeQuestionDynamicRow[]
  dynamicResponseRows: PracticeQuestionDynamicRow[]
  /** Keys `stimulus:${elementId}` and `response:${elementId}` (ids from the type definition schema) */
  dynamicFieldValues: Record<string, string>
}

export function createEmptyPracticeQuestionDraft(): PracticeQuestionEditorValue {
  return {
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
    shortAnswer: "",
    imageUrl: "",
    questionTypeDefinitionId: null,
    dynamicStimulusRows: [],
    dynamicResponseRows: [],
    dynamicFieldValues: {},
  }
}

function useDebouncedString(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

function defaultOptionsForType(
  type: PracticeQuestionEditorType,
  previousType: PracticeQuestionEditorType,
  current: PracticeQuestionOptionDraft[],
): PracticeQuestionOptionDraft[] {
  if (type === "DYNAMIC") {
    return current
  }
  if (type === "TRUE_FALSE") {
    if (previousType === "TRUE_FALSE" && current.length >= 2) {
      return current.map((o, i) => ({
        text: i === 0 ? "True" : "False",
        isCorrect: o.isCorrect,
      }))
    }
    return [
      { text: "True", isCorrect: true },
      { text: "False", isCorrect: false },
    ]
  }
  if (type === "MCQ") {
    if (previousType === "MCQ" && current.length >= 2) {
      const hasCorrect = current.some((o) => o.isCorrect)
      return current.map((o, i) => ({
        text: o.text,
        isCorrect: hasCorrect ? o.isCorrect : i === 0,
      }))
    }
    return [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ]
  }
  return current
}

export type PracticeQuestionFieldErrorKey =
  | "questionText"
  | "points"
  | "shortAnswer"
  | "options"
  | "correctOption"

export interface PracticeQuestionEditorFieldsProps {
  value: PracticeQuestionEditorValue
  onChange: (next: PracticeQuestionEditorValue) => void
  fieldErrors?: Partial<Record<PracticeQuestionFieldErrorKey, string>>
  showFieldErrors?: boolean
  /** Disables upload/record controls while parent saves */
  mediaBusy?: boolean
}

export function PracticeQuestionEditorFields({
  value,
  onChange,
  fieldErrors = {},
  showFieldErrors = false,
  mediaBusy = false,
}: PracticeQuestionEditorFieldsProps) {
  const valueRef = useRef(value)
  valueRef.current = value

  const patch = (partial: Partial<PracticeQuestionEditorValue>) => {
    onChange({ ...value, ...partial })
  }

  const setType = (questionType: PracticeQuestionEditorType) => {
    const options = defaultOptionsForType(questionType, value.questionType, value.options)
    if (questionType === "DYNAMIC" || value.questionType === "DYNAMIC") {
      onChange({
        ...value,
        questionType,
        options,
        questionTypeDefinitionId: null,
        dynamicStimulusRows: [],
        dynamicResponseRows: [],
        dynamicFieldValues: {},
      })
      return
    }
    onChange({ ...value, questionType, options })
  }

  const updateOption = (optionIndex: number, updates: Partial<PracticeQuestionOptionDraft>) => {
    const options = value.options.map((opt, i) => (i === optionIndex ? { ...opt, ...updates } : opt))
    onChange({ ...value, options })
  }

  const addOption = () => {
    onChange({ ...value, options: [...value.options, { text: "", isCorrect: false }] })
  }

  const removeOption = (optionIndex: number) => {
    if (value.options.length <= 2) return
    const options = value.options.filter((_, i) => i !== optionIndex)
    if (!options.some((o) => o.isCorrect) && options.length > 0) {
      options[0] = { ...options[0], isCorrect: true }
    }
    onChange({ ...value, options })
  }

  const setCorrectOption = (optionIndex: number) => {
    const options = value.options.map((opt, i) => ({ ...opt, isCorrect: i === optionIndex }))
    onChange({ ...value, options })
  }

  const [voicePreviewUrl, setVoicePreviewUrl] = useState("")
  const [samplePreviewUrl, setSamplePreviewUrl] = useState("")
  const [imagePreviewUrl, setImagePreviewUrl] = useState("")
  const [uploadingVoice, setUploadingVoice] = useState(false)
  const [uploadingSample, setUploadingSample] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const debVoice = useDebouncedString(value.voicePrompt, 500)
  const debSample = useDebouncedString(value.sampleAnswerVoicePrompt, 500)
  const debImage = useDebouncedString(value.imageUrl, 500)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const s = debVoice.trim()
      if (!s) {
        setVoicePreviewUrl("")
        return
      }
      if (s.startsWith("http://") || s.startsWith("https://")) {
        setVoicePreviewUrl(s)
        return
      }
      try {
        const u = await resolveMediaPreviewUrl(s)
        if (!cancelled) setVoicePreviewUrl(u)
      } catch {
        if (!cancelled) setVoicePreviewUrl("")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [debVoice])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const s = debSample.trim()
      if (!s) {
        setSamplePreviewUrl("")
        return
      }
      if (s.startsWith("http://") || s.startsWith("https://")) {
        setSamplePreviewUrl(s)
        return
      }
      try {
        const u = await resolveMediaPreviewUrl(s)
        if (!cancelled) setSamplePreviewUrl(u)
      } catch {
        if (!cancelled) setSamplePreviewUrl("")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [debSample])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const s = debImage.trim()
      if (!s) {
        setImagePreviewUrl("")
        return
      }
      try {
        const u = await resolveMediaPreviewUrl(s)
        if (!cancelled) setImagePreviewUrl(u)
      } catch {
        if (!cancelled) setImagePreviewUrl("")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [debImage])

  const uploadAudioForField = useCallback(
    async (file: File, field: RecordingField) => {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? ""
      if (!ALLOWED_AUDIO_EXTENSIONS.has(extension)) {
        toast.error("Unsupported audio format")
        return
      }
      if (file.size > MAX_AUDIO_SIZE_BYTES) {
        toast.error("Audio file must be 50MB or less")
        return
      }

      if (field === "voice_prompt") setUploadingVoice(true)
      else setUploadingSample(true)

      try {
        const res = await uploadAudioFile(file)
        const objectKey = res.data?.data?.object_key?.trim()
        const immediateUrl = res.data?.data?.url?.trim() ?? ""
        if (!objectKey) throw new Error("Missing uploaded audio object key")

        const base = valueRef.current
        if (field === "voice_prompt") {
          onChange({
            ...base,
            voicePrompt: objectKey,
          })
          setVoicePreviewUrl(immediateUrl || (await resolveMediaPreviewUrl(objectKey)))
        } else {
          onChange({
            ...base,
            sampleAnswerVoicePrompt: objectKey,
          })
          setSamplePreviewUrl(immediateUrl || (await resolveMediaPreviewUrl(objectKey)))
        }
        toast.success("Audio uploaded successfully")
      } catch (error) {
        console.error("Failed to upload audio:", error)
        toast.error("Failed to upload audio file")
      } finally {
        if (field === "voice_prompt") setUploadingVoice(false)
        else setUploadingSample(false)
      }
    },
    [onChange],
  )

  const handleAudioFileInput = async (
    event: ChangeEvent<HTMLInputElement>,
    field: RecordingField,
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    await uploadAudioForField(file, field)
  }

  const resolveManualAudioOnBlur = async (field: RecordingField) => {
    const rawValue = field === "voice_prompt" ? value.voicePrompt : value.sampleAnswerVoicePrompt
    if (!rawValue.trim()) {
      if (field === "voice_prompt") setVoicePreviewUrl("")
      else setSamplePreviewUrl("")
      return
    }

    try {
      const trimmedValue = rawValue.trim()
      const isURL = /^https?:\/\//i.test(trimmedValue)

      if (isURL) {
        if (field === "voice_prompt") setUploadingVoice(true)
        else setUploadingSample(true)

        const res = await uploadAudioFile(trimmedValue)
        const objectKey = res.data?.data?.object_key?.trim()
        const immediateUrl = res.data?.data?.url?.trim() ?? ""
        if (!objectKey) throw new Error("Missing uploaded audio object key")

        const base = valueRef.current
        if (field === "voice_prompt") {
          onChange({ ...base, voicePrompt: objectKey })
          setVoicePreviewUrl(immediateUrl || (await resolveMediaPreviewUrl(objectKey)))
        } else {
          onChange({ ...base, sampleAnswerVoicePrompt: objectKey })
          setSamplePreviewUrl(immediateUrl || (await resolveMediaPreviewUrl(objectKey)))
        }
        toast.success("Audio URL imported successfully")
        return
      }

      const url = await resolveMediaPreviewUrl(rawValue)
      if (field === "voice_prompt") setVoicePreviewUrl(url)
      else setSamplePreviewUrl(url)
    } catch (error) {
      console.error("Failed to resolve audio:", error)
      toast.error("Could not import/resolve audio URL")
    } finally {
      if (field === "voice_prompt") setUploadingVoice(false)
      else setUploadingSample(false)
    }
  }

  const handleImageFileInput = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    const extension = file.name.split(".").pop()?.toLowerCase() ?? ""
    if (!ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
      toast.error("Unsupported image format")
      return
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error("Image file must be 10MB or less")
      return
    }

    setUploadingImage(true)
    try {
      const res = await uploadImageFile(file)
      const uploadedUrl = res.data?.data?.url?.trim()
      if (!uploadedUrl) throw new Error("Missing uploaded image url")
      onChange({ ...valueRef.current, imageUrl: uploadedUrl })
      setImagePreviewUrl(uploadedUrl)
      toast.success("Image uploaded successfully")
    } catch (error) {
      console.error("Failed to upload image:", error)
      toast.error("Failed to upload image")
    } finally {
      setUploadingImage(false)
    }
  }

  const resolveImageOnBlur = async () => {
    if (!value.imageUrl.trim()) {
      setImagePreviewUrl("")
      return
    }
    try {
      const resolved = await resolveMediaPreviewUrl(value.imageUrl)
      setImagePreviewUrl(resolved)
    } catch (error) {
      console.error("Failed to resolve image preview URL:", error)
      toast.error("Could not resolve image preview URL")
    }
  }

  const [recordingModal, setRecordingModal] = useState<{
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
    field: RecordingField
    shouldUpload: boolean
    isPaused: boolean
    startedAtMs: number
    pausedTotalMs: number
    pauseStartedAtMs: number | null
  } | null>(null)

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

  const startRecording = async (field: RecordingField) => {
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
            const normalized = Math.min(1, Math.pow(avg / 180, 0.85))
            return Math.max(0.04, normalized)
          })
          setRecordingModal((prev) => {
            if (!prev || prev.field !== field) return prev
            return { ...prev, levels: nextLevels, elapsedSeconds }
          })
        } else {
          setRecordingModal((prev) => {
            if (!prev || prev.field !== field) return prev
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
        const stopField = active.field
        active.stream.getTracks().forEach((track) => track.stop())
        if (active.rafId) cancelAnimationFrame(active.rafId)
        await active.audioContext.close().catch(() => undefined)
        activeRecordingRef.current = null
        setRecordingModal(null)

        if (shouldUpload) {
          const blob = new Blob(chunks, { type: "audio/webm" })
          const fileName =
            stopField === "voice_prompt"
              ? `voice-prompt-${Date.now()}.webm`
              : `sample-answer-${Date.now()}.webm`
          const recordedFile = new File([blob], fileName, { type: "audio/webm" })
          await uploadAudioForField(recordedFile, stopField)
        }
      }

      setRecordingModal({
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
        field,
        shouldUpload: true,
        isPaused: false,
        startedAtMs: Date.now(),
        pausedTotalMs: 0,
        pauseStartedAtMs: null,
      }
      animateLevels()
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

  const controlsDisabled = mediaBusy

  const [typeDefinitions, setTypeDefinitions] = useState<QuestionTypeDefinition[]>([])
  const [definitionsLoading, setDefinitionsLoading] = useState(false)
  const [definitionDetailLoading, setDefinitionDetailLoading] = useState(false)

  useEffect(() => {
    if (value.questionType !== "DYNAMIC") return
    let cancelled = false
    setDefinitionsLoading(true)
    ;(async () => {
      try {
        const rows = await getQuestionTypeDefinitions({ include_system: true })
        if (!cancelled) setTypeDefinitions(Array.isArray(rows) ? rows : [])
      } catch {
        if (!cancelled) setTypeDefinitions([])
      } finally {
        if (!cancelled) setDefinitionsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [value.questionType])

  const handleDynamicDefinitionChange = async (rawId: string) => {
    if (!rawId) {
      onChange({
        ...value,
        questionTypeDefinitionId: null,
        dynamicStimulusRows: [],
        dynamicResponseRows: [],
        dynamicFieldValues: {},
      })
      return
    }
    const id = Number(rawId)
    if (!Number.isFinite(id) || id <= 0) return
    setDefinitionDetailLoading(true)
    try {
      const def = await getQuestionTypeDefinitionById(id)
      if (!def) {
        toast.error("Definition not found")
        return
      }
      const fieldValues: Record<string, string> = { ...value.dynamicFieldValues }
      const dynamicStimulusRows: PracticeQuestionDynamicRow[] = def.stimulus_schema.map((r) => ({
        id: r.id,
        kind: r.kind,
        label: r.label,
        required: r.required,
      }))
      const dynamicResponseRows: PracticeQuestionDynamicRow[] = def.response_schema.map((r) => ({
        id: r.id,
        kind: r.kind,
        label: r.label,
        required: r.required,
      }))
      for (const r of dynamicStimulusRows) {
        const k = `stimulus:${r.id}`
        if (fieldValues[k] === undefined) fieldValues[k] = ""
      }
      for (const r of dynamicResponseRows) {
        const k = `response:${r.id}`
        if (fieldValues[k] === undefined) fieldValues[k] = ""
      }
      onChange({
        ...value,
        questionTypeDefinitionId: id,
        dynamicStimulusRows,
        dynamicResponseRows,
        dynamicFieldValues: fieldValues,
      })
    } catch (e) {
      console.error(e)
      toast.error("Failed to load definition details")
    } finally {
      setDefinitionDetailLoading(false)
    }
  }

  const setDynamicField = (key: string, next: string) => {
    onChange({
      ...value,
      dynamicFieldValues: { ...value.dynamicFieldValues, [key]: next },
    })
  }

  return (
    <>
      <div className="mt-3 space-y-3">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wide text-grayScale-500">Question Text</label>
          <textarea
            value={value.questionText}
            onChange={(e) => patch({ questionText: e.target.value })}
            placeholder="Enter your question..."
            className={cn(
              "w-full rounded-lg border px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100",
              showFieldErrors && fieldErrors.questionText ? "border-red-300 ring-1 ring-red-200" : "border-grayScale-200",
            )}
            rows={2}
            aria-invalid={Boolean(showFieldErrors && fieldErrors.questionText)}
          />
          {showFieldErrors && fieldErrors.questionText ? (
            <p className="text-xs text-red-600">{fieldErrors.questionText}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wide text-grayScale-500">Type</label>
            <Select value={value.questionType} onChange={(e) => setType(e.target.value as PracticeQuestionEditorType)} className="h-9 text-sm">
              <option value="MCQ">Multiple Choice</option>
              <option value="TRUE_FALSE">True/False</option>
              <option value="SHORT">Short Answer</option>
              <option value="AUDIO">Audio</option>
              <option value="DYNAMIC">Dynamic (schema-driven)</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wide text-grayScale-500">Difficulty</label>
            <Select
              value={value.difficultyLevel}
              onChange={(e) => patch({ difficultyLevel: e.target.value as PracticeQuestionEditorDifficulty })}
              className="h-9 text-sm"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wide text-grayScale-500">Points</label>
            <Input
              type="number"
              value={value.points}
              onChange={(e) => patch({ points: Number(e.target.value) || 1 })}
              min={1}
              className={cn(
                "h-9 text-sm",
                showFieldErrors && fieldErrors.points ? "border-red-300 ring-1 ring-red-200" : undefined,
              )}
              aria-invalid={Boolean(showFieldErrors && fieldErrors.points)}
            />
            {showFieldErrors && fieldErrors.points ? (
              <p className="text-xs text-red-600">{fieldErrors.points}</p>
            ) : null}
          </div>
        </div>

        {value.questionType === "DYNAMIC" && (
          <div className="space-y-2 rounded-lg border border-violet-200 bg-violet-50/50 p-2.5 sm:p-3">
            <p className="text-xs leading-snug text-grayScale-600 sm:text-sm">
              <span className="font-medium text-grayScale-800">Image / Audio</span> slots: drop file or paste URL
              (imports via <code className="rounded bg-white px-0.5 text-[11px]">POST /files/upload</code>). Other
              slots: text or JSON.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
                Question type definition <span className="text-red-500">*</span>
              </label>
              <Select
                value={value.questionTypeDefinitionId != null ? String(value.questionTypeDefinitionId) : ""}
                onChange={(e) => void handleDynamicDefinitionChange(e.target.value)}
                disabled={definitionsLoading || definitionDetailLoading}
                className="h-9 text-sm"
              >
                <option value="">{definitionsLoading ? "Loading definitions…" : "Select definition…"}</option>
                {typeDefinitions.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {questionTypeDefinitionListLabel(d)}
                  </option>
                ))}
              </Select>
            </div>
            {definitionDetailLoading ? (
              <p className="text-sm font-medium text-grayScale-500">Loading schema…</p>
            ) : null}
            {value.dynamicStimulusRows.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-violet-800">Stimulus</p>
                {value.dynamicStimulusRows.map((row) => (
                  <div
                    key={`stimulus-${row.id}`}
                    className="rounded-lg border border-grayScale-200 bg-white p-2.5 shadow-sm sm:p-3"
                  >
                    <DynamicSchemaSlotField
                      row={row}
                      value={value.dynamicFieldValues[`stimulus:${row.id}`] ?? ""}
                      onChange={(next) => setDynamicField(`stimulus:${row.id}`, next)}
                      disabled={controlsDisabled}
                    />
                  </div>
                ))}
              </div>
            ) : null}
            {value.dynamicResponseRows.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-violet-800">Response</p>
                {value.dynamicResponseRows.map((row) => (
                  <div
                    key={`response-${row.id}`}
                    className="rounded-lg border border-grayScale-200 bg-white p-2.5 shadow-sm sm:p-3"
                  >
                    <DynamicSchemaSlotField
                      row={row}
                      value={value.dynamicFieldValues[`response:${row.id}`] ?? ""}
                      onChange={(next) => setDynamicField(`response:${row.id}`, next)}
                      disabled={controlsDisabled}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {value.questionType === "MCQ" && (
          <div className="space-y-2 rounded-lg bg-grayScale-50/50 p-3">
            <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">Options</label>
            <div className="space-y-2.5">
              {value.options.map((option, optIdx) => (
                <div
                  key={optIdx}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors ${
                    option.isCorrect ? "border-green-200 bg-green-50/50" : "border-grayScale-200 bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setCorrectOption(optIdx)}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                      option.isCorrect
                        ? "border-green-500 bg-green-500 text-white shadow-sm"
                        : "border-grayScale-300 hover:border-brand-400 hover:shadow-sm"
                    }`}
                  >
                    {option.isCorrect ? <Check className="h-3 w-3" /> : null}
                  </button>
                  <Input
                    value={option.text}
                    onChange={(e) => updateOption(optIdx, { text: e.target.value })}
                    placeholder={`Option ${optIdx + 1}`}
                    className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
                  />
                  {value.options.length > 2 ? (
                    <button
                      type="button"
                      onClick={() => removeOption(optIdx)}
                      className="rounded-lg p-1 text-grayScale-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              ))}
              <button
                type="button"
                onClick={addOption}
                className="mt-1 flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-brand-500 transition-colors hover:bg-brand-50 hover:text-brand-600"
              >
                <Plus className="h-4 w-4" />
                Add Option
              </button>
            </div>
            <p className="text-xs text-grayScale-400">Click the circle to mark the correct answer.</p>
            {showFieldErrors && fieldErrors.options ? (
              <p className="text-xs text-red-600">{fieldErrors.options}</p>
            ) : null}
            {showFieldErrors && fieldErrors.correctOption ? (
              <p className="text-xs text-red-600">{fieldErrors.correctOption}</p>
            ) : null}
          </div>
        )}

        {value.questionType === "TRUE_FALSE" && (
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">Correct Answer</label>
            <div className="flex gap-3">
              {["True", "False"].map((val, i) => (
                <button
                  key={val}
                  type="button"
                  onClick={() =>
                    patch({
                      options: [
                        { text: "True", isCorrect: i === 0 },
                        { text: "False", isCorrect: i === 1 },
                      ],
                    })
                  }
                  className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                    value.options[i]?.isCorrect
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

        {value.questionType === "SHORT" && (
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">Expected Short Answer</label>
            <Input
              value={value.shortAnswer}
              onChange={(e) => patch({ shortAnswer: e.target.value })}
              placeholder="Enter the acceptable answer"
              className={cn(showFieldErrors && fieldErrors.shortAnswer ? "border-red-300 ring-1 ring-red-200" : undefined)}
              aria-invalid={Boolean(showFieldErrors && fieldErrors.shortAnswer)}
            />
            {showFieldErrors && fieldErrors.shortAnswer ? (
              <p className="text-xs text-red-600">{fieldErrors.shortAnswer}</p>
            ) : null}
          </div>
        )}

        {value.questionType === "AUDIO" && (
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">Audio Correct Answer Text</label>
            <Input
              value={value.audioCorrectAnswerText}
              onChange={(e) => patch({ audioCorrectAnswerText: e.target.value })}
              placeholder="Expected correct answer text for audio response"
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">Tips (Optional)</label>
            <Input
              value={value.tips}
              onChange={(e) => patch({ tips: e.target.value })}
              placeholder="Helpful tip for the student"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">Explanation (Optional)</label>
            <Input
              value={value.explanation}
              onChange={(e) => patch({ explanation: e.target.value })}
              placeholder="Why this is the correct answer"
            />
          </div>
        </div>

        {value.questionType !== "DYNAMIC" ? (
          <>
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">Voice Prompt (Optional)</label>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <label
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-md border border-grayScale-200 px-3 py-2 text-sm text-grayScale-600 hover:bg-grayScale-50",
                  (uploadingVoice || controlsDisabled || recordingModal) && "pointer-events-none opacity-60",
                )}
              >
                {uploadingVoice ? <SpinnerIcon className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                Upload Voice Prompt
                <input
                  type="file"
                  accept=".mp3,.wav,.ogg,.m4a,.aac,.webm,.flac,audio/*"
                  className="hidden"
                  onChange={(e) => void handleAudioFileInput(e, "voice_prompt")}
                  disabled={uploadingVoice || controlsDisabled || Boolean(recordingModal)}
                />
              </label>
              <Button
                type="button"
                variant="outline"
                className="h-9 px-3 text-xs"
                onClick={() => void startRecording("voice_prompt")}
                disabled={uploadingVoice || controlsDisabled || Boolean(recordingModal)}
              >
                {recordingModal?.field === "voice_prompt" ? "Recording…" : "Record Voice Prompt"}
              </Button>
              <span className="text-xs text-grayScale-400">Max 50MB</span>
            </div>
            <Input
              value={value.voicePrompt}
              onChange={(e) => patch({ voicePrompt: e.target.value })}
              onBlur={() => void resolveManualAudioOnBlur("voice_prompt")}
              placeholder="Audio object_key (or URL)"
              className="font-mono text-[13px]"
              disabled={controlsDisabled}
            />
            {voicePreviewUrl ? (
              <ResolvedAudio controls src={voicePreviewUrl} className="h-10 w-full max-w-md" />
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
            Sample Answer Voice Prompt (Optional)
          </label>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <label
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-md border border-grayScale-200 px-3 py-2 text-sm text-grayScale-600 hover:bg-grayScale-50",
                  (uploadingSample || controlsDisabled || recordingModal) && "pointer-events-none opacity-60",
                )}
              >
                {uploadingSample ? <SpinnerIcon className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                Upload Sample Answer
                <input
                  type="file"
                  accept=".mp3,.wav,.ogg,.m4a,.aac,.webm,.flac,audio/*"
                  className="hidden"
                  onChange={(e) => void handleAudioFileInput(e, "sample_answer_voice_prompt")}
                  disabled={uploadingSample || controlsDisabled || Boolean(recordingModal)}
                />
              </label>
              <Button
                type="button"
                variant="outline"
                className="h-9 px-3 text-xs"
                onClick={() => void startRecording("sample_answer_voice_prompt")}
                disabled={uploadingSample || controlsDisabled || Boolean(recordingModal)}
              >
                {recordingModal?.field === "sample_answer_voice_prompt" ? "Recording…" : "Record Sample Answer"}
              </Button>
              <span className="text-xs text-grayScale-400">Max 50MB</span>
            </div>
            <Input
              value={value.sampleAnswerVoicePrompt}
              onChange={(e) => patch({ sampleAnswerVoicePrompt: e.target.value })}
              onBlur={() => void resolveManualAudioOnBlur("sample_answer_voice_prompt")}
              placeholder="Audio object_key (or URL)"
              className="font-mono text-[13px]"
              disabled={controlsDisabled}
            />
            {samplePreviewUrl ? (
              <ResolvedAudio controls src={samplePreviewUrl} className="h-10 w-full max-w-md" />
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">Image (Optional)</label>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <label
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-md border border-grayScale-200 px-3 py-2 text-sm text-grayScale-600 hover:bg-grayScale-50",
                  (uploadingImage || controlsDisabled) && "pointer-events-none opacity-60",
                )}
              >
                {uploadingImage ? <SpinnerIcon className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                Upload Image
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
                  className="hidden"
                  onChange={(e) => void handleImageFileInput(e)}
                  disabled={uploadingImage || controlsDisabled}
                />
              </label>
              <span className="text-xs text-grayScale-400">Max 10MB</span>
            </div>
            <Input
              value={value.imageUrl}
              onChange={(e) => patch({ imageUrl: e.target.value })}
              onBlur={() => void resolveImageOnBlur()}
              placeholder="Image URL (https://…) or key"
              className="font-mono text-[13px]"
              disabled={controlsDisabled}
            />
            {imagePreviewUrl ? (
              <ResolvedImage
                src={imagePreviewUrl}
                alt=""
                className="h-28 w-28 rounded-md border border-grayScale-200 object-cover"
              />
            ) : null}
          </div>
        </div>
          </>
        ) : null}
      </div>

      {recordingModal ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-grayScale-200/80 bg-white p-6 shadow-2xl">
            <p className="text-center text-base font-semibold text-grayScale-900">Recording {recordingModal.label}</p>
            <p className="mt-1 text-center text-xs text-grayScale-500">
              Speak clearly. The bars reflect your input level in real time.
            </p>
            <div className="mt-3 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
                REC{" "}
                {`${Math.floor(recordingModal.elapsedSeconds / 60)
                  .toString()
                  .padStart(2, "0")}:${(recordingModal.elapsedSeconds % 60).toString().padStart(2, "0")}`}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-4 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700 shadow-sm">
                <Mic className="h-5 w-5" />
              </div>
              <div
                className="grid h-16 w-full items-end gap-[3px] overflow-hidden"
                style={{ gridTemplateColumns: "repeat(32, minmax(0, 1fr))" }}
              >
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
    </>
  )
}
