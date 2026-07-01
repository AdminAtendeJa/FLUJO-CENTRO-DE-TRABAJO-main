import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Link as LinkIcon, FileText, AlertCircle } from 'lucide-react';
import { AVAILABLE_CLIENT_FIELDS, saveTemplateMapping, getPDFFormFields } from '../services/templateService';

export default function TemplateEditorModal({ template, onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pdfFields, setPdfFields] = useState([]);
  
  // mappings array: { pdfFieldName, kommoFieldId, isCustomText, customValue }
  const [mappings, setMappings] = useState([]);

  useEffect(() => {
    const loadFields = async () => {
      setLoading(true);
      try {
        if (template.tipo_contenido === 'application/pdf') {
          const fields = await getPDFFormFields(template.url_archivo);
          setPdfFields(fields);
        } else {
          // Si no es PDF, o no tiene campos nativos, mostramos error
          setPdfFields([]);
        }
        
        // Cargar mappings existentes
        const existingMappings = template.field_mappings || [];
        setMappings(existingMappings);
      } catch (err) {
        console.error('Error loading template fields:', err);
        alert('Error cargando la plantilla: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadFields();
  }, [template]);

  const handleSave = async () => {
    setSaving(true);
    const result = await saveTemplateMapping(template.id, mappings);
    setSaving(false);
    
    if (result.error) {
      alert('Error guardando: ' + result.error);
    } else {
      if (onSaved) onSaved();
      onClose();
    }
  };

  const updateMapping = (pdfFieldName, updates) => {
    setMappings(prev => {
      const existing = prev.find(m => m.pdfFieldName === pdfFieldName);
      if (existing) {
        return prev.map(m => m.pdfFieldName === pdfFieldName ? { ...m, ...updates } : m);
      } else {
        return [...prev, { pdfFieldName, ...updates }];
      }
    });
  };

  const getMappingFor = (pdfFieldName) => {
    return mappings.find(m => m.pdfFieldName === pdfFieldName) || null;
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--color-bg-base)',
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--color-bg-elevated)', flexShrink: 0
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Mapear Campos de PDF
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            {template.nombre}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={onClose}
            className="btn btn-ghost"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving || loading}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Guardar Mapeo
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '2rem' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)' }}>
            <Loader2 size={40} className="animate-spin" style={{ marginBottom: '1rem' }} />
            <p>Leyendo campos del PDF...</p>
          </div>
        ) : pdfFields.length === 0 ? (
          <div style={{ textAlign: 'center', maxWidth: '400px', margin: '4rem auto', color: 'var(--color-text-secondary)' }}>
            <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>No se encontraron campos</h3>
            <p style={{ fontSize: '0.9rem' }}>Este documento no parece ser un PDF Rellenable (AcroForm) o no contiene campos de texto. Asegúrate de subir un PDF con campos de formulario nativos.</p>
          </div>
        ) : (
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                Se han detectado <strong>{pdfFields.length}</strong> campos en el PDF. Selecciona qué dato del cliente debe insertarse en cada uno.
              </p>
            </div>
            
            {pdfFields.map(field => {
              const currentMap = getMappingFor(field.name);
              const isMapped = !!currentMap;
              const isCustom = currentMap?.isCustomText;
              
              return (
                <div key={field.name} style={{
                  display: 'flex', alignItems: 'center', gap: '1.5rem',
                  padding: '1rem 1.5rem',
                  background: 'var(--color-bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${isMapped ? 'var(--color-border)' : 'rgba(239, 68, 68, 0.3)'}`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ flex: '1', display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                    <FileText size={18} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {field.name}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{field.type}</p>
                    </div>
                  </div>
                  
                  <LinkIcon size={16} color="var(--color-text-muted)" style={{ opacity: 0.5 }} />
                  
                  <div style={{ flex: '1.5', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                      className="form-input"
                      value={isCustom ? 'custom_text' : (currentMap?.kommoFieldId || '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          // Unmap
                          setMappings(prev => prev.filter(m => m.pdfFieldName !== field.name));
                        } else if (val === 'custom_text') {
                          updateMapping(field.name, { isCustomText: true, customValue: '', kommoFieldId: null });
                        } else {
                          updateMapping(field.name, { isCustomText: false, kommoFieldId: val, customValue: null });
                        }
                      }}
                      style={{ padding: '0.5rem', fontSize: '0.9rem', flex: 1 }}
                    >
                      <option value="">-- No mapear --</option>
                      <optgroup label="Datos del Cliente">
                        {AVAILABLE_CLIENT_FIELDS.map(cf => (
                          <option key={cf.id} value={cf.id}>{cf.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Otros">
                        <option value="custom_text">Texto Personalizado...</option>
                      </optgroup>
                    </select>

                    {isCustom && (
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Escribe el texto..."
                        value={currentMap?.customValue || ''}
                        onChange={(e) => updateMapping(field.name, { customValue: e.target.value })}
                        style={{ padding: '0.5rem', fontSize: '0.9rem', width: '200px' }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
