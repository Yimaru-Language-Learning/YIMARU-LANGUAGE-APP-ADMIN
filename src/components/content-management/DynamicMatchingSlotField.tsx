import { Plus, Trash2 } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import {
  addMatchingInputRow,
  addMatchingPair,
  defaultMatchingAnswerFromInputs,
  MATCHING_MIN_ITEMS,
  parseMatchingAnswerSlotValue,
  parseMatchingInputsSlotValue,
  removeMatchingInputRow,
  removeMatchingPair,
  serializeMatchingAnswerSlotValue,
  serializeMatchingInputsSlotValue,
  type MatchingAnswerSlotValue,
  type MatchingInputsSlotValue,
} from "../../lib/matchingSlotValue"

export function DynamicMatchingInputsSlot({
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
  const parsed = parseMatchingInputsSlotValue(value)

  const updateValue = (next: MatchingInputsSlotValue) => {
    onChange(serializeMatchingInputsSlotValue(next))
  }

  const updateSide = (
    side: "left" | "right",
    index: number,
    text: string,
  ) => {
    const next = {
      left: [...parsed.left],
      right: [...parsed.right],
    }
    next[side][index] = { ...next[side][index], text }
    updateValue(next)
  }

  const rowCount = Math.max(parsed.left.length, parsed.right.length)
  const canRemove = rowCount > MATCHING_MIN_ITEMS

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-medium text-grayScale-700">{slotLabel}</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 gap-1.5 rounded-lg border-brand-200 text-brand-600 hover:bg-brand-50"
          onClick={() => updateValue(addMatchingInputRow(parsed))}
        >
          <Plus className="h-3.5 w-3.5" />
          Add row
        </Button>
      </div>

      <div className="space-y-3">
        {Array.from({ length: rowCount }).map((_, index) => (
          <div
            key={`matching-row-${index}`}
            className="grid gap-2 rounded-lg border border-grayScale-200 bg-grayScale-50/50 p-3 md:grid-cols-[1fr_1fr_auto]"
          >
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-grayScale-400">
                Left {parsed.left[index]?.id ?? `l${index + 1}`}
              </p>
              <Input
                value={parsed.left[index]?.text ?? ""}
                onChange={(e) => updateSide("left", index, e.target.value)}
                placeholder={`Left item ${index + 1}`}
                className="rounded-lg border-grayScale-200 bg-white"
                disabled={disabled}
              />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-grayScale-400">
                Right {parsed.right[index]?.id ?? `r${index + 1}`}
              </p>
              <Input
                value={parsed.right[index]?.text ?? ""}
                onChange={(e) => updateSide("right", index, e.target.value)}
                placeholder={`Right item ${index + 1}`}
                className="rounded-lg border-grayScale-200 bg-white"
                disabled={disabled}
              />
            </div>
            <div className="flex items-end justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled || !canRemove}
                className="h-9 w-9 text-grayScale-400 hover:text-red-600 disabled:opacity-40"
                aria-label={`Remove row ${index + 1}`}
                onClick={() => updateValue(removeMatchingInputRow(parsed, index))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-grayScale-500">
        Minimum {MATCHING_MIN_ITEMS} rows on each side. Whitespace in text is preserved.
      </p>
    </div>
  )
}

export function DynamicMatchingAnswerSlot({
  value,
  onChange,
  disabled,
  slotLabel,
  matchingInputs,
}: {
  value: string
  onChange: (next: string) => void
  disabled: boolean
  slotLabel: string
  matchingInputs: MatchingInputsSlotValue | null
}) {
  const parsed = parseMatchingAnswerSlotValue(value, matchingInputs)

  const updateValue = (next: MatchingAnswerSlotValue) => {
    onChange(serializeMatchingAnswerSlotValue(next))
  }

  const leftOptions = matchingInputs?.left ?? []
  const rightOptions = matchingInputs?.right ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-medium text-grayScale-700">{slotLabel}</label>
        <div className="flex flex-wrap gap-2">
          {matchingInputs ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              className="h-8 rounded-lg"
              onClick={() =>
                updateValue(defaultMatchingAnswerFromInputs(matchingInputs))
              }
            >
              Reset from inputs
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-8 gap-1.5 rounded-lg border-brand-200 text-brand-600 hover:bg-brand-50"
            onClick={() => updateValue(addMatchingPair(parsed, matchingInputs))}
          >
            <Plus className="h-3.5 w-3.5" />
            Add pair
          </Button>
        </div>
      </div>

      {!matchingInputs ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Fill in matching inputs first so answer pairs can reference left and right ids.
        </p>
      ) : null}

      <div className="space-y-2">
        {parsed.pairs.map((pair, index) => (
          <div
            key={`pair-${index}-${pair.left_id}-${pair.right_id}`}
            className="flex flex-wrap items-center gap-2"
          >
            <select
              value={pair.left_id}
              disabled={disabled || leftOptions.length === 0}
              onChange={(e) => {
                const pairs = [...parsed.pairs]
                pairs[index] = { ...pairs[index], left_id: e.target.value }
                updateValue({ pairs })
              }}
              className="h-10 min-w-[120px] rounded-lg border border-grayScale-200 bg-white px-3 text-sm"
            >
              {leftOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id}
                  {item.text ? `: ${item.text.slice(0, 40)}` : ""}
                </option>
              ))}
            </select>
            <span className="text-sm text-grayScale-400">→</span>
            <select
              value={pair.right_id}
              disabled={disabled || rightOptions.length === 0}
              onChange={(e) => {
                const pairs = [...parsed.pairs]
                pairs[index] = { ...pairs[index], right_id: e.target.value }
                updateValue({ pairs })
              }}
              className="h-10 min-w-[120px] rounded-lg border border-grayScale-200 bg-white px-3 text-sm"
            >
              {rightOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id}
                  {item.text ? `: ${item.text.slice(0, 40)}` : ""}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled || parsed.pairs.length <= 1}
              className="h-8 w-8 shrink-0 text-grayScale-400 hover:text-red-600 disabled:opacity-40"
              aria-label={`Remove pair ${index + 1}`}
              onClick={() => updateValue(removeMatchingPair(parsed, index))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
