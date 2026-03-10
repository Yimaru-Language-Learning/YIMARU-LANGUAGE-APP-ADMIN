import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus, Mic, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Select } from "../../components/ui/select"
import {
  addQuestionToSet,
  createQuestion,
  createQuestionSet,
  getQuestions,
} from "../../api/courses.api"
import type { QuestionDetail } from "../../types/course.types"

export function SpeakingPage() {
  const [audioQuestions, setAudioQuestions] = useState<QuestionDetail[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [openCreate, setOpenCreate] = useState(false)

  const [setTitle, setSetTitle] = useState("")
  const [setDescription, setSetDescription] = useState("")
  const [ownerType, setOwnerType] = useState<"SUB_COURSE" | "COURSE">("SUB_COURSE")
  const [ownerId, setOwnerId] = useState("")
  const [setStatus, setSetStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED")

  const [questionText, setQuestionText] = useState("")
  const [difficulty, setDifficulty] = useState("EASY")
  const [points, setPoints] = useState(1)
  const [voicePrompt, setVoicePrompt] = useState("")
  const [sampleAnswerVoicePrompt, setSampleAnswerVoicePrompt] = useState("")
  const [audioCorrectAnswerText, setAudioCorrectAnswerText] = useState("")

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

  const resetCreateForm = () => {
    setSetTitle("")
    setSetDescription("")
    setOwnerType("SUB_COURSE")
    setOwnerId("")
    setSetStatus("PUBLISHED")
    setQuestionText("")
    setDifficulty("EASY")
    setPoints(1)
    setVoicePrompt("")
    setSampleAnswerVoicePrompt("")
    setAudioCorrectAnswerText("")
  }

  const canCreate = useMemo(() => {
    return (
      setTitle.trim().length > 0 &&
      ownerId.trim().length > 0 &&
      questionText.trim().length > 0 &&
      voicePrompt.trim().length > 0 &&
      sampleAnswerVoicePrompt.trim().length > 0 &&
      audioCorrectAnswerText.trim().length > 0
    )
  }, [setTitle, ownerId, questionText, voicePrompt, sampleAnswerVoicePrompt, audioCorrectAnswerText])

  const handleCreateSpeakingPractice = async () => {
    if (!canCreate) return
    const parsedOwnerId = Number(ownerId)
    if (!Number.isFinite(parsedOwnerId) || parsedOwnerId <= 0) return

    setSaving(true)
    try {
      const setRes = await createQuestionSet({
        title: setTitle.trim(),
        description: setDescription.trim(),
        set_type: "PRACTICE",
        owner_type: ownerType,
        owner_id: parsedOwnerId,
        status: setStatus,
      })

      const setId = setRes.data?.data?.id
      if (!setId) throw new Error("Question set creation failed: missing set ID")

      const questionRes = await createQuestion({
        question_text: questionText.trim(),
        question_type: "AUDIO",
        status: "PUBLISHED",
        difficulty_level: difficulty,
        points,
        voice_prompt: voicePrompt.trim(),
        sample_answer_voice_prompt: sampleAnswerVoicePrompt.trim(),
        audio_correct_answer_text: audioCorrectAnswerText.trim(),
      })

      const questionId = questionRes.data?.data?.id
      if (!questionId) throw new Error("Question creation failed: missing question ID")

      await addQuestionToSet(setId, {
        question_id: questionId,
        display_order: 1,
      })

      setOpenCreate(false)
      resetCreateForm()
      await fetchAudioQuestions()
    } catch (error) {
      console.error("Failed to create speaking practice:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-grayScale-600">
            Speaking
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-grayScale-400">
            Create and manage speaking practice sessions for your learners.
          </p>
        </div>
        <Button className="w-full bg-brand-500 hover:bg-brand-600 sm:w-auto" onClick={() => setOpenCreate(true)}>
          <Plus className="h-4 w-4" />
          Add New Speaking Practice
        </Button>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="border-b border-grayScale-200 pb-4">
          <CardTitle className="text-base font-semibold text-grayScale-600">
            AUDIO Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          {loading ? (
            <div className="py-14 text-center text-sm text-grayScale-500">Loading audio questions...</div>
          ) : audioQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="mb-6 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200">
                <Mic className="h-8 w-8 text-brand-500" />
              </div>
              <h3 className="text-base font-semibold text-grayScale-600">No audio questions yet</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-grayScale-400">
                Create a speaking practice to automatically create and attach an AUDIO question.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {audioQuestions.map((question, idx) => (
                <div
                  key={question.id}
                  className={`rounded-lg border px-4 py-3 ${
                    idx % 2 === 0 ? "border-grayScale-200 bg-white" : "border-grayScale-100 bg-grayScale-50"
                  }`}
                >
                  <p className="text-sm font-medium text-grayScale-700">{question.question_text}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-md bg-purple-100 px-2 py-1 text-purple-700">AUDIO</span>
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {openCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-grayScale-900">Create Speaking Practice</h2>
              <button
                onClick={() => setOpenCreate(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5 px-6 py-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-grayScale-600">Practice Title</label>
                  <Input value={setTitle} onChange={(e) => setSetTitle(e.target.value)} placeholder="Speaking practice title" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-grayScale-600">Practice Description (Optional)</label>
                  <Textarea value={setDescription} onChange={(e) => setSetDescription(e.target.value)} rows={2} placeholder="Brief description" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-grayScale-600">Owner Type</label>
                  <Select value={ownerType} onChange={(e) => setOwnerType(e.target.value as "SUB_COURSE" | "COURSE")}>
                    <option value="SUB_COURSE">SUB_COURSE</option>
                    <option value="COURSE">COURSE</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-grayScale-600">Owner ID</label>
                  <Input
                    type="number"
                    min={1}
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    placeholder="e.g. 12"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-grayScale-600">Set Status</label>
                  <Select value={setStatus} onChange={(e) => setSetStatus(e.target.value as "DRAFT" | "PUBLISHED")}>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                  </Select>
                </div>
              </div>

              <div className="rounded-lg border border-grayScale-200 bg-grayScale-50/50 p-4">
                <p className="mb-3 text-sm font-semibold text-grayScale-700">AUDIO Question</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-sm font-medium text-grayScale-600">Question Text</label>
                    <Textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={2} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-grayScale-600">Difficulty</label>
                    <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                      <option value="EASY">EASY</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HARD">HARD</option>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-grayScale-600">Points</label>
                    <Input type="number" min={1} value={points} onChange={(e) => setPoints(Number(e.target.value) || 1)} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-sm font-medium text-grayScale-600">Voice Prompt</label>
                    <Textarea value={voicePrompt} onChange={(e) => setVoicePrompt(e.target.value)} rows={2} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-sm font-medium text-grayScale-600">Sample Answer Voice Prompt</label>
                    <Textarea value={sampleAnswerVoicePrompt} onChange={(e) => setSampleAnswerVoicePrompt(e.target.value)} rows={2} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-sm font-medium text-grayScale-600">Audio Correct Answer Text</label>
                    <Textarea value={audioCorrectAnswerText} onChange={(e) => setAudioCorrectAnswerText(e.target.value)} rows={2} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setOpenCreate(false)} disabled={saving}>
                Cancel
              </Button>
              <Button
                className="bg-brand-500 hover:bg-brand-600"
                disabled={!canCreate || saving}
                onClick={handleCreateSpeakingPractice}
              >
                {saving ? "Creating..." : "Create Practice + Audio Question"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
