import React, { useState, useEffect, useCallback } from 'react';
import {  UploadCloud, FileText, Loader2, Tag, Eye, Trash2, Sparkles, Plus, Search , ChevronDown, ChevronUp } from 'lucide-react';
import { uploadTemplate, getTemplates, deleteTemplate, analyzeTemplateWithAI, renderPdfPageAsImage } from '../services/templateService';
import TemplateEditorModal from './TemplateEditorModal';
import TemplatePreviewModal from './TemplatePreviewModal';
import HtmlTemplateBuilder from './HtmlTemplateBuilder';
import { formatDate } from '../utils/dateFormatter';

/**
 * TemplateManager
 * 
 * Reemplaza la sección "Generador de Trámites y Declaraciones".
 * Permite subir plantillas, gestionar mapeos y generar copias para un cliente.
 */
export default function TemplateManager({ client, clienteDatos }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(null); // templateId being analyzed
  const [isDragging, setIsDragging] = useState(false);

  // Modals
  const [editorTemplate, setEditorTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [showHtmlBuilder, setShowHtmlBuilder] = useState(false);

  // Upload form
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadName, setUploadName] = useState('');

  // Search
  const [isTemplateExpanded, setIsTemplateExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Thumbnails cache (No longer used in UI, but kept for compatibility if needed)
  const [thumbnails, setThumbnails] = useState({});

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const { data } = await getTemplates();
    setTemplates(data);
    setLoading(false);

    // Generate thumbnails for PDFs (kept logic but not rendering them)
    for (const t of data) {
      if (t.tipo_contenido === 'application/pdf' && !thumbnails[t.id]) {
        try {
          const img = await renderPdfPageAsImage(t.url_archivo, 1, 0.5);
          setThumbnails(prev => ({ ...prev, [t.id]: img }));
        } catch (err) {
          console.warn('Thumbnail error for', t.nombre, err);
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Upload handler
  const handleUpload = useCallback(async (file) => {
    if (!file) return;

    const allowedTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 'image/png', 'image/webp'
    ];
    if (!allowedTypes.includes(file.type)) {
      alert('Solo se permiten archivos PDF, Word (.docx), JPEG, PNG o WebP.');
      return;
    }

    const nombre = uploadName.trim() || file.name.replace(/\.[^/.]+$/, '');
    setUploading(true);

    try {
      const { data: record, error } = await uploadTemplate(file, nombre);
      if (error) { alert('Error: ' + error); return; }

      setUploadName('');
      setShowUploadForm(false);
      await fetchTemplates();

      // Auto-analyze con IA
      if (record) {
        setAnalyzing(record.id);
        try {
          let base64;
          if (file.type === 'application/pdf') {
            const { convertPdfPageToImageBase64 } = await import('../services/pdfToImage');
            base64 = await convertPdfPageToImageBase64(file);
          } else {
            base64 = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
            });
          }

          const detectedMappings = await analyzeTemplateWithAI(base64);

          if (detectedMappings.length > 0) {
            const { saveTemplateMapping } = await import('../services/templateService');
            await saveTemplateMapping(record.id, detectedMappings);
            await fetchTemplates();
          }
        } catch (aiErr) {
          console.warn('AI analysis failed:', aiErr.message);
        } finally {
          setAnalyzing(null);
        }
      }
    } finally {
      setUploading(false);
    }
  }, [uploadName, fetchTemplates]);

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.toLowerCase().endsWith('.doc') || file.type === 'application/msword') {
        alert('Por favor, guarda tu documento como .DOCX (versión moderna de Word) en lugar de .DOC antes de subirlo.');
        e.target.value = '';
        return;
      }
      handleUpload(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      if (file.name.toLowerCase().endsWith('.doc') || file.type === 'application/msword') {
        alert('Por favor, guarda tu documento como .DOCX (versión moderna de Word) en lugar de .DOC antes de subirlo.');
        return;
      }
      handleUpload(file);
    }
  };

  const handleDelete = async (template) => {
    if (!window.confirm(`¿Eliminar la plantilla "${template.nombre}"?`)) return;
    const { error } = await deleteTemplate(template);
    if (error) { alert('Error: ' + error); return; }
    await fetchTemplates();
  };

  // Filtered templates
  const filteredTemplates = String(searchQuery).trim()
    ? templates.filter(t => (t.nombre || '').toLowerCase().includes(String(searchQuery).toLowerCase()))
    : templates;

  return (
    <>
      <section id="template-engine" className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: isTemplateExpanded ? '1px solid var(--color-border)' : 'none', cursor: 'pointer', flexWrap: 'wrap', gap: '1rem' }} onClick={() => setIsTemplateExpanded(!isTemplateExpanded)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
            <FileText size={18} color="var(--color-info)" />
            <h3 style={{ font: 'var(--font-section-title)', margin: 0, fontSize: '1rem' }}>Generador de Planillas</h3>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {templates.length > 3 && (
              <div style={{ position: 'relative' }}>
                <Search size={14} color="var(--color-text-muted)" style={{
                  position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
                }} />
                <input
                  type="text"
                  placeholder="Buscar plantilla..."
                  className="form-input"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '2rem', fontSize: '0.8rem', width: '180px', padding: '0.4rem 0.6rem 0.4rem 2rem' }}
                />
              </div>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => setShowHtmlBuilder(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={16} /> Crear Plantilla HTML
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowUploadForm(!showUploadForm)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={16} /> Subir Documento (PDF/Word)
            </button>
          </div>
        </div>

        {/* Upload Form */}
        {showUploadForm && (
          <div style={{
            marginBottom: '1.5rem', padding: '1.25rem',
            background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            animation: 'fadeIn 0.25s ease-out',
          }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{
                  display: 'block', fontSize: '0.75rem', marginBottom: '0.4rem',
                  color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  Nombre de la plantilla
                </label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Ej: Declaración de Hipossuficiencia"
                  value={uploadName}
                  onChange={e => setUploadName(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: `2px dashed ${isDragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
                backgroundColor: isDragging ? 'rgba(59,130,246,0.05)' : 'transparent',
                borderRadius: 'var(--radius-md)', padding: '2rem',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <input type="file" style={{ display: 'none' }} onChange={handleFileInput} disabled={uploading} accept=".pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,.doc,.jpg,.jpeg,.png,.webp" />
              {uploading ? (
                <Loader2 className="animate-spin" size={28} color="var(--color-primary)" />
              ) : (
                <UploadCloud size={28} color={isDragging ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
              )}
              <div style={{
                fontSize: '0.875rem', fontWeight: 500, marginTop: '0.75rem',
                color: isDragging ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              }}>
                {uploading ? 'Subiendo y analizando...' : isDragging ? 'Suelta aquí' : 'Arrastra un PDF, Word o imagen, o haz clic'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                PDF, DOCX, DOC, JPEG, PNG, WebP — Máx 10MB
              </div>
            </label>
          </div>
        )}

        {/* Template List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
            <Loader2 size={24} className="animate-spin" color="var(--color-primary)" style={{ margin: '0 auto 0.5rem' }} />
            Cargando plantillas...
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '3rem',
            color: 'var(--color-text-muted)', fontSize: '0.9rem',
          }}>
            {templates.length === 0 ? (
              <>
                <FileText size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Sin plantillas</div>
                <div style={{ fontSize: '0.8rem' }}>
                  Sube tu primera plantilla de documento para comenzar.
                </div>
              </>
            ) : (
              'No se encontraron plantillas con ese nombre.'
            )}
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1.25rem', paddingTop: 0
          }}>
            {filteredTemplates.map(template => {
              const mappingCount = (template.field_mappings || []).length;
              const isAnalyzing = analyzing === template.id;

              return (
                <div
                  key={template.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem 1rem', background: 'var(--color-bg-elevated)',
                    borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                    transition: 'background 0.2s', gap: '1rem'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--color-bg-elevated)'}
                >
                  {/* Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                    <FileText size={16} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
                    <div style={{
                      fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }} title={template.nombre}>
                      {template.nombre}
                    </div>
                    {mappingCount > 0 && !isAnalyzing && (
                      <span style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--color-info)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 600, flexShrink: 0 }}>
                        {mappingCount} campos
                      </span>
                    )}
                    {isAnalyzing && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontSize: '0.7rem', fontWeight: 600, flexShrink: 0 }}>
                        <Sparkles size={12} className="animate-spin" /> Analizando...
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    {(template.tipo_contenido === 'text/html' || template.tipo_contenido === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || template.nombre.endsWith('.docx')) ? (
                      <button
                        className="btn btn-primary"
                        onClick={async () => {
                          if (template.tipo_contenido === 'text/html') {
                            const { generateFilledHtmlPdf } = await import('../services/templateService');
                            await generateFilledHtmlPdf(template.url_archivo, client, template.nombre);
                          } else {
                            const { generateFilledDocx } = await import('../services/templateService');
                            await generateFilledDocx(template.url_archivo, client, template.nombre);
                          }
                        }}
                        style={{
                          fontSize: '0.75rem', padding: '0.35rem 0.6rem',
                          display: 'flex', alignItems: 'center', gap: '4px',
                        }}
                        title="Generar Documento"
                      >
                        <Eye size={13} /> Generar Final
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={() => setPreviewTemplate(template)}
                        disabled={mappingCount === 0}
                        style={{
                          fontSize: '0.75rem', padding: '0.35rem 0.6rem',
                          display: 'flex', alignItems: 'center', gap: '4px',
                          opacity: mappingCount === 0 ? 0.5 : 1,
                        }}
                        title={mappingCount === 0 ? 'Plantilla sin campos' : 'Ver y generar documento'}
                      >
                        <Eye size={13} /> Visualizar
                      </button>
                    )}
                    
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleDelete(template)}
                      style={{
                        padding: '0.35rem', color: 'var(--color-danger)',
                      }}
                      title="Eliminar plantilla"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modals */}
      {editorTemplate && (
        <TemplateEditorModal
          template={editorTemplate}
          onClose={() => setEditorTemplate(null)}
          onSaved={() => fetchTemplates()}
        />
      )}

      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          client={client}
          onClose={() => setPreviewTemplate(null)}
        />
      )}

      {showHtmlBuilder && (
        <HtmlTemplateBuilder
          onClose={() => setShowHtmlBuilder(false)}
          onSaved={() => {
            setShowHtmlBuilder(false);
            fetchTemplates();
          }}
        />
      )}
    </>
  );
}
