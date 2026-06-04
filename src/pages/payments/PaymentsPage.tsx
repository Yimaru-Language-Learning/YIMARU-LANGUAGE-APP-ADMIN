import { useCallback, useEffect, useState, type ReactNode } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  Eye,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { getPayments } from "../../api/payments.api"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { cn } from "../../lib/utils"
import {
  formatPaymentAmount,
  formatPaymentDate,
  formatPaymentMethod,
  formatPaymentPlanCategory,
  formatPaymentStatus,
  paymentCustomerName,
  paymentStatusBadgeVariant,
} from "../../lib/payments"
import type {
  Payment,
  PaymentPlanCategory,
  PaymentProvider,
  PaymentStatus,
} from "../../types/payment.types"

import { DEFAULT_TABLE_PAGE_SIZE, TABLE_PAGE_SIZE_OPTIONS } from "../../lib/tablePagination"

const STATUS_FILTERS: { value: PaymentStatus; label: string }[] = [
  { value: "SUCCESS", label: "Success" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
]

const PROVIDER_FILTERS: { value: PaymentProvider; label: string }[] = [
  { value: "CHAPA", label: "Chapa" },
  { value: "ARIFPAY", label: "Arifpay" },
]

const PLAN_CATEGORY_FILTERS: { value: PaymentPlanCategory; label: string }[] = [
  { value: "LEARN_ENGLISH", label: "Learn English" },
  { value: "IELTS", label: "IELTS" },
  { value: "DUOLINGO", label: "Duolingo" },
]

type PaymentListFilters = {
  status: PaymentStatus | ""
  provider: PaymentProvider | ""
  planCategory: PaymentPlanCategory | ""
}

function copyText(value: string, label: string) {
  if (!value) return
  void navigator.clipboard.writeText(value)
  toast.success(`${label} copied`)
}

export function PaymentsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("")
  const [providerFilter, setProviderFilter] = useState<PaymentProvider | "">("")
  const [planCategoryFilter, setPlanCategoryFilter] = useState<PaymentPlanCategory | "">("")
  const [selected, setSelected] = useState<Payment | null>(null)

  const listFilters: PaymentListFilters = {
    status: statusFilter,
    provider: providerFilter,
    planCategory: planCategoryFilter,
  }

  const hasActiveFilters = Boolean(
    listFilters.status || listFilters.provider || listFilters.planCategory,
  )

  const fetchPayments = useCallback(
    async (nextOffset: number, limit: number, filters: PaymentListFilters) => {
      setLoading(true)
      setError(false)
      try {
        const res = await getPayments({
          limit,
          offset: nextOffset,
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.provider ? { provider: filters.provider } : {}),
          ...(filters.planCategory ? { plan_category: filters.planCategory } : {}),
        })
        setPayments(res.data.payments)
        setTotalCount(res.data.total_count)
      } catch (e) {
        console.error(e)
        setError(true)
        setPayments([])
        setTotalCount(0)
        toast.error("Failed to load payments")
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    void fetchPayments(offset, pageSize, listFilters)
  }, [offset, pageSize, statusFilter, providerFilter, planCategoryFilter, fetchPayments])

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
    setOffset(0)
  }

  const successfulOnPage = payments.filter((p) => p.status.toUpperCase() === "SUCCESS")
  const pageRevenue = successfulOnPage.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const pendingOnPage = payments.filter((p) => {
    const s = p.status.toUpperCase()
    return s === "PENDING" || s === "PROCESSING"
  }).length

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
        <Button
          variant="outline"
          className="shrink-0 rounded-[6px]"
          disabled={loading}
          onClick={() => void fetchPayments(offset, pageSize, listFilters)}
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
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
              <p className="text-xs font-medium text-grayScale-500">Successful (this page)</p>
              <p className="text-2xl font-bold text-grayScale-900">{successfulOnPage.length}</p>
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
              <p className="text-xs font-medium text-grayScale-500">Revenue (this page)</p>
              <p className="text-2xl font-bold text-grayScale-900">
                {pageRevenue.toLocaleString()} ETB
              </p>
              <p className="text-[11px] text-grayScale-400">{pendingOnPage} pending on page</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0 overflow-hidden rounded-[8px] border border-grayScale-100 shadow-none">
        <CardHeader className="border-b border-grayScale-50 pb-4">
          <CardTitle className="text-sm font-bold text-grayScale-900">Transaction history</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4 p-4 sm:p-6">
          <div className="flex flex-col gap-3 rounded-[8px] border border-grayScale-100 bg-grayScale-50/40 p-3 sm:p-4">
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
              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-7 rounded-[6px] px-2 text-xs text-grayScale-500"
                  disabled={loading}
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          </div>

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
                onClick={() => void fetchPayments(offset, pageSize, listFilters)}
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
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-grayScale-100 bg-grayScale-50/80 text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                    <th className="whitespace-nowrap px-3 py-3 sm:px-4">Transaction</th>
                    <th className="whitespace-nowrap px-3 py-3 sm:px-4">Customer</th>
                    <th className="whitespace-nowrap px-3 py-3 sm:px-4">Plan</th>
                    <th className="whitespace-nowrap px-3 py-3 sm:px-4">Amount</th>
                    <th className="whitespace-nowrap px-3 py-3 sm:px-4">Method</th>
                    <th className="whitespace-nowrap px-3 py-3 sm:px-4">Status</th>
                    <th className="whitespace-nowrap px-3 py-3 sm:px-4">Paid</th>
                    <th className="sticky right-0 z-10 whitespace-nowrap bg-grayScale-50/95 px-3 py-3 text-right sm:px-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-grayScale-50">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="group transition-colors hover:bg-grayScale-50/60">
                      <td className="whitespace-nowrap px-3 py-3 sm:px-4 sm:py-4">
                        <p className="font-semibold text-grayScale-900">#{payment.id}</p>
                        <p className="mt-0.5 max-w-[160px] truncate font-mono text-[11px] text-grayScale-500">
                          {payment.transaction_id || payment.session_id || "—"}
                        </p>
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4">
                        <p className="font-medium text-grayScale-900">
                          {paymentCustomerName(payment)}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-grayScale-500">
                          {payment.user_email || `User #${payment.user_id}`}
                        </p>
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4">
                        <p className="max-w-[180px] truncate font-medium text-grayScale-800">
                          {payment.plan_name || `Plan #${payment.plan_id}`}
                        </p>
                        {payment.plan_category ? (
                          <Badge variant="secondary" className="mt-1 text-[10px]">
                            {formatPaymentPlanCategory(payment.plan_category)}
                          </Badge>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-semibold text-grayScale-900 sm:px-4 sm:py-4">
                        {formatPaymentAmount(payment)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 sm:px-4 sm:py-4">
                        <Badge variant="info">{formatPaymentMethod(payment.payment_method)}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 sm:px-4 sm:py-4">
                        <Badge variant={paymentStatusBadgeVariant(payment.status)}>
                          {formatPaymentStatus(payment.status)}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-grayScale-600 sm:px-4 sm:py-4">
                        {formatPaymentDate(payment.paid_at ?? payment.created_at)}
                      </td>
                      <td className="sticky right-0 z-10 whitespace-nowrap bg-white px-3 py-3 shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.08)] group-hover:bg-grayScale-50/60 sm:px-4 sm:py-4">
                        <div className="flex justify-end gap-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-[6px] p-0 text-grayScale-500 hover:text-brand-600"
                            aria-label="View payment details"
                            onClick={() => setSelected(payment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-[6px] p-0 text-grayScale-500 hover:text-brand-600"
                            aria-label="Copy transaction ID"
                            onClick={() =>
                              copyText(
                                payment.transaction_id || payment.session_id,
                                "Transaction ID",
                              )
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
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
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-[12px]">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>Payment #{selected.id}</DialogTitle>
                <DialogDescription>
                  {formatPaymentStatus(selected.status)} · {formatPaymentAmount(selected)}
                </DialogDescription>
              </DialogHeader>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <Detail label="Customer" value={paymentCustomerName(selected)} />
                <Detail label="Email" value={selected.user_email || "—"} />
                <Detail
                  label="User"
                  value={
                    <Link
                      to={`/users/${selected.user_id}`}
                      className="font-medium text-brand-500 hover:text-brand-600"
                    >
                      View user #{selected.user_id}
                    </Link>
                  }
                />
                <Detail label="Plan" value={selected.plan_name || `Plan #${selected.plan_id}`} />
                <Detail
                  label="Category"
                  value={formatPaymentPlanCategory(selected.plan_category)}
                />
                <Detail label="Method" value={formatPaymentMethod(selected.payment_method)} />
                <Detail label="Status" value={formatPaymentStatus(selected.status)} />
                <Detail label="Transaction ID" value={selected.transaction_id || "—"} mono />
                <Detail label="Session ID" value={selected.session_id || "—"} mono />
                <Detail label="Subscription" value={`#${selected.subscription_id}`} />
                <Detail label="Paid at" value={formatPaymentDate(selected.paid_at)} />
                <Detail label="Expires at" value={formatPaymentDate(selected.expires_at)} />
                <Detail label="Created" value={formatPaymentDate(selected.created_at)} />
                <Detail label="Updated" value={formatPaymentDate(selected.updated_at)} />
              </dl>
              {selected.payment_url ? (
                <a
                  href={selected.payment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-sm font-semibold text-brand-500 hover:text-brand-600"
                >
                  Open checkout URL
                </a>
              ) : null}
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

function Detail({
  label,
  value,
  mono,
}: {
  label: string
  value: ReactNode
  mono?: boolean
}) {
  return (
    <div className="rounded-[8px] border border-grayScale-100 bg-grayScale-50/50 px-3 py-2">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-grayScale-400">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 font-medium text-grayScale-800 break-all",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </dd>
    </div>
  )
}
