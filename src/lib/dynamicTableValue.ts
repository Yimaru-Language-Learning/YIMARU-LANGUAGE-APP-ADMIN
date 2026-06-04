export type DynamicTableValue = {
  columns: string[]
  rows: string[][]
}

const DEFAULT_TABLE: DynamicTableValue = {
  columns: ["Column 1", "Column 2"],
  rows: [["", ""]],
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v)
}

function normalizeRows(columns: string[], rows: unknown): string[][] {
  const colCount = Math.max(1, columns.length)
  if (!Array.isArray(rows)) return [Array(colCount).fill("")]
  return rows.map((row) => {
    if (!Array.isArray(row)) return Array(colCount).fill("")
    const cells = row.map((c) => String(c ?? ""))
    while (cells.length < colCount) cells.push("")
    return cells.slice(0, colCount)
  })
}

export function parseTableSlotValue(raw: string | undefined): DynamicTableValue {
  const t = (raw ?? "").trim()
  if (!t) return { ...DEFAULT_TABLE, columns: [...DEFAULT_TABLE.columns], rows: DEFAULT_TABLE.rows.map((r) => [...r]) }

  try {
    const parsed = JSON.parse(t) as unknown
    if (isRecord(parsed) && Array.isArray(parsed.columns)) {
      const columns = parsed.columns.map((c) => String(c ?? "").trim() || "Column")
      if (columns.length === 0) columns.push("Column 1")
      const rows = normalizeRows(columns, parsed.rows)
      return { columns, rows: rows.length > 0 ? rows : [Array(columns.length).fill("")] }
    }
  } catch {
    /* fall through */
  }

  return { ...DEFAULT_TABLE, columns: [...DEFAULT_TABLE.columns], rows: DEFAULT_TABLE.rows.map((r) => [...r]) }
}

export function serializeTableSlotValue(table: DynamicTableValue): string {
  const columns = table.columns.map((c) => c.trim() || "Column")
  const rows = normalizeRows(columns, table.rows).map((row) =>
    row.map((cell) => cell.trim()),
  )
  return JSON.stringify({ columns, rows })
}

export function createEmptyTable(columnCount = 2, rowCount = 1): DynamicTableValue {
  const columns = Array.from({ length: Math.max(1, columnCount) }, (_, i) => `Column ${i + 1}`)
  const rows = Array.from({ length: Math.max(1, rowCount) }, () => Array(columns.length).fill(""))
  return { columns, rows }
}
