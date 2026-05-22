export type EmailTemplateStatus = "ACTIVE" | "INACTIVE" | string

export interface EmailTemplate {
  id: number
  slug: string
  name: string
  subject: string
  body_text: string
  body_html: string
  variables: string[]
  is_system: boolean
  status: EmailTemplateStatus
  created_at: string
  updated_at: string
}

export interface GetEmailTemplatesResponse {
  message: string
  data: {
    templates: EmailTemplate[]
    total_count: number
  }
  success: boolean
  status_code: number
  metadata: unknown | null
}

export interface GetEmailTemplateBySlugResponse {
  message: string
  data: EmailTemplate
  success: boolean
  status_code: number
  metadata: unknown | null
}

/** Body for PUT /admin/email-templates/:id */
export interface UpdateEmailTemplateRequest {
  subject: string
  body_text: string
  body_html: string
}

export interface UpdateEmailTemplateResponse {
  message: string
  data: EmailTemplate
  success: boolean
  status_code: number
  metadata: unknown | null
}

/** Body for POST /admin/email-templates */
export interface CreateEmailTemplateRequest {
  slug: string
  name: string
  subject: string
  body_text: string
  body_html: string
  variables: string[]
  status: EmailTemplateStatus
}

export interface CreateEmailTemplateResponse {
  message: string
  data: EmailTemplate
  success: boolean
  status_code: number
  metadata: unknown | null
}

export interface DeleteEmailTemplateResponse {
  message: string
  data?: unknown
  success: boolean
  status_code: number
  metadata: unknown | null
}

export type EmailTemplatePreviewSource = Pick<
  EmailTemplate,
  "subject" | "body_text" | "body_html" | "variables"
> & { slug?: string }
