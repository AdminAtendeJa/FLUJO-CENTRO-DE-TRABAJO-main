import React, { useState } from 'react';
import { Plus, Clock, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { formatDate } from '../utils/dateFormatter';

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
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  const sortedEntradas = [...entradas].sort((a, b) => {
    const dateA = new Date(b.creado_en || b.created_at || 0).getTime();
    const dateB = new Date(a.creado_en || a.created_at || 0).getTime();
    return dateA - dateB;
  });

  const activeTramite = sortedEntradas[0];
  const historyTramites = sortedEntradas.slice(1);

  // Helper to determine step progress based on estado
  const getStepStatus = (estado, stepNum) => {
    if (estado === 'completada') return 'completed';
    if (estado === 'cancelada') return 'inactive';

    if (estado === 'procesando') {
      if (stepNum === 1) return 'completed';
      if (stepNum === 2) return 'active';
      return 'inactive';
    }

    // Pendiente
    if (stepNum === 1) return 'active';
    return 'inactive';
  };

  const StepIndicator = ({ num, label, status }) => {
    const isCompleted = status === 'completed';
    const isActive = status === 'active';
    const color = isCompleted || isActive ? 'var(--color-warning)' : 'var(--color-text-disabled)';
    const barColor = isCompleted ? 'var(--color-warning)' : 'var(--border-default)';

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color, textTransform: 'uppercase' }}>
          Etapa {num}
        </div>
        <div style={{ fontSize: '0.65rem', color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)', lineHeight: 1.2, height: '24px' }}>
          {label}
        </div>
        <div style={{ height: '3px', background: barColor, borderRadius: '2px', marginTop: '4px' }}></div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* TRÁMITE ACTIVO */}
      <section className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ font: 'var(--font-section-title)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            <FileText size={18} color="var(--color-info)" />
            Trámite activo
          </h3>
          <button className="btn btn-ghost" onClick={onCreateTramite} style={{ padding: '0.2rem', color: 'var(--color-text-muted)' }}>
             <Plus size={18} />
          </button>
        </div>

        {activeTramite ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Tipo de trámite</span>
              <div style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600 }}>
                {activeTramite.servicio?.toUpperCase() || 'NO ESPECIFICADO'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Operacional</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 600 }}>
                  {activeTramite.operario ? activeTramite.operario.substring(0,2).toUpperCase() : 'AD'}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{activeTramite.operario || 'Sin asignar'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Estado</span>
              <select
                value={activeTramite.estado_tramite || 'pendiente'}
                onChange={(e) => onUpdateEstado(activeTramite.id, e.target.value)}
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: TRAMITE_COLORS[activeTramite.estado_tramite]?.bg || TRAMITE_COLORS.pendiente.bg,
                  color: TRAMITE_COLORS[activeTramite.estado_tramite]?.color || TRAMITE_COLORS.pendiente.color,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="pendiente">Pendiente</option>
                <option value="procesando">Procesando</option>
                <option value="completada">Completada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <StepIndicator num={1} label="Recepción de inf del cliente" status={getStepStatus(activeTramite.estado_tramite, 1)} />
              <StepIndicator num={2} label="Llenado de formularios" status={getStepStatus(activeTramite.estado_tramite, 2)} />
              <StepIndicator num={3} label="Entrega" status={getStepStatus(activeTramite.estado_tramite, 3)} />
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            No hay trámites activos.
          </div>
        )}
      </section>

      {/* HISTORIAL DE TRÁMITES */}
      <section className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ font: 'var(--font-section-title)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            <Clock size={18} color="var(--color-info)" />
            Historial de trámites
          </h3>
          <ChevronDown size={18} color="var(--color-text-muted)" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {historyTramites.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
               No hay historial.
             </div>
          ) : (
            historyTramites.map((t) => {
              const isExpanded = expandedHistoryId === t.id;
              return (
                <div key={t.id} style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  {/* Accordion Header */}
                  <div
                    onClick={() => setExpandedHistoryId(isExpanded ? null : t.id)}
                    style={{ padding: '0.75rem 1rem', background: 'var(--surface-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {t.servicio?.toUpperCase() || 'TRÁMITE'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{formatDate(t.creado_en)}</span>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </div>

                  {/* Accordion Body */}
                  {isExpanded && (
                    <div style={{ padding: '1rem', background: 'transparent', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Estado:</span>
                        <span style={{ color: TRAMITE_COLORS[t.estado_tramite]?.color || 'var(--color-text-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                          {t.estado_tramite?.toUpperCase() || 'PENDIENTE'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Agente:</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)' }}>{t.operario || 'N/A'}</span>
                      </div>
                      {/* Document mockup inside history */}
                      <div style={{ marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Documentos:</span>
                        <div style={{ marginTop: '0.5rem', background: 'var(--surface-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FileText size={14} color="var(--color-info)" />
                          <span>Sin documentos adjuntos</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
