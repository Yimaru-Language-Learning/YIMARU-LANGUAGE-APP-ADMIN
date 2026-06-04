import { useMemo } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { cn } from "../../lib/utils"
import {
  createEmptyTable,
  parseTableSlotValue,
  serializeTableSlotValue,
  type DynamicTableValue,
} from "../../lib/dynamicTableValue"

export type DynamicTableBuilderProps = {
  value: string
  onChange: (next: string) => void
  disabled?: boolean
  slotLabel: string
  slotMeta: string
}

function normalizeTable(table: DynamicTableValue): DynamicTableValue {
  const columns =
    table.columns.length > 0
      ? table.columns.map((c, i) => c.trim() || `Column ${i + 1}`)
      : ["Column 1"]
  const colCount = columns.length
  const rows =
    table.rows.length > 0
      ? table.rows.map((row) => {
          const cells = [...row]
          while (cells.length < colCount) cells.push("")
          return cells.slice(0, colCount)
        })
      : [Array(colCount).fill("")]
  return { columns, rows }
}

export function DynamicTableBuilder({
  value,
  onChange,
  disabled = false,
  slotLabel,
  slotMeta,
}: DynamicTableBuilderProps) {
  const table = useMemo(() => normalizeTable(parseTableSlotValue(value)), [value])

  const commit = (next: DynamicTableValue) => {
    onChange(serializeTableSlotValue(normalizeTable(next)))
  }

  const updateColumn = (colIndex: number, text: string) => {
    const columns = [...table.columns]
    columns[colIndex] = text
    commit({ columns, rows: table.rows })
  }

  const updateCell = (rowIndex: number, colIndex: number, text: string) => {
    const rows = table.rows.map((r) => [...r])
    rows[rowIndex][colIndex] = text
    commit({ columns: table.columns, rows })
  }

  const addColumn = () => {
    const columns = [...table.columns, `Column ${table.columns.length + 1}`]
    const rows = table.rows.map((row) => [...row, ""])
    commit({ columns, rows })
  }

  const removeColumn = (colIndex: number) => {
    if (table.columns.length <= 1) return
    const columns = table.columns.filter((_, i) => i !== colIndex)
    const rows = table.rows.map((row) => row.filter((_, i) => i !== colIndex))
    commit({ columns, rows })
  }

  const addRow = () => {
    const rows = [...table.rows, Array(table.columns.length).fill("")]
    commit({ columns: table.columns, rows })
  }

  const removeRow = (rowIndex: number) => {
    if (table.rows.length <= 1) return
    const rows = table.rows.filter((_, i) => i !== rowIndex)
    commit({ columns: table.columns, rows })
  }

  const resetTable = () => {
    commit(createEmptyTable(2, 1))
  }

  const previewColumns = table.columns.map((c, i) => c.trim() || `Column ${i + 1}`)
  const previewRows = table.rows.map((row) =>
    row.map((cell, ci) => cell.trim() || ""),
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <label className="text-sm font-medium text-grayScale-700">{slotLabel}</label>
        <span className="text-[11px] font-mono text-grayScale-500">{slotMeta}</span>
      </div>

      <p className="text-xs text-grayScale-500">
        Build the reference table learners will see with the question.
      </p>

      <div className="overflow-x-auto rounded-xl border border-grayScale-200 bg-white">
        <table className="w-full min-w-[320px] border-collapse text-sm">
          <thead>
            <tr className="bg-grayScale-50/90">
              {table.columns.map((col, colIndex) => (
                <th
                  key={`col-${colIndex}`}
                  className="border-b border-r border-grayScale-200 p-1.5 align-top last:border-r-0"
                >
                  <div className="flex min-w-[100px] items-start gap-1">
                    <Input
                      value={col}
                      disabled={disabled}
                      onChange={(e) => updateColumn(colIndex, e.target.value)}
                      placeholder={`Column ${colIndex + 1}`}
                      className="h-9 border-grayScale-200 bg-white text-xs font-semibold"
                    />
                    {table.columns.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={disabled}
                        className="h-9 w-9 shrink-0 p-0 text-grayScale-400 hover:text-red-600"
                        aria-label={`Remove column ${colIndex + 1}`}
                        onClick={() => removeColumn(colIndex)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </th>
              ))}
              <th className="w-10 border-b border-grayScale-200 bg-grayScale-50/90 p-1" />
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`} className="group">
                {row.map((cell, colIndex) => (
                  <td
                    key={`cell-${rowIndex}-${colIndex}`}
                    className="border-b border-r border-grayScale-100 p-1.5 last:border-r-0"
                  >
                    <Input
                      value={cell}
                      disabled={disabled}
                      onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                      placeholder="Cell value"
                      className="h-9 border-grayScale-200 bg-[#F8FAFC] text-sm"
                    />
                  </td>
                ))}
                <td className="border-b border-grayScale-100 p-1 align-middle">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled || table.rows.length <= 1}
                    className="h-9 w-9 p-0 text-grayScale-400 hover:text-red-600 disabled:opacity-30"
                    aria-label={`Remove row ${rowIndex + 1}`}
                    onClick={() => removeRow(rowIndex)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-1.5"
          onClick={addColumn}
        >
          <Plus className="h-3.5 w-3.5" />
          Add column
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-1.5"
          onClick={addRow}
        >
          <Plus className="h-3.5 w-3.5" />
          Add row
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={resetTable}
        >
          Reset table
        </Button>
      </div>

      <div className="rounded-xl border border-dashed border-grayScale-200 bg-grayScale-50/60 p-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-grayScale-400">
          Learner preview
        </p>
        <div className="overflow-x-auto rounded-lg border border-grayScale-200 bg-white">
          <table className={cn("w-full min-w-[240px] border-collapse text-sm text-grayScale-800")}>
            <thead>
              <tr className="bg-brand-50/80">
                {previewColumns.map((col, i) => (
                  <th
                    key={`preview-h-${i}`}
                    className="border border-grayScale-200 px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-grayScale-700"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, ri) => (
                <tr key={`preview-r-${ri}`} className={ri % 2 === 0 ? "bg-white" : "bg-grayScale-50/50"}>
                  {row.map((cell, ci) => (
                    <td
                      key={`preview-c-${ri}-${ci}`}
                      className="border border-grayScale-100 px-3 py-2 text-sm"
                    >
                      {cell || <span className="text-grayScale-300">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
