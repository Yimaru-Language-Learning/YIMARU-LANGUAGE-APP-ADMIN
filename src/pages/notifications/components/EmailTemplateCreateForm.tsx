import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Textarea } from "../../../components/ui/textarea"
import type { EmailTemplateStatus } from "../../../types/emailTemplate.types"

export type EmailTemplateCreateDraft = {
  slug: string
  name: string
  subject: string
  body_text: string
  body_html: string
  variablesText: string
  status: EmailTemplateStatus
}

export const EMPTY_EMAIL_TEMPLATE_CREATE_DRAFT: EmailTemplateCreateDraft = {
  slug: "",
  name: "",
  subject: "",
  body_text: "",
  body_html: "",
  variablesText: "",
  status: "ACTIVE",
}

/** Parse variable names from comma- or newline-separated input. */
export function parseEmailTemplateVariables(text: string): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const part of text.split(/[\n,]+/)) {
    const name = part.trim()
    if (!name || seen.has(name)) continue
    seen.add(name)
    result.push(name)
  }
  return result
}

export function slugFromTemplateName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

type EmailTemplateCreateFormProps = {
  draft: EmailTemplateCreateDraft
  saving: boolean
  onChange: (patch: Partial<EmailTemplateCreateDraft>) => void
  onSubmit: () => void
  onReset: () => void
}

export function EmailTemplateCreateForm({
  draft,
  saving,
  onChange,
  onSubmit,
  onReset,
}: EmailTemplateCreateFormProps) {
  const variables = parseEmailTemplateVariables(draft.variablesText)

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-grayScale-500">
            Name
          </p>
          <Input
            value={draft.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Course Reminder"
            disabled={saving}
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-grayScale-500">
            Slug
          </p>
          <Input
            value={draft.slug}
            onChange={(e) => onChange({ slug: e.target.value })}
            placeholder="course_reminder"
            className="font-mono text-sm"
            disabled={saving}
          />
          <p className="mt-1 text-xs text-grayScale-400">
            Lowercase letters, numbers, and underscores only.
          </p>
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-grayScale-500">
          Status
        </p>
        <select
          value={draft.status}
          onChange={(e) => onChange({ status: e.target.value })}
          disabled={saving}
          className="flex h-10 w-full max-w-xs rounded-md border border-grayScale-200 bg-white px-3 py-2 text-sm text-grayScale-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-grayScale-500">
          Subject
        </p>
        <Input
          value={draft.subject}
          onChange={(e) => onChange({ subject: e.target.value })}
          placeholder="Reminder: {{.CourseName}}"
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
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-grayScale-500">
          Variables
        </p>
        <Textarea
          value={draft.variablesText}
          onChange={(e) => onChange({ variablesText: e.target.value })}
          rows={3}
          placeholder="FirstName, CourseName, Link"
          className="resize-y font-mono text-sm"
          disabled={saving}
        />
        <p className="mt-1 text-xs text-grayScale-400">
          One per line or comma-separated. Refer in templates as{" "}
          <code className="rounded bg-grayScale-100 px-1">{`{{.VarName}}`}</code>.
        </p>
        {variables.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {variables.map((v) => (
              <Badge key={v} variant="secondary">
                {`{{.${v}}}`}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-grayScale-100 pt-4">
        <Button
          className="bg-brand-500 text-white hover:bg-brand-600"
          disabled={saving}
          onClick={onSubmit}
        >
          {saving ? "Creating…" : "Create template"}
        </Button>
        <Button variant="outline" disabled={saving} onClick={onReset}>
          Reset
        </Button>
        <p className="text-xs text-grayScale-400">
          Saved with{" "}
          <code className="rounded bg-grayScale-100 px-1">POST /admin/email-templates</code>
        </p>
      </div>
    </div>
  )
}
