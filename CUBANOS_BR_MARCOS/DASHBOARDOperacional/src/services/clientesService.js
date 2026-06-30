/**
 * clientesService.js
 * Capa de servicio — Agente 2 (Arquitecto)
 * Centraliza TODAS las llamadas a Supabase relacionadas con clientes.
 * Los componentes NO deben llamar a supabase.from() directamente.
 */
import { supabase } from '../supabaseClient';
import { registrarAccionHistorial } from './equipoService';
// ── Clientes ──────────────────────────────────────────────────────────────────
export const getCliente = async (id) => {
  const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
};

export const getClientesBase = async () => {
  const { data, error } = await supabase.from('clientes').select('id, nombre, cpf');
  if (error) throw error;
  return data || [];
};

export const createCliente = async (clienteData) => {
  const { data, error } = await supabase.from('clientes').insert([clienteData]).select().single();
  if (error) throw error;
  return data;
};

export const updateCliente = async (id, updates) => {
  const { data, error } = await supabase.from('clientes').update(updates).eq('id', id).select().single();
  if (error) throw error;
  
  const desc = Object.keys(updates).map(k => `${k}: ${updates[k]}`).join(', ');
  registrarAccionHistorial(id, 'ACTUALIZAR_CLIENTE', `Actualizó datos: ${desc}`);
  
  return data;
};

export const deleteCliente = async (id) => {
  // Elimina en cascada: relaciones → documentos → datos → cliente
  await supabase.from('relaciones_clientes').delete().or(`cliente_id.eq.${id},cliente_relacionado_id.eq.${id}`);
  await supabase.from('documentos_operacionales').delete().eq('id_cliente', id);
  await supabase.from('cliente_datos_operacionales').delete().eq('id_cliente', id);
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) throw error;
};

// ── Datos Operacionales ───────────────────────────────────────────────────────
export const getClienteDatos = async (clientId) => {
  const { data, error } = await supabase
    .from('cliente_datos_operacionales')
    .select('*')
    .eq('id_cliente', clientId);
  if (error) throw error;
  return data || [];
};

export const upsertClienteDato = async ({ id, valor, campo_id, id_cliente }) => {
  if (id) {
    const { error } = await supabase.from('cliente_datos_operacionales').update({ valor }).eq('id', id);
    if (error) throw error;
    registrarAccionHistorial(id_cliente, 'ACTUALIZAR_DATO', `Actualizó un dato operacional a: ${valor}`);
  } else {
    const { error } = await supabase.from('cliente_datos_operacionales').insert({ campo_id, id_cliente, valor });
    if (error) throw error;
    registrarAccionHistorial(id_cliente, 'NUEVO_DATO', `Añadió un dato operacional con valor: ${valor}`);
  }
};

export const deleteClienteDatoFijo = async (clientId, fieldId) => {
  const { error } = await supabase.from('clientes').update({ [fieldId]: null }).eq('id', clientId);
  if (error) throw error;
};

export const deleteClienteDatoDinamico = async (id) => {
  const { error } = await supabase.from('cliente_datos_operacionales').delete().eq('id', id);
  if (error) throw error;
};

// ── Campos / Categorías ───────────────────────────────────────────────────────
export const getCategorias = async () => {
  const { data, error } = await supabase.from('categorias_datos_operacionales').select('*').order('orden');
  if (error) throw error;
  return data || [];
};

export const insertCategoria = async (categoria) => {
  const { data, error } = await supabase.from('categorias_datos_operacionales').insert(categoria).select().single();
  if (error) throw error;
  return data;
};

export const updateCategoria = async (id, updates) => {
  const { data, error } = await supabase.from('categorias_datos_operacionales').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const getCampos = async () => {
  const { data, error } = await supabase.from('campos_datos_operacionales').select('*').order('orden');
  if (error) throw error;
  return data || [];
};

export const insertCampo = async (campos) => {
  const { data, error } = await supabase.from('campos_datos_operacionales').insert(campos).select().single();
  if (error) throw error;
  return data;
};

export const updateCampo = async (id, updates) => {
  const { data, error } = await supabase.from('campos_datos_operacionales').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

// ── Búsqueda ──────────────────────────────────────────────────────────────────
export const searchClientes = async (query) => {
  const sanitized = query.trim().replace(/[%_]/g, '\\$&'); // Escapar caracteres especiales de LIKE
  const { data, error } = await supabase
    .from('clientes')
    .select('id, nombre, cpf')
    .ilike('nombre', `%${sanitized}%`)
    .limit(50);
  if (error) throw error;
  return data || [];
};

// ── Relaciones ────────────────────────────────────────────────────────────────
export const getRelaciones = async (clientId) => {
  const { data, error } = await supabase
    .from('relaciones_clientes')
    .select('*, cliente_principal:cliente_id(id,nombre,cpf), cliente_secundario:cliente_relacionado_id(id,nombre,cpf)')
    .or(`cliente_id.eq.${clientId},cliente_relacionado_id.eq.${clientId}`);
  if (error) throw error;
  return data || [];
};

export const insertRelacion = async ({ cliente_id, cliente_relacionado_id, tipo_relacion }) => {
  const { error } = await supabase.from('relaciones_clientes').insert({ cliente_id, cliente_relacionado_id, tipo_relacion });
  if (error) throw error;
  registrarAccionHistorial(cliente_id, 'NUEVA_RELACION', `Vinculó a otro cliente como ${tipo_relacion}`);
};

export const updateRelacionTipo = async (id, tipo_relacion) => {
  const { error } = await supabase.from('relaciones_clientes').update({ tipo_relacion }).eq('id', id);
  if (error) throw error;
};

export const deleteRelacion = async (id) => {
  const { error } = await supabase.from('relaciones_clientes').delete().eq('id', id);
  if (error) throw error;
};

// ── AI Chat ───────────────────────────────────────────────────────────────────
export const getAiChatHistory = async (clienteId) => {
  const { data, error } = await supabase
    .from('ai_chats')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('creado_en', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const insertAiChatMessage = async ({ cliente_id, role, content }) => {
  await supabase.from('ai_chats').insert({ cliente_id, role, content });
};
