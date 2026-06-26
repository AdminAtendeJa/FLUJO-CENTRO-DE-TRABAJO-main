import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from 'react-error-boundary'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const ErrorFallback = ({ error }) => (
  <div style={{ padding: '2rem', color: 'red', textAlign: 'center' }}>
    <h2>Algo salió mal.</h2>
    <pre style={{ textAlign: 'left', background: '#f5f5f5', padding: '1rem', color: '#333' }}>{error.message}</pre>
    <button onClick={() => window.location.reload()}>Recargar página</button>
  </div>
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster position="top-right" />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
