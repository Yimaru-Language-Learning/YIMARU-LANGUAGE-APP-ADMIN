import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { notifyApiError } from "../../lib/apiErrors"
import {
  createEmailTemplate,
  parseEmailTemplateResponse,
} from "../../api/emailTemplates.api"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import type { EmailTemplateStatus } from "../../types/emailTemplate.types"
import {
  EmailTemplateCreateForm,
  EMPTY_EMAIL_TEMPLATE_CREATE_DRAFT,
  parseEmailTemplateVariables,
  slugFromTemplateName,
  type EmailTemplateCreateDraft,
} from "./components/EmailTemplateCreateForm"
import { EmailTemplatePreviewPanel } from "./components/EmailTemplatePreviewPanel"

const SLUG_PATTERN = /^[a-z][a-z0-9_]*$/

function buildCreatePayload(draft: EmailTemplateCreateDraft) {
  return {
    slug: draft.slug.trim(),
    name: draft.name.trim(),
    subject: draft.subject,
    body_text: draft.body_text,
    body_html: draft.body_html,
    variables: parseEmailTemplateVariables(draft.variablesText),
    status: draft.status.trim().toUpperCase() as EmailTemplateStatus,
  }
}

function validateDraft(draft: EmailTemplateCreateDraft): string | null {
  const slug = draft.slug.trim()
  const name = draft.name.trim()
  if (!name) return "Name is required"
  if (!slug) return "Slug is required"
  if (!SLUG_PATTERN.test(slug)) {
    return "Slug must start with a letter and use only lowercase letters, numbers, and underscores"
  }
  if (!draft.subject.trim()) return "Subject is required"
  return null
}

export function CreateEmailTemplatePage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<EmailTemplateCreateDraft>(
    EMPTY_EMAIL_TEMPLATE_CREATE_DRAFT,
  )
  const [slugTouched, setSlugTouched] = useState(false)

  const previewSource = useMemo(() => {
    const variables = parseEmailTemplateVariables(draft.variablesText)
    return {
      subject: draft.subject,
      body_text: draft.body_text,
      body_html: draft.body_html,
      variables,
      slug: draft.slug.trim() || undefined,
    }
  }, [draft])

  const handleChange = (patch: Partial<EmailTemplateCreateDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch }
      if ("slug" in patch) {
        setSlugTouched(true)
      }
      if ("name" in patch && !slugTouched && patch.name != null) {
        const autoSlug = slugFromTemplateName(patch.name)
        if (autoSlug) next.slug = autoSlug
      }
      return next
    })
  }

  const handleCreate = async () => {
    const validationError = validateDraft(draft)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setSaving(true)
    try {
      const response = await createEmailTemplate(buildCreatePayload(draft))
      const created = parseEmailTemplateResponse(response)
      if (!created) {
        throw new Error("Empty create response")
      }
      toast.success(response.data?.message ?? "Email template created successfully")
      navigate(`/notifications/email-templates/${created.slug}`)
    } catch (e: unknown) {
      console.error(e)
      notifyApiError(e, "Failed to create email template")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-12">
      <Link
        to="/notifications/email-templates"
        className="group flex w-fit items-center gap-2 text-sm font-semibold text-grayScale-600 transition-colors hover:text-brand-500"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to email templates
      </Link>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-grayScale-500">Email template</p>
        <h1 className="text-2xl font-semibold tracking-tight text-grayScale-900">
          New custom template
        </h1>
        <p className="max-w-2xl text-sm text-grayScale-500">
          Create a custom email template. System templates are managed separately.
        </p>
      </div>

      <Card className="border border-grayScale-100 shadow-none">
        <CardHeader className="border-b border-grayScale-100 pb-4">
          <CardTitle className="text-lg">Template details</CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <EmailTemplateCreateForm
            draft={draft}
            saving={saving}
            onChange={handleChange}
            onSubmit={() => void handleCreate()}
            onReset={() => {
              setDraft(EMPTY_EMAIL_TEMPLATE_CREATE_DRAFT)
              setSlugTouched(false)
            }}
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
    </div>
  )
}
