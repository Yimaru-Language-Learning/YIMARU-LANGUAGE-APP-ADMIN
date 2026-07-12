import { notifyApiError } from "../../lib/apiErrors"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Search,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { getAllPayments, getPayments, paymentsFilterParams } from "../../api/payments.api"
import { AdminFiltersPanel } from "../../components/filters/AdminFiltersPanel"
import { ExportCsvButton } from "../../components/export/ExportCsvButton"
import { ExportTruncationWarning } from "../../components/export/ExportTruncationWarning"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"
import { Select } from "../../components/ui/select"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { countActiveFilters } from "../../lib/adminFilterUtils"
import { cn } from "../../lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import {
  formatPaymentAmount,
  formatPaymentDate,
  formatPaymentMethod,
  formatPaymentPlanCategory,
  formatPaymentStatus,
  computePaymentAggregateStats,
  paymentCustomerName,
  paymentStatusBadgeVariant,
  type PaymentAggregateStats,
} from "../../lib/payments"
import { SUBSCRIPTION_CURRENCIES, SUBSCRIPTION_PLAN_CATEGORIES } from "../../lib/subscriptionPlans"
import { EXPORT_PERMISSIONS, EXPORT_ROUTES } from "../../lib/csv-export"
import { paymentListFiltersToExportQuery } from "../../lib/csvExportFilters"
import type {
  Payment,
  PaymentPlanCategory,
  PaymentProvider,
  PaymentStatus,
} from "../../types/payment.types"

import { DEFAULT_TABLE_PAGE_SIZE, TABLE_PAGE_SIZE_OPTIONS } from "../../lib/tablePagination"

const STATUS_FILTERS: { value: PaymentStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "SUCCESS", label: "Success" },
  { value: "EXPIRED", label: "Expired" },
]

const PROVIDER_FILTERS: { value: PaymentProvider; label: string }[] = [
  { value: "CHAPA", label: "Chapa" },
  { value: "ARIFPAY", label: "Arifpay" },
]

const PLAN_CATEGORY_FILTERS = SUBSCRIPTION_PLAN_CATEGORIES

type PaymentListFilters = {
  status: PaymentStatus | ""
  provider: PaymentProvider | ""
  planCategory: PaymentPlanCategory | ""
  currency: string
  reference: string
}

const TEXT_FILTER_DEBOUNCE_MS = 400

function copyText(value: string, label: string) {
  if (!value) return
  void navigator.clipboard.writeText(value)
  toast.success(`${label} copied`)
}

const PROVIDER_LOGOS: Record<string, string> = {
  CHAPA: "https://avatars.githubusercontent.com/u/72302147?v=4",
  ARIFPAY: "https://avatars.githubusercontent.com/u/72302147?v=4",
}

const EMPTY_PAYMENT_STATS: PaymentAggregateStats = {
  successfulCount: 0,
  totalRevenue: 0,
  pendingCount: 0,
}

