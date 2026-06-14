import { useState } from "react"
import { Link } from "react-router-dom"
import { CircleHelp, LogOut, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { syncRbacPermissions } from "../../../api/rbac.api"
import { Button } from "../../../components/ui/button"
import { Card, CardContent } from "../../../components/ui/card"
import { SpinnerIcon } from "../../../components/ui/spinner-icon"
import { getSessionTeamRole, hasFaqRoleBypass } from "../../../lib/faqPermissions"
import { FAQ_FORBIDDEN_MESSAGE } from "../../../lib/faqErrors"

type FaqAccessDeniedProps = {
  apiForbidden?: boolean
}

export function FaqAccessDenied({ apiForbidden = false }: FaqAccessDeniedProps) {
  const [syncing, setSyncing] = useState(false)
  const teamRole = getSessionTeamRole()
  const canSync = hasFaqRoleBypass()

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await syncRbacPermissions()
      toast.success(res.data?.message ?? "RBAC permissions synced. Please sign in again.")
    } catch (e: unknown) {
      console.error(e)
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to sync RBAC permissions"
      toast.error(msg)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <Card className="border border-grayScale-100 shadow-none">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <CircleHelp className="h-10 w-10 text-grayScale-300" />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-grayScale-800">
              {apiForbidden ? "FAQ access denied" : "No permission to view FAQs"}
            </h2>
            <p className="text-sm text-grayScale-600">
              {apiForbidden
                ? FAQ_FORBIDDEN_MESSAGE
                : "Your account does not have the faqs.list permission."}
            </p>
            {teamRole ? (
              <p className="text-xs text-grayScale-500">
                Signed in as team role: <span className="font-medium">{teamRole}</span>
              </p>
            ) : null}
          </div>

          <div className="w-full max-w-md rounded-xl border border-grayScale-200 bg-grayScale-50 px-4 py-3 text-left text-xs text-grayScale-600">
            <p className="font-semibold text-grayScale-700">If you expect access:</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Use a team account mapped to ADMIN, SUPER_ADMIN, or INSTRUCTOR with faqs.* permissions</li>
              <li>Ensure migrations 000059 and 000084 are applied on the API database</li>
              <li>After RBAC sync or deploy, sign out and sign in again for a fresh token</li>
              <li>Custom roles need faqs.list, faqs.get, faqs.create, faqs.update, and faqs.delete assigned</li>
            </ul>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {canSync ? (
              <Button variant="outline" disabled={syncing} onClick={() => void handleSync()}>
                {syncing ? (
                  <SpinnerIcon className="mr-2 h-4 w-4" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Sync RBAC permissions
              </Button>
            ) : null}
            <Button variant="outline" asChild>
              <Link to="/roles">Manage roles</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.clear()
                window.location.href = "/login"
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign in again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
