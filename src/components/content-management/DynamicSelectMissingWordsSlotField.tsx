import { Plus, Trash2 } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import {
  addBlankSegment,
  addTextSegment,
  addWordBankItem,
  defaultSelectMissingWordsResponseFromStimulus,
  parseSelectMissingWordsResponseSlotValue,
  parseSelectMissingWordsStimulusSlotValue,
  removeSegment,
  removeWordBankItem,
  SELECT_MISSING_WORDS_MIN_BANK,
  serializeSelectMissingWordsResponseSlotValue,
  serializeSelectMissingWordsStimulusSlotValue,
  setAllowReuse,
  syncResponseBlanksWithStimulus,
  updateTextSegment,
  updateWordBankText,
  type SelectMissingWordsStimulusValue,
} from "../../lib/selectMissingWordsSlotValue"

export function DynamicSelectMissingWordsStimulusSlot({
  value,
  onChange,
  disabled,
  slotLabel,
}: {
  value: string
  onChange: (next: string) => void
  disabled: boolean
  slotLabel: string
}) {
  const parsed = parseSelectMissingWordsStimulusSlotValue(value)

  const updateValue = (next: SelectMissingWordsStimulusValue) => {
    onChange(serializeSelectMissingWordsStimulusSlotValue(next))
  }

  const canRemoveWord = parsed.word_bank.length > SELECT_MISSING_WORDS_MIN_BANK
  const canRemoveSegment = parsed.segments.length > 1

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-medium text-grayScale-700">{slotLabel}</label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-8 gap-1.5 rounded-[6px] border-brand-200 text-brand-600 hover:bg-brand-50"
            onClick={() => updateValue(addTextSegment(parsed))}
          >
            <Plus className="h-3.5 w-3.5" />
            Add text
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-8 gap-1.5 rounded-[6px] border-brand-200 text-brand-600 hover:bg-brand-50"
            onClick={() => updateValue(addBlankSegment(parsed))}
          >
            <Plus className="h-3.5 w-3.5" />
            Add blank
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-grayScale-400">
          Passage segments
        </p>
        {parsed.segments.map((segment, index) => (
          <div
            key={`segment-${index}-${segment.type === "blank" ? segment.id : "text"}`}
            className="flex flex-wrap items-start gap-2 rounded-lg border border-grayScale-200 bg-grayScale-50/50 p-3"
          >
            {segment.type === "text" ? (
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-grayScale-400">
                  Text
                </p>
                <Textarea
                  rows={2}
                  value={segment.value}
                  onChange={(e) =>
                    updateValue(updateTextSegment(parsed, index, e.target.value))
                  }
                  placeholder="Text before or after a blank"
                  className="min-h-[56px] resize-y rounded-lg border-grayScale-200 bg-white font-mono text-sm"
                  disabled={disabled}
                />
              </div>
            ) : (
              <div className="flex min-h-[56px] flex-1 items-center rounded-lg border border-dashed border-brand-200 bg-brand-50/40 px-3">
                <span className="text-sm font-medium text-brand-700">
                  Blank {segment.id}
                </span>
              </div>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled || !canRemoveSegment}
              className="h-9 w-9 shrink-0 text-grayScale-400 hover:text-red-600 disabled:opacity-40"
              aria-label={`Remove segment ${index + 1}`}
              onClick={() => updateValue(removeSegment(parsed, index))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-grayScale-400">
            Word bank
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-8 gap-1.5 rounded-[6px] border-brand-200 text-brand-600 hover:bg-brand-50"
            onClick={() => updateValue(addWordBankItem(parsed))}
          >
            <Plus className="h-3.5 w-3.5" />
            Add word
          </Button>
        </div>
        {parsed.word_bank.map((item, index) => (
          <div
            key={`word-${item.id}`}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="w-10 text-xs font-medium text-grayScale-500">{item.id}</span>
            <Input
              value={item.text}
              onChange={(e) =>
                updateValue(updateWordBankText(parsed, index, e.target.value))
              }
              placeholder={`Word ${index + 1}`}
              className="h-10 flex-1 rounded-lg border-grayScale-200 bg-white"
              disabled={disabled}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled || !canRemoveWord}
              className="h-9 w-9 shrink-0 text-grayScale-400 hover:text-red-600 disabled:opacity-40"
              aria-label={`Remove word ${item.id}`}
              onClick={() => updateValue(removeWordBankItem(parsed, index))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm text-grayScale-700">
        <input
          type="checkbox"
          checked={parsed.allow_reuse}
          disabled={disabled}
          onChange={(e) => updateValue(setAllowReuse(parsed, e.target.checked))}
          className="h-4 w-4 rounded border-grayScale-300"
        />
        Allow word reuse across blanks
      </label>

      <p className="text-[11px] text-grayScale-500">
        Minimum {SELECT_MISSING_WORDS_MIN_BANK} words in the bank and at least one blank.
        Whitespace in text is preserved.
      </p>
    </div>
  )
}

export function DynamicSelectMissingWordsAnswerSlot({
  value,
  onChange,
  disabled,
  slotLabel,
  stimulus,
}: {
  value: string
  onChange: (next: string) => void
  disabled: boolean
  slotLabel: string
  stimulus: SelectMissingWordsStimulusValue | null
}) {
  const parsed = parseSelectMissingWordsResponseSlotValue(value, stimulus)
  const synced = stimulus
    ? syncResponseBlanksWithStimulus(parsed, stimulus)
    : parsed

  const updateValue = (next: ReturnType<typeof parseSelectMissingWordsResponseSlotValue>) => {
    onChange(serializeSelectMissingWordsResponseSlotValue(next))
  }

  const wordOptions =
    stimulus?.word_bank.filter((item) => item.text.length > 0) ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-medium text-grayScale-700">{slotLabel}</label>
        {stimulus ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-8 rounded-[6px]"
            onClick={() =>
              updateValue(defaultSelectMissingWordsResponseFromStimulus(stimulus))
            }
          >
            Reset from blanks
          </Button>
        ) : null}
      </div>

      {!stimulus ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Fill in the cloze passage and word bank first so answers can reference blank and word ids.
        </p>
      ) : null}

      <div className="space-y-2">
        {synced.blanks.map((blank, index) => (
          <div
            key={`blank-answer-${blank.blank_id}`}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-grayScale-200 bg-grayScale-50/50 p-3"
          >
            <span className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-wide text-grayScale-400">
              Blank {blank.blank_id}
            </span>
            <select
              value={blank.word_id}
              disabled={disabled || wordOptions.length === 0}
              onChange={(e) => {
                const selected = wordOptions.find((item) => item.id === e.target.value)
                const blanks = [...synced.blanks]
                blanks[index] = {
                  blank_id: blank.blank_id,
                  word_id: e.target.value,
                  text: selected?.text ?? "",
                }
                updateValue({ blanks })
              }}
              className="h-10 min-w-[160px] flex-1 rounded-lg border border-grayScale-200 bg-white px-3 text-sm"
            >
              <option value="">Select word…</option>
              {wordOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id}
                  {item.text ? `: ${item.text}` : ""}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
