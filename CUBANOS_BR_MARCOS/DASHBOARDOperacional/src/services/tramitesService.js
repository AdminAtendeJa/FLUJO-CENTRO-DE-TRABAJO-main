/**
 * tramitesService.js
 * Capa de servicio — Agente 2 (Arquitecto)
 * Centraliza TODAS las llamadas a Supabase relacionadas con trámites (entradas).
 */
import { supabase } from '../supabaseClient';

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
  return data;
};

export const updateEntradaEstado = async (id, estado_tramite) => {
  const { error } = await supabase
    .from('entradas')
    .update({ estado_tramite })
    .eq('id', id);
  if (error) throw error;
};
