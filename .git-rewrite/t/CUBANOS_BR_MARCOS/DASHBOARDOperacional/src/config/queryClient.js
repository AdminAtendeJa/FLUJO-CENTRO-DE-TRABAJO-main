import { QueryClient } from '@tanstack/react-query';

// Configuración del cliente de React Query con valores predeterminados optimizados para rendimiento
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Opciones predeterminadas para todas las queries
            staleTime: 5 * 60 * 1000, // 5 minutos antes de considerar los datos como obsoletos
            gcTime: 10 * 60 * 1000,   // 10 minutos antes de eliminar de la caché
            retry: 2,                 // Reintentar 2 veces en caso de error
            retryDelay: (attemptIndex) => {
                // Incrementar el delay entre reintentos (exponential backoff)
                return Math.min(1000 * 2 ** attemptIndex, 30000); // Máximo 30 segundos
            },
            refetchOnWindowFocus: false, // Desactivar refetch automático al enfocar ventana para mejor rendimiento
            refetchOnReconnect: true,    // Refetch al reconectar
        },
        mutations: {
            // Opciones predeterminadas para todas las mutaciones
            retry: 1, // Reintentar 1 vez en caso de error en mutaciones
            retryDelay: 1000, // Esperar 1 segundo entre reintentos
        }
    }
});

export default queryClient;