import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Loader2, Search, X, Check } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Badge } from "../../components/ui/badge"
import { createRole, setRolePermissions, getAllPermissions } from "../../api/rbac.api"
import type { RolePermission } from "../../types/rbac.types"
import { cn } from "../../lib/utils"
import { toast } from "sonner"

export function AddRolePage() {
  const navigate = useNavigate()

  const [roleName, setRoleName] = useState("")
  const [roleDescription, setRoleDescription] = useState("")
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<number>>(new Set())

  // Permissions from API (already grouped by group_name)
  const [permissionsMap, setPermissionsMap] = useState<Record<string, RolePermission[]>>({})
  const [permLoading, setPermLoading] = useState(true)
  const [permSearch, setPermSearch] = useState("")

  const [saving, setSaving] = useState(false)

  // Load all available permissions
  useEffect(() => {
    const fetch = async () => {
      setPermLoading(true)
      try {
        const res = await getAllPermissions()
        setPermissionsMap(res.data.data ?? {})
      } catch {
        toast.error("Failed to load permissions.")
      } finally {
        setPermLoading(false)
      }
    }
    fetch()
  }, [])

  // Flat list of all permissions (for select-all / count)
  const allPermissions = useMemo(
    () => Object.values(permissionsMap).flat(),
    [permissionsMap],
  )

  // Filtered & sorted groups
  const permissionGroups = useMemo(() => {
    const q = permSearch.toLowerCase()
    const entries: [string, RolePermission[]][] = []

    for (const [groupName, perms] of Object.entries(permissionsMap)) {
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
  }, [permissionsMap, permSearch])

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

  const selectAll = () => {
    setSelectedPermissionIds(new Set(allPermissions.map((p) => p.id)))
  }

  const clearAll = () => {
    setSelectedPermissionIds(new Set())
  }

  const handleSubmit = async () => {
    if (!roleName.trim()) {
      toast.error("Role name is required.")
      return
    }

    setSaving(true)
    try {
      // 1. Create the role
      const res = await createRole({
        name: roleName.trim(),
        description: roleDescription.trim(),
      })
      const newRoleId = res.data.data.id

      // 2. Assign permissions if any selected
      if (selectedPermissionIds.size > 0) {
        await setRolePermissions(newRoleId, {
          permission_ids: Array.from(selectedPermissionIds),
        })
      }

      toast.success(`Role "${res.data.data.name}" created successfully.`)
      navigate("/roles")
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to create role."
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/roles")} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-grayScale-700">Add New Role</h1>
          <p className="text-xs text-grayScale-400">Create a role and assign permissions.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        {/* Left – Role info */}
        <Card className="h-fit shadow-soft">
          <CardHeader className="border-b border-grayScale-200 pb-3">
            <CardTitle className="text-sm font-semibold text-grayScale-600">
              Role Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-grayScale-500">
                Role Name
              </label>
              <Input
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. CONTENT_MANAGER"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-grayScale-500">
                Description
              </label>
              <Textarea
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                placeholder="Describe what this role can do…"
                rows={3}
              />
            </div>

            <div className="border-t border-grayScale-100 pt-4">
              <div className="flex items-center justify-between text-xs text-grayScale-400">
                <span>{selectedPermissionIds.size} permission{selectedPermissionIds.size !== 1 ? "s" : ""} selected</span>
                <span>{allPermissions.length} available</span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={saving || !roleName.trim()}
              className="w-full bg-brand-500 hover:bg-brand-600"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Creating…" : "Create Role"}
            </Button>
          </CardContent>
        </Card>

        {/* Right – Permissions picker */}
        <Card className="shadow-soft">
          <CardHeader className="border-b border-grayScale-200 pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm font-semibold text-grayScale-600">
                Permissions
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={selectAll}
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={clearAll}
                  disabled={selectedPermissionIds.size === 0}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Search */}
            <div className="relative">
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

            {/* Loading */}
            {permLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
              </div>
            )}

            {/* Permission groups */}
            {!permLoading && (
              <div className="max-h-[500px] space-y-5 overflow-y-auto pr-1">
                {permissionGroups.length === 0 ? (
                  <p className="py-8 text-center text-xs text-grayScale-400">
                    {permSearch ? "No permissions match your search." : "No permissions available."}
                  </p>
                ) : (
                  permissionGroups.map(([groupName, perms]) => {
                    const allSelected = perms.every((p) => selectedPermissionIds.has(p.id))
                    const someSelected = perms.some((p) => selectedPermissionIds.has(p.id))

                    return (
                      <div key={groupName}>
                        {/* Group header */}
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

                        {/* Permission items */}
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
