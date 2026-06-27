import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { findDuplicateContacts } from '../utils/contactUtils';

// Hook personalizado para gestionar la obtención de datos del cliente con caché
const useClientData = (clientId) => {
    const queryClient = useQueryClient();

    // Query para obtener datos del cliente
    const clientQuery = useQuery({
        queryKey: ['client', clientId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('clientes')
                .select('*')
                .eq('id', clientId)
                .single();

            if (error) throw new Error(error.message);
            return data;
        },
        enabled: !!clientId, // Solo ejecutar si clientId está definido
        staleTime: 5 * 60 * 1000, // 5 minutos antes de considerar los datos como obsoletos
        cacheTime: 10 * 60 * 1000, // 10 minutos antes de eliminar de la caché
    });

    // Query para obtener categorías
    const categoriesQuery = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('categorias_datos_operacionales')
                .select('*')
                .order('orden');

            if (error) throw new Error(error.message);
            return data;
        },
        staleTime: 10 * 60 * 1000, // 10 minutos
        cacheTime: 15 * 60 * 1000, // 15 minutos
    });

    // Query para obtener campos
    const fieldsQuery = useQuery({
        queryKey: ['fields'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('campos_datos_operacionales')
                .select('*')
                .order('orden');

            if (error) throw new Error(error.message);
            return data;
        },
        staleTime: 10 * 60 * 1000, // 10 minutos
        cacheTime: 15 * 60 * 1000, // 15 minutos
    });

    // Query para obtener datos operacionales del cliente
    const clientDataQuery = useQuery({
        queryKey: ['clientData', clientId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cliente_datos_operacionales')
                .select('*')
                .eq('id_cliente', clientId);

            if (error) throw new Error(error.message);
            return data;
        },
        enabled: !!clientId,
        staleTime: 2 * 60 * 1000, // 2 minutos
        cacheTime: 5 * 60 * 1000, // 5 minutos
    });

    // Query para obtener entradas (trámites)
    const entradasQuery = useQuery({
        queryKey: ['entradas', clientId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('entradas')
                .select('*')
                .eq('id_cliente', clientId)
                .order('creado_en', { ascending: false });
            if (error) throw new Error(error.message);
            return data;
        },
        enabled: !!clientId,
        staleTime: 2 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
    });

    // Query para obtener relaciones
    const relationsQuery = useQuery({
        queryKey: ['relations', clientId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('relaciones_clientes')
                .select('*, cliente_principal:cliente_id(id,nombre,cpf), cliente_secundario:cliente_relacionado_id(id,nombre,cpf)')
                .or(`cliente_id.eq.${clientId},cliente_relacionado_id.eq.${clientId}`);

            if (error) throw new Error(error.message);
            return data;
        },
        enabled: !!clientId,
        staleTime: 3 * 60 * 1000, // 3 minutos
        cacheTime: 5 * 60 * 1000, // 5 minutos
    });

    // Query para obtener contactos duplicados
    const duplicateContactsQuery = useQuery({
        queryKey: ['duplicateContacts', clientQuery.data?.telefono],
        queryFn: async () => {
            if (!clientQuery.data?.telefono) return [];
            return await findDuplicateContacts(clientQuery.data.telefono);
        },
        enabled: !!clientQuery.data?.telefono,
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
    });

    // Query para obtener documentos
    const documentsQuery = useQuery({
        queryKey: ['documents', clientId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('documentos_operacionales')
                .select('*')
                .eq('id_cliente', clientId)
                .order('creado_en', { ascending: false });

            if (error) throw new Error(error.message);
            return data;
        },
        enabled: !!clientId,
        staleTime: 2 * 60 * 1000, // 2 minutos
        cacheTime: 5 * 60 * 1000, // 5 minutos
    });

    // Mutation para actualizar datos del cliente
    const updateClientMutation = useMutation({
        mutationFn: async (updateData) => {
            const { data, error } = await supabase
                .from('clientes')
                .update(updateData)
                .eq('id', clientId)
                .select()
                .single();

            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            // Invalidar queries relacionadas para refrescar datos
            queryClient.invalidateQueries({ queryKey: ['client', clientId] });
            queryClient.invalidateQueries({ queryKey: ['clientData', clientId] });
        },
    });

    return {
        client: clientQuery.data,
        categories: categoriesQuery.data,
        fields: fieldsQuery.data,
        clientData: clientDataQuery.data,
        relations: relationsQuery.data,
        documents: documentsQuery.data,
        entradas: entradasQuery.data,
        duplicateContacts: duplicateContactsQuery.data,
        isLoading: clientQuery.isLoading || categoriesQuery.isLoading || fieldsQuery.isLoading ||
            clientDataQuery.isLoading || relationsQuery.isLoading || documentsQuery.isLoading || entradasQuery.isLoading || duplicateContactsQuery.isLoading,
        isError: clientQuery.isError || categoriesQuery.isError || fieldsQuery.isError ||
            clientDataQuery.isError || relationsQuery.isError || documentsQuery.isError || entradasQuery.isError || duplicateContactsQuery.isError,
        error: clientQuery.error || categoriesQuery.error || fieldsQuery.error ||
            clientDataQuery.error || relationsQuery.error || documentsQuery.error || entradasQuery.error || duplicateContactsQuery.error,
        updateClient: updateClientMutation.mutate,
        isUpdating: updateClientMutation.isPending,
    };
};

export default useClientData;