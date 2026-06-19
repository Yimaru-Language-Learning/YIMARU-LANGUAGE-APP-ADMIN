export interface QuestionAssociationRow {
  id: string
  serverQuestionId?: number | null
  displayOrder?: number
  associatedQuestionId?: number | null
  associatedAnchorRowId?: string | null
  prerequisiteQuestionIds?: number[]
  text?: string
}

export function isQuestionSectionAnchor(row: QuestionAssociationRow): boolean {
  return row.associatedQuestionId == null && !row.associatedAnchorRowId
}

export function findAnchorRowForQuestion(
  row: QuestionAssociationRow,
  allQuestions: QuestionAssociationRow[],
): QuestionAssociationRow | undefined {
  if (isQuestionSectionAnchor(row)) return undefined
  if (row.associatedQuestionId != null) {
    return allQuestions.find((q) => q.serverQuestionId === row.associatedQuestionId)
  }
  if (row.associatedAnchorRowId) {
    return allQuestions.find((q) => q.id === row.associatedAnchorRowId)
  }
  return undefined
}

export function resolveAssociatedQuestionId(
  row: QuestionAssociationRow,
  allQuestions: QuestionAssociationRow[],
  rowIdToServerId?: Map<string, number>,
): number | null {
  if (isQuestionSectionAnchor(row)) return null
  if (row.associatedQuestionId != null && row.associatedQuestionId > 0) {
    return row.associatedQuestionId
  }
  const anchorRow = findAnchorRowForQuestion(row, allQuestions)
  if (!anchorRow) return null
  if (anchorRow.serverQuestionId != null && anchorRow.serverQuestionId > 0) {
    return anchorRow.serverQuestionId
  }
  if (rowIdToServerId?.has(anchorRow.id)) {
    return rowIdToServerId.get(anchorRow.id) ?? null
  }
  return null
}

export function validateQuestionAssociations(
  questions: QuestionAssociationRow[],
): string | null {
  for (const q of questions) {
    if (isQuestionSectionAnchor(q)) continue

    const selfId = q.serverQuestionId
    const assocId = resolveAssociatedQuestionId(q, questions)
    const anchor = findAnchorRowForQuestion(q, questions)

    if (!anchor) {
      return `Question ${q.displayOrder ?? "?"}: select a section anchor or mark it as starting a new section.`
    }

    if (selfId != null && assocId === selfId) {
      return "A question cannot be associated with itself."
    }

    if (!isQuestionSectionAnchor(anchor)) {
      return `Question ${q.displayOrder ?? "?"}: associated question must be a section anchor.`
    }

    const anchorOrder = anchor.displayOrder ?? 0
    const questionOrder = q.displayOrder ?? 0
    if (anchorOrder >= questionOrder) {
      return `Question ${q.displayOrder ?? "?"}: section anchor must appear before this question.`
    }

    if (
      assocId == null &&
      anchor.serverQuestionId == null &&
      !q.associatedAnchorRowId
    ) {
      return `Question ${q.displayOrder ?? "?"}: select a section anchor or mark it as starting a new section.`
    }
  }
  return null
}

export function getSectionAnchorOptions(
  questions: QuestionAssociationRow[],
  currentRowId: string,
): { value: number | string; label: string; serverId: number | null }[] {
  return questions
    .filter((q) => q.id !== currentRowId && isQuestionSectionAnchor(q))
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map((q) => ({
      value: q.serverQuestionId ?? q.id,
      label: `Q${q.displayOrder ?? "?"} — ${summarizeQuestionLabel(q)}`,
      serverId: q.serverQuestionId ?? null,
    }))
}

export function summarizeQuestionLabel(row: QuestionAssociationRow): string {
  const text = String(row.text ?? "").trim()
  if (text) return text.length > 48 ? `${text.slice(0, 48)}…` : text
  if (row.serverQuestionId) return `Question #${row.serverQuestionId}`
  return "New question"
}

export function sectionBadgeLabel(
  row: QuestionAssociationRow,
  allQuestions: QuestionAssociationRow[],
): string {
  if (isQuestionSectionAnchor(row)) return "Section anchor"
  const anchor = findAnchorRowForQuestion(row, allQuestions)
  if (!anchor) return "No section"
  const sectionIndex =
    allQuestions
      .filter((q) => isQuestionSectionAnchor(q))
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .findIndex((q) => q.id === anchor.id) + 1
  return sectionIndex > 0 ? `Section ${sectionIndex}` : "Linked section"
}

export function fixAssociationsAfterReorder<T extends QuestionAssociationRow>(
  questions: T[],
): T[] {
  return questions.map((q) => {
    if (isQuestionSectionAnchor(q)) return q
    const anchor = findAnchorRowForQuestion(q, questions)
    if (!anchor) {
      return { ...q, associatedQuestionId: null, associatedAnchorRowId: null }
    }
    if ((anchor.displayOrder ?? 0) >= (q.displayOrder ?? 0)) {
      return { ...q, associatedQuestionId: null, associatedAnchorRowId: null }
    }
    return q
  })
}

export function setQuestionAsSectionAnchor<T extends QuestionAssociationRow>(
  row: T,
): T {
  return { ...row, associatedQuestionId: null, associatedAnchorRowId: null }
}

export function setQuestionSectionAnchorRef<T extends QuestionAssociationRow>(
  row: T,
  anchor: QuestionAssociationRow,
): T {
  if (anchor.serverQuestionId != null && anchor.serverQuestionId > 0) {
    return {
      ...row,
      associatedQuestionId: anchor.serverQuestionId,
      associatedAnchorRowId: null,
    }
  }
  return {
    ...row,
    associatedQuestionId: null,
    associatedAnchorRowId: anchor.id,
  }
}

export function findLastSectionAnchor<T extends QuestionAssociationRow>(
  questions: T[],
): T | undefined {
  const anchors = questions.filter((q) => isQuestionSectionAnchor(q))
  if (anchors.length === 0) return undefined
  return [...anchors].sort((a, b) => (b.displayOrder ?? 0) - (a.displayOrder ?? 0))[0]
}
