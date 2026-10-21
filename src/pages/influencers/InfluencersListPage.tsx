import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  BarChart3,
  Check,
  Copy,
  Megaphone,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react"
import {
  deleteInfluencer,
  getSystemRevenueSummary,
  listInfluencers,
  updateInfluencer,
} from "../../api/influencers.api"
import { ExportCsvButton } from "../../components/export/ExportCsvButton"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import { Input } from "../../components/ui/input"
import { Select } from "../../components/ui/select"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { EXPORT_PERMISSIONS, EXPORT_ROUTES } from "../../lib/csv-export"
import type {
  Influencer,
  InfluencerPlatform,
  InfluencerStatus,
  InfluencerSystemSummary,
} from "../../types/influencer.types"
import { CreateInfluencerModal } from "./CreateInfluencerModal"
import { EditInfluencerModal } from "./EditInfluencerModal"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ""
// Derive the redirect base URL from VITE_API_BASE_URL (strip /api/v1 suffix)
// e.g. "http://localhost:8080/api/v1" → "http://localhost:8080"
// Falls back to production if not configured
function getRedirectBaseURL(): string {
  if (API_BASE_URL) {
    try {
      const url = new URL(API_BASE_URL)
      return `${url.protocol}//${url.host}`
    } catch {
      // fall through to default
    }
  }
  return "https://api.yimaruacademy.com"
}

