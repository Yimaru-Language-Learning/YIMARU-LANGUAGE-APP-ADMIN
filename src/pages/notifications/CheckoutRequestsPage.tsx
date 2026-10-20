import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { RefreshCw, Search } from "lucide-react"
import { getCheckoutRequests, type CheckoutRequest } from "../../api/checkout-requests.api"
import { checkoutRequestStatus } from "../../lib/checkoutRequests"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { TablePagination } from "../../components/admin/TablePagination"
import { useTeamPermissions } from "../../hooks/useTeamPermissions"
import { hasActivityLogPermission } from "../../lib/activityLogPermissions"

export function CheckoutRequestsPage() {
  const { permissions, loading: permissionsLoading } = useTeamPermissions()
  const allowed = hasActivityLogPermission("activity_logs.list", permissions)
  const [search, setSearch] = useState("")
  const [channel, setChannel] = useState("")
  const [source, setSource] = useState("")
  const [offset, setOffset] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [revision, setRevision] = useState(0)
  const [rows, setRows] = useState<CheckoutRequest[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (permissionsLoading || !allowed) return
    const controller = new AbortController()
    let current = true
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError(false)
      void getCheckoutRequests({ search: search.trim(), channel, source, limit: pageSize, offset }, controller.signal)
        .then((data) => {
          if (!current) return
          setRows(data.requests)
          setTotal(data.total_count)
        })
        .catch(() => { if (current) setError(true) })
        .finally(() => { if (current) setLoading(false) })
    }, 250)
    return () => { current = false; window.clearTimeout(timer); controller.abort() }
  }, [permissionsLoading, allowed, search, channel, source, pageSize, offset, revision])

  if (permissionsLoading) return <p role="status">Checking access…</p>
  if (!allowed) return <p>You do not have permission to view checkout requests.</p>

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-grayScale-600">Checkout requests</h1>
        <p className="mt-1 text-sm text-grayScale-400">Track learner checkout links and verified iOS phone numbers for hardcopy follow-up.</p>
      </div>
      <Button variant="outline" disabled={loading} onClick={() => setRevision((n) => n + 1)}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
    </div>
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-grayScale-400" />
            <Input aria-label="Search checkout requests" className="pl-9" placeholder="Search name, email, phone or user ID" maxLength={200} value={search} onChange={(e) => { setSearch(e.target.value); setOffset(0) }} />
          </div>
          <select aria-label="Delivery channel" className="h-10 rounded-md border bg-white px-3 text-sm" value={channel} onChange={(e) => { setChannel(e.target.value); setOffset(0) }}>
            <option value="">All channels</option><option value="sms">SMS</option><option value="email">Email</option>
          </select>
          <select aria-label="Request source" className="h-10 rounded-md border bg-white px-3 text-sm" value={source} onChange={(e) => { setSource(e.target.value); setOffset(0) }}>
            <option value="">All sources (includes legacy)</option><option value="ios">iOS only</option>
          </select>
        </div>
        <p className="text-xs text-grayScale-400">Provider acceptance is not proof of arrival in the inbox or payment. Unconfirmed requests may still have arrived; do not immediately resend. Contacts are snapshots at request time. Older records may lack platform or destination details. This page does not send messages or manage deliveries.</p>
      </CardContent>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Learner</TableHead><TableHead>Requested at</TableHead><TableHead>Source</TableHead><TableHead>Channel / contact</TableHead><TableHead>Category</TableHead><TableHead>Outcome</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} role="status" className="p-8 text-center">Loading requests…</TableCell></TableRow>
              : error ? <TableRow><TableCell colSpan={6} className="p-8 text-center"><p role="alert">Could not load checkout requests.</p><Button variant="outline" className="mt-3" onClick={() => setRevision((n) => n + 1)}>Retry</Button></TableCell></TableRow>
                : rows.length === 0 ? <TableRow><TableCell colSpan={6} className="p-8 text-center text-grayScale-400">No checkout requests match these filters.</TableCell></TableRow>
                  : rows.map((row) => <TableRow key={row.id}>
                    <TableCell><Link className="font-medium text-brand-600 hover:underline" to={`/users/${row.user_id}`}>{row.name || `User ${row.user_id}`}</Link><div className="text-xs text-grayScale-400">{row.email || "No email"} · #{row.user_id}</div></TableCell>
                    <TableCell className="whitespace-nowrap">{new Date(row.created_at).toLocaleString()}</TableCell>
                    <TableCell>{row.metadata.source || row.metadata.app_platform || "Unknown (legacy)"}</TableCell>
                    <TableCell><span className="uppercase">{row.metadata.channel || "Unknown"}</span><div className="text-xs text-grayScale-500">{row.metadata.phone_number || row.metadata.destination_hint || "Not recorded"}</div></TableCell>
                    <TableCell>{row.metadata.category?.replaceAll("_", " ") || "Not recorded"}</TableCell>
                    <TableCell><Badge variant="secondary">{checkoutRequestStatus(row)}</Badge></TableCell>
                  </TableRow>)}
          </TableBody>
        </Table>
      </div>
      {!error && <TablePagination startEntry={total ? offset + 1 : 0} endEntry={Math.min(offset + pageSize, total)} totalCount={total} pageSize={pageSize}
        onPageSizeChange={(size) => { setPageSize(size); setOffset(0) }} currentPage={Math.floor(offset / pageSize) + 1} totalPages={Math.max(1, Math.ceil(total / pageSize))}
        onPageChange={(page) => setOffset((page - 1) * pageSize)} disabled={loading} />}
    </Card>
  </div>
}
