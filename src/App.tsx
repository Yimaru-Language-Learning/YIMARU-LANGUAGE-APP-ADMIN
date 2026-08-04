import { Toaster } from "sonner"
import { AppRoutes } from "./app/AppRoutes"
import { useTheme } from "./contexts/ThemeContext"
import { clearTeamSession } from "./lib/teamAuthStorage"

const SESSION_KEY = "yimaru_session_active"

/**
 * Clear persisted team tokens when this browser tab session is new.
 * Must run before the first render so AppLayout/Login never mount protected
 * fetches against a stale localStorage session and toast "Authorization header missing".
 */
function bootstrapBrowserSession() {
  try {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      clearTeamSession()
      sessionStorage.setItem(SESSION_KEY, "1")
    }
  } catch {
    // sessionStorage unavailable (private mode quirks) — leave tokens alone
  }
}

bootstrapBrowserSession()

function AppToaster() {
  const { resolvedTheme } = useTheme()
  return (
    <Toaster
      position="top-center"
      theme={resolvedTheme}
      closeButton
      expand={false}
      visibleToasts={4}
      offset={20}
      gap={12}
      duration={4200}
      toastOptions={{
        classNames: {
          toast: "yimaru-toast",
          title: "yimaru-toast__title",
          description: "yimaru-toast__description",
          actionButton: "yimaru-toast__action",
          cancelButton: "yimaru-toast__cancel",
          closeButton: "yimaru-toast__close",
          success: "yimaru-toast--success",
          error: "yimaru-toast--error",
          warning: "yimaru-toast--warning",
          info: "yimaru-toast--info",
        },
      }}
    />
  )
}

export default function App() {
  return (
    <>
      <AppRoutes />
      <AppToaster />
    </>
  )
}
