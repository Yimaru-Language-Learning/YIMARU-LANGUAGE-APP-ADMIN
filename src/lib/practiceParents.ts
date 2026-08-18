import type { PracticeParent, PracticeParentKind } from "../types/course.types"

const PARENT_KINDS: PracticeParentKind[] = [
  "COURSE",
  "MODULE",
  "LESSON",
  "CATALOG_COURSE",
  "UNIT",
]

export function isPracticeParentKind(value: string): value is PracticeParentKind {
  return PARENT_KINDS.includes(value.toUpperCase() as PracticeParentKind)
}

export function normalizePracticeParent(row: unknown): PracticeParent | null {
  if (!row || typeof row !== "object") return null
  const o = row as Record<string, unknown>
  const kind = String(o.parent_kind ?? o.ParentKind ?? o.parentKind ?? "")
    .trim()
    .toUpperCase()
  const parent_id = Number(o.parent_id ?? o.ParentId ?? o.parentId ?? o.id ?? o.ID)
  if (!isPracticeParentKind(kind)) return null
  if (!Number.isFinite(parent_id) || parent_id <= 0) return null
  return { parent_kind: kind, parent_id }
}

export function normalizePracticeParents(raw: unknown): PracticeParent[] {
  if (!raw || typeof raw !== "object") return []
  const o = raw as Record<string, unknown>
  const parentsRaw = o.parents ?? o.Parents
  if (Array.isArray(parentsRaw)) {
    return dedupeParents(
      parentsRaw
        .map((entry) => normalizePracticeParent(entry))
        .filter((entry): entry is PracticeParent => entry != null),
    )
  }
  const single = normalizePracticeParent(raw)
  return single ? [single] : []
}

/** Rollout helper: `parents[]` or legacy `parent_kind` + `parent_id`. */
export function parentsFromPractice(practice: {
  parents?: PracticeParent[] | null
  parent_kind?: string
  parent_id?: number
}): PracticeParent[] {
  if (Array.isArray(practice.parents) && practice.parents.length > 0) {
    return dedupeParents(practice.parents)
  }
  const kind = practice.parent_kind?.trim().toUpperCase() ?? ""
  const parent_id = practice.parent_id
  if (isPracticeParentKind(kind) && parent_id != null && parent_id > 0) {
    return [{ parent_kind: kind, parent_id }]
  }
  return []
}

export function dedupeParents(parents: PracticeParent[]): PracticeParent[] {
  const seen = new Set<string>()
  return parents.filter((p) => {
    if (!isPracticeParentKind(p.parent_kind) || p.parent_id <= 0) return false
    const key = `${p.parent_kind}:${p.parent_id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function validatePracticeParents(
  parents: PracticeParent[],
  options?: { required?: boolean },
): string | null {
  const required = options?.required !== false
  const normalized = dedupeParents(parents)
  if (normalized.length === 0) {
    return required ? "Select at least one course, module, or lesson." : null
  }
  for (let i = 0; i < parents.length; i++) {
    const row = parents[i]
    if (!isPracticeParentKind(row.parent_kind)) {
      return `Location ${i + 1}: choose a valid parent type.`
    }
    if (!Number.isFinite(row.parent_id) || row.parent_id <= 0) {
      return `Location ${i + 1}: enter a valid parent id.`
    }
  }
  const validRows = parents.filter(
    (p) => isPracticeParentKind(p.parent_kind) && p.parent_id > 0,
  )
  if (dedupeParents(validRows).length !== validRows.length) {
    return "The same location is listed twice."
  }
  return null
}

export function formatPracticeParentLabel(parent: PracticeParent): string {
  switch (parent.parent_kind) {
    case "CATALOG_COURSE":
      return `Catalog course #${parent.parent_id}`
    case "UNIT":
      return `Unit #${parent.parent_id}`
    case "COURSE":
      return `Course #${parent.parent_id}`
    case "MODULE":
      return `Module #${parent.parent_id}`
    case "LESSON":
      return `Lesson #${parent.parent_id}`
    default:
      return `${parent.parent_kind} #${parent.parent_id}`
  }
}

export function formatPracticeParentsSummary(
  parents: PracticeParent[],
  options?: { isExamPrep?: boolean },
): string {
  const list = dedupeParents(parents)
  if (list.length === 0) {
    return options?.isExamPrep
      ? "Not attached to any catalog course, unit, or lesson"
      : "Not attached to any course, module, or lesson"
  }
  return list.map(formatPracticeParentLabel).join(" · ")
}

export function isPracticeUnlinked(practice: {
  parents?: PracticeParent[] | null
  parent_kind?: string
  parent_id?: number
}): boolean {
  return parentsFromPractice(practice).length === 0
}

/** API create payload: null when no locations selected. */
export function buildCreatePracticeParentsPayload(
  parents: PracticeParent[],
): PracticeParent[] | null {
  const normalized = dedupeParents(parents)
  return normalized.length > 0 ? normalized : null
}

export function practiceParentsEqual(a: PracticeParent[], b: PracticeParent[]): boolean {
  const left = dedupeParents(a)
  const right = dedupeParents(b)
  if (left.length !== right.length) return false
  const rightKeys = new Set(right.map((p) => `${p.parent_kind}:${p.parent_id}`))
  return left.every((p) => rightKeys.has(`${p.parent_kind}:${p.parent_id}`))
}

export function primaryPracticeParent(parents: PracticeParent[]): PracticeParent | null {
  const list = dedupeParents(parents)
  return list[0] ?? null
}

export function newParentRow(kind: PracticeParentKind = "LESSON"): PracticeParent {
  return { parent_kind: kind, parent_id: 0 }
}

export const learnEnglishPracticeLimitHint =
  "This location already has a practice. Remove or unlink it before adding another."
