import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Plus,
  Search,
  Shield,
  ShieldCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Eye,
  X,
  Pencil,
  Check,
  Trash2,
  UserX,
  UserCheck,
  Mail,
} from "lucide-react"
import { notifyApiError } from "../../lib/apiErrors"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "../../components/ui/dialog"
import {
  getRoles,
  getRoleDetail,
  getAllPermissions,
  setRolePermissions,
  updateRole,
  deleteRole,
  bulkDeactivateRole,
  bulkReactivateRole,
} from "../../api/rbac.api"
import type { Role, RoleDetail, RolePermission } from "../../types/rbac.types"
import { cn } from "../../lib/utils"
import { DEFAULT_TABLE_PAGE_SIZE, TABLE_PAGE_SIZE_OPTIONS } from "../../lib/tablePagination"
import { toast } from "sonner"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { InviteTeamMemberDialog } from "./components/InviteTeamMemberDialog"
import { SuperAdminOnly } from "../../components/access/AdminAccessGates"
import { STAFF_TEAM_ROLE_OPTIONS } from "../../lib/teamRoles"

export function RolesListPage() {
  const navigate = useNavigate()
  const staffRoleNames = useMemo(
    () => new Set(STAFF_TEAM_ROLE_OPTIONS.map((o) => o.value)),
    [],
  )

  // List state
  const [roles, setRoles] = useState<Role[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Detail modal state
  const [selectedRole, setSelectedRole] = useState<RoleDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  // Delete modal state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  /** Bulk deactivate / reactivate (users + team members for this role). */
  const [bulkDialog, setBulkDialog] = useState<{
    type: "deactivate" | "reactivate"
    role: Role
  } | null>(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  // Role info editing state
  const [editingRole, setEditingRole] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [savingRole, setSavingRole] = useState(false)

  // Permissions editing state
  const [editingPermissions, setEditingPermissions] = useState(false)
  const [allPermissionsMap, setAllPermissionsMap] = useState<Record<string, RolePermission[]>>({})
  const [permLoading, setPermLoading] = useState(false)
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<number>>(new Set())
  const [permSearch, setPermSearch] = useState("")
  const [savingPermissions, setSavingPermissions] = useState(false)

  const [inviteForRole, setInviteForRole] = useState<Role | null>(null)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  const fetchRoles = useCallback(async () => {
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
  }, [debouncedQuery, page, pageSize])

  // Fetch roles
  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  // Open role detail
  const handleViewRole = async (roleId: number) => {
    setDetailOpen(true)
    setDetailLoading(true)
    setSelectedRole(null)
    try {
      const res = await getRoleDetail(roleId)
      setSelectedRole(res.data.data)
    } catch (err: unknown) {
      notifyApiError(err, "Failed to load role details.")
      setDetailOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleDeleteRoleClick = (role: Role) => {
    setRoleToDelete(role)
    setDeleteDialogOpen(true)
  }

  const handleCancelDeleteRole = () => {
    setDeleteDialogOpen(false)
    setRoleToDelete(null)
  }

  const handleCancelBulkDialog = () => {
    setBulkDialog(null)
  }

  const handleConfirmBulkAction = async () => {
    if (!bulkDialog) return
    const { type, role } = bulkDialog
    setBulkActionLoading(true)
    try {
      if (type === "deactivate") {
        const res = await bulkDeactivateRole(role.id)
        const d = res.data.data
        toast.success(res.data.message ?? "Bulk deactivation completed", {
          description: `${d.role}: ${d.users_deactivated} user(s), ${d.team_members_deactivated} team member(s) deactivated.`,
        })
      } else {
        const res = await bulkReactivateRole(role.id)
        const d = res.data.data
        toast.success(res.data.message ?? "Bulk reactivation completed", {
          description: `${d.role}: ${d.users_reactivated} user(s), ${d.team_members_reactivated} team member(s) reactivated.`,
        })
      }
      setBulkDialog(null)
    } catch (err: unknown) {
      notifyApiError(
        err,
        type === "deactivate" ? "Bulk deactivation failed." : "Bulk reactivation failed.",
      )
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleConfirmDeleteRole = async () => {
    if (!roleToDelete) return
    setDeleteLoading(true)
    try {
      const res = await deleteRole(roleToDelete.id)
      toast.success(res.data.message ?? "Role deleted successfully")

      // Close dialogs if the deleted role is currently opened.
      if (selectedRole?.id === roleToDelete.id) {
        setDetailOpen(false)
        setSelectedRole(null)
        setEditingPermissions(false)
        setEditingRole(false)
        setPermSearch("")
      }

      setRoleToDelete(null)
      setDeleteDialogOpen(false)
      await fetchRoles()
    } catch (err: unknown) {
      notifyApiError(err, "Failed to delete role.")
    } finally {
      setDeleteLoading(false)
    }
  }

  // Enter role info edit mode
  const handleEditRole = () => {
    if (!selectedRole) return
    setEditName(selectedRole.name)
    setEditDescription(selectedRole.description)
    setEditingRole(true)
  }

  const handleCancelEditRole = () => {
    setEditingRole(false)
  }

  const handleSaveRole = async () => {
    if (!selectedRole || !editName.trim()) return
    setSavingRole(true)
    try {
      await updateRole(selectedRole.id, {
        name: editName.trim(),
        description: editDescription.trim(),
      })
      const res = await getRoleDetail(selectedRole.id)
      setSelectedRole(res.data.data)
      setEditingRole(false)
      toast.success("Role updated successfully.")
    } catch (err: unknown) {
      notifyApiError(err, "Failed to update role.")
    } finally {
      setSavingRole(false)
    }
  }

  // Enter edit mode – fetch all permissions
  const handleEditPermissions = async () => {
    setEditingPermissions(true)
    setPermSearch("")
    setSelectedPermissionIds(new Set(selectedRole?.permissions.map((p) => p.id) ?? []))

    if (Object.keys(allPermissionsMap).length === 0) {
      setPermLoading(true)
      try {
        const res = await getAllPermissions()
        setAllPermissionsMap(res.data.data ?? {})
      } catch (err: unknown) {
        notifyApiError(err, "Failed to load permissions.")
        setEditingPermissions(false)
      } finally {
        setPermLoading(false)
      }
    }
  }

  const handleCancelEdit = () => {
    setEditingPermissions(false)
    setPermSearch("")
  }

  const togglePermission = (id: number) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleGroup = (perms: RolePermission[]) => {
    const allSelected = perms.every((p) => selectedPermissionIds.has(p.id))
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev)
      for (const p of perms) {
        if (allSelected) next.delete(p.id)
        else next.add(p.id)
      }
      return next
    })
  }

  const handleSavePermissions = async () => {
    if (!selectedRole) return
    setSavingPermissions(true)
    try {
      await setRolePermissions(selectedRole.id, {
        permission_ids: Array.from(selectedPermissionIds),
      })
      // Refresh role detail
      const res = await getRoleDetail(selectedRole.id)
      setSelectedRole(res.data.data)
      setEditingPermissions(false)
      toast.success("Permissions updated successfully.")
    } catch (err: unknown) {
      notifyApiError(err, "Failed to update permissions.")
    } finally {
      setSavingPermissions(false)
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

  // Filtered permission groups for edit mode
  const editPermissionGroups = useMemo(() => {
    const q = permSearch.toLowerCase()
    const entries: [string, RolePermission[]][] = []
    for (const [groupName, perms] of Object.entries(allPermissionsMap)) {
      const filtered = q
        ? perms.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.key.toLowerCase().includes(q) ||
              groupName.toLowerCase().includes(q),
          )
        : perms
      if (filtered.length > 0) entries.push([groupName, filtered])
    }
    return entries.sort(([a], [b]) => a.localeCompare(b))
  }, [allPermissionsMap, permSearch])

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
          <SpinnerIcon className="h-8 w-8" />
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
                  className="overflow-hidden border border-grayScale-100 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div
                    className={cn(
                      "h-1.5",
                      role.is_system
                        ? "bg-gradient-to-r from-brand-400 to-brand-600"
                        : "bg-gradient-to-r from-brand-500 to-brand-600",
                    )}
                  />
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg",
                            role.is_system
                              ? "bg-brand-100 text-brand-600"
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
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-grayScale-700">
                            {role.name}
                          </h3>
                          <p className="mt-0.5 text-xs text-grayScale-500 line-clamp-2">
                            {role.description?.trim() || "No description provided for this role."}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={role.is_system ? "warning" : "outline"}
                        className="shrink-0 text-[10px]"
                      >
                        {role.is_system ? "System" : "Custom"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-grayScale-100 bg-grayScale-50/70 p-2.5 text-[11px]">
                      <div>
                        <p className="text-grayScale-400">Role ID</p>
                        <p className="font-semibold text-grayScale-700">#{role.id}</p>
                      </div>
                      <div>
                        <p className="text-grayScale-400">Created</p>
                        <p className="font-semibold text-grayScale-700">
                          {new Date(role.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <SuperAdminOnly>
                    {staffRoleNames.has(role.name.toUpperCase()) ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 w-full gap-1.5 border-brand-200 text-xs text-brand-600 hover:bg-brand-50"
                      onClick={() => setInviteForRole(role)}
                      disabled={deleteLoading || bulkActionLoading}
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      Invite team members
                    </Button>
                    ) : null}
                    </SuperAdminOnly>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs text-grayScale-700"
                        onClick={() => setBulkDialog({ type: "deactivate", role })}
                        disabled={deleteLoading || bulkActionLoading}
                      >
                        <UserX className="h-3.5 w-3.5 shrink-0" />
                        Deactivate all
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs text-grayScale-700"
                        onClick={() => setBulkDialog({ type: "reactivate", role })}
                        disabled={deleteLoading || bulkActionLoading}
                      >
                        <UserCheck className="h-3.5 w-3.5 shrink-0" />
                        Reactivate all
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-grayScale-400">
                        Open details to view permissions
                      </span>
                      <div className="flex items-center gap-2">
                        {!role.is_system && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDeleteRoleClick(role)}
                            disabled={deleteLoading}
                            aria-label={`Delete role ${role.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-grayScale-100 pt-4 text-sm text-grayScale-500">
              <div className="flex flex-wrap items-center gap-2">
                <span>
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} roles
                </span>
                <span className="hidden h-4 w-px bg-grayScale-200 sm:inline" />
                <span className="flex items-center gap-2">
                  Rows per page
                  <div className="relative">
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                        setPage(1)
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
              {totalPages > 1 ? (
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
              ) : null}
            </div>
          )}
        </>
      )}

      {/* Role detail dialog */}
      <Dialog open={detailOpen} onOpenChange={(open) => {
        setDetailOpen(open)
        if (!open) {
          setEditingPermissions(false)
          setEditingRole(false)
          setPermSearch("")
        }
      }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            {!editingRole ? (
              <>
                <DialogTitle className="flex items-center gap-2">
                  {selectedRole?.is_system ? (
                    <ShieldCheck className="h-5 w-5 text-brand-500" />
                  ) : (
                    <Shield className="h-5 w-5 text-brand-500" />
                  )}
                  {selectedRole?.name ?? "Role Details"}
                  {selectedRole && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto h-7 w-7"
                      onClick={handleEditRole}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {selectedRole?.description}
                </DialogDescription>
              </>
            ) : (
              <>
                <DialogTitle>Edit Role</DialogTitle>
                <DialogDescription>Update the role name and description.</DialogDescription>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-grayScale-500">
                      Role Name
                    </label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. CONTENT_MANAGER"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-grayScale-500">
                      Description
                    </label>
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Describe what this role can do…"
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={handleCancelEditRole}
                      disabled={savingRole}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 bg-brand-500 text-xs hover:bg-brand-600"
                      onClick={handleSaveRole}
                      disabled={savingRole || !editName.trim()}
                    >
                      {savingRole && <SpinnerIcon className="h-3.5 w-3.5" />}
                      {savingRole ? "Saving…" : "Save"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogHeader>

          {detailLoading && (
            <div className="flex items-center justify-center py-12">
              <SpinnerIcon className="h-6 w-6" />
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

              {/* Permissions section */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-grayScale-600">Permissions</h4>
                  {!editingPermissions && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 text-xs"
                      onClick={handleEditPermissions}
                    >
                      <Pencil className="h-3 w-3" />
                      Edit Permissions
                    </Button>
                  )}
                </div>

                {/* VIEW mode */}
                {!editingPermissions && (
                  <>
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
                  </>
                )}

                {/* EDIT mode */}
                {editingPermissions && (
                  <div className="space-y-4">
                    {/* Search & actions bar */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
                        <Input
                          value={permSearch}
                          onChange={(e) => setPermSearch(e.target.value)}
                          placeholder="Filter permissions…"
                          className="pl-9"
                        />
                        {permSearch && (
                          <button
                            type="button"
                            onClick={() => setPermSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-grayScale-400 hover:text-grayScale-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-grayScale-400">
                        {selectedPermissionIds.size} selected
                      </span>
                    </div>

                    {permLoading && (
                      <div className="flex items-center justify-center py-10">
                        <SpinnerIcon className="h-6 w-6" />
                      </div>
                    )}

                    {!permLoading && (
                      <div className="max-h-[400px] space-y-5 overflow-y-auto pr-1">
                        {editPermissionGroups.length === 0 ? (
                          <p className="py-6 text-center text-xs text-grayScale-400">
                            {permSearch ? "No permissions match your search." : "No permissions available."}
                          </p>
                        ) : (
                          editPermissionGroups.map(([groupName, perms]) => {
                            const allSelected = perms.every((p) => selectedPermissionIds.has(p.id))
                            const someSelected = perms.some((p) => selectedPermissionIds.has(p.id))

                            return (
                              <div key={groupName}>
                                <div className="mb-2 flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleGroup(perms)}
                                    className={cn(
                                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                                      allSelected
                                        ? "border-brand-500 bg-brand-500 text-white"
                                        : someSelected
                                          ? "border-brand-300 bg-brand-50"
                                          : "border-grayScale-300",
                                    )}
                                  >
                                    {allSelected && <Check className="h-3 w-3" />}
                                    {someSelected && !allSelected && (
                                      <div className="h-1.5 w-1.5 rounded-sm bg-brand-500" />
                                    )}
                                  </button>
                                  <span className="text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                                    {groupName}
                                  </span>
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    {perms.filter((p) => selectedPermissionIds.has(p.id)).length}/{perms.length}
                                  </Badge>
                                </div>
                                <div className="ml-6 grid gap-1">
                                  {perms.map((perm) => {
                                    const isSelected = selectedPermissionIds.has(perm.id)
                                    return (
                                      <label
                                        key={perm.id}
                                        className={cn(
                                          "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors",
                                          isSelected
                                            ? "border-brand-200 bg-brand-50/50"
                                            : "border-grayScale-100 hover:bg-grayScale-50",
                                        )}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => togglePermission(perm.id)}
                                          className="h-3.5 w-3.5 rounded border-grayScale-300 text-brand-500 focus:ring-brand-500"
                                        />
                                        <div className="min-w-0 flex-1">
                                          <p className="truncate text-xs font-medium text-grayScale-700">
                                            {perm.name}
                                          </p>
                                          <p className="truncate text-[10px] text-grayScale-400">
                                            {perm.key}
                                          </p>
                                        </div>
                                      </label>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}

                    {/* Save / Cancel */}
                    <div className="flex items-center justify-end gap-2 border-t border-grayScale-100 pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={handleCancelEdit}
                        disabled={savingPermissions}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 gap-1.5 bg-brand-500 text-xs hover:bg-brand-600"
                        onClick={handleSavePermissions}
                        disabled={savingPermissions}
                      >
                        {savingPermissions && <SpinnerIcon className="h-3.5 w-3.5" />}
                        {savingPermissions ? "Saving…" : "Save Permissions"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk deactivate / reactivate confirmation */}
      <Dialog
        open={bulkDialog != null}
        onOpenChange={(open) => {
          if (!open) handleCancelBulkDialog()
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {bulkDialog?.type === "deactivate" ? (
                <>
                  <UserX className="h-5 w-5 text-amber-600" />
                  Deactivate all for this role?
                </>
              ) : (
                <>
                  <UserCheck className="h-5 w-5 text-brand-600" />
                  Reactivate all for this role?
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {bulkDialog?.type === "deactivate"
                ? "This deactivates every user and team member currently assigned to this role. They can be reactivated later with Reactivate all."
                : "This reactivates users and team members tied to this role who were deactivated in bulk for this role."}
            </DialogDescription>
          </DialogHeader>

          {bulkDialog && (
            <div className="rounded-lg border border-grayScale-100 bg-grayScale-50/80 p-3">
              <p className="text-sm font-semibold text-grayScale-700">{bulkDialog.role.name}</p>
              <p className="text-xs text-grayScale-500">Role #{bulkDialog.role.id}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelBulkDialog}
              disabled={bulkActionLoading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className={
                bulkDialog?.type === "deactivate"
                  ? "gap-1.5 bg-amber-600 hover:bg-amber-700"
                  : "gap-1.5 bg-brand-500 hover:bg-brand-600"
              }
              disabled={bulkActionLoading || !bulkDialog}
              onClick={handleConfirmBulkAction}
            >
              {bulkActionLoading && <SpinnerIcon className="h-3.5 w-3.5" />}
              {bulkActionLoading
                ? "Working…"
                : bulkDialog?.type === "deactivate"
                  ? "Deactivate all"
                  : "Reactivate all"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete role dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) handleCancelDeleteRole()
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Role
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this role? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {roleToDelete && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3">
              <p className="text-sm font-medium text-red-700">{roleToDelete.name}</p>
              <p className="text-xs text-red-500 mt-0.5">Role #{roleToDelete.id}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelDeleteRole}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              disabled={deleteLoading || !roleToDelete}
              onClick={handleConfirmDeleteRole}
            >
              {deleteLoading ? <SpinnerIcon className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <InviteTeamMemberDialog
        open={inviteForRole !== null}
        onOpenChange={(open) => {
          if (!open) setInviteForRole(null)
        }}
        presetTeamRole={inviteForRole?.name}
        presetRoleLabel={inviteForRole?.name}
      />
    </div>
  )
}
