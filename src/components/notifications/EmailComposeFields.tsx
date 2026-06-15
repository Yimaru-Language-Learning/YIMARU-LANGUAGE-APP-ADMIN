import { useEffect, useMemo, useState } from "react"
import { Eye, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import {
  parseEmailTemplatePreviewResponse,
  previewEmailTemplate,
} from "../../api/emailTemplates.api"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { SpinnerIcon } from "../ui/spinner-icon"
import { Textarea } from "../ui/textarea"
import { Select } from "../ui/select"
import {
  buildEmailTemplateVariablesForSend,
  isCustomMessageTemplate,
} from "../../lib/notificationEmailCompose"
import type { EmailTemplate, PreviewEmailTemplateResult } from "../../types/emailTemplate.types"

type EmailComposeFieldsProps = {
  templates: EmailTemplate[]
  templatesLoading: boolean
  subject: string
  message: string
  htmlBody: string
  templateSlug: string
  templateVariables: Record<string, string>
  onSubjectChange: (value: string) => void
  onMessageChange: (value: string) => void
  onHtmlBodyChange: (value: string) => void
  onTemplateSlugChange: (slug: string) => void
  onTemplateVariablesChange: (variables: Record<string, string>) => void
}

export function EmailComposeFields({
  templates,
  templatesLoading,
  subject,
  message,
  htmlBody,
  templateSlug,
  templateVariables,
  onSubjectChange,
  onMessageChange,
  onHtmlBodyChange,
  onTemplateSlugChange,
  onTemplateVariablesChange,
}: EmailComposeFieldsProps) {
  const [previewLoading, setPreviewLoading] = useState(false)
  const [preview, setPreview] = useState<PreviewEmailTemplateResult | null>(null)

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.slug === templateSlug) ?? null,
    [templates, templateSlug],
  )

  const isFreeForm = !templateSlug
  const isCustomMessage = isCustomMessageTemplate(templateSlug)
  const usesTemplateVariables =
    Boolean(templateSlug) && !isCustomMessage && (selectedTemplate?.variables.length ?? 0) > 0

  useEffect(() => {
    setPreview(null)
  }, [templateSlug, subject, message, htmlBody, templateVariables])

  const handleTemplateChange = (slug: string) => {
    onTemplateSlugChange(slug)
    onTemplateVariablesChange({})
    if (slug && !isCustomMessageTemplate(slug)) {
      onHtmlBodyChange("")
    }
  }

  const handlePreview = async () => {
    if (!templateSlug) {
      toast.error("Select an email template to preview.")
      return
    }
    const variables = buildEmailTemplateVariablesForSend(
      templateSlug,
      subject,
      message,
      templateVariables,
    )
    setPreviewLoading(true)
    try {
      const response = await previewEmailTemplate(templateSlug, variables)
      const result = parseEmailTemplatePreviewResponse(response)
      if (!result) throw new Error("Empty preview response")
      setPreview(result)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to preview email template"
      toast.error(msg)
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-grayScale-500">
          Email content mode
        </label>
        <Select
          value={templateSlug}
          onChange={(e) => handleTemplateChange(e.target.value)}
          disabled={templatesLoading}
        >
          <option value="">Free-form (subject + message/HTML)</option>
          {templates.map((template) => (
            <option key={template.slug} value={template.slug}>
              {template.name} ({template.slug})
            </option>
          ))}
        </Select>
        <p className="mt-1 text-[10px] text-grayScale-400">
          {templatesLoading
            ? "Loading templates…"
            : "System templates (OTP, welcome, etc.) are excluded from outbound campaigns."}
        </p>
      </div>

      {(isFreeForm || isCustomMessage) && (
        <div>
          <label className="mb-1 block text-xs font-medium text-grayScale-500">Subject</label>
          <Input
            placeholder="Email subject line"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
          />
        </div>
      )}

      {(isFreeForm || isCustomMessage) && (
        <div>
          <label className="mb-1 block text-xs font-medium text-grayScale-500">Message</label>
          <Textarea
            rows={4}
            placeholder="Plain-text email body"
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
          />
        </div>
      )}

      {isFreeForm && (
        <div>
          <label className="mb-1 block text-xs font-medium text-grayScale-500">
            HTML body (optional)
          </label>
          <Textarea
            rows={3}
            placeholder="<p>Rich HTML content</p>"
            value={htmlBody}
            onChange={(e) => onHtmlBodyChange(e.target.value)}
          />
        </div>
      )}

      {usesTemplateVariables && selectedTemplate && (
        <div className="space-y-2 rounded-lg border border-grayScale-100 bg-grayScale-50/50 p-3">
          <p className="text-xs font-semibold text-grayScale-600">Template variables</p>
          {selectedTemplate.variables.map((variable) => (
            <div key={variable}>
              <label className="mb-1 block text-[11px] font-medium text-grayScale-500">
                {variable}
              </label>
              <Input
                value={templateVariables[variable] ?? ""}
                onChange={(e) =>
                  onTemplateVariablesChange({
                    ...templateVariables,
                    [variable]: e.target.value,
                  })
                }
                placeholder={`Value for {{.${variable}}}`}
              />
            </div>
          ))}
        </div>
      )}

      {templateSlug && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handlePreview()}
            disabled={previewLoading}
          >
            {previewLoading ? (
              <SpinnerIcon className="mr-2 h-3.5 w-3.5" alt="" />
            ) : (
              <Eye className="mr-2 h-3.5 w-3.5" />
            )}
            Preview rendered email
          </Button>
          {preview && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setPreview(null)}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Hide preview
            </Button>
          )}
        </div>
      )}

      {preview && (
        <div className="space-y-2 rounded-lg border border-grayScale-200 bg-white p-3">
          <p className="text-xs font-semibold text-grayScale-600">Server preview</p>
          <p className="rounded-md border border-grayScale-100 bg-grayScale-50 px-2 py-1.5 text-xs font-medium text-grayScale-800">
            {preview.subject || "(no subject)"}
          </p>
          {preview.html ? (
            <iframe
              title="Email preview"
              sandbox=""
              srcDoc={preview.html}
              className="h-48 w-full rounded-md border border-grayScale-200 bg-white"
            />
          ) : (
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-grayScale-100 bg-grayScale-50 p-2 text-xs text-grayScale-700">
              {preview.text || "(empty body)"}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
