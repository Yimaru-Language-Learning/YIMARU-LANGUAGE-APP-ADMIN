import { notifyApiError } from "../../../lib/apiErrors"
import { useCallback, useEffect, useState } from "react"
import { Check, ChevronLeft, ChevronRight, ListOrdered, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Textarea } from "../../../components/ui/textarea"
import {
  addQuestionToSet,
  createParentLinkedPractice,
  createQuestion,
  createQuestionSet,
} from "../../../api/courses.api"
import type {
  CreateQuestionRequest,
  PracticeParentKind,
  PracticePublishStatus,
} from "../../../types/course.types"
import { cn } from "../../../lib/utils"
import { SpinnerIcon } from "../../../components/ui/spinner-icon"

export type CreatePracticeWizardParent = {
  kind: PracticeParentKind
  id: number
} | null

const STEPS = [
  { n: 1, label: "Question set" },
  { n: 2, label: "Questions" },
  { n: 3, label: "Attach" },
  { n: 4, label: "Practice" },
] as const

type QuestionDraft = {
  question_text: string
  voice_prompt: string
  sample_answer_voice_prompt: string
  audio_correct_answer_text: string
}

const emptyQuestion = (): QuestionDraft => ({
  question_text: "",
  voice_prompt: "",
  sample_answer_voice_prompt: "",
  audio_correct_answer_text: "",
})

type Props = {
  parent: CreatePracticeWizardParent
  onCreated?: () => void
}

