import { Toaster } from 'sonner'
import { AppRoutes } from './app/AppRoutes'
import { useTheme } from './contexts/ThemeContext'
import { clearTeamSession } from './lib/teamAuthStorage'

const SESSION_KEY = 'yimaru_session_active'

/**
 * Clear persisted team tokens when this browser tab session is new.
 * Must run before the first render so AppLayout/Login never mount protected
 * fetches against a stale localStorage session and toast "Authorization header missing".
 */
function bootstrapBrowserSession() {
  try {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      clearTeamSession()
      sessionStorage.setItem(SESSION_KEY, '1')
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
      toastOptions={{
        className: 'font-sans',
        style: {
          padding: '14px 20px',
          borderRadius: '12px',
          fontSize: '14px',
        },
      }}
      richColors
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
