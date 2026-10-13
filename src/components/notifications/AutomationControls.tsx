import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { automationLabel } from "../../lib/automationRules"
import type { AutomationChannel, AutomationConfig, AutomationRule, AutomationStep } from "../../types/automation.types"

export interface AutomationControlsProps {
  config: AutomationConfig
  canEdit: boolean
  canSend: (channel: AutomationChannel) => boolean
  saving: boolean
  dirty: boolean
  onChange: (index: number, update: (rule: AutomationRule) => AutomationRule) => void
  onPreview: (step: AutomationStep) => void
  onSave: () => void
}

// No side effects: permissions and every emitted edit are testable separately
// from authentication/loading. The backend remains the permission authority.
export function AutomationControls({ config, canEdit, canSend, saving, dirty, onChange, onPreview, onSave }: AutomationControlsProps) {
  return <>
    {config.rules.map((rule, index) => <Card key={rule.kind}><CardHeader><CardTitle>{automationLabel(rule.kind)}</CardTitle></CardHeader><CardContent>
      <fieldset disabled={!canEdit || saving} className="space-y-4">
        <label className="flex items-center gap-2"><input type="checkbox" checked={rule.enabled} onChange={(e) => onChange(index, (r) => ({ ...r, enabled: e.target.checked }))} />Enabled</label>
        <div className="flex gap-4">{(["push", "email"] as AutomationChannel[]).map((channel) => <label key={channel} className="flex items-center gap-2"><input type="checkbox" checked={rule.channels.includes(channel)} disabled={!canSend(channel)} onChange={(e) => onChange(index, (r) => ({ ...r, channels: e.target.checked ? [...r.channels, channel] : r.channels.filter((ch) => ch !== channel) }))} />{channel === "push" ? "Push" : "Email"}</label>)}</div>
        {rule.steps.map((step, stepIndex) => <div key={stepIndex} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm">Step {stepIndex + 1} delay (minutes)<Input type="number" min={1} max={43200} value={step.delay_minutes} onChange={(e) => onChange(index, (r) => ({ ...r, steps: r.steps.map((s, i) => i === stepIndex ? { ...s, delay_minutes: Number(e.target.value) } : s) }))} /><span className="text-xs text-grayScale-500">{(step.delay_minutes / 1440).toFixed(2)} days after the event</span></label>
          <label className="space-y-1 text-sm">Title / email subject<Input value={step.title} onChange={(e) => onChange(index, (r) => ({ ...r, steps: r.steps.map((s, i) => i === stepIndex ? { ...s, title: e.target.value } : s) }))} /></label>
          <label className="space-y-1 text-sm sm:col-span-2">Message<Textarea rows={3} value={step.message} onChange={(e) => onChange(index, (r) => ({ ...r, steps: r.steps.map((s, i) => i === stepIndex ? { ...s, message: e.target.value } : s) }))} /></label>
          <Button type="button" variant="outline" onClick={() => onPreview(step)}>Preview text</Button>
        </div>)}
      </fieldset>
    </CardContent></Card>)}
    <Button disabled={!canEdit || saving || !dirty} onClick={onSave}>{saving ? "Saving…" : "Save settings"}</Button>
  </>
}
