import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { AppRoutes } from './app/AppRoutes'
import { useTheme } from './contexts/ThemeContext'
import { clearTeamSession } from './lib/teamAuthStorage'

const SESSION_KEY = 'yimaru_session_active'

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
  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      clearTeamSession()
      sessionStorage.setItem(SESSION_KEY, '1')
    }
  }, [])

  return (
    <>
      <AppRoutes />
      <AppToaster />
    </>
  )
}
