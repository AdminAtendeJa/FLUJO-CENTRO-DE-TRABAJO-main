import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Loader2, CheckCircle, AlertTriangle, Edit2, GripVertical } from 'lucide-react';
import { generateFilledPDF, renderPdfPageAsImage, AVAILABLE_CLIENT_FIELDS } from '../services/templateService';

/**
 * TemplatePreviewModal
 * 
 * Pantalla de verificación donde el OP ve la plantilla con los datos del cliente
 * superpuestos. Puede editar valores inline antes de generar la copia final.
 */
export default function TemplatePreviewModal({ template, client, onClose }) {
  const [bgImage, setBgImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editableValues, setEditableValues] = useState({});
  const [editingField, setEditingField] = useState(null);
  const [localMappings, setLocalMappings] = useState([]);
  const containerRef = useRef(null);
  const tagsRef = useRef({});

  // Cargar imagen de fondo y valores del cliente
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (template.tipo_contenido === 'application/pdf') {
          const imgUrl = await renderPdfPageAsImage(template.url_archivo, 1, 2);
          setBgImage(imgUrl);
        } else {
          setBgImage(template.url_archivo);
        }

        // Pre-cargar valores del cliente y mapeos
        const loadedMappings = template.field_mappings || [];
        setLocalMappings(loadedMappings);

        const values = {};
        for (const m of loadedMappings) {
          values[m.fieldId] = getClientValue(client, m.fieldId);
        }
        setEditableValues(values);
      } catch (err) {
        console.error('Error loading preview:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [template, client]);

  const getClientValue = (clientData, fieldId) => {
    if (!clientData || !fieldId) return '';
    const val = clientData[fieldId];
    if (!val) return '';

    if (fieldId === 'direccion') {
      try {
        let dirObj = val;
        if (typeof val === 'string') dirObj = JSON.parse(val);
        return [dirObj.endereco, dirObj.numero, dirObj.bairro, dirObj.cidade, dirObj.estado]
          .filter(Boolean).join(', ');
      } catch {
        return String(val);
      }
    }
    return String(val);
  };

  // ── Drag Logic ──
  const dragState = useRef({ active: false, idx: null, offsetX: 0, offsetY: 0, newX: 0, newY: 0, moved: false });

  const handleMouseDown = useCallback((e, idx) => {
    e.preventDefault();
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mapping = localMappings[idx];
    const tagX = mapping.x * rect.width;
    const tagY = mapping.y * rect.height;

    dragState.current = {
      active: true,
      idx,
      offsetX: e.clientX - rect.left - tagX,
      offsetY: e.clientY - rect.top - tagY,
      newX: mapping.x,
      newY: mapping.y,
      moved: false,
    };
  }, [localMappings]);

  const handleMouseMove = useCallback((e) => {
    if (!dragState.current.active) return;
    const container = containerRef.current;
    if (!container) return;

    dragState.current.moved = true;

    const rect = container.getBoundingClientRect();
    const { idx, offsetX, offsetY } = dragState.current;

    let newX = (e.clientX - rect.left - offsetX) / rect.width;
    let newY = (e.clientY - rect.top - offsetY) / rect.height;

    newX = Math.max(0, Math.min(1, newX));
    newY = Math.max(0, Math.min(1, newY));

    dragState.current.newX = newX;
    dragState.current.newY = newY;

    const tagEl = tagsRef.current[idx];
    if (tagEl) {
      tagEl.style.left = `${newX * 100}%`;
      tagEl.style.top = `${newY * 100}%`;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!dragState.current.active) return;

    const { idx, newX, newY, moved } = dragState.current;

    if (moved) {
      setLocalMappings(prev => {
        const updated = [...prev];
        if (updated[idx].x !== newX || updated[idx].y !== newY) {
          updated[idx] = { ...updated[idx], x: newX, y: newY };
        }
        return updated;
      });
    } else {
      setEditingField(idx);
    }

    dragState.current.active = false;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Construir clientData con valores editados
      const filledData = { ...client };
      for (const [fieldId, value] of Object.entries(editableValues)) {
        filledData[fieldId] = value;
      }

      const { error } = await generateFilledPDF(template.url_archivo, localMappings, filledData);
      if (error) throw new Error(error);

      // Mostrar alerta de éxito y cerrar
      onClose();
    } catch (err) {
      alert('Error generando el documento: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Contar campos con/sin valor
  const filledCount = localMappings.filter(m => m.isCustomText || editableValues[m.fieldId]?.trim()).length;
  const emptyCount = localMappings.length - filledCount;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column',
      zIndex: 200, animation: 'fadeIn 0.3s ease-out',
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-base)', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircle size={20} color="var(--color-success)" />
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
            Verificación — {template.nombre}
          </h2>
          <span style={{
            fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)',
            background: filledCount === localMappings.length ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
            color: filledCount === localMappings.length ? 'var(--color-success)' : 'var(--color-warning)',
            fontWeight: 500,
          }}>
            {filledCount}/{localMappings.length} campos listos
          </span>
          {emptyCount > 0 && (
            <span style={{
              fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)',
              background: 'rgba(239,68,68,0.15)', color: 'var(--color-danger)', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <AlertTriangle size={12} /> {emptyCount} vacíos
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {generating ? 'Generando...' : 'Generar Copia'}
          </button>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '0.5rem' }}>
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main content: left = preview, right = field list */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Document preview */}
        <div style={{
          flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center',
          alignItems: 'flex-start', padding: '1.5rem', background: 'rgba(15,23,42,0.5)',
        }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '4rem' }}>
              <Loader2 size={32} className="animate-spin" color="var(--color-primary)" />
              <span style={{ color: 'var(--color-text-secondary)' }}>Cargando vista previa...</span>
            </div>
          ) : (
            <div
              ref={containerRef}
              style={{
                position: 'relative', display: 'inline-block',
                boxShadow: '0 8px 40px rgba(0,0,0,0.5)', borderRadius: 'var(--radius-md)',
                overflow: 'hidden', maxWidth: '100%',
              }}
            >
              <img
                src={bgImage}
                alt="Preview"
                style={{
                  display: 'block', maxHeight: 'calc(100vh - 140px)',
                  maxWidth: '100%', objectFit: 'contain',
                  userSelect: 'none', pointerEvents: 'none',
                }}
                draggable={false}
              />

              {/* Overlay values */}
              {localMappings.map((mapping, idx) => {
                let value = editableValues[mapping.fieldId] || '';
                if (mapping.isCustomText) value = mapping.fieldLabel || '';
                const isEmpty = !mapping.isCustomText && !value.trim();

                return (
                  <div
                    key={idx}
                    ref={(el) => (tagsRef.current[idx] = el)}
                    onMouseDown={(e) => handleMouseDown(e, idx)}
                    style={{
                      position: 'absolute',
                      left: `${mapping.x * 100}%`,
                      top: `${mapping.y * 100}%`,
                      transform: 'translate(0, -50%)',
                      display: 'flex', flexDirection: 'column', gap: '2px',
                      maxWidth: `${(mapping.width || 0.3) * 100}%`,
                      cursor: dragState.current?.idx === idx && dragState.current?.active ? 'grabbing' : 'grab',
                      zIndex: editingField === idx ? 50 : 10,
                    }}
                  >
                    {/* Label */}
                    <span style={{
                      fontSize: '0.55rem', color: mapping.isCustomText ? 'rgba(16,185,129,1)' : 'var(--color-primary)',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      fontWeight: 700, lineHeight: 1, display: 'flex', alignItems: 'center', gap: '2px'
                    }}>
                      <GripVertical size={8} style={{ opacity: 0.6 }} />
                      {mapping.fieldLabel}
                    </span>
                    {/* Value */}
                    <div
                      style={{
                        fontSize: '0.75rem', fontWeight: 600,
                        color: isEmpty ? 'var(--color-danger)' : '#111',
                        background: isEmpty
                          ? 'rgba(239,68,68,0.15)'
                          : mapping.isCustomText ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,200,0.85)',
                        padding: '2px 6px', borderRadius: '3px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        border: `1px solid ${isEmpty ? 'rgba(239,68,68,0.3)' : mapping.isCustomText ? 'rgba(16,185,129,0.4)' : 'rgba(200,180,0,0.3)'}`,
                        display: 'flex', alignItems: 'center', gap: '4px',
                        transition: 'all 0.15s',
                      }}
                    >
                      {editingField === idx ? (
                        <input
                          autoFocus
                          value={value}
                          onChange={(e) => setEditableValues(prev => ({
                            ...prev, [mapping.fieldId]: e.target.value
                          }))}
                          onBlur={() => setEditingField(null)}
                          onKeyDown={(e) => { if (e.key === 'Enter') setEditingField(null); }}
                          style={{
                            background: 'white', border: '1px solid var(--color-primary)',
                            borderRadius: '3px', fontSize: '0.75rem', padding: '1px 4px',
                            outline: 'none', width: '150px', color: '#111', fontWeight: 600,
                          }}
                        />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Field panel */}
        <div style={{
          width: '320px', background: 'var(--color-bg-base)',
          borderLeft: '1px solid var(--color-border)', display: 'flex',
          flexDirection: 'column', flexShrink: 0,
        }}>
          <div style={{
            padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)',
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Datos del Cliente
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Haz clic en un valor para editarlo antes de generar.
            </p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            {localMappings.map((mapping, idx) => {
              if (mapping.isCustomText) return null; // No editables aquí, el layout los maneja aparte si se quiere
              const value = editableValues[mapping.fieldId] || '';
              const isEmpty = !value.trim();
              return (
                <div
                  key={idx}
                  style={{
                    padding: '0.65rem 0.75rem', marginBottom: '0.5rem',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isEmpty ? 'rgba(239,68,68,0.2)' : 'var(--color-border)'}`,
                  }}
                >
                  <label style={{
                    display: 'block', fontSize: '0.65rem', textTransform: 'uppercase',
                    letterSpacing: '0.05em', color: 'var(--color-text-muted)',
                    marginBottom: '0.3rem', fontWeight: 600,
                  }}>
                    {mapping.fieldLabel}
                    {isEmpty && (
                      <span style={{ color: 'var(--color-danger)', marginLeft: '0.5rem' }}>
                        ⚠ Vacío
                      </span>
                    )}
                  </label>
                  <input
                    className="form-input"
                    value={value}
                    onChange={(e) => setEditableValues(prev => ({
                      ...prev, [mapping.fieldId]: e.target.value
                    }))}
                    style={{
                      fontSize: '0.8rem', padding: '0.4rem 0.6rem',
                      background: isEmpty ? 'rgba(239,68,68,0.05)' : 'rgba(15,23,42,0.4)',
                    }}
                    placeholder="Sin dato..."
                  />
                </div>
              );
            })}

            {localMappings.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '2rem',
                color: 'var(--color-text-muted)', fontSize: '0.85rem',
              }}>
                Esta plantilla no tiene campos mapeados.
                Edita el mapeo primero.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
