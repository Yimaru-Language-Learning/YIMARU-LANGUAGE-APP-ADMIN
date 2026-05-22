import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, RefreshCw, Shield, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  getEmailTemplateBySlug,
  parseEmailTemplateResponse,
  updateEmailTemplate,
} from "../../api/emailTemplates.api"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { cn } from "../../lib/utils"
import {
  emailTemplateStatusBadgeVariant,
  formatEmailTemplateDate,
} from "../../lib/emailTemplatePreview"
import type { EmailTemplate } from "../../types/emailTemplate.types"
import {
  EmailTemplateEditForm,
  emailTemplateDraftFromTemplate,
  type EmailTemplateDraft,
} from "./components/EmailTemplateEditForm"
import { EmailTemplateDeleteDialog } from "./components/EmailTemplateDeleteDialog"
import { EmailTemplatePreviewPanel } from "./components/EmailTemplatePreviewPanel"

function applyTemplateToDraft(template: EmailTemplate): EmailTemplateDraft {
  return emailTemplateDraftFromTemplate(template)
}

export function EmailTemplateDetailPage() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [error, setError] = useState(false)
  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [draft, setDraft] = useState<EmailTemplateDraft>({
    subject: "",
    body_text: "",
    body_html: "",
  })

  const load = useCallback(async () => {
    const trimmed = slug?.trim()
    if (!trimmed) {
      setError(true)
      setTemplate(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(false)
    try {
      const response = await getEmailTemplateBySlug(trimmed)
      const row = parseEmailTemplateResponse(response)
      if (!row) {
        throw new Error("Empty template response")
      }
      setTemplate(row)
      setDraft(applyTemplateToDraft(row))
    } catch (e) {
      console.error(e)
      setError(true)
      setTemplate(null)
      toast.error("Failed to load email template")
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    void load()
  }, [load])

  const previewSource = useMemo(() => {
    if (!template) return null
    return {
      subject: draft.subject,
      body_text: draft.body_text,
      body_html: draft.body_html,
      variables: template.variables,
      slug: template.slug,
    }
  }, [template, draft])

  const handleSave = async () => {
    if (!template) return
    setSaving(true)
    try {
      const response = await updateEmailTemplate(template.id, {
        subject: draft.subject.trim(),
        body_text: draft.body_text,
        body_html: draft.body_html,
      })
      const updated = parseEmailTemplateResponse(response)
      if (!updated) {
        throw new Error("Empty update response")
      }
      setTemplate(updated)
      setDraft(applyTemplateToDraft(updated))
      toast.success("Email template updated")
    } catch (e: unknown) {
      console.error(e)
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update email template"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-12">
      <Link
        to="/notifications/email-templates"
        className="flex w-fit items-center gap-2 text-sm font-semibold text-grayScale-600 transition-colors hover:text-brand-500 group"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to email templates
      </Link>

      {loading ? (
        <div className="flex justify-center py-20">
          <SpinnerIcon className="h-6 w-6" />
        </div>
      ) : error || !template || !previewSource ? (
        <Card className="border border-grayScale-100 shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-destructive">
              Could not load template
              {slug ? (
                <>
                  {" "}
                  <code className="rounded bg-grayScale-100 px-1 text-xs">{slug}</code>
                </>
              ) : null}
              .
            </p>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-grayScale-500">Email template</p>
              <h1 className="text-2xl font-semibold tracking-tight text-grayScale-900">
                {template.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded bg-grayScale-100 px-2 py-0.5 text-sm text-grayScale-600">
                  {template.slug}
                </code>
                <Badge variant={emailTemplateStatusBadgeVariant(template.status)}>
                  {template.status}
                </Badge>
                {template.is_system ? (
                  <Badge variant="secondary" className="gap-1">
                    <Shield className="h-3 w-3" />
                    System
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs text-grayScale-500">
                ID {template.id} · Updated {formatEmailTemplateDate(template.updated_at)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={loading || saving}
                onClick={() => void load()}
              >
                <RefreshCw
                  className={cn("mr-2 h-4 w-4", (loading || saving) && "animate-spin")}
                />
                Refresh
              </Button>
              {!template.is_system ? (
                <Button
                  variant="destructive"
                  disabled={loading || saving}
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              ) : null}
            </div>
          </div>

          <Card className="border border-grayScale-100 shadow-none">
            <CardHeader className="border-b border-grayScale-100 pb-4">
              <CardTitle className="text-lg">Edit template</CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <EmailTemplateEditForm
                template={template}
                draft={draft}
                saving={saving}
                onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
                onSave={() => void handleSave()}
                onReset={() => setDraft(applyTemplateToDraft(template))}
              />
            </CardContent>
          </Card>

          <Card className="border border-grayScale-100 shadow-none">
            <CardHeader className="border-b border-grayScale-100 pb-4">
              <CardTitle className="text-lg">Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <EmailTemplatePreviewPanel source={previewSource} />
            </CardContent>
          </Card>

          <EmailTemplateDeleteDialog
            template={template}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            onDeleted={() => navigate("/notifications/email-templates")}
          />
        </>
      )}
    </div>
  )
}
