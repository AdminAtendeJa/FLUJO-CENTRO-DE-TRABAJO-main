/**
 * useClientViewTramites.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Encapsula toda la lógica de creación y gestión de trámites dentro de la
 * vista de cliente. Maneja estado del modal, creación, y cambio de estado.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { createEntrada, updateEntradaEstado } from '../services/tramitesService';

export default function useClientViewTramites({ clientId, queryClient }) {
  const [isNewTramiteModalOpen, setIsNewTramiteModalOpen] = useState(false);
  const [newTramiteData, setNewTramiteData] = useState({ servicio: '', operario: '' });
  const [isCreatingTramite, setIsCreatingTramite] = useState(false);

  const handleChangeTramiteState = useCallback(async (entradaId, newState) => {
    try {
      await updateEntradaEstado(entradaId, newState);
      queryClient.invalidateQueries({ queryKey: ['entradas', clientId] });
      toast.success('Estado del trámite actualizado');
    } catch (err) {
      console.error('[useClientViewTramites] handleChangeTramiteState:', err);
      toast.error('Error al actualizar el estado del trámite.');
    }
  }, [clientId, queryClient]);

  const handleCreateTramite = useCallback(async () => {
    if (!newTramiteData.servicio.trim()) {
      toast.error('Por favor ingresa el nombre del servicio/trámite.');
      return;
    }
    setIsCreatingTramite(true);
    const toastId = toast.loading('Creando trámite...');
    try {
      await createEntrada({
        id_cliente: clientId,
        servicio: newTramiteData.servicio,
        operario: newTramiteData.operario,
      });
      queryClient.invalidateQueries({ queryKey: ['entradas', clientId] });
      setIsNewTramiteModalOpen(false);
      setNewTramiteData({ servicio: '', operario: '' });
      toast.success('Trámite creado', { id: toastId });
    } catch (err) {
      console.error('[useClientViewTramites] handleCreateTramite:', err);
      toast.error('Error al crear el trámite.', { id: toastId });
    } finally {
      setIsCreatingTramite(false);
    }
  }, [clientId, newTramiteData, queryClient]);

  return {
    // State
    isNewTramiteModalOpen,
    setIsNewTramiteModalOpen,
    newTramiteData,
    setNewTramiteData,
    isCreatingTramite,
    // Handlers
    handleChangeTramiteState,
    handleCreateTramite,
  };
}
