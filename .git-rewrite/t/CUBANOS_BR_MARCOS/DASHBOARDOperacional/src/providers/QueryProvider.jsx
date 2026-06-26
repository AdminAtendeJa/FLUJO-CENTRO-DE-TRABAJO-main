import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from '../config/queryClient';

// Proveedor de React Query para toda la aplicación
const QueryProvider = ({ children }) => {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

export default QueryProvider;