export function InfluencersListPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [summary, setSummary] = useState<InfluencerSystemSummary | null>(null)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(true)

  // Filters & Pagination
  const [search, setSearch] = useState("")
  const [platform, setPlatform] = useState<InfluencerPlatform | "">("")
  const [status, setStatus] = useState<InfluencerStatus | "">("")
  const [page, setPage] = useState(1)
  const pageSize = 20

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null)
  const [influencerToDelete, setInfluencerToDelete] = useState<Influencer | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true)
      const data = await getSystemRevenueSummary()
      setSummary(data)
    } catch (err: unknown) {
      console.error("Failed to load summary:", err)
    } finally {
      setSummaryLoading(false)
    }
  }, [])

  const fetchInfluencers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await listInfluencers({
        search,
        platform,
        status,
        page,
        limit: pageSize,
      })
      setInfluencers(res.data)
      setTotalItems(res.pagination?.total_items ?? res.data.length)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      const msg = e?.response?.data?.message || e?.message || "Failed to load influencers"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [search, platform, status, page])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  useEffect(() => {
    fetchInfluencers()
  }, [fetchInfluencers])

  const handleCopyLink = (code: string) => {
    const link = `${getRedirectBaseURL()}/r/${code}`
    navigator.clipboard.writeText(link)
    setCopiedCode(code)
    toast.success(`Copied link to clipboard: ${link}`)
    setTimeout(() => setCopiedCode(null), 2500)
  }

  const handleToggleStatus = async (inf: Influencer) => {
    const nextStatus: InfluencerStatus = inf.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    try {
      await updateInfluencer(inf.id, { status: nextStatus })
      toast.success(
        `Influencer "${inf.name}" is now ${nextStatus === "ACTIVE" ? "Active" : "Inactive"}`
      )
      fetchInfluencers()
      fetchSummary()
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "Failed to change influencer status"
      toast.error(msg)
    }
  }

  const handleConfirmDelete = async () => {
    if (!influencerToDelete) return
    try {
      setDeleteLoading(true)
      await deleteInfluencer(influencerToDelete.id)
      toast.success(`Influencer "${influencerToDelete.name}" deleted successfully`)
      setInfluencerToDelete(null)
      fetchInfluencers()
      fetchSummary()
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "Failed to delete influencer"
      toast.error(msg)
    } finally {
      setDeleteLoading(false)
    }
  }

  const totalPages = Math.ceil(totalItems / pageSize) || 1

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)
  }

  const getPlatformBadge = (p: InfluencerPlatform) => {
    switch (p) {
      case "TIKTOK":
        return <Badge className="bg-black text-white hover:bg-black/90">TikTok</Badge>
      case "TELEGRAM":
        return <Badge className="bg-sky-500 text-white hover:bg-sky-600">Telegram</Badge>
      case "YOUTUBE":
        return <Badge className="bg-red-600 text-white hover:bg-red-700">YouTube</Badge>
      case "INSTAGRAM":
        return <Badge className="bg-gradient-to-r from-pink-500 via-purple-500 to-amber-500 text-white">Instagram</Badge>
      case "FACEBOOK":
        return <Badge className="bg-blue-600 text-white hover:bg-blue-700">Facebook</Badge>
      default:
        return <Badge variant="outline">Other</Badge>
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-grayScale-900">
            Influencer Referrals & Attribution
          </h1>
          <p className="mt-1 text-sm text-grayScale-500">
            Manage creator promo codes, track clicks, and monitor customer conversion and revenue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchSummary()
              fetchInfluencers()
            }}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <ExportCsvButton
            permission={EXPORT_PERMISSIONS.influencers}
            exportPath={EXPORT_ROUTES.influencers}
            params={{}}
            resourceName="influencers_revenue"
            variant="outline"
            size="sm"
          />

          <Button
            variant="brand"
            onClick={() => setCreateModalOpen(true)}
            size="sm"
            className="gap-2 bg-brand-500 hover:bg-brand-600 text-white shadow-sm font-medium"
            style={{ backgroundColor: "#9E2891", color: "#ffffff" }}
          >
            <Plus className="h-4 w-4 text-white" />
            Add Influencer
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Influencers */}
        <Card className="border border-grayScale-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-grayScale-500">
              Active Influencers
            </CardTitle>
            <Users className="h-4 w-4 text-brand-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-grayScale-100" />
            ) : (
              <div>
                <div className="text-2xl font-bold text-grayScale-900">
                  {summary?.active_influencers ?? 0}
                  <span className="ml-1 text-sm font-normal text-grayScale-500">
                    / {summary?.total_influencers ?? 0} total
                  </span>
                </div>
                <p className="mt-1 text-xs text-grayScale-500">
                  Registered referral campaigns
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Clicks & Signups */}
        <Card className="border border-grayScale-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-grayScale-500">
              Clicks & Signups
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-grayScale-100" />
            ) : (
              <div>
                <div className="text-2xl font-bold text-grayScale-900">
                  {summary?.total_referred_users ?? 0}
                  <span className="ml-1 text-sm font-normal text-grayScale-500">
                    signups
                  </span>
                </div>
                <p className="mt-1 text-xs text-emerald-600 font-medium">
                  {summary?.total_clicks ?? 0} clicks (
                  {summary?.click_to_signup_rate?.toFixed(1) ?? "0.0"}% conv.)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paying Customers */}
        <Card className="border border-grayScale-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-grayScale-500">
              Paying Customers
            </CardTitle>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-grayScale-100" />
            ) : (
              <div>
                <div className="text-2xl font-bold text-grayScale-900">
                  {summary?.total_paying_users ?? 0}
                  <span className="ml-1 text-sm font-normal text-grayScale-500">
                    subscribers
                  </span>
                </div>
                <p className="mt-1 text-xs text-blue-600 font-medium">
                  {summary?.signup_to_paid_rate?.toFixed(1) ?? "0.0"}% signup-to-paid
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attributed Revenue & Commission */}
        <Card className="border border-grayScale-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-grayScale-500">
              Attributed Revenue
            </CardTitle>
            <Wallet className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-grayScale-100" />
            ) : (
              <div>
                <div className="text-2xl font-bold text-grayScale-900">
                  {formatCurrency(summary?.total_revenue ?? 0)}
                  <span className="ml-1 text-xs font-semibold text-grayScale-500">
                    ETB
                  </span>
                </div>
                <p className="mt-1 text-xs text-amber-600 font-medium">
                  {formatCurrency(summary?.total_commission ?? 0)} ETB commission
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-grayScale-200 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-grayScale-400" />
                <Input
                  placeholder="Search by name or referral code..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-9"
                />
              </div>

              {/* Platform Filter */}
              <div className="w-full sm:w-44">
                <Select
                  value={platform}
                  onChange={(e) => {
                    setPlatform(e.target.value as InfluencerPlatform | "")
                    setPage(1)
                  }}
                >
                  <option value="">All Platforms</option>
                  <option value="TIKTOK">TikTok</option>
                  <option value="TELEGRAM">Telegram</option>
                  <option value="YOUTUBE">YouTube</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="FACEBOOK">Facebook</option>
                  <option value="OTHER">Other</option>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-36">
                <Select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as InfluencerStatus | "")
                    setPage(1)
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </Select>
              </div>
            </div>

            {(search || platform || status) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("")
                  setPlatform("")
                  setStatus("")
                  setPage(1)
                }}
                className="text-grayScale-500 hover:text-grayScale-900"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="border border-grayScale-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-grayScale-200 bg-grayScale-50/75 text-xs font-semibold uppercase text-grayScale-500">
              <tr>
                <th className="px-6 py-3.5">Influencer</th>
                <th className="px-6 py-3.5">Referral Code</th>
                <th className="px-6 py-3.5">Platform</th>
                <th className="px-6 py-3.5">Commission</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Created</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grayScale-100 text-grayScale-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-grayScale-500">
                    <SpinnerIcon className="mx-auto mb-2 h-6 w-6" />
                    Loading influencers...
                  </td>
                </tr>
              ) : influencers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-grayScale-500">
                    <Megaphone className="mx-auto mb-2 h-8 w-8 text-grayScale-300" />
                    <p className="font-medium text-grayScale-700">No influencers found</p>
                    <p className="mt-1 text-xs text-grayScale-400">
                      Get started by adding your first influencer promo code.
                    </p>
                    <div className="mt-4 flex justify-center">
                      <Button
                        variant="brand"
                        size="sm"
                        onClick={() => setCreateModalOpen(true)}
                        className="gap-1.5 bg-brand-500 hover:bg-brand-600 text-white shadow-sm font-medium"
                        style={{ backgroundColor: "#9E2891", color: "#ffffff" }}
                      >
                        <Plus className="h-4 w-4 text-white" />
                        Add Influencer
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                influencers.map((inf) => (
                  <tr
                    key={inf.id}
                    className="transition-colors hover:bg-grayScale-50/50"
                  >
                    {/* Influencer Name & Handle */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-grayScale-900">
                        <Link
                          to={`/influencers/${inf.id}`}
                          className="hover:text-brand-600 hover:underline"
                        >
                          {inf.name}
                        </Link>
                      </div>
                      <div className="text-xs text-grayScale-500">
                        {inf.social_handle || inf.phone_number || inf.email || "No contact"}
                      </div>
                    </td>

                    {/* Code with Copy */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-mono text-sm font-semibold text-grayScale-800">
                        <span className="rounded bg-grayScale-100 px-2 py-0.5">
                          {inf.code}
                        </span>
                        <button
                          onClick={() => handleCopyLink(inf.code)}
                          title="Copy redirect link"
                          className="rounded p-1 text-grayScale-400 hover:bg-grayScale-100 hover:text-grayScale-700"
                        >
                          {copiedCode === inf.code ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Platform Badge */}
                    <td className="px-6 py-4">
                      {getPlatformBadge(inf.platform)}
                    </td>

                    {/* Commission Rate */}
                    <td className="px-6 py-4 font-medium text-grayScale-800">
                      {inf.commission_rate?.toFixed(1)}%
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <Badge
                        variant={inf.status === "ACTIVE" ? "success" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleToggleStatus(inf)}
                      >
                        {inf.status === "ACTIVE" ? "Active" : "Inactive"}
                      </Badge>
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 text-xs text-grayScale-500">
                      {new Date(inf.created_at).toLocaleDateString()}
                    </td>

                    {/* Actions Menu */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/influencers/${inf.id}`}>
                          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                            <BarChart3 className="h-3.5 w-3.5" />
                            Analytics
                          </Button>
                        </Link>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleCopyLink(inf.code)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Referral URL
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingInfluencer(inf)}>
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(inf)}>
                              {inf.status === "ACTIVE" ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setInfluencerToDelete(inf)}
                              className="text-red-600 focus:text-red-600 cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between border-t border-grayScale-200 px-6 py-3 text-xs text-grayScale-500">
            <div>
              Showing {Math.min((page - 1) * pageSize + 1, totalItems)} to{" "}
              {Math.min(page * pageSize, totalItems)} of {totalItems} influencers
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="font-medium text-grayScale-700">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      <CreateInfluencerModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          fetchInfluencers()
          fetchSummary()
        }}
      />

      <EditInfluencerModal
        influencer={editingInfluencer}
        open={Boolean(editingInfluencer)}
        onClose={() => setEditingInfluencer(null)}
        onSuccess={() => {
          fetchInfluencers()
          fetchSummary()
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!influencerToDelete}
        onOpenChange={(open) => {
          if (!open) setInfluencerToDelete(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 sm:mx-0">
              <Trash2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-semibold text-grayScale-900">
              Delete Influencer
            </DialogTitle>
            <DialogDescription className="text-sm text-grayScale-500">
              Are you sure you want to delete this influencer? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {influencerToDelete && (
            <div className="rounded-lg border border-red-100 bg-red-50/60 p-3.5 text-sm">
              <div className="font-semibold text-grayScale-900">
                {influencerToDelete.name}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-grayScale-600">
                <span>Code: <code className="font-mono font-semibold text-brand-600">{influencerToDelete.code}</code></span>
                <span>•</span>
                <span>Platform: {influencerToDelete.platform}</span>
                <span>•</span>
                <span>Commission: {influencerToDelete.commission_rate?.toFixed(1)}%</span>
              </div>
              <p className="mt-2 text-xs font-medium text-red-600">
                Their referral code will be deactivated and no longer attribute new users.
              </p>
            </div>
          )}

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInfluencerToDelete(null)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={deleteLoading || !influencerToDelete}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm"
              style={{ backgroundColor: "#dc2626", color: "#ffffff" }}
            >
              {deleteLoading ? (
                <SpinnerIcon className="h-4 w-4 text-white" />
              ) : (
                <Trash2 className="h-4 w-4 text-white" />
              )}
              {deleteLoading ? "Deleting..." : "Delete Influencer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
