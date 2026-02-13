import { Toaster } from 'sonner'
import { AppRoutes } from './app/AppRoutes'

export default function App() {
  return (
    <>
      <AppRoutes />
      <Toaster
        position="top-center"
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
    </>
  )
}
