import React, { useState, useCallback } from 'react';
import { Plus, ChevronDown, ChevronUp, FileText, Send, Loader2, Trash2 } from 'lucide-react';
import { formatDate } from '../utils/dateFormatter';
import { getNotasTramite, createNotaTramite } from '../services/tramitesService';
import toast from 'react-hot-toast';

const TRAMITE_COLORS = {
  completada: { bg: 'rgba(29,158,117,0.18)', color: '#1D9E75' },
  procesando: { bg: 'rgba(55,138,221,0.18)', color: '#378ADD' },
  cancelada: { bg: 'rgba(216,90,48,0.18)', color: '#D85A30' },
  pendiente: { bg: 'rgba(186,117,23,0.18)', color: '#BA7517' },
};

export default function ClientViewTramites({
  entradas = [],
  catalogoTramites = [],
  operariosList = [],
  onCreateTramite,
  onUpdateEstado,
  onUpdateServicio,
  onUpdateOperario,
  onDeleteTramite,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [notasCache, setNotasCache] = useState({}); // { [entradaId]: nota[] }
  const [loadingNotas, setLoadingNotas] = useState(null);
  const [newNotaText, setNewNotaText] = useState('');
  const [sendingNota, setSendingNota] = useState(false);

  const sortedEntradas = [...entradas].sort((a, b) => {
    const dateA = new Date(b.creado_en || b.created_at || 0).getTime();
    const dateB = new Date(a.creado_en || a.created_at || 0).getTime();
    return dateA - dateB;
  });

  const handleToggle = useCallback(async (entradaId) => {
    if (expandedId === entradaId) {
      setExpandedId(null);
      setNewNotaText('');
      return;
    }

    setExpandedId(entradaId);
    setNewNotaText('');

    // Load notas if not cached
    if (!notasCache[entradaId]) {
      setLoadingNotas(entradaId);
      try {
        const notas = await getNotasTramite(entradaId);
        setNotasCache(prev => ({ ...prev, [entradaId]: notas }));
      } catch (err) {
        console.error('[ClientViewTramites] Error loading notas:', err);
        setNotasCache(prev => ({ ...prev, [entradaId]: [] }));
      } finally {
        setLoadingNotas(null);
      }
    }
  }, [expandedId, notasCache]);

  const handleAddNota = useCallback(async (entradaId) => {
    if (!newNotaText.trim()) return;

    setSendingNota(true);
    try {
      const nota = await createNotaTramite({
        entrada_id: entradaId,
        texto: newNotaText,
      });
      setNotasCache(prev => ({
        ...prev,
        [entradaId]: [nota, ...(prev[entradaId] || [])],
      }));
      setNewNotaText('');
      toast.success('Nota agregada');
    } catch (err) {
      console.error('[ClientViewTramites] Error creating nota:', err);
      toast.error('Error al agregar la nota');
    } finally {
      setSendingNota(false);
    }
  }, [newNotaText]);

  const handleKeyDown = (e, entradaId) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddNota(entradaId);
    }
  };

  return (
    <section className="glass-panel" style={{ padding: '1.25rem', flexShrink: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sortedEntradas.length > 0 ? '1rem' : 0 }}>
        <h3 style={{ font: 'var(--font-section-title)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
          <FileText size={18} color="var(--color-info)" />
          Trámites
          {sortedEntradas.length > 0 && (
            <span style={{
              background: 'var(--color-primary)',
              color: 'white',
              padding: '1px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              marginLeft: '0.25rem',
            }}>
              {sortedEntradas.length}
            </span>
          )}
        </h3>
        <button className="btn btn-ghost" onClick={onCreateTramite} style={{ padding: '0.2rem', color: 'var(--color-text-muted)' }}>
          <Plus size={18} />
        </button>
      </div>

      {/* Lista de trámites */}
      {sortedEntradas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          No hay trámites registrados.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {sortedEntradas.map((t) => {
            const isExpanded = expandedId === t.id;
            const estadoColor = TRAMITE_COLORS[t.estado_tramite] || TRAMITE_COLORS.pendiente;
            const notas = notasCache[t.id] || [];
            const isLoadingThisNotas = loadingNotas === t.id;

            return (
              <div
                key={t.id}
                style={{
                  border: `1px solid ${isExpanded ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s ease',
                }}
              >
                {/* Accordion Header */}
                <div
                  onClick={() => handleToggle(t.id)}
                  style={{
                    padding: '0.75rem 1rem',
                    background: isExpanded ? 'var(--color-bg-elevated)' : 'transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    {isExpanded ? <ChevronUp size={16} color="var(--color-primary)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {t.servicio?.toUpperCase() || 'TRÁMITE'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: estadoColor.bg,
                      color: estadoColor.color,
                    }}>
                      {(t.estado_tramite || 'pendiente').charAt(0).toUpperCase() + (t.estado_tramite || 'pendiente').slice(1)}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {formatDate(t.creado_en)}
                    </span>
                  </div>
                </div>

                {/* Accordion Body — Expanded */}
                {isExpanded && (
                  <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Detalles del trámite */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Tipo de trámite</span>
                        <select
                          value={t.servicio || ''}
                          onChange={(e) => onUpdateServicio && onUpdateServicio(t.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            background: 'var(--color-info-bg, rgba(55,138,221,0.15))',
                            color: 'var(--color-info)',
                            padding: '0.25rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            border: 'none',
                            outline: 'none',
                            cursor: 'pointer',
                            maxWidth: '60%',
                          }}
                        >
                          <option value="">SELECCIONAR...</option>
                          {/* Opciones del catálogo */}
                          {catalogoTramites.map(cat => (
                            <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                          ))}
                          {/* Si el trámite actual no está en el catálogo, mostrarlo también */}
                          {t.servicio && !catalogoTramites.some(cat => cat.nombre.toUpperCase() === t.servicio.toUpperCase()) && (
                            <option value={t.servicio}>{t.servicio.toUpperCase()}</option>
                          )}
                        </select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Operacional</span>
                        <select
                          value={t.operario || ''}
                          onChange={(e) => onUpdateOperario && onUpdateOperario(t.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-elevated)',
                            color: 'var(--color-text-primary)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          <option value="">Sin asignar</option>
                          {operariosList.map(op => (
                            <option key={op.id} value={op.nombre}>{op.nombre}</option>
                          ))}
                          {/* Si el operario actual no está en la lista, mostrarlo */}
                          {t.operario && !operariosList.some(op => op.nombre === t.operario) && (
                            <option value={t.operario}>{t.operario}</option>
                          )}
                        </select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Estado</span>
                        <select
                          value={t.estado_tramite || 'pendiente'}
                          onChange={(e) => onUpdateEstado(t.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            background: estadoColor.bg,
                            color: estadoColor.color,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="procesando">Procesando</option>
                          <option value="completada">Completada</option>
                          <option value="cancelada">Cancelada</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDeleteTramite) onDeleteTramite(t.id);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.35rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            background: 'rgba(239, 68, 68, 0.05)',
                            color: 'rgb(239, 68, 68)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
                        >
                          <Trash2 size={14} />
                          Eliminar Trámite
                        </button>
                      </div>
                    </div>

                    {/* Separador */}
                    <div style={{ height: '1px', background: 'var(--color-border)' }} />

                    {/* Historial del Trámite */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h4 style={{
                          margin: 0, fontSize: '0.8rem', fontWeight: 600,
                          color: 'var(--color-text-secondary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          Historial del Trámite
                        </h4>
                      </div>

                      {/* Input para nueva nota */}
                      <div style={{
                        display: 'flex', gap: '0.5rem', marginBottom: '0.75rem',
                      }}>
                        <input
                          type="text"
                          placeholder="Agregar nota al historial..."
                          value={newNotaText}
                          onChange={(e) => setNewNotaText(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, t.id)}
                          onClick={(e) => e.stopPropagation()}
                          disabled={sendingNota}
                          style={{
                            flex: 1,
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-elevated)',
                            color: 'var(--color-text-primary)',
                            fontSize: '0.8rem',
                            outline: 'none',
                          }}
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAddNota(t.id); }}
                          disabled={sendingNota || !newNotaText.trim()}
                          className="btn btn-primary"
                          style={{
                            padding: '0.5rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: sendingNota || !newNotaText.trim() ? 0.5 : 1,
                          }}
                        >
                          {sendingNota ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </button>
                      </div>

                      {/* Timeline de notas */}
                      {isLoadingThisNotas ? (
                        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                          <Loader2 size={18} className="animate-spin" style={{ display: 'inline-block', marginRight: '0.5rem' }} />
                          Cargando historial...
                        </div>
                      ) : notas.length === 0 ? (
                        <div style={{
                          textAlign: 'center', padding: '1rem',
                          color: 'var(--color-text-muted)', fontSize: '0.8rem',
                          fontStyle: 'italic',
                        }}>
                          Sin notas en el historial. Agrega la primera nota arriba.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', maxHeight: '300px', overflowY: 'auto' }}>
                          {/* Línea vertical del timeline */}
                          <div style={{
                            position: 'absolute',
                            left: '52px',
                            top: '8px',
                            bottom: '8px',
                            width: '2px',
                            background: 'var(--color-border)',
                            borderRadius: '1px',
                          }} />

                          {notas.map((nota, idx) => (
                            <div
                              key={nota.id}
                              style={{
                                display: 'flex',
                                gap: '1rem',
                                padding: '0.6rem 0',
                                position: 'relative',
                                alignItems: 'flex-start',
                              }}
                            >
                              {/* Fecha */}
                              <div style={{
                                width: '44px', flexShrink: 0,
                                fontSize: '0.7rem', fontWeight: 600,
                                color: idx === 0 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                textAlign: 'right',
                                lineHeight: '1.4',
                                paddingTop: '2px',
                              }}>
                                {new Date(nota.creado_en).toLocaleDateString('es', { day: '2-digit', month: '2-digit' })}
                              </div>

                              {/* Dot del timeline */}
                              <div style={{
                                width: '8px', height: '8px',
                                borderRadius: '50%',
                                background: idx === 0 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                flexShrink: 0,
                                marginTop: '5px',
                                position: 'relative',
                                zIndex: 1,
                                boxShadow: idx === 0 ? '0 0 0 3px rgba(55,138,221,0.2)' : 'none',
                              }} />

                              {/* Texto */}
                              <div style={{
                                flex: 1,
                                fontSize: '0.8rem',
                                color: 'var(--color-text-primary)',
                                lineHeight: '1.5',
                                paddingTop: '1px',
                              }}>
                                {nota.texto}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
