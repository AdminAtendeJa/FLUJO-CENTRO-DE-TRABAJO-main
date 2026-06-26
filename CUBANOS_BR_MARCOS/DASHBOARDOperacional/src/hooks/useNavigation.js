import { useState } from 'react';

export const useNavigation = () => {
    const [currentView, setCurrentView] = useState('dashboard');
    const [selectedClientId, setSelectedClientId] = useState(null);

    const navigateToClient = (clientId) => {
        setSelectedClientId(clientId);
        setCurrentView('client');
    };

    const navigateToHome = () => {
        setSelectedClientId(null);
        setCurrentView('dashboard');
    };

    const navigateToClientsList = () => {
        setSelectedClientId(null);
        setCurrentView('clients');
    };

    return {
        currentView,
        selectedClientId,
        setCurrentView,
        setSelectedClientId,
        navigateToClient,
        navigateToHome,
        navigateToClientsList
    };
};