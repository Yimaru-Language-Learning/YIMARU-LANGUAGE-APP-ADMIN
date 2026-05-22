import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Eye, Mail, Plus, RefreshCw, Search, Shield, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  getEmailTemplates,
  parseEmailTemplatesResponse,
} from "../../api/emailTemplates.api"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { cn } from "../../lib/utils"
import {
  emailTemplateStatusBadgeVariant,
  formatEmailTemplateDate,
} from "../../lib/emailTemplatePreview"
import type { EmailTemplate } from "../../types/emailTemplate.types"
import { EmailTemplateDeleteDialog } from "./components/EmailTemplateDeleteDialog"

export function EmailTemplatesPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"All" | "ACTIVE" | "INACTIVE">("All")
  const [templatePendingDelete, setTemplatePendingDelete] = useState<EmailTemplate | null>(
    null,
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const response = await getEmailTemplates()
      const rows = parseEmailTemplatesResponse(response)
      setTemplates(rows)
      setTotalCount(Number(response.data?.data?.total_count ?? rows.length))
    } catch (e) {
      console.error(e)
      setError(true)
      setTemplates([])
      setTotalCount(0)
      toast.error("Failed to load email templates")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return templates.filter((t) => {
      const status = String(t.status ?? "").toUpperCase()
      if (statusFilter !== "All" && status !== statusFilter) {
        return false
      }
      if (!q) return true
      const variables = Array.isArray(t.variables) ? t.variables : []
      const haystack = [t.name, t.slug, t.subject, variables.join(" ")]
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [templates, query, statusFilter])

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-grayScale-500">Notifications</p>
          <h1 className="text-2xl font-semibold tracking-tight text-grayScale-800">
            Email Templates
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-grayScale-500">
            Templates from{" "}
            <code className="rounded bg-grayScale-100 px-1 text-xs">
              GET /admin/email-templates
            </code>
            . Open a template for full preview via slug API.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="shrink-0 bg-brand-500 text-white hover:bg-brand-600" asChild>
            <Link to="/notifications/email-templates/new">
              <Plus className="mr-2 h-4 w-4" />
              New template
            </Link>
          </Button>
          <Button
            variant="outline"
            className="shrink-0"
            disabled={loading}
            onClick={() => void load()}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="border border-grayScale-100 shadow-none">
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
              <Input
                className="pl-9"
                placeholder="Search by name, slug, subject, or variable…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(["All", "ACTIVE", "INACTIVE"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={cn(
                    "h-9 rounded-full px-3 text-xs font-semibold transition-colors",
                    statusFilter === tab
                      ? "bg-brand-500 text-white"
                      : "bg-grayScale-100 text-grayScale-600 hover:bg-grayScale-200",
                  )}
                >
                  {tab === "All" ? "All" : tab === "ACTIVE" ? "Active" : "Inactive"}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-grayScale-500">
            {loading
              ? "Loading…"
              : `${filtered.length} shown · ${totalCount} total from API`}
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <SpinnerIcon className="h-6 w-6" />
        </div>
      ) : error ? (
        <Card className="border border-grayScale-100 shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-destructive">Could not load email templates.</p>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border border-grayScale-100 shadow-none">
          <CardContent className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-100/50 text-brand-500">
              <Mail className="h-7 w-7" />
            </div>
            <p className="text-sm text-grayScale-500">
              {templates.length === 0
                ? "No email templates returned from the API."
                : "No templates match your search or filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((template) => (
            <Card
              key={template.id}
              className="flex flex-col overflow-hidden border border-grayScale-200 rounded-xl bg-white shadow-none transition-shadow hover:shadow-soft"
            >
              <CardContent className="flex flex-1 flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-100/40 text-brand-500">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <Badge variant={emailTemplateStatusBadgeVariant(template.status)}>
                      {template.status}
                    </Badge>
                    {template.is_system ? (
                      <Badge variant="secondary" className="gap-1 text-[10px]">
                        <Shield className="h-3 w-3" />
                        System
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <div className="min-w-0 space-y-1">
                  <h3 className="text-lg font-bold leading-snug text-grayScale-900">
                    {template.name}
                  </h3>
                  <code className="inline-block rounded bg-grayScale-100 px-1.5 py-0.5 text-xs text-grayScale-600">
                    {template.slug}
                  </code>
                </div>

                <div className="min-w-0 space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-grayScale-400">
                    Subject
                  </p>
                  <p className="line-clamp-2 text-sm text-grayScale-600">{template.subject}</p>
                </div>

                <div className="min-w-0 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-grayScale-400">
                    Variables
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(template.variables ?? []).length > 0 ? (
                      (template.variables ?? []).map((v) => (
                        <Badge key={v} variant="secondary" className="text-[10px]">
                          {`{{.${v}}}`}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-grayScale-400">None</span>
                    )}
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-grayScale-100 pt-4">
                  <span className="text-xs text-grayScale-400">
                    Updated{" "}
                    {formatEmailTemplateDate(
                      template.updated_at || template.created_at,
                    )}
                  </span>
                  <div className="flex shrink-0 gap-1.5">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/notifications/email-templates/${template.slug}`}>
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        View
                      </Link>
                    </Button>
                    {!template.is_system ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setTemplatePendingDelete(template)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EmailTemplateDeleteDialog
        template={templatePendingDelete}
        open={templatePendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setTemplatePendingDelete(null)
        }}
        onDeleted={() => {
          setTemplatePendingDelete(null)
          void load()
        }}
      />
    </div>
  )
}
