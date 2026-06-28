import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

// Parche global para evitar errores de React con Google Translate
// Cuando Google Translate modifica el DOM (ej. con etiquetas <font>), React pierde la referencia
// y lanza NotFoundError al intentar remover el nodo original.
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function(child) {
    if (child.parentNode !== this) {
      if (console) {
        console.warn('DOM patched: Cannot remove a child from a different parent. Likely caused by a translation extension.', child, this);
      }
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };
  
  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console) {
        console.warn('DOM patched: Cannot insert before a reference node from a different parent.', referenceNode, this);
      }
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments);
  };
}

// Import the custom ErrorBoundary component
import { ErrorBoundary } from './components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <App />
        <Toaster position="top-right" />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)