export function CreatePracticeWizard({ parent, onCreated }: Props) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  const [setTitle, setSetTitle] = useState("")
  const [questionSetId, setQuestionSetId] = useState<number | null>(null)

  const [questionRows, setQuestionRows] = useState<QuestionDraft[]>([emptyQuestion()])
  const [createdQuestionIds, setCreatedQuestionIds] = useState<number[]>([])

  const [practiceTitle, setPracticeTitle] = useState("")
  const [storyDescription, setStoryDescription] = useState("")
  const [storyImage, setStoryImage] = useState("")
  const [quickTips, setQuickTips] = useState("")
  const [pendingSaveStatus, setPendingSaveStatus] =
    useState<PracticePublishStatus | null>(null)

  useEffect(() => {
    if (step === 4 && setTitle.trim() && !practiceTitle.trim()) {
      setPracticeTitle(setTitle.trim())
    }
  }, [step, setTitle, practiceTitle])

  const resetAll = useCallback(() => {
    setStep(1)
    setSetTitle("")
    setQuestionSetId(null)
    setQuestionRows([emptyQuestion()])
    setCreatedQuestionIds([])
    setPracticeTitle("")
    setStoryDescription("")
    setStoryImage("")
    setQuickTips("")
    setPendingSaveStatus(null)
  }, [])

  const handleStep1 = async () => {
    if (!setTitle.trim()) {
      toast.error("Enter a title for the question set")
      return
    }
    setSaving(true)
    try {
      const res = await createQuestionSet({
        title: setTitle.trim(),
        set_type: "PRACTICE",
      })
      const id = res.data?.data?.id
      if (id == null) {
        throw new Error("No question set id in response")
      }
      setQuestionSetId(id)
      toast.success("Question set created")
      setStep(2)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      notifyApiError(err, "Failed to create question set")
    } finally {
      setSaving(false)
    }
  }

  const handleStep2 = async () => {
    for (let i = 0; i < questionRows.length; i++) {
      const r = questionRows[i]
      if (!r.question_text.trim()) {
        toast.error(`Question ${i + 1}: enter question text`)
        return
      }
      if (!r.voice_prompt.trim() || !r.sample_answer_voice_prompt.trim()) {
        toast.error(`Question ${i + 1}: enter voice prompt URLs`)
        return
      }
      if (!r.audio_correct_answer_text.trim()) {
        toast.error(`Question ${i + 1}: enter the correct answer text`)
        return
      }
    }
    if (questionSetId == null) return
    setSaving(true)
    try {
      const ids: number[] = []
      for (const r of questionRows) {
        const body: CreateQuestionRequest = {
          question_text: r.question_text.trim(),
          question_type: "AUDIO",
          voice_prompt: r.voice_prompt.trim(),
          sample_answer_voice_prompt: r.sample_answer_voice_prompt.trim(),
          audio_correct_answer_text: r.audio_correct_answer_text.trim(),
        }
        const res = await createQuestion(body)
        const qid = res.data?.data?.id
        if (qid == null) {
          throw new Error("A question was created but no id was returned")
        }
        ids.push(qid)
      }
      setCreatedQuestionIds(ids)
      toast.success(`Created ${ids.length} question(s)`)
      setStep(3)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      notifyApiError(err, "Failed to create questions")
    } finally {
      setSaving(false)
    }
  }

  const handleStep3 = async () => {
    if (questionSetId == null || createdQuestionIds.length === 0) return
    setSaving(true)
    try {
      for (let i = 0; i < createdQuestionIds.length; i++) {
        await addQuestionToSet(questionSetId, {
          question_id: createdQuestionIds[i],
          display_order: i + 1,
        })
      }
      toast.success("Questions linked to the set")
      setStep(4)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      notifyApiError(err, "Failed to attach questions")
    } finally {
      setSaving(false)
    }
  }

  const handleStep4 = async (status: PracticePublishStatus) => {
    if (questionSetId == null) return
    if (!practiceTitle.trim() || !storyDescription.trim() || !storyImage.trim()) {
      toast.error("Title, story description, and story image are required")
      return
    }
    setPendingSaveStatus(status)
    setSaving(true)
    try {
      await createParentLinkedPractice({
        parents: parent
          ? [{ parent_kind: parent.kind, parent_id: parent.id }]
          : null,
        title: practiceTitle.trim(),
        story_description: storyDescription.trim(),
        story_image: storyImage.trim(),
        question_set_id: questionSetId,
        quick_tips: quickTips.trim(),
        publish_status: status,
      })
      toast.success(
        status === "PUBLISHED" ? "Practice published" : "Practice saved as draft",
      )
      resetAll()
      onCreated?.()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      notifyApiError(err, "Failed to create practice")
    } finally {
      setSaving(false)
      setPendingSaveStatus(null)
    }
  }

  return (
    <Card className="border-brand-200/60 shadow-soft">
      <CardHeader className="border-b border-grayScale-200 pb-4">
        <CardTitle className="text-base font-semibold text-grayScale-800">Create a new practice</CardTitle>
        <p className="text-sm font-normal text-grayScale-500">
          Four steps: create a question set, add audio questions, attach them, then set the practice
          story. Locations are optional — attach a course, module, or lesson later if needed.
        </p>
        <ol className="mt-4 flex flex-wrap gap-2">
          {STEPS.map((s) => {
            const done = step > s.n
            const active = step === s.n
            return (
              <li
                key={s.n}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider",
                  done && "border-mint-500/40 bg-mint-50 text-mint-800",
                  active && !done && "border-brand-500 bg-brand-500 text-white",
                  !active && !done && "border-grayScale-200 bg-white text-grayScale-500",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <span className="font-mono tabular-nums">{s.n}</span>}
                {s.label}
              </li>
            )
          })}
        </ol>
      </CardHeader>
      <CardContent className="pt-5">
        {!parent ? (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
            No placement selected — the practice shell will be created unlinked. Attach it to a
            course, module, or lesson later.
          </p>
        ) : null}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                Question set title
              </p>
              <Input
                value={setTitle}
                onChange={(e) => setSetTitle(e.target.value)}
                placeholder='e.g. "Course-A1 practice"'
                disabled={saving}
              />
            </div>
            <p className="text-xs text-grayScale-500">
              Creates a practice question set for this course, module, or lesson.
            </p>
            <Button type="button" onClick={handleStep1} disabled={saving}>
              {saving ? <SpinnerIcon className="h-4 w-4" /> : null}
              Create question set &amp; continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-grayScale-600">
              Add one or more audio questions to question set #{questionSetId}.
            </p>
            {questionRows.map((row, idx) => (
              <div
                key={idx}
                className="space-y-3 rounded-2xl border border-grayScale-200 bg-grayScale-50/50 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-grayScale-500">
                    Question {idx + 1}
                  </span>
                  {questionRows.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-red-600 hover:text-red-700"
                      onClick={() => setQuestionRows((rows) => rows.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-grayScale-500">Question text</p>
                  <Textarea
                    value={row.question_text}
                    onChange={(e) => {
                      const v = e.target.value
                      setQuestionRows((rows) =>
                        rows.map((r, i) => (i === idx ? { ...r, question_text: v } : r)),
                      )
                    }}
                    rows={2}
                    placeholder="Thank you for your help!"
                    disabled={saving}
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-grayScale-500">Voice prompt (URL)</p>
                  <Input
                    value={row.voice_prompt}
                    onChange={(e) => {
                      const v = e.target.value
                      setQuestionRows((rows) =>
                        rows.map((r, i) => (i === idx ? { ...r, voice_prompt: v } : r)),
                      )
                    }}
                    placeholder="https://…"
                    disabled={saving}
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-grayScale-500">Sample answer voice (URL)</p>
                  <Input
                    value={row.sample_answer_voice_prompt}
                    onChange={(e) => {
                      const v = e.target.value
                      setQuestionRows((rows) =>
                        rows.map((r, i) => (i === idx ? { ...r, sample_answer_voice_prompt: v } : r)),
                      )
                    }}
                    placeholder="https://…"
                    disabled={saving}
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-grayScale-500">Correct answer text</p>
                  <Textarea
                    value={row.audio_correct_answer_text}
                    onChange={(e) => {
                      const v = e.target.value
                      setQuestionRows((rows) =>
                        rows.map((r, i) => (i === idx ? { ...r, audio_correct_answer_text: v } : r)),
                      )
                    }}
                    rows={2}
                    placeholder="You're welcome! Have a nice day!"
                    disabled={saving}
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuestionRows((rows) => [...rows, emptyQuestion()])}
              disabled={saving}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add another question
            </Button>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={saving}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              <Button type="button" onClick={handleStep2} disabled={saving}>
                {saving ? <SpinnerIcon className="h-4 w-4" /> : null}
                Create questions &amp; continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-grayScale-600">
              Confirm the order of questions in the set.
            </p>
            <ul className="space-y-2 rounded-xl border border-grayScale-200 bg-white p-3">
              {createdQuestionIds.map((qid, i) => (
                <li
                  key={qid}
                  className="flex items-center justify-between gap-2 text-sm text-grayScale-700"
                >
                  <span className="font-mono">question #{qid}</span>
                  <span className="flex items-center gap-1 text-xs text-grayScale-500">
                    <ListOrdered className="h-3.5 w-3.5" />
                    order {i + 1}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={saving}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              <Button type="button" onClick={handleStep3} disabled={saving}>
                {saving ? <SpinnerIcon className="h-4 w-4" /> : null}
                Attach to question set
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-grayScale-600">
              Linked to {parent.kind.toLowerCase()} #{parent.id} · question set #{questionSetId}
            </p>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                Practice title
              </p>
              <Input
                value={practiceTitle}
                onChange={(e) => setPracticeTitle(e.target.value)}
                placeholder="Test title"
                disabled={saving}
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                Story description
              </p>
              <Textarea
                value={storyDescription}
                onChange={(e) => setStoryDescription(e.target.value)}
                rows={4}
                placeholder="Story for the learner…"
                disabled={saving}
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                Story image (URL)
              </p>
              <Input
                value={storyImage}
                onChange={(e) => setStoryImage(e.target.value)}
                placeholder="https://…"
                disabled={saving}
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                Quick tips
              </p>
              <Textarea
                value={quickTips}
                onChange={(e) => setQuickTips(e.target.value)}
                rows={2}
                placeholder="Comma-separated tips (optional)"
                disabled={saving}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(3)} disabled={saving}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => void handleStep4("DRAFT")}
              >
                {saving && pendingSaveStatus === "DRAFT" ? (
                  <SpinnerIcon className="h-4 w-4" />
                ) : null}
                Save as draft
              </Button>
              <Button
                type="button"
                disabled={saving}
                onClick={() => void handleStep4("PUBLISHED")}
              >
                {saving && pendingSaveStatus === "PUBLISHED" ? (
                  <SpinnerIcon className="h-4 w-4" />
                ) : null}
                Publish practice
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
