import { useState, useEffect, useCallback } from 'react';

/**
 * useNavigation — Maneja navegación SPA basada en hash.
 * Lee el hash inicial, sincroniza cambios de state → hash y
 * escucha back/forward del navegador.
 * @param {boolean} isReady  Si es false no sincroniza (p.ej. si no hay sesión).
 */
export const useNavigation = (isReady = true) => {
    const [currentView, setCurrentView] = useState(() => {
        const hash = window.location.hash;
        if (hash.startsWith('#client/')) return 'client';
        if (hash === '#clients') return 'clients';
        return 'dashboard';
    });

    const [selectedClientId, setSelectedClientId] = useState(() => {
        const hash = window.location.hash;
        if (hash.startsWith('#client/')) {
            const idStr = hash.replace('#client/', '');
            return idStr ? Number(idStr) : null;
        }
        return null;
    });

    // Sync state → URL hash
    useEffect(() => {
        if (!isReady) return;
        if (currentView === 'client' && selectedClientId) {
            window.location.hash = `client/${selectedClientId}`;
        } else if (currentView === 'clients') {
            window.location.hash = 'clients';
        } else {
            window.location.hash = 'dashboard';
        }
    }, [currentView, selectedClientId, isReady]);

    // Listen to browser Back/Forward buttons and manual hash changes
    useEffect(() => {
        const handleHashChange = () => {
            if (!isReady) return;
            const hash = window.location.hash;
            if (hash.startsWith('#client/')) {
                setCurrentView('client');
                const idStr = hash.replace('#client/', '');
                setSelectedClientId(idStr ? Number(idStr) : null);
            } else if (hash === '#clients') {
                setCurrentView('clients');
                setSelectedClientId(null);
            } else {
                setCurrentView('dashboard');
                setSelectedClientId(null);
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [isReady]);

    const navigateToClient = useCallback((clientId) => {
        setSelectedClientId(clientId);
        setCurrentView('client');
    }, []);

    const navigateToHome = useCallback(() => {
        setSelectedClientId(null);
        setCurrentView('dashboard');
    }, []);

    const navigateToClientsList = useCallback((query) => {
        setSelectedClientId(null);
        setCurrentView('clients');
    }, []);

    return {
        currentView,
        selectedClientId,
        navigateToClient,
        navigateToHome,
        navigateToClientsList,
    };
};