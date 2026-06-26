import { useState, useEffect } from 'react';

export const usePermissions = () => {
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);

    // Simulate fetching permissions (in a real app, this would come from an API or auth system)
    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                setLoading(true);

                // Simulated permissions - in a real app these would come from your auth system
                const simulatedPermissions = {
                    canViewClients: true,
                    canEditClients: true,
                    canCreateClients: true,
                    canDeleteClients: false, // Usually more restricted
                    canViewDocuments: true,
                    canUploadDocuments: true,
                    canDeleteDocuments: true,
                    canViewTramites: true,
                    canEditTramites: true,
                    canCreateTramites: true,
                    canViewReports: false, // Maybe only for admins
                    canViewSettings: false, // Maybe only for admins
                };

                setPermissions(simulatedPermissions);
            } catch (error) {
                console.error('Error fetching permissions:', error);
                // Set default permissions in case of error
                setPermissions({
                    canViewClients: true,
                    canEditClients: true,
                    canCreateClients: true,
                    canDeleteClients: false,
                    canViewDocuments: true,
                    canUploadDocuments: true,
                    canDeleteDocuments: true,
                    canViewTramites: true,
                    canEditTramites: true,
                    canCreateTramites: true,
                    canViewReports: false,
                    canViewSettings: false,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchPermissions();
    }, []);

    // Helper functions to check permissions
    const hasPermission = (permission) => {
        return !!permissions[permission];
    };

    const canViewClients = () => hasPermission('canViewClients');
    const canEditClients = () => hasPermission('canEditClients');
    const canCreateClients = () => hasPermission('canCreateClients');
    const canDeleteClients = () => hasPermission('canDeleteClients');
    const canViewDocuments = () => hasPermission('canViewDocuments');
    const canUploadDocuments = () => hasPermission('canUploadDocuments');
    const canDeleteDocuments = () => hasPermission('canDeleteDocuments');
    const canViewTramites = () => hasPermission('canViewTramites');
    const canEditTramites = () => hasPermission('canEditTramites');
    const canCreateTramites = () => hasPermission('canCreateTramites');
    const canViewReports = () => hasPermission('canViewReports');
    const canViewSettings = () => hasPermission('canViewSettings');

    return {
        permissions,
        loading,
        hasPermission,
        canViewClients,
        canEditClients,
        canCreateClients,
        canDeleteClients,
        canViewDocuments,
        canUploadDocuments,
        canDeleteDocuments,
        canViewTramites,
        canEditTramites,
        canCreateTramites,
        canViewReports,
        canViewSettings,
    };
};