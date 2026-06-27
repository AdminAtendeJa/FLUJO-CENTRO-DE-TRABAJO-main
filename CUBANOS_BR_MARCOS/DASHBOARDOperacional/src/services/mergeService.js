import { supabase } from '../supabaseClient';

// Función para fusionar dos contactos
export const mergeContacts = async (contact1Id, contact2Id, mergedData) => {
    try {
        // Primero, obtenemos los datos de ambos contactos
        const { data: contact1, error: error1 } = await supabase
            .from('clientes')
            .select('*')
            .eq('id', contact1Id)
            .single();

        const { data: contact2, error: error2 } = await supabase
            .from('clientes')
            .select('*')
            .eq('id', contact2Id)
            .single();

        if (error1 || error2) {
            throw new Error('Error al obtener los contactos para fusionar');
        }

        // Determinamos cuál contacto mantener (el que tenga más datos o el primero por defecto)
        const contactToKeep = contact1Id;
        const contactToDelete = contact2Id;

        // Actualizamos el contacto que se va a mantener con los datos fusionados
        const { error: updateError } = await supabase
            .from('clientes')
            .update(mergedData)
            .eq('id', contactToKeep);

        if (updateError) {
            throw new Error('Error al actualizar el contacto fusionado');
        }

        // Transferimos todos los datos relacionados del contacto a eliminar al contacto a mantener
        // 1. Transferir documentos
        await supabase
            .from('documentos_operacionales')
            .update({ id_cliente: contactToKeep })
            .eq('id_cliente', contactToDelete);

        // 2. Transferir datos operacionales
        await supabase
            .from('cliente_datos_operacionales')
            .update({ id_cliente: contactToKeep })
            .eq('id_cliente', contactToDelete);

        // 3. Actualizar relaciones donde el contacto a eliminar es el principal
        await supabase
            .from('relaciones_clientes')
            .update({ cliente_id: contactToKeep })
            .eq('cliente_id', contactToDelete);

        // 4. Actualizar relaciones donde el contacto a eliminar es el secundario
        await supabase
            .from('relaciones_clientes')
            .update({ cliente_relacionado_id: contactToKeep })
            .eq('cliente_relacionado_id', contactToDelete);

        // 5. Transferir entradas (trámites)
        await supabase
            .from('entradas')
            .update({ id_cliente: contactToKeep })
            .eq('id_cliente', contactToDelete);

        // Finalmente, eliminamos el contacto duplicado
        const { error: deleteError } = await supabase
            .from('clientes')
            .delete()
            .eq('id', contactToDelete);

        if (deleteError) {
            throw new Error('Error al eliminar el contacto duplicado');
        }

        return { success: true, keptContactId: contactToKeep };
    } catch (error) {
        console.error('Error en la fusión de contactos:', error);
        return { success: false, error: error.message };
    }
};