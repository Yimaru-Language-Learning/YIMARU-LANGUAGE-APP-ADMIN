import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Textarea } from "../../../components/ui/textarea"
import type { EmailTemplate } from "../../../types/emailTemplate.types"

export type EmailTemplateDraft = {
  subject: string
  body_text: string
  body_html: string
}

export function emailTemplateDraftFromTemplate(
  template: EmailTemplate,
): EmailTemplateDraft {
  return {
    subject: template.subject,
    body_text: template.body_text,
    body_html: template.body_html,
  }
}

export function draftsEqual(a: EmailTemplateDraft, b: EmailTemplateDraft) {
  return (
    a.subject === b.subject &&
    a.body_text === b.body_text &&
    a.body_html === b.body_html
  )
}

type EmailTemplateEditFormProps = {
  template: EmailTemplate
  draft: EmailTemplateDraft
  saving: boolean
  onChange: (patch: Partial<EmailTemplateDraft>) => void
  onSave: () => void
  onReset: () => void
}

export function EmailTemplateEditForm({
  template,
  draft,
  saving,
  onChange,
  onSave,
  onReset,
}: EmailTemplateEditFormProps) {
  const isDirty = !draftsEqual(draft, emailTemplateDraftFromTemplate(template))

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-grayScale-500">
          Subject
        </p>
        <Input
          value={draft.subject}
          onChange={(e) => onChange({ subject: e.target.value })}
          placeholder="Email subject line"
          className="font-mono text-sm"
          disabled={saving}
        />
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-grayScale-500">
          Plain text body
        </p>
        <Textarea
          value={draft.body_text}
          onChange={(e) => onChange({ body_text: e.target.value })}
          rows={8}
          className="min-h-[160px] resize-y font-mono text-sm"
          disabled={saving}
        />
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-grayScale-500">
          HTML body
        </p>
        <Textarea
          value={draft.body_html}
          onChange={(e) => onChange({ body_html: e.target.value })}
          rows={14}
          className="min-h-[280px] resize-y font-mono text-xs leading-relaxed"
          disabled={saving}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-grayScale-500">
          Allowed variables (read-only)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(template.variables ?? []).map((v) => (
            <Badge key={v} variant="secondary">
              {`{{.${v}}}`}
            </Badge>
          ))}
        </div>
        <p className="mt-2 text-xs text-grayScale-400">
          Use Go template syntax, e.g.{" "}
          <code className="rounded bg-grayScale-100 px-1">{`{{if .FirstName}}`}</code>.
          Saved with{" "}
          <code className="rounded bg-grayScale-100 px-1">
            PUT /admin/email-templates/{template.id}
          </code>
          .
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-grayScale-100 pt-4">
        <Button
          className="bg-brand-500 text-white hover:bg-brand-600"
          disabled={saving || !isDirty}
          onClick={onSave}
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
        <Button variant="outline" disabled={saving || !isDirty} onClick={onReset}>
          Reset
        </Button>
        {!isDirty ? (
          <span className="text-xs text-grayScale-400">No unsaved changes</span>
        ) : null}
      </div>
    </div>
  )
}
