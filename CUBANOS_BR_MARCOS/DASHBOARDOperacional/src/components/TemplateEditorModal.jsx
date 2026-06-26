import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Plus, Save, Loader2, Tag, GripVertical, Trash2, MousePointer } from 'lucide-react';
import { AVAILABLE_CLIENT_FIELDS, saveTemplateMapping, renderPdfPageAsImage } from '../services/templateService';

/**
 * TemplateEditorModal
 * 
 * Modal fullscreen para editar el mapeo de campos sobre una plantilla.
 * El OP ve la imagen de la plantilla de fondo y puede:
 * - Arrastrar etiquetas a la posición correcta
 * - Agregar nuevas etiquetas desde un dropdown
 * - Eliminar etiquetas
 * - Doble-clic para renombrar la etiqueta
 * - Guardar los cambios
 */
export default function TemplateEditorModal({ template, onClose, onSaved }) {
  const [mappings, setMappings] = useState([]);
  const [bgImage, setBgImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [showAddField, setShowAddField] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Cargar la imagen de la plantilla y los mappings existentes
  useEffect(() => {
    const loadTemplate = async () => {
      setLoading(true);
      try {
        // Cargar mappings existentes
        const existingMappings = template.field_mappings || [];
        setMappings(existingMappings.map((m, i) => ({ ...m, _id: m._id || `m_${i}_${Date.now()}` })));

        // Renderizar PDF como imagen o usar URL directa si es imagen
        if (template.tipo_contenido === 'application/pdf') {
          const imgUrl = await renderPdfPageAsImage(template.url_archivo, 1, 2);
          setBgImage(imgUrl);
        } else {
          setBgImage(template.url_archivo);
        }
      } catch (err) {
        console.error('Error loading template:', err);
        alert('Error cargando la plantilla: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadTemplate();
  }, [template]);

  // ── Drag Logic (mouse events on the container) ──
  const dragState = useRef({ active: false, idx: null, offsetX: 0, offsetY: 0 });

  const handleMouseDown = useCallback((e, idx) => {
    e.preventDefault();
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mapping = mappings[idx];
    const tagX = mapping.x * rect.width;
    const tagY = mapping.y * rect.height;

    dragState.current = {
      active: true,
      idx,
      offsetX: e.clientX - rect.left - tagX,
      offsetY: e.clientY - rect.top - tagY,
    };
    setDragIndex(idx);
  }, [mappings]);

  const handleMouseMove = useCallback((e) => {
    if (!dragState.current.active) return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const { idx, offsetX, offsetY } = dragState.current;

    let newX = (e.clientX - rect.left - offsetX) / rect.width;
    let newY = (e.clientY - rect.top - offsetY) / rect.height;

    // Clamp to [0, 1]
    newX = Math.max(0, Math.min(1, newX));
    newY = Math.max(0, Math.min(1, newY));

    setMappings(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], x: newX, y: newY };
      return updated;
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    dragState.current.active = false;
    setDragIndex(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // ── Agregar campo ──
  const handleAddField = (fieldId) => {
    const fieldDef = AVAILABLE_CLIENT_FIELDS.find(f => f.id === fieldId);
    if (!fieldDef) return;

    const newMapping = {
      _id: `m_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      fieldId: fieldDef.id,
      fieldLabel: fieldDef.label,
      x: 0.3,
      y: 0.5,
      width: 0.3,
      height: 0.025,
    };

    setMappings(prev => [...prev, newMapping]);
    setShowAddField(false);
  };

  // ── Eliminar campo ──
  const handleRemoveField = (idx) => {
    setMappings(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Guardar ──
  const handleSave = async () => {
    setSaving(true);
    try {
      // Limpiar _id internos antes de guardar
      const cleanMappings = mappings.map(({ _id, ...rest }) => rest);
      const { error } = await saveTemplateMapping(template.id, cleanMappings);
      if (error) throw new Error(error);
      onSaved?.();
      onClose();
    } catch (err) {
      alert('Error guardando: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Campos ya usados
  const usedFieldIds = new Set(mappings.map(m => m.fieldId));
  const availableFields = AVAILABLE_CLIENT_FIELDS.filter(f => !usedFieldIds.has(f.id));

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
          <Tag size={20} color="var(--color-primary)" />
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
            Editor de Mapeo — {template.nombre}
          </h2>
          <span style={{
            fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)',
            background: 'rgba(59,130,246,0.15)', color: 'var(--color-primary)', fontWeight: 500,
          }}>
            {mappings.length} campos
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowAddField(!showAddField)}
            style={{ position: 'relative' }}
          >
            <Plus size={16} /> Agregar Campo
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Guardando...' : 'Guardar Mapeo'}
          </button>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '0.5rem' }}>
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Dropdown para agregar campo */}
      {showAddField && (
        <div style={{
          position: 'absolute', top: '60px', right: '200px', zIndex: 210,
          background: 'var(--color-bg-base)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', padding: '0.5rem', maxHeight: '300px',
          overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minWidth: '220px',
        }}>
          {availableFields.length === 0 ? (
            <div style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Todos los campos ya están asignados
            </div>
          ) : (
            availableFields.map(f => (
              <button
                key={f.id}
                onClick={() => handleAddField(f.id)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: 'none', border: 'none', padding: '0.5rem 0.75rem',
                  fontSize: '0.85rem', color: 'var(--color-text-primary)',
                  cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-elevated)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                {f.label}
              </button>
            ))
          )}
        </div>
      )}

      {/* Canvas Area */}
      <div style={{
        flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center',
        alignItems: 'flex-start', padding: '1.5rem', background: 'rgba(15,23,42,0.5)',
      }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '4rem' }}>
            <Loader2 size={32} className="animate-spin" color="var(--color-primary)" />
            <span style={{ color: 'var(--color-text-secondary)' }}>Cargando plantilla...</span>
          </div>
        ) : (
          <div
            ref={containerRef}
            style={{
              position: 'relative', display: 'inline-block',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)', borderRadius: 'var(--radius-md)',
              overflow: 'hidden', cursor: dragIndex !== null ? 'grabbing' : 'default',
              maxWidth: '100%',
            }}
          >
            {/* Background Image */}
            <img
              ref={canvasRef}
              src={bgImage}
              alt="Plantilla"
              style={{
                display: 'block', maxHeight: 'calc(100vh - 120px)',
                maxWidth: '100%', objectFit: 'contain',
                userSelect: 'none', pointerEvents: 'none',
              }}
              draggable={false}
            />

            {/* Tags Overlay */}
            {mappings.map((mapping, idx) => (
              <div
                key={mapping._id || idx}
                onMouseDown={(e) => handleMouseDown(e, idx)}
                onDoubleClick={() => setEditingLabel(idx)}
                style={{
                  position: 'absolute',
                  left: `${mapping.x * 100}%`,
                  top: `${mapping.y * 100}%`,
                  transform: 'translate(0, -50%)',
                  display: 'flex', alignItems: 'center', gap: '4px',
                  background: dragIndex === idx
                    ? 'rgba(59,130,246,0.95)'
                    : 'rgba(59,130,246,0.85)',
                  color: 'white',
                  padding: '3px 8px 3px 4px',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'grab',
                  userSelect: 'none',
                  boxShadow: dragIndex === idx
                    ? '0 4px 16px rgba(59,130,246,0.5)'
                    : '0 2px 8px rgba(0,0,0,0.3)',
                  transition: dragIndex === idx ? 'none' : 'box-shadow 0.2s',
                  whiteSpace: 'nowrap',
                  zIndex: dragIndex === idx ? 50 : 10,
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                <GripVertical size={12} style={{ opacity: 0.7, flexShrink: 0 }} />
                {editingLabel === idx ? (
                  <input
                    autoFocus
                    defaultValue={mapping.fieldLabel}
                    onBlur={(e) => {
                      const arr = [...mappings];
                      arr[idx] = { ...arr[idx], fieldLabel: e.target.value };
                      setMappings(arr);
                      setEditingLabel(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.target.blur();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                      background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
                      borderRadius: '3px', color: 'white', fontSize: '0.7rem', padding: '1px 4px',
                      outline: 'none', width: '120px', fontWeight: 600,
                    }}
                  />
                ) : (
                  <span>{mapping.fieldLabel}</span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveField(idx); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                    cursor: 'pointer', padding: '1px 3px', borderRadius: '3px',
                    display: 'flex', alignItems: 'center', marginLeft: '4px',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.6)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  title="Eliminar campo"
                >
                  <X size={10} />
                </button>
              </div>
            ))}

            {/* Helper text when empty */}
            {mappings.length === 0 && !loading && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)',
              }}>
                <MousePointer size={32} color="var(--color-primary)" style={{ marginBottom: '0.75rem' }} />
                <span style={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>
                  Sin campos mapeados
                </span>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Haz clic en "Agregar Campo" para comenzar
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with instructions */}
      <div style={{
        padding: '0.75rem 1.5rem', background: 'var(--color-bg-base)',
        borderTop: '1px solid var(--color-border)', flexShrink: 0,
        display: 'flex', gap: '2rem', fontSize: '0.75rem', color: 'var(--color-text-muted)',
      }}>
        <span>🖱️ <strong>Arrastrar</strong> — mover etiqueta</span>
        <span>🖱️🖱️ <strong>Doble clic</strong> — renombrar</span>
        <span>❌ <strong>X</strong> — eliminar</span>
        <span>➕ <strong>Agregar Campo</strong> — añadir nueva etiqueta</span>
      </div>
    </div>
  );
}
