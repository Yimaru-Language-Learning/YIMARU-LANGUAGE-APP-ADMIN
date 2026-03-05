import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Plus, Search, Shield, ShieldCheck, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, Eye, X,
} from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Input } from "../../components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "../../components/ui/dialog"
import { getRoles, getRoleDetail } from "../../api/rbac.api"
import type { Role, RoleDetail, RolePermission } from "../../types/rbac.types"
import { cn } from "../../lib/utils"
import { toast } from "sonner"

export function RolesListPage() {
  const navigate = useNavigate()

  // List state
  const [roles, setRoles] = useState<Role[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Detail modal state
  const [selectedRole, setSelectedRole] = useState<RoleDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await getRoles({
          query: debouncedQuery || undefined,
          page,
          page_size: pageSize,
        })
        setRoles(res.data.data.roles ?? [])
        setTotal(res.data.data.total ?? 0)
      } catch {
        setError("Failed to load roles.")
      } finally {
        setLoading(false)
      }
    }
    fetchRoles()
  }, [debouncedQuery, page, pageSize])

  // Open role detail
  const handleViewRole = async (roleId: number) => {
    setDetailOpen(true)
    setDetailLoading(true)
    setSelectedRole(null)
    try {
      const res = await getRoleDetail(roleId)
      setSelectedRole(res.data.data)
    } catch {
      toast.error("Failed to load role details.")
      setDetailOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  // Group permissions by group_name
  const permissionGroups = useMemo(() => {
    if (!selectedRole?.permissions) return []
    const map = new Map<string, RolePermission[]>()
    for (const p of selectedRole.permissions) {
      const group = map.get(p.group_name) ?? []
      group.push(p)
      map.set(p.group_name, group)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [selectedRole])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-grayScale-700">Role Management</h1>
          <p className="mt-1 text-sm text-grayScale-400">
            Manage roles and their permissions.
          </p>
        </div>
        <Button
          onClick={() => navigate("/roles/add")}
          className="bg-brand-500 hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          Add New Role
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search roles…"
          className="pl-9"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-grayScale-400 hover:text-grayScale-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      )}

      {/* Roles grid */}
      {!loading && !error && (
        <>
          {roles.length === 0 ? (
            <Card className="shadow-none border border-dashed border-grayScale-200 bg-grayScale-50/60">
              <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <Shield className="h-10 w-10 text-grayScale-300" />
                <p className="text-sm font-semibold text-grayScale-600">No roles found.</p>
                <p className="text-xs text-grayScale-400">
                  {debouncedQuery
                    ? `No roles match "${debouncedQuery}".`
                    : "Create a new role to get started."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => (
                <Card
                  key={role.id}
                  className="overflow-hidden shadow-sm transition-shadow hover:shadow-md"
                >
                  <div
                    className={cn(
                      "h-1.5",
                      role.is_system
                        ? "bg-gradient-to-r from-amber-400 to-amber-500"
                        : "bg-gradient-to-r from-brand-500 to-brand-600",
                    )}
                  />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg",
                            role.is_system
                              ? "bg-amber-50 text-amber-600"
                              : "bg-brand-50 text-brand-600",
                          )}
                        >
                          {role.is_system ? (
                            <ShieldCheck className="h-4.5 w-4.5" />
                          ) : (
                            <Shield className="h-4.5 w-4.5" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-grayScale-700">{role.name}</h3>
                          <p className="mt-0.5 text-xs text-grayScale-400 line-clamp-1">
                            {role.description}
                          </p>
                        </div>
                      </div>
                      {role.is_system && (
                        <Badge variant="warning" className="shrink-0 text-[10px]">
                          System
                        </Badge>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[11px] text-grayScale-400">
                        Created {new Date(role.created_at).toLocaleDateString()}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => handleViewRole(role.id)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-grayScale-100 pt-4">
              <p className="text-xs text-grayScale-400">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} roles
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-xs font-medium text-grayScale-600">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Role detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRole?.is_system ? (
                <ShieldCheck className="h-5 w-5 text-amber-500" />
              ) : (
                <Shield className="h-5 w-5 text-brand-500" />
              )}
              {selectedRole?.name ?? "Role Details"}
            </DialogTitle>
            <DialogDescription>
              {selectedRole?.description}
            </DialogDescription>
          </DialogHeader>

          {detailLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
            </div>
          )}

          {!detailLoading && selectedRole && (
            <div className="space-y-5">
              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-grayScale-400">
                {selectedRole.is_system && (
                  <Badge variant="warning" className="text-[10px]">System Role</Badge>
                )}
                <span>
                  Created {new Date(selectedRole.created_at).toLocaleDateString()}
                </span>
                <span>
                  {selectedRole.permissions.length} permission{selectedRole.permissions.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Permissions grouped */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-grayScale-600">Permissions</h4>
                {permissionGroups.length === 0 ? (
                  <p className="text-xs italic text-grayScale-400">No permissions assigned.</p>
                ) : (
                  <div className="space-y-4">
                    {permissionGroups.map(([groupName, perms]) => (
                      <div key={groupName}>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-grayScale-400">
                          {groupName}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {perms.map((p) => (
                            <span
                              key={p.id}
                              title={`${p.key} — ${p.description}`}
                              className="inline-flex items-center rounded-md border border-grayScale-200 bg-grayScale-50 px-2 py-0.5 text-[11px] font-medium text-grayScale-600"
                            >
                              {p.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
