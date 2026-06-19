import { useMemo, useState } from "react"
import type { ComponentProps } from "react"
import { buildPracticeContentPaths, type PracticeContentPathOptions } from "../../../lib/practiceContentPaths"
import { Button } from "../../../components/ui/button"
import { PracticeActionChoiceDialog } from "./PracticeActionChoiceDialog"

interface PracticeActionButtonProps
  extends Omit<ComponentProps<typeof Button>, "onClick"> {
  pathOptions: PracticeContentPathOptions
  parentLabel?: string | null
}

export function PracticeActionButton({
  pathOptions,
  parentLabel,
  children,
  ...buttonProps
}: PracticeActionButtonProps) {
  const [open, setOpen] = useState(false)
  const paths = useMemo(
    () => buildPracticeContentPaths(pathOptions),
    [pathOptions],
  )

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} {...buttonProps}>
        {children}
      </Button>
      <PracticeActionChoiceDialog
        open={open}
        onOpenChange={setOpen}
        createHref={paths.create}
        attachHref={paths.attach}
        pathOptions={pathOptions}
        parentLabel={parentLabel}
      />
    </>
  )
}
