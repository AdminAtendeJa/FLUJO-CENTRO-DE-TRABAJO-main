import { supabase } from '../supabaseClient';

// --- Perfiles / Gestión de Equipo ---

export const getPerfiles = async () => {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .order('creado_en', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createTeamMember = async (email, password, nombre, rol = 'miembro') => {
  // Nota: Esto creará el usuario y lo logueará. Si el admin está logueado, cerrará su sesión.
  // Para evitar eso, Supabase ofrece signUp con admin API, pero desde el cliente
  // la forma nativa es signUp. Lo ideal en un entorno real es usar una Edge Function.
  // Usaremos signUp estándar y documentaremos que cierra la sesión actual.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre,
        rol,
      },
    },
  });

  if (error) throw error;
  return data;
};

// --- Historial Global por Cliente ---

export const getHistorialCliente = async (clienteId) => {
  const { data, error } = await supabase
    .from('historial_clientes')
    .select('*, usuario:usuario_id(id, nombre, email, rol)')
    .eq('cliente_id', clienteId)
    .order('creado_en', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const registrarAccionHistorial = async (clienteId, accion, descripcion) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return; // No se registra si no hay sesión activa

  const usuarioId = session.user.id;

  const { error } = await supabase
    .from('historial_clientes')
    .insert({
      cliente_id: clienteId,
      usuario_id: usuarioId,
      accion,
      descripcion,
    });
    
  if (error) {
    console.error("Error registrando historial:", error);
  }
};

// --- Chat General del Equipo ---

export const getChatMensajes = async () => {
  const { data, error } = await supabase
    .from('chat_equipo')
    .select('*, usuario:usuario_id(id, nombre, email, rol)')
    .order('creado_en', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const enviarMensajeChat = async (mensaje) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No hay sesión activa");

  const usuarioId = session.user.id;

  const { data, error } = await supabase
    .from('chat_equipo')
    .insert({
      usuario_id: usuarioId,
      mensaje,
    })
    .select('*, usuario:usuario_id(id, nombre, email, rol)')
    .single();

  if (error) throw error;
  return data;
};
