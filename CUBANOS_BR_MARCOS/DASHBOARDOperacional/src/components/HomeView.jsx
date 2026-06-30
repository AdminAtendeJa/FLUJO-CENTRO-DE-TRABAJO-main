import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Clock, ArrowRight, AlertCircle, CheckCircle, RotateCw, XCircle } from 'lucide-react';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import { SkeletonTramiteCard } from './ui/SkeletonCard';
import Card from './ui/Card';
import KanbanBoard from './ui/KanbanBoard';

const DOCS_PENDING_KEYWORDS = [
  'pendiente', 'esperando', 'faltante', 'pendente', 'aguardando',
];

const hasPendingDocs = (entrada) => {
  const txt = [entrada.estado_tramite, entrada.servicio, entrada.clientes?.observaciones, entrada.observaciones, entrada.notas]
    .filter(Boolean).join(' ').toLowerCase();
  return DOCS_PENDING_KEYWORDS.some((k) => txt.includes(k));
};

const KANBAN_STAGES = [
  { id: 'entrante', label: 'Clientes Entrantes', color: 'var(--color-info, #378ADD)' },
  { id: 'esperando_cliente', label: 'Esperando por el cliente', color: '#ef4444' }, // rojo
  { id: 'esperando', label: 'Esperando', color: '#ef4444' }, // rojo
  { id: 'cobranza', label: 'Realizar Cobranza', color: 'var(--color-success, #1D9E75)' },
  { id: 'logrado', label: 'Logrado con Éxito', color: '#10b981' } // verde esmeralda
];

export default function HomeView({ onNavigateToClient, onNavigateToClientsList, searchQuery = '' }) {
  const [entradas, setEntradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tramiteFilter, setTramiteFilter] = useState('');

  useEffect(() => {
    async function fetchEntradas() {
      try {
        const { data, error } = await supabase
          .from('entradas')
          .select('*, clientes(*)')
          .order('creado_en', { ascending: false })
          .limit(300);
        if (error) throw error;
        setEntradas(data || []);
      } catch (err) {
        console.error('Error fetching entradas:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEntradas();
  }, []);

  const mapStageToLegacy = (stageId) => {
    switch (stageId) {
      case 'entrante': return 'pendiente';
      case 'esperando_cliente': return 'esperando_docs';
      case 'esperando': return 'procesando';
      case 'cobranza': return 'cancelada';
      case 'logrado': return 'completada';
      default: return 'pendiente';
    }
  };

  const handleMoveCard = async (entradaId, newStageId) => {
    const legacyState = mapStageToLegacy(newStageId);
    
    // Update locally immediately using legacy state so mapping still works
    setEntradas(prev => prev.map(e => String(e.id) === String(entradaId) ? { ...e, estado_tramite: legacyState } : e));
    
    // Update in DB
    try {
      const { error } = await supabase
        .from('entradas')
        .update({ estado_tramite: legacyState })
        .eq('id', entradaId);
        
      if (error) throw error;
    } catch (err) {
      console.error('Error updating estado:', err);
    }
  };

  const filteredEntradas = entradas.filter(entrada => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const clienteNombre = (entrada.clientes?.nombre || entrada.cliente || '').toLowerCase();
      const clienteCpf = (entrada.clientes?.cpf || '').toLowerCase();
      const servicio = (entrada.servicio || '').toLowerCase();
      if (!clienteNombre.includes(searchLower) && !clienteCpf.includes(searchLower) && !servicio.includes(searchLower)) {
        return false;
      }
    }
    
    if (tramiteFilter && entrada.servicio !== tramiteFilter) {
      return false;
    }
    
    return true;
  });

  // Get unique tramites for the filter
  const uniqueTramites = [...new Set(entradas.map(e => e.servicio).filter(Boolean))].sort();

  return (
    <div style={{ padding: 'var(--section-gap, 16px)', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="animate-fade-in">
      <header style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--gap-md, 12px)', flexWrap: 'wrap', flexShrink: 0 }}>
        <div>
          <h1 style={{ font: 'var(--font-page-title)', marginBottom: '4px' }}>Pipeline de Trámites</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>Gestiona el flujo de trabajo arrastrando las tarjetas</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select
            value={tramiteFilter}
            onChange={(e) => setTramiteFilter(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--surface-base)',
              color: 'var(--color-text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">Todos los trámites</option>
            {uniqueTramites.map(t => (
              <option key={t} value={t}>{t.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </header>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', gap: '1rem', height: '100%' }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ flex: '0 0 320px', height: '100%', background: 'var(--surface-base)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ height: '20px', width: '60%', background: 'var(--color-border)', borderRadius: '4px', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }} />
                <div style={{ height: '100px', width: '100%', background: 'var(--surface-elevated)', borderRadius: '8px', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }} />
                <div style={{ height: '100px', width: '100%', background: 'var(--surface-elevated)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
              </div>
            ))}
          </div>
        ) : (
          <KanbanBoard 
            entradas={filteredEntradas} 
            stages={KANBAN_STAGES} 
            onMoveCard={handleMoveCard}
            onNavigateToClient={onNavigateToClient}
            onNavigateToClientsList={onNavigateToClientsList}
          />
        )}
      </div>
    </div>
  );
}
