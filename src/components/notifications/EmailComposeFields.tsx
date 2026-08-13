import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Eye, ExternalLink, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { notifyApiError } from "../../lib/apiErrors"
import {
  parseEmailTemplatePreviewResponse,
  previewEmailTemplate,
} from "../../api/emailTemplates.api"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { SpinnerIcon } from "../ui/spinner-icon"
import { Textarea } from "../ui/textarea"
import { Select } from "../ui/select"
import { cn } from "../../lib/utils"
import {
  buildEmailTemplateVariablesForSend,
  defaultOutboundEmailTemplateSlug,
  isAutomatedEmailTemplateSlug,
  isCustomMessageTemplate,
} from "../../lib/notificationEmailCompose"
import type { EmailTemplate, PreviewEmailTemplateResult } from "../../types/emailTemplate.types"

type EmailContentMode = "freeform" | "template"

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
  const [contentMode, setContentMode] = useState<EmailContentMode>(
    templateSlug ? "template" : "freeform",
  )

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.slug === templateSlug) ?? null,
    [templates, templateSlug],
  )

  const isFreeForm = contentMode === "freeform"
  const isCustomMessage = isCustomMessageTemplate(templateSlug)
  const usesTemplateVariables =
    contentMode === "template" &&
    Boolean(templateSlug) &&
    !isCustomMessage &&
    (selectedTemplate?.variables.length ?? 0) > 0

  useEffect(() => {
    setContentMode(templateSlug ? "template" : "freeform")
  }, [templateSlug])

  useEffect(() => {
    setPreview(null)
  }, [templateSlug, subject, message, htmlBody, templateVariables, contentMode])

  const switchToFreeForm = () => {
    setContentMode("freeform")
    onTemplateSlugChange("")
    onTemplateVariablesChange({})
    setPreview(null)
  }

  const switchToTemplate = () => {
    setContentMode("template")
    const slug = templateSlug || defaultOutboundEmailTemplateSlug(templates)
    onTemplateSlugChange(slug)
    onTemplateVariablesChange({})
    if (slug && !isCustomMessageTemplate(slug)) {
      onHtmlBodyChange("")
    }
    setPreview(null)
  }

  const handleTemplateChange = (slug: string) => {
    onTemplateSlugChange(slug)
    onTemplateVariablesChange({})
    if (slug && !isCustomMessageTemplate(slug)) {
      onHtmlBodyChange("")
    }
    setPreview(null)
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
      notifyApiError(err, "Failed to preview email template")
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-grayScale-400">
            Email content
          </p>
          <p className="mt-0.5 text-[11px] text-grayScale-500">
            Send free-form HTML or render a stored email template on the server.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" asChild>
          <Link to="/notifications/email-templates">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Manage templates
          </Link>
        </Button>
      </div>

      <div className="inline-flex rounded-full border border-grayScale-200 bg-grayScale-50 p-0.5 text-xs font-medium">
        <button
          type="button"
          onClick={switchToFreeForm}
          className={cn(
            "rounded-[6px] px-3 py-1.5 transition-colors",
            isFreeForm
              ? "bg-brand-500 text-white shadow-sm"
              : "text-grayScale-500 hover:text-grayScale-700",
          )}
        >
          Free-form HTML
        </button>
        <button
          type="button"
          onClick={switchToTemplate}
          disabled={templatesLoading || templates.length === 0}
          className={cn(
            "rounded-[6px] px-3 py-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            !isFreeForm
              ? "bg-brand-500 text-white shadow-sm"
              : "text-grayScale-500 hover:text-grayScale-700",
          )}
        >
          Email template
        </button>
      </div>

      {isFreeForm ? (
        <div className="space-y-3 rounded-lg border border-grayScale-100 bg-grayScale-50/40 p-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-grayScale-500">Subject</label>
            <Input
              placeholder="Email subject line"
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-grayScale-500">Message</label>
            <Textarea
              rows={4}
              placeholder="Plain-text email body"
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-grayScale-500">
              HTML body (optional)
            </label>
            <Textarea
              rows={4}
              placeholder="<p>Rich HTML content</p>"
              value={htmlBody}
              onChange={(e) => onHtmlBodyChange(e.target.value)}
            />
            <p className="mt-1 text-[10px] text-grayScale-400">
              Provide message, HTML, or both. Sent as-is without a template wrapper.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border border-grayScale-100 bg-grayScale-50/40 p-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-grayScale-500">
              Email template
            </label>
            <Select
              value={templateSlug}
              onChange={(e) => handleTemplateChange(e.target.value)}
              disabled={templatesLoading || templates.length === 0}
            >
              {templates.length === 0 ? (
                <option value="">No templates available</option>
              ) : (
                templates.map((template) => (
                  <option key={template.slug} value={template.slug}>
                    {template.name} ({template.slug})
                    {isAutomatedEmailTemplateSlug(template.slug) ? " · system" : ""}
                  </option>
                ))
              )}
            </Select>
            <p className="mt-1 text-[10px] text-grayScale-400">
              {templatesLoading
                ? "Loading templates…"
                : `${templates.length} active template${templates.length === 1 ? "" : "s"} from the template store.`}
            </p>
          </div>

          {selectedTemplate && selectedTemplate.variables.length === 0 && !isCustomMessage ? (
            <p className="rounded-md border border-grayScale-100 bg-white px-2.5 py-2 text-[11px] text-grayScale-500">
              This template has no placeholders — subject and HTML are taken from the template
              body when sent.
            </p>
          ) : null}

          {isAutomatedEmailTemplateSlug(templateSlug) ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-900">
              This template is normally used by automated flows (OTP, invites, etc.). Fill all
              variables below before sending.
            </p>
          ) : null}

          {isCustomMessage && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-grayScale-500">Subject</label>
                <Input
                  placeholder="Email subject line"
                  value={subject}
                  onChange={(e) => onSubjectChange(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-grayScale-500">Message</label>
                <Textarea
                  rows={4}
                  placeholder="Body text rendered inside the branded custom_message template"
                  value={message}
                  onChange={(e) => onMessageChange(e.target.value)}
                />
              </div>
            </>
          )}

          {usesTemplateVariables && selectedTemplate && (
            <div className="space-y-2 rounded-lg border border-grayScale-100 bg-white p-3">
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

          {!templatesLoading && templates.length === 0 ? (
            <p className="text-xs text-amber-800">
              No outbound templates found. Use free-form HTML or{" "}
              <Link to="/notifications/email-templates/new" className="font-semibold underline">
                create a template
              </Link>
              .
            </p>
          ) : null}

          {templateSlug ? (
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
              {preview ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setPreview(null)}>
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Hide preview
                </Button>
              ) : null}
            </div>
          ) : null}

          {preview ? (
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
          ) : null}
        </div>
      )}
    </div>
  )
}
