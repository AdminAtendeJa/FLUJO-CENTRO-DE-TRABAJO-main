import { supabase } from '../supabaseClient';

const BUCKET = 'documentos_operacionales';
const MAX_SIZE_MB = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

/**
 * Valida un archivo antes de subirlo.
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFile(file) {
  if (!file) return { valid: false, error: 'No se seleccionó ningún archivo.' };
  if (file.size > MAX_SIZE_MB * 1024 * 1024) return { valid: false, error: `El archivo supera el límite de ${MAX_SIZE_MB}MB.` };
  if (!ALLOWED_TYPES.includes(file.type)) return { valid: false, error: `Tipo de archivo no permitido: ${file.type}` };
  return { valid: true };
}

/**
 * Sube un documento al bucket de Supabase y lo registra en la tabla documentos_operacionales.
 * @param {File} file - Archivo seleccionado por el usuario.
 * @param {number|string} clientId - ID del cliente al que pertenece el documento.
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
export async function uploadDocument(file, clientId) {
  const validation = validateFile(file);
  if (!validation.valid) return { data: null, error: validation.error };

  try {
    const ext = file.name.split('.').pop().toLowerCase();
    const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const storagePath = `${clientId}/${uniqueName}`;

    // 1. Subir al Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, { upsert: false });

    if (uploadError) throw uploadError;

    // 2. Obtener URL pública
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    // 3. Registrar en la base de datos
    const { data: docRecord, error: dbError } = await supabase
      .from('documentos_operacionales')
      .insert({
        id_cliente: clientId,
        tipo_documento: file.type.startsWith('image/') ? 'FOTO' : 'COMPROBANTE',
        nombre_archivo: file.name,
        url_archivo: urlData.publicUrl,
        tamaño_bytes: file.size,
        tipo_contenido: file.type,
        subido_por: 'Admin',
        estado: 'pendiente',
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return { data: docRecord, error: null };
  } catch (err) {
    console.error('[storageService] uploadDocument error:', err);
    return { data: null, error: err.message || 'Error desconocido al subir el archivo.' };
  }
}

/**
 * Elimina un documento del Storage y de la base de datos.
 * @param {{ id: number, url_archivo: string }} doc - Registro del documento a eliminar.
 * @returns {Promise<{ success: boolean, error: string|null }>}
 */
export async function deleteDocument(doc) {
  try {
    // Extraer el path del Storage desde la URL pública
    const urlParts = doc.url_archivo?.split(`/${BUCKET}/`);
    if (urlParts?.length === 2) {
      const { error: storageErr } = await supabase.storage.from(BUCKET).remove([urlParts[1]]);
      // No lanzamos error si el archivo ya no existe en storage, solo lo logueamos
      if (storageErr) console.warn('[storageService] Storage remove warning:', storageErr.message);
    }

    // Eliminar el registro de la DB
    const { error: dbError } = await supabase.from('documentos_operacionales').delete().eq('id', doc.id);
    if (dbError) throw dbError;

    return { success: true, error: null };
  } catch (err) {
    console.error('[storageService] deleteDocument error:', err);
    return { success: false, error: err.message || 'Error eliminando el documento.' };
  }
}
