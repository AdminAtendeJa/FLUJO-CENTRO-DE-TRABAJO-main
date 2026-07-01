import React, { useState, useEffect, useCallback } from 'react';
import { X, Download, Loader2, RefreshCw, ChevronDown, FileText } from 'lucide-react';
import { generateFilledPDF, getFilledPdfBlob, AVAILABLE_CLIENT_FIELDS } from '../services/templateService';

export default function TemplatePreviewModal({ template, client, onClose }) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  
  // editableValues contains the overrides the user has set for specific pdfFieldNames
  const [editableValues, setEditableValues] = useState({});
  const [localMappings, setLocalMappings] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);

  // Pre-load mappings and generate initial preview
  const loadPreview = useCallback(async () => {
    setLoading(true);
    try {
      const loadedMappings = template.field_mappings || [];
      setLocalMappings(loadedMappings);

      // Generate the initial filled PDF blob for the iframe
      const blob = await getFilledPdfBlob(template.url_archivo, loadedMappings, client, editableValues);
      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
    } catch (err) {
      console.error('Error loading preview:', err);
    } finally {
      setLoading(false);
    }
  }, [template, client, editableValues]);

  // Initial load only
  useEffect(() => {
    loadPreview();
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdatePreview = async () => {
    setLoading(true);
    try {
      const blob = await getFilledPdfBlob(template.url_archivo, localMappings, client, editableValues);
      const url = URL.createObjectURL(blob);
      
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(url);
    } catch (err) {
      console.error('Error updating preview:', err);
    } finally {
      setLoading(false);
    }
  };

  const getClientValue = (clientData, kommoFieldId) => {
    if (!clientData || !kommoFieldId) return '';
    const val = clientData[kommoFieldId];
    if (!val) return '';

    if (kommoFieldId === 'direccion') {
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

  const handleGenerateFinal = async () => {
    setGenerating(true);
    try {
      // Usamos el helper para descargar, pasándole los overrides en un futuro si es necesario
      // O mas facil, llamamos getFilledPdfBlob y forzamos la descarga aqui
      const blob = await getFilledPdfBlob(template.url_archivo, localMappings, client, editableValues);
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.nombre.replace(/\.[^/.]+$/, "")}_${client.nombre || 'documento'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error generando PDF: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--color-bg-base)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem', background: 'var(--color-bg-elevated)',
        borderBottom: '1px solid var(--color-border)', flexShrink: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.5rem' }}>
            <X size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Vista Previa de Generación</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{template.nombre}</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleUpdatePreview}
            disabled={loading}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Actualizar Vista
          </button>
          
          <button
            onClick={handleGenerateFinal}
            disabled={loading || generating}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-success)', color: 'white', border: 'none' }}
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Descargar PDF Final
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: PDF Preview iframe */}
        <div style={{ flex: 1, position: 'relative', background: '#e5e7eb' }}>
          {loading && !pdfPreviewUrl && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
              <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
              <span className="text-gray-500 font-medium">Generando previsualización...</span>
            </div>
          )}
          
          {pdfPreviewUrl && (
            <iframe 
              src={`${pdfPreviewUrl}#toolbar=0&navpanes=0`} 
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="PDF Preview"
            />
          )}
        </div>

        {/* Right: Field panel */}
        <div style={{
          width: '350px', background: 'var(--color-bg-base)',
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
              Revisa y modifica los valores antes de generar el PDF final.
            </p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            {localMappings.map((mapping, idx) => {
              // Obtener valor actual: overrides si existe, sino el de clientData o custom
              let defaultValue = '';
              if (mapping.isCustomText) {
                defaultValue = mapping.fieldLabel || mapping.customValue || '';
              } else {
                defaultValue = getClientValue(client, mapping.kommoFieldId || mapping.fieldId);
              }
              
              const currentValue = editableValues[mapping.pdfFieldName] !== undefined 
                ? editableValues[mapping.pdfFieldName] 
                : defaultValue;

              const isEmpty = !currentValue.trim();

              return (
                <div
                  key={idx}
                  style={{
                    padding: '0.65rem 0.75rem', marginBottom: '0.5rem',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isEmpty ? 'rgba(239,68,68,0.3)' : 'var(--color-border)'}`,
                  }}
                >
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    fontSize: '0.75rem', color: 'var(--color-text-muted)',
                    marginBottom: '0.4rem', fontWeight: 600,
                  }}>
                    <FileText size={12} />
                    {mapping.pdfFieldName}
                    {isEmpty && (
                      <span style={{ color: 'var(--color-danger)', fontSize: '0.65rem', marginLeft: 'auto' }}>
                        ¡Vacío!
                      </span>
                    )}
                  </label>
                  
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        className="form-input"
                        value={currentValue}
                        onChange={(e) => {
                          setEditableValues(prev => ({
                            ...prev, 
                            [mapping.pdfFieldName]: e.target.value
                          }));
                        }}
                        style={{
                          fontSize: '0.85rem', padding: '0.5rem',
                          background: isEmpty ? 'rgba(239,68,68,0.05)' : 'var(--color-bg-base)',
                          width: '100%',
                        }}
                        placeholder="Escribe un valor..."
                      />
                      
                      {!mapping.isCustomText && (
                        <button
                          onClick={() => setOpenDropdown(openDropdown === idx ? null : idx)}
                          style={{
                            position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)',
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            padding: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--color-text-muted)'
                          }}
                        >
                          <ChevronDown size={16} />
                        </button>
                      )}
                    </div>

                    {openDropdown === idx && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                        background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)', maxHeight: '200px', overflowY: 'auto',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)', marginTop: '4px'
                      }}>
                        {AVAILABLE_CLIENT_FIELDS.map(field => {
                          const clientVal = getClientValue(client, field.id);
                          if (!clientVal) return null;
                          return (
                            <div
                              key={field.id}
                              onClick={() => {
                                setEditableValues(prev => ({ ...prev, [mapping.pdfFieldName]: clientVal }));
                                setOpenDropdown(null);
                              }}
                              style={{
                                padding: '0.6rem', cursor: 'pointer', fontSize: '0.8rem',
                                borderBottom: '1px solid var(--color-border)',
                                display: 'flex', flexDirection: 'column', gap: '0.25rem'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{field.label}</span>
                              <span style={{ color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {clientVal}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {localMappings.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '2rem',
                color: 'var(--color-text-muted)', fontSize: '0.85rem',
              }}>
                Esta plantilla no tiene campos mapeados.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}