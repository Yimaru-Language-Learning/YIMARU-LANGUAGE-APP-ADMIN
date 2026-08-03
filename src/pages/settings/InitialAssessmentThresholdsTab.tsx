import { Link } from "react-router-dom"
import { useCallback, useEffect, useMemo, useState } from "react"
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
  { level: "A1", min_percent: 70, display_order: 1 },
  { level: "A2", min_percent: 70, display_order: 2 },
  { level: "B1", min_percent: 70, display_order: 3 },
  { level: "B2", min_percent: 70, display_order: 4 },
  { level: "C1", min_percent: 70, display_order: 5 },
  { level: "C2", min_percent: 70, display_order: 6 },
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
  for (let i = 0; i < rows.length; i++) {
    const value = rows[i].min_percent
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      return `${rows[i].level} pass score must be between 0 and 100.`
    }
  }
  return null
}

function thresholdsEqual(
  a: InitialAssessmentLevelThreshold[],
  b: InitialAssessmentLevelThreshold[],
): boolean {
  if (a.length !== b.length) return false
  return a.every(
    (row, i) =>
      String(row.level).toUpperCase() === String(b[i]?.level).toUpperCase() &&
      Number(row.min_percent) === Number(b[i]?.min_percent) &&
      Number(row.display_order) === Number(b[i]?.display_order),
  )
}

export function InitialAssessmentThresholdsTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rows, setRows] = useState<InitialAssessmentLevelThreshold[]>(DEFAULTS)
  const [savedRows, setSavedRows] = useState<InitialAssessmentLevelThreshold[]>(DEFAULTS)

  const dirty = useMemo(() => !thresholdsEqual(rows, savedRows), [rows, savedRows])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getInitialAssessmentLevelThresholds()
      const next = ensureAllLevels(data.length ? data : DEFAULTS)
      setRows(next)
      setSavedRows(next)
    } catch (e) {
      console.error(e)
      notifyApiError(e, "Failed to load placement level thresholds")
      setRows(DEFAULTS)
      setSavedRows(DEFAULTS)
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
      const normalized = ensureAllLevels(saved)
      setRows(normalized)
      setSavedRows(normalized)
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
            Pass score (%) required to clear each CEFR level&apos;s question set and continue to the
            next level. Failing a level finalizes the learner at the highest level they already
            passed (A1 if none).
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={saving}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Reload
          </Button>
          <Button type="button" size="sm" onClick={() => void handleSave()} disabled={saving || !dirty}>
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
              <span className="text-xs text-grayScale-400">Pass score (%)</span>
              <Input
                type="number"
                min={0}
                max={100}
                step={1}
                value={row.min_percent}
                onChange={(e) => updateMin(row.level, e.target.value)}
                className="h-9"
              />
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-grayScale-400">
          Learners start at A1 and advance only when they meet that level&apos;s pass score. Configure
          one question set per level under{" "}
          <Link to="/new-content/initial-assessment" className="font-medium text-brand-600 hover:underline">
            Content → Initial assessment
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  )
}
