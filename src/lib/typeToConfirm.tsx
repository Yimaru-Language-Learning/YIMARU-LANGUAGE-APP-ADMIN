import { useEffect, useState, type ReactNode } from "react"
import { Button } from "../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { SpinnerIcon } from "../components/ui/spinner-icon"
import { cn } from "./utils"

type TypeToConfirmFieldProps = {
  labelWord: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

/** Requires the admin to type an exact confirmation word (case-insensitive). */
export function TypeToConfirmField({
  labelWord,
  value,
  onChange,
  disabled,
  className,
}: TypeToConfirmFieldProps) {
  const expected = labelWord.trim().toUpperCase()

  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-sm text-grayScale-600">
        Type <span className="font-bold text-grayScale-900">{expected}</span> to confirm
      </label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={expected}
        autoComplete="off"
        spellCheck={false}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onPaste={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
        className="rounded-[6px] font-mono uppercase tracking-wide"
        aria-label={`Type ${expected} to confirm`}
      />
    </div>
  )
}

export function matchesConfirmWord(value: string, expectedWord: string): boolean {
  return value.trim().toUpperCase() === expectedWord.trim().toUpperCase()
}

type TypeToConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  confirmWord: string
  confirmLabel?: string
  cancelLabel?: string
  confirming?: boolean
  variant?: "default" | "destructive"
  onConfirm: () => void | Promise<void>
}

/** Separate “Are you sure?” modal that requires typing a confirmation word. */
export function TypeToConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmWord,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirming = false,
  variant = "default",
  onConfirm,
}: TypeToConfirmDialogProps) {
  const [confirmText, setConfirmText] = useState("")
  const confirmMatched = matchesConfirmWord(confirmText, confirmWord)

  useEffect(() => {
    if (!open) return
    setConfirmText("")
  }, [open, confirmWord])

  const handleConfirm = async () => {
    if (!confirmMatched || confirming) return
    await onConfirm()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !confirming && onOpenChange(next)}>
      <DialogContent className="max-w-md rounded-[12px] border border-grayScale-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-grayScale-900">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-left text-grayScale-600">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <TypeToConfirmField
          labelWord={confirmWord}
          value={confirmText}
          onChange={setConfirmText}
          disabled={confirming}
        />

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-[6px]"
            disabled={confirming}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            className={cn(
              "rounded-[6px]",
              variant === "default" &&
                "bg-brand-500 font-semibold text-white hover:bg-brand-600",
            )}
            disabled={confirming || !confirmMatched}
            onClick={() => void handleConfirm()}
          >
            {confirming ? <SpinnerIcon className="h-4 w-4" /> : null}
            {confirming ? "Working…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
