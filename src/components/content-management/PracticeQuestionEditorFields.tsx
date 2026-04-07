import { Check, Plus, X } from "lucide-react"
import { Input } from "../ui/input"
import { Select } from "../ui/select"
import { cn } from "../../lib/utils"

export type PracticeQuestionEditorType = "MCQ" | "TRUE_FALSE" | "SHORT" | "AUDIO"
export type PracticeQuestionEditorDifficulty = "EASY" | "MEDIUM" | "HARD"

export interface PracticeQuestionOptionDraft {
  text: string
  isCorrect: boolean
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
  }
}

function defaultOptionsForType(
  type: PracticeQuestionEditorType,
  previousType: PracticeQuestionEditorType,
  current: PracticeQuestionOptionDraft[],
): PracticeQuestionOptionDraft[] {
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
}

export function PracticeQuestionEditorFields({
  value,
  onChange,
  fieldErrors = {},
  showFieldErrors = false,
}: PracticeQuestionEditorFieldsProps) {
  const patch = (partial: Partial<PracticeQuestionEditorValue>) => {
    onChange({ ...value, ...partial })
  }

  const setType = (questionType: PracticeQuestionEditorType) => {
    const options = defaultOptionsForType(questionType, value.questionType, value.options)
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

  return (
    <div className="mt-5 space-y-5">
      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">Question Text</label>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">Type</label>
          <Select value={value.questionType} onChange={(e) => setType(e.target.value as PracticeQuestionEditorType)}>
            <option value="MCQ">Multiple Choice</option>
            <option value="TRUE_FALSE">True/False</option>
            <option value="SHORT">Short Answer</option>
            <option value="AUDIO">Audio</option>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">Difficulty</label>
          <Select
            value={value.difficultyLevel}
            onChange={(e) => patch({ difficultyLevel: e.target.value as PracticeQuestionEditorDifficulty })}
          >
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">Points</label>
          <Input
            type="number"
            value={value.points}
            onChange={(e) => patch({ points: Number(e.target.value) || 1 })}
            min={1}
            className={cn(showFieldErrors && fieldErrors.points ? "border-red-300 ring-1 ring-red-200" : undefined)}
            aria-invalid={Boolean(showFieldErrors && fieldErrors.points)}
          />
          {showFieldErrors && fieldErrors.points ? (
            <p className="text-xs text-red-600">{fieldErrors.points}</p>
          ) : null}
        </div>
      </div>

      {value.questionType === "MCQ" && (
        <div className="space-y-3 rounded-lg bg-grayScale-50/50 p-4">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">Voice Prompt (Optional)</label>
          <Input
            value={value.voicePrompt}
            onChange={(e) => patch({ voicePrompt: e.target.value })}
            placeholder="Voice prompt text"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-grayScale-500">
            Sample Answer Voice Prompt (Optional)
          </label>
          <Input
            value={value.sampleAnswerVoicePrompt}
            onChange={(e) => patch({ sampleAnswerVoicePrompt: e.target.value })}
            placeholder="Sample answer voice prompt"
          />
        </div>
      </div>

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
    </div>
  )
}
