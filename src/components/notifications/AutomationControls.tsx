import { BookOpen, Clock3, CreditCard } from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { ToggleSwitch } from "../ui/toggle-switch"
import { AutomationPreviewDialog } from "./AutomationPreviewDialog"
import { automationLabel } from "../../lib/automationRules"
import type { AutomationChannel, AutomationConfig, AutomationRule } from "../../types/automation.types"

export interface AutomationControlsProps {
  config: AutomationConfig
  canEdit: boolean
  canSend: (channel: AutomationChannel) => boolean
  saving: boolean
  dirty: boolean
  onChange: (index: number, update: (rule: AutomationRule) => AutomationRule) => void
  onSave: () => void
}

// No side effects: permissions and every emitted edit are testable separately
// from authentication/loading. The backend remains the permission authority.
export function AutomationControls({ config, canEdit, canSend, saving, dirty, onChange, onSave }: AutomationControlsProps) {
  return (
    <>
      {config.rules.map((rule, index) => {
        const label = automationLabel(rule.kind)
        const newCourse = rule.kind === "new_course"
        const Icon = rule.kind === "payment_recovery" ? CreditCard : newCourse ? BookOpen : Clock3

        return (
          <Card key={rule.kind} className="rounded-xl border-grayScale-200 shadow-none">
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-4 space-y-0 border-b border-grayScale-100 p-5">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-100/40 text-brand-500">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 space-y-1">
                  <CardTitle id={`automation-${rule.kind}`} className="leading-snug">{label}</CardTitle>
                  <CardDescription className="text-grayScale-500">
                    {rule.kind === "payment_recovery"
                      ? "Follow up after a confirmed subscription payment failure or expiry."
                      : newCourse
                        ? "Announce a new Learn English or exam-prep course once, on its first publication. Courses present at the one-time historical baseline, including drafts, are excluded. Edits and republishing do not send announcements."
                        : "Re-engage learners after their last recorded app activity."}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-grayScale-500">
                <span>{rule.enabled ? "Enabled" : "Disabled"}</span>
                <ToggleSwitch
                  checked={rule.enabled}
                  disabled={!canEdit || saving}
                  aria-label={`${label} enabled`}
                  onCheckedChange={() => onChange(index, (r) => ({ ...r, enabled: !r.enabled }))}
                />
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <fieldset disabled={!canEdit || saving} aria-labelledby={`automation-${rule.kind}`} className="min-w-0 space-y-5">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Delivery channels</p>
                  <div className="flex flex-wrap gap-3">
                    {(["push", "email"] as AutomationChannel[]).map((channel) => (
                      <label key={channel} className="flex items-center gap-2 rounded-lg border border-grayScale-200 px-3 py-2 text-sm text-grayScale-600">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
                          checked={rule.channels.includes(channel)}
                          disabled={!canSend(channel)}
                          onChange={(e) => onChange(index, (r) => ({
                            ...r,
                            channels: e.target.checked ? [...r.channels, channel] : r.channels.filter((ch) => ch !== channel),
                          }))}
                        />
                        {channel === "push" ? "Push" : "Email"}
                      </label>
                    ))}
                  </div>
                </div>
                {rule.steps.map((step, stepIndex) => (
                  <div key={stepIndex} className="space-y-4 rounded-xl border border-grayScale-100 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-foreground">{newCourse ? "Announcement" : `Step ${stepIndex + 1}`}</h3>
                      <AutomationPreviewDialog step={step} label={newCourse ? label : `${label} — step ${stepIndex + 1}`} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="min-w-0 space-y-1.5 text-sm font-medium text-grayScale-600">
                        Delay (minutes)
                        <Input
                          type="number" min={newCourse ? 0 : 1} max={43200} value={step.delay_minutes}
                          onChange={(e) => onChange(index, (r) => ({ ...r, steps: r.steps.map((s, i) => i === stepIndex ? { ...s, delay_minutes: Number(e.target.value) } : s) }))}
                        />
                        <span className="block text-xs font-normal text-grayScale-500">{newCourse && step.delay_minutes === 0 ? "On the next scheduler sweep after publication" : `${(step.delay_minutes / 1440).toFixed(2)} days after ${newCourse ? "first publication" : "the event"}`}</span>
                      </label>
                      <label className="min-w-0 space-y-1.5 text-sm font-medium text-grayScale-600">
                        Title / email subject
                        <Input
                          value={step.title}
                          onChange={(e) => onChange(index, (r) => ({ ...r, steps: r.steps.map((s, i) => i === stepIndex ? { ...s, title: e.target.value } : s) }))}
                        />
                      </label>
                      <label className="min-w-0 space-y-1.5 text-sm font-medium text-grayScale-600 sm:col-span-2">
                        Message
                        <Textarea
                          rows={3} value={step.message}
                          onChange={(e) => onChange(index, (r) => ({ ...r, steps: r.steps.map((s, i) => i === stepIndex ? { ...s, message: e.target.value } : s) }))}
                        />
                        {newCourse && <span className="block text-xs font-normal text-grayScale-500">Use {"{{course_name}}"} in the title or message. Sent to active learners who allow automated reminders; course access is unchanged. Preview shows the placeholder, which is replaced when scheduled.</span>}
                      </label>
                    </div>
                  </div>
                ))}
              </fieldset>
            </CardContent>
          </Card>
        )
      })}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-grayScale-200 bg-card p-4">
        <p role="status" className="text-sm text-grayScale-500">
          {!canEdit ? "You have read-only access to these settings." : dirty ? "You have unsaved changes." : "No unsaved changes."}
        </p>
        <Button type="button" variant="brand" disabled={!canEdit || saving || !dirty} onClick={onSave}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </>
  )
}
