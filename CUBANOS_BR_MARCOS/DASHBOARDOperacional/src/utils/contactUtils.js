import { supabase } from '../supabaseClient';

// Función para encontrar contactos duplicados por número de teléfono
export const findDuplicateContacts = async (telefono) => {
    if (!telefono) return [];

    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .ilike('telefono', `%${telefono}%`)
        .neq('telefono', ''); // Excluir registros con teléfono vacío

    if (error) {
        console.error('Error buscando contactos duplicados:', error);
        return [];
    }

    // Filtrar solo los contactos que tienen exactamente el mismo número de teléfono
    const normalizedTelefono = telefono.replace(/\D/g, ''); // Remover todos los caracteres no numéricos
    const duplicates = data.filter(contact => {
        const contactNormalized = contact.telefono?.replace(/\D/g, '') || '';
        return contactNormalized === normalizedTelefono && contact.telefono;
    });

    return duplicates;
};

// Función para obtener todos los contactos duplicados en el sistema
export const findAllDuplicateContacts = async () => {
    const { data, error } = await supabase
        .from('clientes')
        .select('id, nombre, telefono, email, cpf')
        .neq('telefono', '')
        .not('telefono', 'is', null);

    if (error) {
        console.error('Error obteniendo todos los contactos:', error);
        return [];
    }

    // Agrupar contactos por número de teléfono normalizado
    const phoneGroups = {};
    data.forEach(contact => {
        if (contact.telefono) {
            const normalizedPhone = contact.telefono.replace(/\D/g, '');
            if (!phoneGroups[normalizedPhone]) {
                phoneGroups[normalizedPhone] = [];
            }
            phoneGroups[normalizedPhone].push(contact);
        }
    });

    // Devolver solo grupos con más de un contacto (duplicados)
    const duplicateGroups = Object.values(phoneGroups).filter(group => group.length > 1);
    return duplicateGroups.flat(); // Convertir a array plano de contactos duplicados
};