import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useClients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('clientes')
                .select('*')
                .order('creado_en', { ascending: false });

            if (error) throw error;
            setClients(data);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching clients:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    return {
        clients,
        loading,
        error,
        fetchClients,
        refetch: fetchClients
    };
};