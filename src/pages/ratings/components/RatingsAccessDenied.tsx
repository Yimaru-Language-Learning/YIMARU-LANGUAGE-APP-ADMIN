import { useState } from "react"
import { Link } from "react-router-dom"
import { LogOut, RefreshCw, Star } from "lucide-react"
import { toast } from "sonner"
import { syncRbacPermissions } from "../../../api/rbac.api"
import { Button } from "../../../components/ui/button"
import { Card, CardContent } from "../../../components/ui/card"
import { SpinnerIcon } from "../../../components/ui/spinner-icon"
import { getSessionTeamRole, hasRatingsRoleBypass } from "../../../lib/ratingsPermissions"
import { RATINGS_FORBIDDEN_MESSAGE } from "../../../lib/ratingsErrors"

type RatingsAccessDeniedProps = {
  apiForbidden?: boolean
}

export function RatingsAccessDenied({ apiForbidden = false }: RatingsAccessDeniedProps) {
  const [syncing, setSyncing] = useState(false)
  const teamRole = getSessionTeamRole()
  const canSync = hasRatingsRoleBypass()

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
          <Star className="h-10 w-10 text-grayScale-300" />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-grayScale-800">
              {apiForbidden ? "App reviews access denied" : "No permission to view app reviews"}
            </h2>
            <p className="text-sm text-grayScale-600">
              {apiForbidden
                ? RATINGS_FORBIDDEN_MESSAGE
                : "Your account does not have the ratings.list_by_target permission."}
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
              <li>Use a team account with ADMIN or SUPER_ADMIN, or explicit ratings permissions</li>
              <li>Ensure migration 000017_ratings is applied on the API database</li>
              <li>Run RBAC sync, then sign out and sign in again for a fresh token</li>
              <li>Custom roles need ratings.list_by_target and ratings.summary assigned</li>
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
