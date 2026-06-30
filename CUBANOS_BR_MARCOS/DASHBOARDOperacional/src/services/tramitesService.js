/**
 * tramitesService.js
 * Capa de servicio — Agente 2 (Arquitecto)
 * Centraliza TODAS las llamadas a Supabase relacionadas con trámites (entradas).
 */
import { supabase } from '../supabaseClient';
import { registrarAccionHistorial } from './equipoService';

export const getEntradas = async (clientId) => {
  const { data, error } = await supabase
    .from('entradas')
    .select('*')
    .eq('id_cliente', clientId)
    .order('creado_en', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createEntrada = async ({ id_cliente, servicio, operario }) => {
  const { data, error } = await supabase
    .from('entradas')
    .insert({
      id_cliente,
      servicio: servicio.trim().toUpperCase(),
      operario: operario?.trim().toUpperCase() || null,
      estado_tramite: 'pendiente',
    })
    .select()
    .single();
  if (error) throw error;
  registrarAccionHistorial(id_cliente, 'NUEVO_TRAMITE', `Creó trámite de ${servicio}`);
  return data;
};

export const updateEntradaEstado = async (id, estado_tramite) => {
  const { error } = await supabase
    .from('entradas')
    .update({ estado_tramite })
    .eq('id', id);
  if (error) throw error;
};

export const deleteEntrada = async (id) => {
  const { error } = await supabase
    .from('entradas')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const updateEntradaServicio = async (id, servicio) => {
  const { error } = await supabase
    .from('entradas')
    .update({ servicio: servicio?.trim().toUpperCase() })
    .eq('id', id);
  if (error) throw error;
};

export const updateEntradaOperario = async (id, operario) => {
  const { error } = await supabase
    .from('entradas')
    .update({ operario: operario?.trim().toUpperCase() || null })
    .eq('id', id);
  if (error) throw error;
};

export const getCatalogoTramites = async () => {
  const { data, error } = await supabase
    .from('tramites_catalogo')
    .select('id, nombre, codigo')
    .eq('activo', true)
    .order('nombre');
  if (error) throw error;
  return data || [];
};

export const getAllCatalogoTramites = async () => {
  const { data, error } = await supabase
    .from('tramites_catalogo')
    .select('*')
    .order('nombre');
  if (error) throw error;
  return data || [];
};

export const createCatalogoTramite = async (tramite) => {
  const { data, error } = await supabase
    .from('tramites_catalogo')
    .insert(tramite)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateCatalogoTramite = async (id, updates) => {
  const { data, error } = await supabase
    .from('tramites_catalogo')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getNotasTramite = async (entradaId) => {
  const { data, error } = await supabase
    .from('notas_tramite')
    .select('*')
    .eq('entrada_id', entradaId)
    .order('creado_en', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createNotaTramite = async ({ entrada_id, texto }) => {
  const { data, error } = await supabase
    .from('notas_tramite')
    .insert({
      entrada_id,
      texto: texto.trim(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getOperarios = async () => {
  const { data, error } = await supabase
    .from('operarios')
    .select('id, nombre, iniciales')
    .eq('activo', true)
    .order('nombre');
  if (error) throw error;
  return data || [];
};

export const getAllOperarios = async () => {
  const { data, error } = await supabase
    .from('operarios')
    .select('*')
    .order('nombre');
  if (error) throw error;
  return data || [];
};

export const createOperario = async (operario) => {
  const { data, error } = await supabase
    .from('operarios')
    .insert(operario)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateOperario = async (id, updates) => {
  const { data, error } = await supabase
    .from('operarios')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};
