import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Plus, Trash2 } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { cn } from "../../lib/utils"
import {
  addSequenceOrderItem,
  limitsFromSchemaConfig,
  parseSequenceOrderSlotValue,
  removeSequenceOrderItem,
  serializeSequenceOrderSlotValue,
  updateSequenceOrderItemText,
  type SequenceOrderSlotValue,
} from "../../lib/sequenceOrderSlotValue"

function SortableSequenceRow({
  id,
  itemId,
  text,
  index,
  disabled,
  canRemove,
  onTextChange,
  onRemove,
}: {
  id: string
  itemId: string
  text: string
  index: number
  disabled: boolean
  canRemove: boolean
  onTextChange: (text: string) => void
  onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border border-grayScale-200 bg-grayScale-50/50 p-3 sm:flex-nowrap",
        isDragging && "relative z-50 opacity-60",
      )}
    >
      <button
        type="button"
        className="flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-[6px] text-grayScale-400 hover:bg-white hover:text-grayScale-600 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
        disabled={disabled}
        aria-label={`Drag item ${itemId}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <p className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-wide text-grayScale-400">
        Item {itemId}
      </p>
      <Input
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={`Item ${index + 1}`}
        className="h-10 min-w-0 flex-1 rounded-lg border-grayScale-200 bg-white"
        disabled={disabled}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled || !canRemove}
        className="h-9 w-9 shrink-0 text-grayScale-400 hover:text-red-600 disabled:opacity-40"
        aria-label={`Remove item ${itemId}`}
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function DynamicSequenceOrderSlot({
  value,
  onChange,
  disabled,
  slotLabel,
  config,
}: {
  value: string
  onChange: (next: string) => void
  disabled: boolean
  slotLabel: string
  config?: Record<string, unknown>
}) {
  const parsed = parseSequenceOrderSlotValue(value)
  const { minItems, maxItems } = limitsFromSchemaConfig(config)
  const canAdd = parsed.items.length < maxItems
  const canRemove = parsed.items.length > minItems

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const updateValue = (next: SequenceOrderSlotValue) => {
    onChange(serializeSequenceOrderSlotValue(next))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = parsed.items.findIndex((item) => item.id === active.id)
    const newIndex = parsed.items.findIndex((item) => item.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const reordered = arrayMove(parsed.items, oldIndex, newIndex)
    updateValue({
      items: reordered,
      correct_order: reordered.map((item) => item.id),
    })
  }

  const sortableIds = parsed.items.map((item) => item.id)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-medium text-grayScale-700">{slotLabel}</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !canAdd}
          className="h-8 gap-1.5 rounded-[6px] border-brand-200 text-brand-600 hover:bg-brand-50"
          onClick={() => updateValue(addSequenceOrderItem(parsed, maxItems))}
        >
          <Plus className="h-3.5 w-3.5" />
          Add item
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {parsed.items.map((item, index) => (
              <SortableSequenceRow
                key={item.id}
                id={item.id}
                itemId={item.id}
                text={item.text}
                index={index}
                disabled={disabled}
                canRemove={canRemove}
                onTextChange={(text) =>
                  updateValue(updateSequenceOrderItemText(parsed, index, text))
                }
                onRemove={() =>
                  updateValue(removeSequenceOrderItem(parsed, index))
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <p className="text-[11px] text-grayScale-500">
        Minimum {minItems} items (max {maxItems}). Drag to set the correct order.
        Whitespace in text is preserved.
      </p>
    </div>
  )
}
