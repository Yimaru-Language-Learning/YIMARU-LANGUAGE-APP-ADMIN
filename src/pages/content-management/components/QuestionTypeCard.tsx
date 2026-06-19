import { Edit2, GraduationCap, Plus, Sparkles, Trash2, Layers, Shield } from "lucide-react"
import { Badge } from "../../../components/ui/badge"
import { Card } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { cn } from "../../../lib/utils"

export interface QuestionTypeDefinitionCardModel {
  id: number
  definitionKey: string
  display_name: string
  status?: string
  is_system?: boolean
  stimulusKindsCount: number
  responseKindsCount: number
  onEdit?: () => void
  onDelete?: () => void
  onViewPractices?: () => void
  onCreatePractice?: () => void
  deleteDisabled?: boolean
}

export function QuestionTypeCard({
  id,
  definitionKey,
  display_name,
  status,
  is_system,
  stimulusKindsCount,
  responseKindsCount,
  onEdit,
  onDelete,
  onViewPractices,
  onCreatePractice,
  deleteDisabled,
}: QuestionTypeDefinitionCardModel) {
  const statusLabel = (status || "—").toString()
  const isActive = statusLabel.toUpperCase() === "ACTIVE"

  return (
    <Card className="group overflow-hidden border-grayScale-200 rounded-[12px] bg-white transition-all duration-300">
      <div className="px-4 py-6 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[18px] font-bold text-grayScale-900 leading-[1.2]">{display_name}</h3>
          {is_system ? (
            <Badge className="shrink-0 border-none bg-violet-100 text-violet-800 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              System
            </Badge>
          ) : (
            <Badge className="shrink-0 border-none bg-amber-50 text-amber-800 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Custom
            </Badge>
          )}
        </div>

        <p className="text-[12px] font-mono text-grayScale-500 break-all">#{id} · {definitionKey}</p>

        <div className="flex flex-wrap items-center gap-2 text-grayScale-700 font-medium text-[14px]">
          <Layers className="h-4 w-4 text-[#9E2891]" />
          <span>
            {stimulusKindsCount} stimulus kinds · {responseKindsCount} response kinds
          </span>
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-grayScale-200 gap-2">
          <Badge
            className={cn(
              "px-3 py-1 rounded-[4px] text-[12px] font-bold shadow-none border-none",
              isActive ? "bg-[#F0FDF4] text-[#16A34A]" : "bg-grayScale-50 text-grayScale-600",
            )}
          >
            {statusLabel}
          </Badge>
          <div className="flex items-center gap-1">
            {onCreatePractice ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={onCreatePractice}
                aria-label="Create practice"
                title="Create practice"
              >
                <Plus className="h-4 w-4 text-brand-600" />
              </Button>
            ) : null}
            {onViewPractices ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={onViewPractices}
                aria-label="View practices"
                title="View practices"
              >
                <GraduationCap className="h-4 w-4 text-grayScale-500" />
              </Button>
            ) : null}
            {onEdit ? (
              <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={onEdit} aria-label="Edit">
                <Edit2 className="h-4 w-4 text-grayScale-500" />
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                disabled={deleteDisabled}
                onClick={onDelete}
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4 text-grayScale-500 disabled:opacity-30" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  )
}
