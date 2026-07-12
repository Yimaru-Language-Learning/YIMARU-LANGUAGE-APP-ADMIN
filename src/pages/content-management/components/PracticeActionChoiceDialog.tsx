import { Link2, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "../../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import {
  resolvePracticeParentFromPathOptions,
  type PracticeContentPathOptions,
} from "../../../lib/practiceContentPaths"

interface PracticeActionChoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  createHref: string
  attachHref: string
  pathOptions: PracticeContentPathOptions
  parentLabel?: string | null
}

export function PracticeActionChoiceDialog({
  open,
  onOpenChange,
  createHref,
  attachHref,
  pathOptions,
  parentLabel,
}: PracticeActionChoiceDialogProps) {
  const navigate = useNavigate()

  const openAttachPage = () => {
    if (!resolvePracticeParentFromPathOptions(pathOptions)) {
      toast.error("Missing content context", {
        description:
          "Open attach practice from a course, module, or lesson so the API knows where to link the practice.",
      })
      return
    }
    onOpenChange(false)
    navigate(attachHref)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl border-grayScale-200 p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-grayScale-100 px-4 py-4 pr-14 sm:px-6 text-left">
          <DialogTitle className="text-lg font-bold text-grayScale-900">
            Add practice
          </DialogTitle>
          <DialogDescription className="text-left text-sm text-grayScale-600">
            {parentLabel ? (
              <>
                Choose how to add a practice for{" "}
                <span className="font-semibold text-grayScale-800">{parentLabel}</span>.
              </>
            ) : (
              "Create a new practice or link an existing one from your library."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 px-6 py-5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              onOpenChange(false)
              navigate(createHref)
            }}
            className="group flex flex-col gap-3 rounded-xl border border-grayScale-200 bg-white p-5 text-left transition-all hover:border-brand-300 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Plus className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-grayScale-900">Create new practice</p>
              <p className="text-xs leading-relaxed text-grayScale-500">
                Start the 4-step wizard with story details, persona, and questions.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={openAttachPage}
            className="group flex flex-col gap-3 rounded-xl border border-grayScale-200 bg-white p-5 text-left transition-all hover:border-brand-300 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
              <Link2 className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-grayScale-900">Attach existing practice</p>
              <p className="text-xs leading-relaxed text-grayScale-500">
                Pick a practice from the library and link it to this content.
              </p>
            </div>
          </button>
        </div>

        <div className="border-t border-grayScale-100 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-[8px]"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
