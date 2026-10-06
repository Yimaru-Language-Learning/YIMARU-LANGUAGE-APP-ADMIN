import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { Check, ChevronDown } from "lucide-react"
import {
  AUDIENCE_SUBSCRIPTION_STATUS_OPTIONS,
  toggleAudienceSubscriptionStatus,
  type AudienceSubscriptionStatus,
} from "../../lib/platformAudienceFilters"
import { cn } from "../../lib/utils"

export function SubscriptionStatusFilter({
  selected,
  onChange,
}: {
  selected: AudienceSubscriptionStatus[]
  onChange: (next: AudienceSubscriptionStatus[]) => void
}) {
  const labels = AUDIENCE_SUBSCRIPTION_STATUS_OPTIONS
    .filter((option) => selected.includes(option.code))
    .map((option) => option.label)
  const summary = labels.length ? labels.join(", ") : "Any status"

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="audience-subscription-status" className="text-xs font-medium text-grayScale-500">
        Subscription status
      </label>
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            id="audience-subscription-status"
            title={summary}
            className="flex h-9 w-full items-center justify-between gap-2 rounded-[6px] border border-grayScale-200 bg-white px-3 text-left text-sm text-grayScale-600 outline-none focus-visible:ring-1 focus-visible:ring-brand-500"
          >
            <span className="min-w-0 truncate">{summary}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-grayScale-400" aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            side="bottom"
            align="start"
            sideOffset={4}
            collisionPadding={12}
            className="z-[200] max-h-60 min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto rounded-md border border-grayScale-200 bg-white p-1 shadow-lg"
          >
            <p className="px-2 py-1 text-xs text-grayScale-500">Choose one or more statuses</p>
            <DropdownMenu.Item
              className="cursor-pointer rounded px-2 py-2 text-sm text-grayScale-700 outline-none data-[highlighted]:bg-grayScale-100"
              onSelect={(event) => {
                event.preventDefault()
                onChange([])
              }}
            >
              Any status (clear selection)
            </DropdownMenu.Item>
            {AUDIENCE_SUBSCRIPTION_STATUS_OPTIONS.map(({ code, label }) => (
              <DropdownMenu.CheckboxItem
                key={code}
                checked={selected.includes(code)}
                onCheckedChange={() => onChange(toggleAudienceSubscriptionStatus(selected, code))}
                onSelect={(event) => event.preventDefault()}
                className={cn(
                  "relative cursor-pointer rounded py-2 pl-8 pr-2 text-sm text-grayScale-700 outline-none data-[highlighted]:bg-grayScale-100",
                  selected.includes(code) && "bg-brand-50 font-medium text-brand-700",
                )}
              >
                <span className="absolute left-2 top-1/2 -translate-y-1/2">
                  <DropdownMenu.ItemIndicator>
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </DropdownMenu.ItemIndicator>
                </span>
                {label}
              </DropdownMenu.CheckboxItem>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <p className="text-[11px] text-grayScale-500">Matches any selected status.</p>
    </div>
  )
}
