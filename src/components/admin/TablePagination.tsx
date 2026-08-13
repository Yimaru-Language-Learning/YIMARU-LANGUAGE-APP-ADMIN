import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "../../lib/utils"
import { TABLE_PAGE_SIZE_OPTIONS } from "../../lib/tablePagination"

type TablePaginationProps = {
  startEntry: number
  endEntry: number
  totalCount: number
  pageSize: number
  onPageSizeChange: (size: number) => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
  className?: string
}

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  const pages: (number | string)[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1, 2, 3)
    if (currentPage > 4) pages.push("...")
    if (currentPage > 3 && currentPage < totalPages - 2) pages.push(currentPage)
    if (currentPage < totalPages - 3) pages.push("...")
    pages.push(totalPages)
  }
  return pages
}

export function TablePagination({
  startEntry,
  endEntry,
  totalCount,
  pageSize,
  onPageSizeChange,
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  className,
}: TablePaginationProps) {
  if (totalCount <= 0) return null

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-grayScale-500",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span>Showing</span>
        <span className="font-medium text-grayScale-600">
          {startEntry}-{endEntry}
        </span>
        <span>of</span>
        <span className="font-medium text-grayScale-600">{totalCount}</span>
        <span className="mr-2 sm:mr-4">entries</span>
        <span className="hidden border-l pl-4 sm:inline">Rows per page</span>
        <span className="sm:hidden">·</span>
        <div className="relative">
          <select
            value={pageSize}
            disabled={disabled}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 appearance-none rounded-md border bg-white pl-2 pr-7 text-sm font-medium text-grayScale-600 focus:outline-none"
            aria-label="Rows per page"
          >
            {TABLE_PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-grayScale-400" />
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={disabled || currentPage <= 1}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-[6px] border bg-white text-grayScale-500",
            (disabled || currentPage <= 1) && "cursor-not-allowed opacity-50",
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {getPageNumbers(currentPage, totalPages).map((n, idx) =>
          typeof n === "string" ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-grayScale-400">
              ...
            </span>
          ) : (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onPageChange(n)}
              className={cn(
                "h-8 w-8 rounded-[6px] border text-sm font-medium",
                n === currentPage
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "bg-white text-grayScale-600 hover:bg-grayScale-50",
              )}
            >
              {n}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={disabled || currentPage >= totalPages}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-[6px] border bg-white text-grayScale-500",
            (disabled || currentPage >= totalPages) && "cursor-not-allowed opacity-50",
          )}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
