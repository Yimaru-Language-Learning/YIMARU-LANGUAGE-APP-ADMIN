import { Link } from "react-router-dom"
import { useCallback, useEffect, useState } from "react"
import { Gauge, RefreshCw, Save } from "lucide-react"
import { toast } from "sonner"
import {
  getInitialAssessmentLevelThresholds,
  updateInitialAssessmentLevelThresholds,
  type InitialAssessmentLevelThreshold,
} from "../../api/initial-assessment.api"
import { notifyApiError } from "../../lib/apiErrors"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { SpinnerIcon } from "../../components/ui/spinner-icon"

const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"] as const

const DEFAULTS: InitialAssessmentLevelThreshold[] = [
  { level: "A1", min_percent: 0, display_order: 1 },
  { level: "A2", min_percent: 17, display_order: 2 },
  { level: "B1", min_percent: 34, display_order: 3 },
  { level: "B2", min_percent: 51, display_order: 4 },
  { level: "C1", min_percent: 68, display_order: 5 },
  { level: "C2", min_percent: 85, display_order: 6 },
]

function ensureAllLevels(rows: InitialAssessmentLevelThreshold[]): InitialAssessmentLevelThreshold[] {
  const byLevel = new Map(rows.map((row) => [String(row.level).toUpperCase(), row]))
  return LEVEL_ORDER.map((level, index) => {
    const existing = byLevel.get(level)
    return {
      level,
      min_percent: existing?.min_percent ?? DEFAULTS[index].min_percent,
      display_order: index + 1,
    }
  })
}

function validateRows(rows: InitialAssessmentLevelThreshold[]): string | null {
  if (rows[0]?.min_percent !== 0) return "A1 minimum score must be 0%."
  for (let i = 0; i < rows.length; i++) {
    const value = rows[i].min_percent
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      return `${rows[i].level} minimum must be between 0 and 100.`
    }
    if (i > 0 && value <= rows[i - 1].min_percent) {
      return `${rows[i].level} minimum must be greater than ${rows[i - 1].level}.`
    }
  }
  return null
}

export function InitialAssessmentThresholdsTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rows, setRows] = useState<InitialAssessmentLevelThreshold[]>(DEFAULTS)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getInitialAssessmentLevelThresholds()
      setRows(ensureAllLevels(data.length ? data : DEFAULTS))
    } catch (e) {
      console.error(e)
      notifyApiError(e, "Failed to load placement level thresholds")
      setRows(DEFAULTS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const updateMin = (level: string, value: string) => {
    const parsed = Number(value)
    setRows((prev) =>
      prev.map((row) =>
        row.level === level
          ? { ...row, min_percent: Number.isFinite(parsed) ? parsed : row.min_percent }
          : row,
      ),
    )
  }

  const handleSave = async () => {
    const next = ensureAllLevels(rows)
    const error = validateRows(next)
    if (error) {
      toast.error(error)
      return
    }
    setSaving(true)
    try {
      const saved = await updateInitialAssessmentLevelThresholds(next)
      setRows(ensureAllLevels(saved))
      toast.success("Placement level thresholds saved")
    } catch (e) {
      notifyApiError(e, "Failed to save thresholds")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <SpinnerIcon className="h-8 w-8 text-brand-500" />
      </div>
    )
  }

  return (
    <Card className="rounded-xl border border-grayScale-200/70 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-brand-500" />
            <CardTitle className="text-base font-bold text-grayScale-900">
              Initial assessment levels
            </CardTitle>
          </div>
          <p className="text-sm text-grayScale-500">
            Map placement score percentage to CEFR levels A1–C2. Learners receive the highest
            level whose minimum they meet.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={saving}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Reload
          </Button>
          <Button type="button" size="sm" onClick={() => void handleSave()} disabled={saving}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <label
              key={row.level}
              className="flex flex-col gap-1.5 rounded-xl border border-grayScale-200 bg-white p-4"
            >
              <span className="text-sm font-semibold text-grayScale-800">{row.level}</span>
              <span className="text-xs text-grayScale-400">Minimum score (%)</span>
              <Input
                type="number"
                min={0}
                max={100}
                step={1}
                value={row.min_percent}
                disabled={row.level === "A1"}
                onChange={(e) => updateMin(row.level, e.target.value)}
                className="h-9"
              />
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-grayScale-400">
          Learners get the highest level whose minimum score they meet. A1 starts at 0%. Manage the
          placement test and its questions under{" "}
          <Link to="/new-content/initial-assessment" className="font-medium text-brand-600 hover:underline">
            Content → Initial assessment
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  )
}
