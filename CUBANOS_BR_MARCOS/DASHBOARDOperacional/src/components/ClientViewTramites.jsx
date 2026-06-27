import React from 'react';
import { Plus, Clock, Loader2 } from 'lucide-react';

const TRAMITE_COLORS = {
  completada: { bg: 'rgba(29,158,117,0.18)', color: '#1D9E75' },
  procesando: { bg: 'rgba(55,138,221,0.18)', color: '#378ADD' },
  cancelada: { bg: 'rgba(216,90,48,0.18)', color: '#D85A30' },
  pendiente: { bg: 'rgba(186,117,23,0.18)', color: '#BA7517' },
};

export default function ClientViewTramites({
  entradas = [],
  onCreateTramite,
  onUpdateEstado,
}) {
  const sortedEntradas = [...entradas].sort((a, b) => {
    const dateA = new Date(b.creado_en || b.created_at || 0).getTime();
    const dateB = new Date(a.creado_en || a.created_at || 0).getTime();
    return dateA - dateB;
  });

  return (
    <section id="historial-tramites" className="glass-panel" style={{ padding: 'var(--card-padding, 14px 16px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ font: 'var(--font-section-title)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Clock size={18} color="var(--brand-primary)" />
          Trámites ({entradas.length})
        </h3>
        <button className="btn btn-secondary" onClick={onCreateTramite} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> Crear Trámite
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sortedEntradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Sin trámites registrados
          </div>
        ) : (
          sortedEntradas.map(entrada => (
            <div key={entrada.id} style={{ background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {entrada.servicio || 'Sin especificar'}
                  </h4>
                </div>
                <select
                  value={entrada.estado_tramite || 'pendiente'}
                  onChange={(e) => onUpdateEstado(entrada.id, e.target.value)}
                  style={{
                    padding: '0.4rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: TRAMITE_COLORS[entrada.estado_tramite]?.bg || TRAMITE_COLORS.pendiente.bg,
                    color: TRAMITE_COLORS[entrada.estado_tramite]?.color || TRAMITE_COLORS.pendiente.color,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="procesando">Procesando</option>
                  <option value="completada">Completada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {new Date(entrada.creado_en).toLocaleDateString()} • {entrada.operario || 'Sin asignar'}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
