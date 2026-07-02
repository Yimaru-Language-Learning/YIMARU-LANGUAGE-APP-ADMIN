import { useState } from "react"
import { ChevronDown, Plus, Trash2 } from "lucide-react"
import { Button } from "../../../../components/ui/button"
import { Card } from "../../../../components/ui/card"
import { Input } from "../../../../components/ui/input"
import { DynamicSchemaSlotField } from "../../../../components/content-management/DynamicSchemaSlotField"
import { cn } from "../../../../lib/utils"
import {
  countQuestionsReferencingBlock,
  createEmptyBlockElement,
  createEmptyStimulusBlock,
  STIMULUS_BLOCK_KINDS,
  stimulusBlockKindLabel,
  type PracticeFormStimulusBlock,
} from "../../../../lib/practiceStimulusBlocks"
import { getStimulusKindPresentation } from "../question-type-steps/componentKindUi"

interface StimulusBlocksPanelProps {
  blocks: PracticeFormStimulusBlock[]
  questions: { stimulusBlockKey?: string | null }[]
  onChange: (blocks: PracticeFormStimulusBlock[]) => void
  onClearQuestionBlockKeys?: (blockKey: string) => void
}

export function StimulusBlocksPanel({
  blocks,
  questions,
  onChange,
  onClearQuestionBlockKeys,
}: StimulusBlocksPanelProps) {
  const [expandedBlockKeys, setExpandedBlockKeys] = useState<Set<string>>(
    () => new Set(blocks[0]?.blockKey ? [blocks[0].blockKey] : []),
  )

  const toggleBlock = (blockKey: string) => {
    setExpandedBlockKeys((prev) => {
      const next = new Set(prev)
      if (next.has(blockKey)) next.delete(blockKey)
      else next.add(blockKey)
      return next
    })
  }

  const updateBlock = (index: number, patch: Partial<PracticeFormStimulusBlock>) => {
    const next = [...blocks]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  const removeBlock = (index: number) => {
    const block = blocks[index]
    const refCount = countQuestionsReferencingBlock(block.blockKey, questions)
    if (refCount > 0) {
      const proceed = window.confirm(
        `${refCount} question(s) reference block "${block.blockKey}". Remove the block and clear those links?`,
      )
      if (!proceed) return
      onClearQuestionBlockKeys?.(block.blockKey)
    }
    const next = blocks.filter((_, i) => i !== index)
    onChange(
      next.map((b, i) => ({
        ...b,
        displayOrder: i + 1,
      })),
    )
  }

  const addBlock = () => {
    const block = createEmptyStimulusBlock(blocks)
    onChange([...blocks, block])
    setExpandedBlockKeys(new Set([block.blockKey]))
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-grayScale-800">Shared stimulus blocks</h3>
        <p className="text-sm text-grayScale-500">
          Define audio, passages, or instructions once per section. Link questions to a block
          so they share that content.
        </p>
      </div>

      {blocks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-sky-200 bg-sky-50/40 px-4 py-6 text-center text-sm text-sky-900">
          No stimulus blocks yet. Add a block for each listening or reading section.
        </div>
      ) : null}

      <div className="space-y-3">
        {blocks.map((block, blockIndex) => {
          const expanded = expandedBlockKeys.has(block.blockKey)
          const refCount = countQuestionsReferencingBlock(block.blockKey, questions)
          return (
            <Card
              key={`${block.blockKey}-${blockIndex}`}
              className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-soft"
            >
              <div className="flex items-start gap-3 border-b border-grayScale-50 px-4 py-3 sm:px-5">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-start gap-3 text-left"
                  onClick={() => toggleBlock(block.blockKey)}
                >
                  <ChevronDown
                    className={cn(
                      "mt-1 h-5 w-5 shrink-0 text-grayScale-400 transition-transform",
                      expanded && "rotate-180",
                    )}
                  />
                  <div className="min-w-0 space-y-1">
                    <p className="text-base font-bold text-grayScale-800">
                      Block {block.displayOrder}
                    </p>
                    <p className="font-mono text-xs text-sky-700">{block.blockKey}</p>
                    <p className="text-xs text-grayScale-500">
                      {block.elements.length} element{block.elements.length === 1 ? "" : "s"}
                      {refCount > 0 ? ` · ${refCount} linked question${refCount === 1 ? "" : "s"}` : ""}
                    </p>
                  </div>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-brand-500 hover:bg-brand-50"
                  onClick={() => removeBlock(blockIndex)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {expanded ? (
                <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-grayScale-700">
                      Block key
                    </label>
                    <Input
                      value={block.blockKey}
                      onChange={(e) =>
                        updateBlock(blockIndex, { blockKey: e.target.value })
                      }
                      className="font-mono text-sm"
                      placeholder="section-1"
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-sky-800">
                      Shared stimulus
                    </p>
                    {block.elements.map((element, elementIndex) => {
                      const presentation = getStimulusKindPresentation(element.kind)
                      const fieldValues: Record<string, string> = {
                        [`stimulus:${element.id}`]: element.fieldValue,
                      }
                      return (
                        <div
                          key={element.id}
                          className="rounded-lg border border-grayScale-200 bg-sky-50/30 p-3"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-grayScale-700">
                              <presentation.Icon className="h-4 w-4 text-sky-700" />
                              {presentation.label}
                              <span className="font-mono text-[10px] text-grayScale-400">
                                {element.id}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-grayScale-500"
                              onClick={() => {
                                const elements = block.elements.filter(
                                  (_, i) => i !== elementIndex,
                                )
                                updateBlock(blockIndex, { elements })
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                          <DynamicSchemaSlotField
                            row={{
                              id: element.id,
                              kind: element.kind,
                              label: stimulusBlockKindLabel(element.kind),
                            }}
                            side="stimulus"
                            value={element.fieldValue}
                            onChange={(next) => {
                              const elements = [...block.elements]
                              elements[elementIndex] = {
                                ...elements[elementIndex],
                                fieldValue: next,
                              }
                              updateBlock(blockIndex, { elements })
                            }}
                            allFieldValues={fieldValues}
                            stimulusSchema={block.elements.map((el) => ({
                              id: el.id,
                              kind: el.kind,
                            }))}
                            responseSchema={[]}
                          />
                        </div>
                      )
                    })}

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        className="h-10 rounded-lg border border-grayScale-200 bg-white px-3 text-sm"
                        defaultValue=""
                        onChange={(e) => {
                          const kind = e.target.value
                          e.target.value = ""
                          if (!kind) return
                          const elements = [
                            ...block.elements,
                            createEmptyBlockElement(kind, block.elements),
                          ]
                          updateBlock(blockIndex, { elements })
                        }}
                      >
                        <option value="">Add stimulus element…</option>
                        {STIMULUS_BLOCK_KINDS.map((kind) => (
                          <option key={kind} value={kind}>
                            {stimulusBlockKindLabel(kind)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : null}
            </Card>
          )
        })}
      </div>

      <button
        type="button"
        onClick={addBlock}
        className="flex items-center gap-3 text-base font-bold text-sky-700 transition-all hover:opacity-80"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-sky-600">
          <Plus className="h-3 w-3 stroke-[4]" />
        </div>
        Add stimulus block
      </button>
    </div>
  )
}
