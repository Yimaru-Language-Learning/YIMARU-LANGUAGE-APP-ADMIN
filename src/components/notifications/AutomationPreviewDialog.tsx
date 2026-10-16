import { Eye } from "lucide-react"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import type { AutomationStep } from "../../types/automation.types"

export function AutomationPreviewDialog({ step, label }: { step: AutomationStep; label: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" aria-label={`Preview ${label}`}>
          <Eye className="h-4 w-4" aria-hidden="true" />
          Preview text
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-xl border-grayScale-200 shadow-lg">
        <DialogHeader className="text-left">
          <DialogTitle>Message preview</DialogTitle>
          <DialogDescription className="break-words">
            {label}. Preview only — nothing is sent.
          </DialogDescription>
        </DialogHeader>
        <div className="min-w-0 space-y-4 rounded-xl border border-grayScale-100 bg-grayScale-50 p-4">
          <div>
            <p className="text-xs font-medium text-grayScale-500">Title / email subject</p>
            <h3 className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-foreground [overflow-wrap:anywhere]">
              {step.title}
            </h3>
          </div>
          <div>
            <p className="text-xs font-medium text-grayScale-500">Message</p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-grayScale-600 [overflow-wrap:anywhere]">
              {step.message}
            </p>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-grayScale-500">
          Emails use the existing branded custom-message template and include an unsubscribe link.
          This is a text preview, not the final email layout.
        </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Close preview</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
