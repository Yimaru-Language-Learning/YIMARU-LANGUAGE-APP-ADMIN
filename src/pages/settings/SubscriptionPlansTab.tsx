import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Calendar,
  CreditCard,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { getSubscriptionPlans } from "../../api/subscription-plans.api"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { cn } from "../../lib/utils"
import {
  formatPlanCategory,
  formatPlanCreatedAt,
  formatPlanDuration,
  formatPlanPrice,
} from "../../lib/subscriptionPlans"
import type { SubscriptionPlan } from "../../types/subscription.types"
import { CreateSubscriptionPlanDialog } from "./components/CreateSubscriptionPlanDialog"
import { DeleteSubscriptionPlanDialog } from "./components/DeleteSubscriptionPlanDialog"
import { EditSubscriptionPlanDialog } from "./components/EditSubscriptionPlanDialog"

export function SubscriptionPlansTab() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [planToEdit, setPlanToEdit] = useState<SubscriptionPlan | null>(null)
  const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await getSubscriptionPlans()
      setPlans(res.data)
    } catch (e) {
      console.error(e)
      setError(true)
      setPlans([])
      toast.error("Failed to load subscription packages")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...plans]
      .filter((plan) => {
        if (statusFilter === "active" && !plan.is_active) return false
        if (statusFilter === "inactive" && plan.is_active) return false
        if (!q) return true
        const haystack = [plan.name, plan.description, plan.category, plan.currency]
          .join(" ")
          .toLowerCase()
        return haystack.includes(q)
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [plans, query, statusFilter])

  const activeCount = plans.filter((p) => p.is_active).length

  const handleCreated = (plan: SubscriptionPlan) => {
    setPlans((prev) => {
      const without = prev.filter((p) => p.id !== plan.id)
      return [plan, ...without]
    })
  }

  const handleUpdated = (plan: SubscriptionPlan) => {
    setPlans((prev) => prev.map((p) => (p.id === plan.id ? plan : p)))
  }

  const handleDeleted = (id: number) => {
    setPlans((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 min-w-0 w-full max-w-full space-y-6 duration-300">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-500">
            Billing & catalog
          </p>
          <h2 className="text-lg font-bold text-grayScale-900">Subscription packages</h2>
          <p className="mt-1 max-w-2xl text-sm text-grayScale-500">
            Manage learner subscription plans. Create, edit, or remove packages for the learner
            checkout flow.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="shrink-0 rounded-[6px] bg-brand-500 font-semibold text-white hover:bg-brand-600"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New package
          </Button>
          <Button
            variant="outline"
            className="shrink-0 rounded-[6px]"
            disabled={loading}
            onClick={() => void load()}
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
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-grayScale-500">Total packages</p>
              <p className="text-2xl font-bold text-grayScale-900">{plans.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden rounded-[8px] border border-grayScale-100 shadow-none">
          <div className="h-1 bg-mint-500" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-mint-50 text-mint-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-grayScale-500">Active</p>
              <p className="text-2xl font-bold text-grayScale-900">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden rounded-[8px] border border-grayScale-100 shadow-none">
          <div className="h-1 bg-grayScale-300" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-grayScale-100 text-grayScale-500">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-grayScale-500">Inactive</p>
              <p className="text-2xl font-bold text-grayScale-900">{plans.length - activeCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0 rounded-[8px] border border-grayScale-100 shadow-none">
        <CardHeader className="border-b border-grayScale-50 pb-4">
          <CardTitle className="text-sm font-bold text-grayScale-900">All packages</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
              <Input
                className="rounded-[6px] pl-9"
                placeholder="Search by name, description, or category…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "active", label: "Active" },
                  { id: "inactive", label: "Inactive" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    statusFilter === tab.id
                      ? "bg-brand-500 text-white"
                      : "bg-grayScale-100 text-grayScale-600 hover:bg-grayScale-200",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <SpinnerIcon className="h-8 w-8 text-brand-500" />
              <p className="text-sm text-grayScale-500">Loading packages…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[8px] border border-dashed border-grayScale-200 py-16">
              <p className="text-sm font-medium text-grayScale-700">Could not load packages</p>
              <Button variant="outline" size="sm" className="rounded-[6px]" onClick={() => void load()}>
                Try again
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[8px] border border-dashed border-grayScale-200 py-16 text-center">
              <Package className="h-10 w-10 text-grayScale-300" />
              <p className="text-sm font-medium text-grayScale-700">
                {plans.length === 0 ? "No subscription packages yet" : "No packages match your filters"}
              </p>
              <p className="max-w-sm text-xs text-grayScale-500">
                {plans.length === 0
                  ? "Create your first package to offer paid access in the learner app."
                  : "Try a different search or status filter."}
              </p>
              {plans.length === 0 ? (
                <Button
                  className="mt-1 rounded-[6px] bg-brand-500 text-white hover:bg-brand-600"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create package
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="min-w-0 w-full max-w-full overflow-x-auto rounded-[8px] border border-grayScale-100">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead>
                  <tr className="border-b border-grayScale-100 bg-grayScale-50/80 text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                    <th className="px-4 py-3">Package</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-grayScale-50">
                  {filtered.map((plan) => (
                    <tr key={plan.id} className="transition-colors hover:bg-grayScale-50/60">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-grayScale-900">{plan.name}</p>
                        <p className="mt-0.5 line-clamp-2 max-w-xs text-xs text-grayScale-500">
                          {plan.description}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="secondary" className="font-medium">
                          {formatPlanCategory(plan.category)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-grayScale-700">
                        {formatPlanDuration(plan)}
                      </td>
                      <td className="px-4 py-4 font-semibold text-grayScale-900">
                        {formatPlanPrice(plan)}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={plan.is_active ? "success" : "secondary"}>
                          {plan.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-grayScale-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          {formatPlanCreatedAt(plan.created_at)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-[6px] p-0 text-grayScale-500 hover:text-brand-600"
                            aria-label={`Edit ${plan.name}`}
                            onClick={() => setPlanToEdit(plan)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-[6px] p-0 text-grayScale-500 hover:text-destructive"
                            aria-label={`Delete ${plan.name}`}
                            onClick={() => setPlanToDelete(plan)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateSubscriptionPlanDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />

      <EditSubscriptionPlanDialog
        plan={planToEdit}
        open={planToEdit != null}
        onOpenChange={(open) => {
          if (!open) setPlanToEdit(null)
        }}
        onUpdated={handleUpdated}
      />

      <DeleteSubscriptionPlanDialog
        plan={planToDelete}
        open={planToDelete != null}
        onOpenChange={(open) => {
          if (!open) setPlanToDelete(null)
        }}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
