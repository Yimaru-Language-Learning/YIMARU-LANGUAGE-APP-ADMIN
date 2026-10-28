import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Edit,
  MousePointer,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react"
import {
  getInfluencer,
  getInfluencerRevenue,
  listInfluencerClicks,
  listReferredUsers,
  updateInfluencer,
} from "../../api/influencers.api"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import type {
  Influencer,
  InfluencerClick,
  InfluencerRevenueAnalytics,
  InfluencerStatus,
  ReferredUserDetail,
} from "../../types/influencer.types"
import { EditInfluencerModal } from "./EditInfluencerModal"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ""
// Derive redirect base URL from VITE_API_BASE_URL (strip /api/v1 suffix)
// e.g. "http://localhost:8080/api/v1" → "http://localhost:8080"
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

export function InfluencerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const influencerId = Number(id)

  const [influencer, setInfluencer] = useState<Influencer | null>(null)
  const [analytics, setAnalytics] = useState<InfluencerRevenueAnalytics | null>(null)
  const [referredUsers, setReferredUsers] = useState<ReferredUserDetail[]>([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [clicks, setClicks] = useState<InfluencerClick[]>([])
  const [clicksTotal, setClicksTotal] = useState(0)

  const [activeTab, setActiveTab] = useState<"revenue" | "users" | "clicks">("revenue")
  const [loading, setLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // Users & Clicks pagination
  const [usersPage, setUsersPage] = useState(1)
  const [clicksPage, setClicksPage] = useState(1)
  const pageSize = 20

  const fetchOverview = useCallback(async () => {
    if (!influencerId || isNaN(influencerId)) return
    try {
      setLoading(true)
      const [infData, revData] = await Promise.all([
        getInfluencer(influencerId),
        getInfluencerRevenue(influencerId),
      ])
      setInfluencer(infData)
      setAnalytics(revData)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      toast.error(e?.response?.data?.message || e?.message || "Failed to load influencer details")
    } finally {
      setLoading(false)
    }
  }, [influencerId])

  const fetchReferredUsers = useCallback(async () => {
    if (!influencerId) return
    try {
      setTabLoading(true)
      const res = await listReferredUsers(influencerId, { page: usersPage, limit: pageSize })
      setReferredUsers(res.data)
      setUsersTotal(res.pagination?.total_items ?? res.data.length)
    } catch (err: unknown) {
      console.error("Failed to load referred users:", err)
    } finally {
      setTabLoading(false)
    }
  }, [influencerId, usersPage])

  const fetchClicks = useCallback(async () => {
    if (!influencerId) return
    try {
      setTabLoading(true)
      const res = await listInfluencerClicks(influencerId, { page: clicksPage, limit: pageSize })
      setClicks(res.data)
      setClicksTotal(res.pagination?.total_items ?? res.data.length)
    } catch (err: unknown) {
      console.error("Failed to load clicks:", err)
    } finally {
      setTabLoading(false)
    }
  }, [influencerId, clicksPage])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  useEffect(() => {
    if (activeTab === "users") {
      fetchReferredUsers()
    } else if (activeTab === "clicks") {
      fetchClicks()
    }
  }, [activeTab, fetchReferredUsers, fetchClicks])

  const handleCopyLink = () => {
    if (!influencer) return
    const link = `${getRedirectBaseURL()}/r/${influencer.code}`
    navigator.clipboard.writeText(link)
    setCopiedLink(true)
    toast.success(`Copied referral URL: ${link}`)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleToggleStatus = async () => {
    if (!influencer) return
    const nextStatus: InfluencerStatus = influencer.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    try {
      const updated = await updateInfluencer(influencer.id, { status: nextStatus })
      setInfluencer(updated)
      toast.success(`Influencer status updated to ${nextStatus}`)
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "Failed to update status"
      toast.error(msg)
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)
  }

  if (loading && !influencer) {
    return (
      <div className="flex h-96 items-center justify-center p-6 text-grayScale-500">
        <SpinnerIcon className="mr-2 h-6 w-6" />
        Loading influencer details...
      </div>
    )
  }

  if (!influencer) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold text-grayScale-900">Influencer not found</h2>
        <Link to="/influencers" className="mt-4 inline-block text-brand-600 hover:underline">
          &larr; Back to Influencers
        </Link>
      </div>
    )
  }

  const redirectURL = `${getRedirectBaseURL()}/r/${influencer.code}`

  return (
    <div className="space-y-6 p-6">
      {/* Top Back Navigation */}
      <div className="flex items-center gap-2">
        <Link
          to="/influencers"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-grayScale-500 hover:text-grayScale-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Influencers
        </Link>
      </div>

      {/* Hero Header Card */}
      <Card className="border border-grayScale-200 bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl font-bold text-brand-600">
                {influencer.name.charAt(0).toUpperCase()}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-grayScale-900">
                    {influencer.name}
                  </h1>
                  <Badge variant={influencer.status === "ACTIVE" ? "success" : "secondary"}>
                    {influencer.status}
                  </Badge>
                  <Badge variant="outline">{influencer.platform}</Badge>
                  {influencer.social_handle && (
                    <span className="text-sm font-medium text-grayScale-500">
                      {influencer.social_handle}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-grayScale-500">
                  {influencer.phone_number && (
                    <span>Phone: {influencer.phone_number}</span>
                  )}
                  {influencer.email && <span>Email: {influencer.email}</span>}
                  <span>
                    Created: {new Date(influencer.created_at).toLocaleDateString()}
                  </span>
                  <span>Commission: {influencer.commission_rate?.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Actions & Redirect Link */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-1.5 rounded-lg border border-grayScale-200 bg-grayScale-50 px-3 py-1.5 font-mono text-xs">
                <span className="font-semibold text-grayScale-800">
                  {redirectURL}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="rounded p-1 text-grayScale-400 hover:bg-grayScale-200 hover:text-grayScale-800"
                  title="Copy Link"
                >
                  {copiedLink ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(true)}
                className="gap-1.5"
              >
                <Edit className="h-3.5 w-3.5" />
                Edit
              </Button>

              <Button
                variant={influencer.status === "ACTIVE" ? "outline" : "default"}
                size="sm"
                onClick={handleToggleStatus}
              >
                {influencer.status === "ACTIVE" ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card className="border border-grayScale-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-grayScale-500">
              Attributed Revenue
            </CardTitle>
            <Wallet className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-grayScale-900">
              {formatCurrency(analytics?.total_revenue ?? 0)}
              <span className="ml-1 text-xs font-semibold text-grayScale-500">
                ETB
              </span>
            </div>
            <p className="mt-1 text-xs text-amber-600 font-medium">
              {formatCurrency(analytics?.total_commission ?? 0)} ETB commission (
              {influencer.commission_rate?.toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        {/* Total Clicks */}
        <Card className="border border-grayScale-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-grayScale-500">
              Total Clicks
            </CardTitle>
            <MousePointer className="h-4 w-4 text-brand-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-grayScale-900">
              {analytics?.total_clicks ?? 0}
            </div>
            <p className="mt-1 text-xs text-grayScale-500">
              Unique link redirect visits
            </p>
          </CardContent>
        </Card>

        {/* Referred Signups */}
        <Card className="border border-grayScale-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-grayScale-500">
              Referred Signups
            </CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-grayScale-900">
              {analytics?.total_referred_users ?? 0}
            </div>
            <p className="mt-1 text-xs text-emerald-600 font-medium">
              {analytics?.click_to_signup_rate?.toFixed(1) ?? "0.0"}% click-to-signup conv.
            </p>
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
            <div className="text-2xl font-bold text-grayScale-900">
              {analytics?.total_paying_users ?? 0}
            </div>
            <p className="mt-1 text-xs text-blue-600 font-medium">
              {analytics?.signup_to_paid_rate?.toFixed(1) ?? "0.0"}% signup-to-paid conv.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-grayScale-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("revenue")}
            className={`border-b-2 py-3 text-sm font-medium transition-colors ${
              activeTab === "revenue"
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-grayScale-500 hover:border-grayScale-300 hover:text-grayScale-700"
            }`}
          >
            Revenue & Payments Breakdown
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`border-b-2 py-3 text-sm font-medium transition-colors ${
              activeTab === "users"
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-grayScale-500 hover:border-grayScale-300 hover:text-grayScale-700"
            }`}
          >
            Referred Users ({analytics?.total_referred_users ?? 0})
          </button>
          <button
            onClick={() => setActiveTab("clicks")}
            className={`border-b-2 py-3 text-sm font-medium transition-colors ${
              activeTab === "clicks"
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-grayScale-500 hover:border-grayScale-300 hover:text-grayScale-700"
            }`}
          >
            Click Stream Logs ({analytics?.total_clicks ?? 0})
          </button>
        </nav>
      </div>

      {/* Tab 1: Revenue Breakdown */}
      {activeTab === "revenue" && (
        <div className="space-y-6">
          {/* Daily Breakdown Table */}
          <Card className="border border-grayScale-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-grayScale-900">
                Daily Performance Breakdown
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="border-b border-grayScale-200 bg-grayScale-50/75 text-xs font-semibold uppercase text-grayScale-500">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Clicks</th>
                    <th className="px-6 py-3">Signups</th>
                    <th className="px-6 py-3">Gross Revenue (ETB)</th>
                    <th className="px-6 py-3">Commission Earned (ETB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-grayScale-100 text-grayScale-700">
                  {analytics?.daily_breakdown && analytics.daily_breakdown.length > 0 ? (
                    analytics.daily_breakdown.map((row) => (
                      <tr key={row.date} className="hover:bg-grayScale-50/50">
                        <td className="px-6 py-3.5 font-medium text-grayScale-900">
                          {row.date}
                        </td>
                        <td className="px-6 py-3.5">{row.clicks}</td>
                        <td className="px-6 py-3.5 font-medium text-emerald-600">
                          {row.registrations}
                        </td>
                        <td className="px-6 py-3.5 font-medium text-grayScale-900">
                          {formatCurrency(row.revenue)}
                        </td>
                        <td className="px-6 py-3.5 font-medium text-amber-600">
                          {formatCurrency(row.commission)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-grayScale-500">
                        No daily revenue records available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Recent Attributed Payments */}
          <Card className="border border-grayScale-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-grayScale-900">
                Recent Attributed Subscription Payments
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="border-b border-grayScale-200 bg-grayScale-50/75 text-xs font-semibold uppercase text-grayScale-500">
                  <tr>
                    <th className="px-6 py-3">Payment ID</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Commission</th>
                    <th className="px-6 py-3">Method</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-grayScale-100 text-grayScale-700">
                  {analytics?.recent_payments && analytics.recent_payments.length > 0 ? (
                    analytics.recent_payments.map((p) => (
                      <tr key={p.payment_id} className="hover:bg-grayScale-50/50">
                        <td className="px-6 py-3.5 font-mono text-xs font-semibold text-grayScale-800">
                          #{p.payment_id}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="font-semibold text-grayScale-900">
                            {p.user_name || `User #${p.user_id}`}
                          </div>
                          <div className="text-xs text-grayScale-500">
                            {p.user_phone || p.user_email || `ID: ${p.user_id}`}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 font-bold text-grayScale-900">
                          {formatCurrency(p.amount)} {p.currency}
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-amber-600">
                          +{formatCurrency(p.commission)} {p.currency}
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge variant="outline">{p.payment_method || "Online"}</Badge>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-grayScale-500">
                          {new Date(p.paid_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-grayScale-500">
                        No attributed subscription payments yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Referred Users */}
      {activeTab === "users" && (
        <Card className="border border-grayScale-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-grayScale-200 bg-grayScale-50/75 text-xs font-semibold uppercase text-grayScale-500">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Attribution Channel</th>
                  <th className="px-6 py-3.5">Subscription Status</th>
                  <th className="px-6 py-3.5">Lifetime Spend</th>
                  <th className="px-6 py-3.5">Payments</th>
                  <th className="px-6 py-3.5">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grayScale-100 text-grayScale-700">
                {tabLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-grayScale-500">
                      <SpinnerIcon className="mx-auto mb-2 h-6 w-6" />
                      Loading referred users...
                    </td>
                  </tr>
                ) : referredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-grayScale-500">
                      <Users className="mx-auto mb-2 h-8 w-8 text-grayScale-300" />
                      No users have registered with this referral code yet.
                    </td>
                  </tr>
                ) : (
                  referredUsers.map((u) => {
                    const fullName =
                      [u.first_name, u.last_name].filter(Boolean).join(" ") ||
                      `User #${u.user_id}`
                    return (
                      <tr key={u.user_id} className="hover:bg-grayScale-50/50">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-grayScale-900">
                            <Link
                              to={`/users/${u.user_id}`}
                              className="hover:text-primary-600 hover:underline"
                            >
                              {fullName}
                            </Link>
                          </div>
                          <div className="text-xs text-grayScale-500">
                            {u.phone_number || u.email || `ID: ${u.user_id}`}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline">{u.attribution_type}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          {u.has_active_subscription ? (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Active Subscriber
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Free / Inactive</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-grayScale-900">
                          {formatCurrency(u.total_spent)} ETB
                        </td>
                        <td className="px-6 py-4 font-medium text-grayScale-700">
                          {u.payments_count}
                        </td>
                        <td className="px-6 py-4 text-xs text-grayScale-500">
                          {new Date(u.attributed_at).toLocaleDateString()}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {usersTotal > 0 && (
            <div className="flex items-center justify-between border-t border-grayScale-200 px-6 py-3 text-xs text-grayScale-500">
              <div>
                Showing {Math.min((usersPage - 1) * pageSize + 1, usersTotal)} to{" "}
                {Math.min(usersPage * pageSize, usersTotal)} of {usersTotal} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                  disabled={usersPage <= 1}
                >
                  Previous
                </Button>
                <span>
                  Page {usersPage} of {Math.ceil(usersTotal / pageSize) || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUsersPage((p) => p + 1)}
                  disabled={usersPage * pageSize >= usersTotal}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Tab 3: Click Stream Logs */}
      {activeTab === "clicks" && (
        <Card className="border border-grayScale-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-grayScale-200 bg-grayScale-50/75 text-xs font-semibold uppercase text-grayScale-500">
                <tr>
                  <th className="px-6 py-3.5">Click ID</th>
                  <th className="px-6 py-3.5">Platform</th>
                  <th className="px-6 py-3.5">IP Address</th>
                  <th className="px-6 py-3.5">Country</th>
                  <th className="px-6 py-3.5">Referer</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grayScale-100 text-grayScale-700">
                {tabLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-grayScale-500">
                      <SpinnerIcon className="mx-auto mb-2 h-6 w-6" />
                      Loading clicks...
                    </td>
                  </tr>
                ) : clicks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-grayScale-500">
                      <MousePointer className="mx-auto mb-2 h-8 w-8 text-grayScale-300" />
                      No clicks recorded for this influencer code yet.
                    </td>
                  </tr>
                ) : (
                  clicks.map((c) => (
                    <tr key={c.id} className="hover:bg-grayScale-50/50">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-grayScale-800">
                        #{c.id}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">{c.platform}</Badge>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-grayScale-600">
                        {c.ip_address || "—"}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-grayScale-700">
                        {c.country || "—"}
                      </td>
                      <td className="max-w-xs truncate px-6 py-4 text-xs text-grayScale-500">
                        {c.referer || "Direct"}
                      </td>
                      <td className="px-6 py-4 text-xs text-grayScale-500">
                        {new Date(c.clicked_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {clicksTotal > 0 && (
            <div className="flex items-center justify-between border-t border-grayScale-200 px-6 py-3 text-xs text-grayScale-500">
              <div>
                Showing {Math.min((clicksPage - 1) * pageSize + 1, clicksTotal)} to{" "}
                {Math.min(clicksPage * pageSize, clicksTotal)} of {clicksTotal} clicks
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setClicksPage((p) => Math.max(1, p - 1))}
                  disabled={clicksPage <= 1}
                >
                  Previous
                </Button>
                <span>
                  Page {clicksPage} of {Math.ceil(clicksTotal / pageSize) || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setClicksPage((p) => p + 1)}
                  disabled={clicksPage * pageSize >= clicksTotal}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Edit Modal */}
      <EditInfluencerModal
        influencer={influencer}
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={(updated) => {
          setInfluencer(updated)
          fetchOverview()
        }}
      />
    </div>
  )
}
