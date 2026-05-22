import { useMemo, useState } from "react"
import { Badge } from "../../../components/ui/badge"
import { cn } from "../../../lib/utils"
import {
  renderEmailTemplatePreview,
} from "../../../lib/emailTemplatePreview"
import type { EmailTemplatePreviewSource } from "../../../types/emailTemplate.types"

type PreviewMode = "rendered-html" | "rendered-text" | "source-html" | "source-text"

export function EmailTemplatePreviewPanel({
  source,
}: {
  source: EmailTemplatePreviewSource
}) {
  const [mode, setMode] = useState<PreviewMode>("rendered-html")

  const variables = source.variables ?? []

  const renderedText = useMemo(
    () => renderEmailTemplatePreview(source.body_text, variables),
    [source.body_text, variables],
  )

  const renderedHtml = useMemo(
    () => renderEmailTemplatePreview(source.body_html, variables),
    [source.body_html, variables],
  )

  const renderedSubject = useMemo(
    () => renderEmailTemplatePreview(source.subject, variables),
    [source.subject, variables],
  )

  const tabs: { id: PreviewMode; label: string }[] = [
    { id: "rendered-html", label: "HTML preview" },
    { id: "rendered-text", label: "Plain text preview" },
    { id: "source-html", label: "HTML source" },
    { id: "source-text", label: "Text source" },
  ]

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-grayScale-500">
          Subject
        </p>
        <p className="rounded-lg border border-grayScale-100 bg-grayScale-50/80 px-3 py-2 text-sm text-grayScale-800">
          {renderedSubject}
        </p>
        <p className="mt-1 text-[11px] text-grayScale-400">
          Source: <code className="text-[10px]">{source.subject}</code>
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-grayScale-500">
          Template variables
        </p>
        <div className="flex flex-wrap gap-1.5">
          {variables.map((v) => (
            <Badge key={v} variant="secondary">
              {`{{.${v}}}`}
            </Badge>
          ))}
        </div>
        <p className="mt-2 text-xs text-grayScale-400">
          HTML and text previews use sample placeholder values for variables (not live
          sends).
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-grayScale-100 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              mode === tab.id
                ? "bg-brand-100 text-brand-600"
                : "text-grayScale-500 hover:bg-grayScale-100",
            )}
            onClick={() => setMode(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "rendered-html" ? (
        <iframe
          title={`HTML preview ${source.slug ?? "template"}`}
          sandbox=""
          srcDoc={renderedHtml}
          className="h-[min(480px,60vh)] w-full rounded-lg border border-grayScale-200 bg-white"
        />
      ) : null}

      {mode === "rendered-text" ? (
        <pre className="max-h-[min(480px,60vh)] overflow-auto whitespace-pre-wrap rounded-lg border border-grayScale-100 bg-grayScale-50/80 p-4 text-sm leading-relaxed text-grayScale-700">
          {renderedText}
        </pre>
      ) : null}

      {mode === "source-html" ? (
        <pre className="max-h-[min(480px,60vh)] overflow-auto whitespace-pre-wrap rounded-lg border border-grayScale-100 bg-grayScale-50/80 p-3 text-xs leading-relaxed text-grayScale-600">
          {source.body_html}
        </pre>
      ) : null}

      {mode === "source-text" ? (
        <pre className="max-h-[min(480px,60vh)] overflow-auto whitespace-pre-wrap rounded-lg border border-grayScale-100 bg-grayScale-50/80 p-3 text-sm leading-relaxed text-grayScale-700">
          {source.body_text}
        </pre>
      ) : null}
    </div>
  )
}
