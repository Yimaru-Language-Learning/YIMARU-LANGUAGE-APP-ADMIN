/** Standard page-size choices for admin data tables. */
export const TABLE_PAGE_SIZE_OPTIONS = [5, 10, 30, 50, 100] as const

export type TablePageSize = (typeof TABLE_PAGE_SIZE_OPTIONS)[number]

export const DEFAULT_TABLE_PAGE_SIZE: TablePageSize = 10