export function PaymentsPage() {
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [paymentStats, setPaymentStats] = useState<PaymentAggregateStats>(EMPTY_PAYMENT_STATS)
  const [offset, setOffset] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("")
  const [providerFilter, setProviderFilter] = useState<PaymentProvider | "">("")
  const [planCategoryFilter, setPlanCategoryFilter] = useState<PaymentPlanCategory | "">("")
  const [currencyFilter, setCurrencyFilter] = useState("")
  const [referenceInput, setReferenceInput] = useState("")
  const [referenceFilter, setReferenceFilter] = useState("")
  const [selected, setSelected] = useState<Payment | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setReferenceFilter(referenceInput.trim())
    }, TEXT_FILTER_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [referenceInput])

  useEffect(() => {
    setOffset(0)
  }, [referenceFilter])

  const listFilters: PaymentListFilters = {
    status: statusFilter,
    provider: providerFilter,
    planCategory: planCategoryFilter,
    currency: currencyFilter,
    reference: referenceFilter,
  }

  const exportParams = useMemo(
    () => paymentListFiltersToExportQuery(listFilters),
    [listFilters],
  )

  const activeFilterCount = countActiveFilters([
    { value: statusFilter },
    { value: providerFilter },
    { value: planCategoryFilter },
    { value: currencyFilter },
    { value: referenceFilter },
  ])

  const hasActiveFilters = activeFilterCount > 0

  const fetchPayments = useCallback(
    async (nextOffset: number, limit: number, filters: PaymentListFilters) => {
      setLoading(true)
      setError(false)
      try {
        const res = await getPayments({
          limit,
          offset: nextOffset,
          ...paymentsFilterParams({
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.provider ? { provider: filters.provider } : {}),
            ...(filters.planCategory ? { plan_category: filters.planCategory } : {}),
            ...(filters.currency ? { currency: filters.currency } : {}),
            ...(filters.reference ? { reference: filters.reference } : {}),
          }),
        })
        setPayments(res.data.payments)
        setTotalCount(res.data.total_count)
      } catch (e) {
        console.error(e)
        setError(true)
        setPayments([])
        setTotalCount(0)
        notifyApiError(e, "Failed to load payments")
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const fetchPaymentStats = useCallback(async (filters: PaymentListFilters) => {
    setStatsLoading(true)
    try {
      const all = await getAllPayments({
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.provider ? { provider: filters.provider } : {}),
        ...(filters.planCategory ? { plan_category: filters.planCategory } : {}),
        ...(filters.currency ? { currency: filters.currency } : {}),
        ...(filters.reference ? { reference: filters.reference } : {}),
      })
      setPaymentStats(computePaymentAggregateStats(all))
    } catch (e) {
      console.error(e)
      setPaymentStats(EMPTY_PAYMENT_STATS)
      notifyApiError(e, "Failed to load payment summary")
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchPayments(offset, pageSize, listFilters)
  }, [
    offset,
    pageSize,
    statusFilter,
    providerFilter,
    planCategoryFilter,
    currencyFilter,
    referenceFilter,
    fetchPayments,
  ])

  useEffect(() => {
    void fetchPaymentStats(listFilters)
  }, [
    statusFilter,
    providerFilter,
    planCategoryFilter,
    currencyFilter,
    referenceFilter,
    fetchPaymentStats,
  ])

  const toggleStatus = (value: PaymentStatus) => {
    setStatusFilter((current) => (current === value ? "" : value))
    setOffset(0)
  }

  const toggleProvider = (value: PaymentProvider) => {
    setProviderFilter((current) => (current === value ? "" : value))
    setOffset(0)
  }

  const togglePlanCategory = (value: PaymentPlanCategory) => {
    setPlanCategoryFilter((current) => (current === value ? "" : value))
    setOffset(0)
  }

  const clearFilters = () => {
    setStatusFilter("")
    setProviderFilter("")
    setPlanCategoryFilter("")
    setCurrencyFilter("")
    setReferenceInput("")
    setReferenceFilter("")
    setOffset(0)
  }

  const refreshAll = () => {
    void fetchPayments(offset, pageSize, listFilters)
    void fetchPaymentStats(listFilters)
  }

  const { successfulCount, totalRevenue, pendingCount } = paymentStats

  const pageStart = totalCount === 0 ? 0 : offset + 1
  const pageEnd = Math.min(offset + payments.length, totalCount)
  const canPrev = offset > 0
  const canNext = offset + pageSize < totalCount

  return (
    <div className="mx-auto min-w-0 w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-500">
            Billing
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-grayScale-900">Payments</h1>
          <p className="mt-1 max-w-2xl text-sm text-grayScale-500">
            Browse and filter checkout transactions from Chapa, Arifpay, and other providers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportCsvButton
            permission={EXPORT_PERMISSIONS.payments}
            exportPath={EXPORT_ROUTES.payments}
            params={exportParams}
            disabled={loading}
          />
          <Button
            variant="outline"
            className="shrink-0 rounded-[6px]"
            disabled={loading || statsLoading}
            onClick={refreshAll}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="overflow-hidden rounded-[8px] border border-grayScale-100 shadow-none">
          <div className="h-1 bg-brand-500" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-brand-50 text-brand-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-grayScale-500">Total transactions</p>
              <p className="text-2xl font-bold text-grayScale-900">{totalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden rounded-[8px] border border-grayScale-100 shadow-none">
          <div className="h-1 bg-mint-500" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-mint-50 text-mint-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-grayScale-500">Successful payments</p>
              <p className="text-2xl font-bold text-grayScale-900">
                {statsLoading ? "…" : successfulCount.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden rounded-[8px] border border-grayScale-100 shadow-none">
          <div className="h-1 bg-amber-500" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-amber-50 text-amber-700">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-grayScale-500">Revenue</p>
              <p className="text-2xl font-bold text-grayScale-900">
                {statsLoading ? "…" : `${totalRevenue.toLocaleString()} ETB`}
              </p>
              <p className="text-[11px] text-grayScale-400">
                {statsLoading ? "Loading summary…" : `${pendingCount.toLocaleString()} pending`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0 overflow-hidden rounded-[8px] border border-grayScale-100 shadow-none">
        <CardHeader className="border-b border-grayScale-50 pb-4">
          <CardTitle className="text-sm font-bold text-grayScale-900">Transaction history</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4 p-4 sm:p-6">
          <ExportTruncationWarning totalCount={totalCount} />
          <AdminFiltersPanel
            activeFilterCount={activeFilterCount}
            onClearFilters={clearFilters}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                Status
              </span>
              {STATUS_FILTERS.map(({ value, label }) => (
                <FilterChip
                  key={value}
                  label={label}
                  active={statusFilter === value}
                  disabled={loading}
                  onClick={() => toggleStatus(value)}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                Provider
              </span>
              {PROVIDER_FILTERS.map(({ value, label }) => (
                <FilterChip
                  key={value}
                  label={label}
                  active={providerFilter === value}
                  disabled={loading}
                  onClick={() => toggleProvider(value)}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                Plan
              </span>
              {PLAN_CATEGORY_FILTERS.map(({ value, label }) => (
                <FilterChip
                  key={value}
                  label={label}
                  active={planCategoryFilter === value}
                  disabled={loading}
                  onClick={() => togglePlanCategory(value)}
                />
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="payments-currency-filter"
                  className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400"
                >
                  Currency
                </label>
                <Select
                  id="payments-currency-filter"
                  value={currencyFilter}
                  onChange={(e) => {
                    setCurrencyFilter(e.target.value)
                    setOffset(0)
                  }}
                  disabled={loading}
                  className="h-9 rounded-[6px] text-sm"
                >
                  <option value="">All currencies</option>
                  {SUBSCRIPTION_CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="payments-reference-filter"
                  className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400"
                >
                  Reference
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-grayScale-400" />
                  <Input
                    id="payments-reference-filter"
                    value={referenceInput}
                    onChange={(e) => setReferenceInput(e.target.value)}
                    placeholder="Session, nonce, or transaction ID"
                    disabled={loading}
                    className="h-9 rounded-[6px] border-grayScale-200 pl-8 pr-8 text-sm"
                  />
                  {referenceInput ? (
                    <button
                      type="button"
                      aria-label="Clear reference filter"
                      disabled={loading}
                      onClick={() => setReferenceInput("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-grayScale-400 hover:text-grayScale-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
                <p className="text-[10px] text-grayScale-400">
                  Partial match on session ID, nonce, or transaction ID
                </p>
              </div>
            </div>
          </AdminFiltersPanel>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <SpinnerIcon className="h-8 w-8 text-brand-500" />
              <p className="text-sm text-grayScale-500">Loading payments…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[8px] border border-dashed border-grayScale-200 py-16">
              <p className="text-sm font-medium text-grayScale-700">Could not load payments</p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-[6px]"
                onClick={refreshAll}
              >
                Try again
              </Button>
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[8px] border border-dashed border-grayScale-200 py-16 text-center">
              <CreditCard className="h-10 w-10 text-grayScale-300" />
              <p className="text-sm font-medium text-grayScale-700">
                {hasActiveFilters ? "No payments match these filters" : "No payments yet"}
              </p>
              <p className="max-w-sm text-xs text-grayScale-500">
                {hasActiveFilters
                  ? "Try different filters or clear them to see more results."
                  : "Transactions will appear here once customers complete checkout."}
              </p>
              {hasActiveFilters ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-[6px]"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="min-w-0 w-full max-w-full overflow-x-auto rounded-[8px] border border-grayScale-100">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-grayScale-100 bg-grayScale-50/80 text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                    <th className="whitespace-nowrap px-3 py-2.5 sm:px-4">Transaction</th>
                    <th className="whitespace-nowrap px-3 py-2.5 sm:px-4">Customer</th>
                    <th className="whitespace-nowrap px-3 py-2.5 sm:px-4">Plan</th>
                    <th className="whitespace-nowrap px-3 py-2.5 sm:px-4">Amount</th>
                    <th className="whitespace-nowrap px-3 py-2.5 sm:px-4">Method</th>
                    <th className="whitespace-nowrap px-3 py-2.5 sm:px-4">Status</th>
                    <th className="whitespace-nowrap px-3 py-2.5 sm:px-4">Paid</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-right sm:px-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-grayScale-50">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="group transition-colors hover:bg-grayScale-50/60">
                      <td className="whitespace-nowrap px-3 py-2.5 sm:px-4">
                        <p className="font-semibold text-grayScale-900">#{payment.id}</p>
                        <p className="mt-0.5 max-w-[140px] truncate font-mono text-[11px] text-grayScale-500">
                          {payment.transaction_id || payment.session_id || "—"}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 sm:px-4">
                        <p className="max-w-[150px] truncate font-medium text-grayScale-900">
                          {paymentCustomerName(payment)}
                        </p>
                        <p className="mt-0.5 max-w-[150px] truncate text-xs text-grayScale-500">
                          {payment.user_email || `User #${payment.user_id}`}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 sm:px-4">
                        <p className="max-w-[160px] truncate font-medium text-grayScale-800">
                          {payment.plan_name || `Plan #${payment.plan_id}`}
                        </p>
                        {payment.plan_category && (
                          <p className="mt-0.5 truncate text-[11px] text-grayScale-400">
                            {formatPaymentPlanCategory(payment.plan_category)}
                          </p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-grayScale-900 sm:px-4">
                        {formatPaymentAmount(payment)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 sm:px-4">
                        <div className="flex items-center gap-1.5">
                          {PROVIDER_LOGOS[payment.payment_method?.toUpperCase()] && (
                            <img
                              src={PROVIDER_LOGOS[payment.payment_method.toUpperCase()]}
                              alt=""
                              className="h-4 w-4 rounded-full object-cover"
                            />
                          )}
                          <Badge variant="info" className="text-[10px]">{formatPaymentMethod(payment.payment_method)}</Badge>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 sm:px-4">
                        <Badge variant={paymentStatusBadgeVariant(payment.status)} className="text-[10px]">
                          {formatPaymentStatus(payment.status)}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-grayScale-600 sm:px-4">
                        {formatPaymentDate(payment.paid_at ?? payment.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 sm:px-4">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 rounded-[6px] p-0 text-grayScale-400 hover:text-grayScale-700"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => setSelected(payment)}>
                                <Eye className="mr-2 h-3.5 w-3.5" />
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  copyText(
                                    payment.transaction_id || payment.session_id,
                                    "Transaction ID",
                                  )
                                }
                              >
                                <Copy className="mr-2 h-3.5 w-3.5" />
                                Copy transaction ID
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && totalCount > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-grayScale-100 pt-4">
              <div className="flex flex-wrap items-center gap-3 text-xs text-grayScale-500">
                <span>
                  Showing {pageStart}–{pageEnd} of {totalCount}
                </span>
                <span className="hidden h-4 w-px bg-grayScale-200 sm:inline" />
                <span className="flex items-center gap-2">
                  Rows per page
                  <div className="relative">
                    <select
                      value={pageSize}
                      disabled={loading}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                        setOffset(0)
                      }}
                      className="h-8 appearance-none rounded-md border bg-white pl-2 pr-7 text-sm font-medium text-grayScale-600 focus:outline-none"
                    >
                      {TABLE_PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-grayScale-400" />
                  </div>
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-[6px]"
                  disabled={!canPrev || loading}
                  onClick={() => setOffset((o) => Math.max(0, o - pageSize))}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-[6px]"
                  disabled={!canNext || loading}
                  onClick={() => setOffset((o) => o + pageSize)}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={selected != null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25)]">
          {selected ? (
            <>
              {/* Header */}
              <div className="px-6 pt-6 pb-5 pr-14">
                <div className="flex items-start gap-3.5">
                  {PROVIDER_LOGOS[selected.payment_method?.toUpperCase()] ? (
                    <img
                      src={PROVIDER_LOGOS[selected.payment_method.toUpperCase()]}
                      alt={formatPaymentMethod(selected.payment_method)}
                      className="h-12 w-12 shrink-0 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className={cn(
                      "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
                      selected.status === "SUCCESS" ? "bg-green-50 text-green-600"
                        : selected.status === "FAILED" ? "bg-red-50 text-red-600"
                        : selected.status === "PENDING" ? "bg-amber-50 text-amber-600"
                        : "bg-grayScale-100 text-grayScale-500",
                    )}>
                      <CreditCard className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <DialogTitle className="text-base font-bold leading-snug text-grayScale-900">
                      Payment #{selected.id}
                    </DialogTitle>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-grayScale-400">
                      <Badge variant={paymentStatusBadgeVariant(selected.status)} className="text-[10px]">
                        {formatPaymentStatus(selected.status)}
                      </Badge>
                      <span>·</span>
                      <span>{formatPaymentAmount(selected)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 pb-8 pt-1">
                {/* Amount highlight */}
                <div className="rounded-xl bg-grayScale-50/70 px-4 py-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-grayScale-300">Amount</p>
                  <p className="mt-1 text-2xl font-bold text-grayScale-900">
                    {formatPaymentAmount(selected)}
                  </p>
                  <p className="mt-0.5 text-xs text-grayScale-400">
                    {formatPaymentMethod(selected.payment_method)}
                  </p>
                </div>

                {/* Metadata */}
                <div className="mt-5 space-y-0 divide-y divide-grayScale-100">
                  {[
                    { k: "Customer", v: paymentCustomerName(selected) },
                    { k: "Email", v: selected.user_email || "—" },
                    { k: "Plan", v: selected.plan_name || `Plan #${selected.plan_id}` },
                    { k: "Category", v: formatPaymentPlanCategory(selected.plan_category) },
                    { k: "Transaction", v: selected.transaction_id || "—", mono: true },
                    { k: "Session", v: selected.session_id || "—", mono: true },
                    { k: "Subscription", v: `#${selected.subscription_id}` },
                    { k: "Paid", v: formatPaymentDate(selected.paid_at ?? selected.created_at) },
                    ...(selected.expires_at ? [{ k: "Expires", v: formatPaymentDate(selected.expires_at) }] : []),
                  ].map((row) => (
                    <div key={row.k} className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                      <span className="text-xs text-grayScale-400">{row.k}</span>
                      {row.k === "Customer" ? (
                        <span className="text-xs font-medium text-grayScale-600">
                          <Link to={`/users/${selected.user_id}`} className="text-brand-500 hover:text-brand-600">
                            {row.v}
                          </Link>
                        </span>
                      ) : (
                        <span className={cn("text-xs font-medium text-grayScale-600", row.mono && "font-mono text-[11px]")}>
                          {row.v}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {selected.payment_url && (
                  <div className="mt-5 border-t border-grayScale-100 pt-4">
                    <Button size="sm" className="h-9 rounded-lg bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-500" asChild>
                      <a href={selected.payment_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        Open checkout
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FilterChip({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string
  active: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-[6px] border px-2.5 py-1 text-xs font-semibold transition-colors",
        active
          ? "border-brand-500 bg-brand-500 text-white"
          : "border-grayScale-200 bg-white text-grayScale-600 hover:border-brand-200 hover:text-brand-600",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {label}
    </button>
  )
}
