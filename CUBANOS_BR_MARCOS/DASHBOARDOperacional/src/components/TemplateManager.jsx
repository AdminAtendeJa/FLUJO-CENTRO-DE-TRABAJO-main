import React, { useState, useEffect, useCallback } from 'react';
import { UploadCloud, FileText, Loader2, Tag, Eye, Trash2, Sparkles, Plus, Search } from 'lucide-react';
import { uploadTemplate, getTemplates, deleteTemplate, analyzeTemplateWithAI, renderPdfPageAsImage } from '../services/templateService';
import TemplateEditorModal from './TemplateEditorModal';
import TemplatePreviewModal from './TemplatePreviewModal';

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

  // Upload form
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadName, setUploadName] = useState('');

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Thumbnails cache
  const [thumbnails, setThumbnails] = useState({});

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const { data } = await getTemplates();
    setTemplates(data);
    setLoading(false);

    // Generate thumbnails for PDFs
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

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Solo se permiten archivos PDF, JPEG, PNG o WebP.');
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
    if (file) handleUpload(file);
    e.target.value = '';
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDelete = async (template) => {
    if (!window.confirm(`¿Eliminar la plantilla "${template.nombre}"?`)) return;
    const { error } = await deleteTemplate(template);
    if (error) { alert('Error: ' + error); return; }
    await fetchTemplates();
  };

  // Filtered templates
  const filteredTemplates = searchQuery.trim()
    ? templates.filter(t => t.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
    : templates;

  return (
    <>
      <section id="template-engine" className="glass-panel" style={{ padding: '2rem' }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem',
        }}>
          <div>
            <h2 style={{
              fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem',
            }}>
              <FileText size={20} /> Motor de Plantillas
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Sube una plantilla de documento, la IA detecta los campos, edita el mapeo y genera copias con los datos del cliente.
            </p>
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
              className="btn btn-primary"
              onClick={() => setShowUploadForm(!showUploadForm)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={16} /> Subir Plantilla
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
              <input type="file" style={{ display: 'none' }} onChange={handleFileInput} disabled={uploading} accept=".pdf,.jpg,.jpeg,.png,.webp" />
              {uploading ? (
                <Loader2 className="animate-spin" size={28} color="var(--color-primary)" />
              ) : (
                <UploadCloud size={28} color={isDragging ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
              )}
              <div style={{
                fontSize: '0.875rem', fontWeight: 500, marginTop: '0.75rem',
                color: isDragging ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              }}>
                {uploading ? 'Subiendo y analizando...' : isDragging ? 'Suelta aquí' : 'Arrastra un PDF o imagen, o haz clic'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                PDF, JPEG, PNG, WebP — Máx 10MB
              </div>
            </label>
          </div>
        )}

        {/* Template Grid */}
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
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1rem',
          }}>
            {filteredTemplates.map(template => {
              const mappingCount = (template.field_mappings || []).length;
              const isAnalyzing = analyzing === template.id;
              const thumbSrc = template.tipo_contenido?.startsWith('image/')
                ? template.url_archivo
                : thumbnails[template.id] || null;

              return (
                <div
                  key={template.id}
                  className="glass-panel-elevated"
                  style={{
                    overflow: 'hidden', display: 'flex', flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    height: '120px', background: 'var(--color-bg-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', borderBottom: '1px solid var(--color-border)',
                    position: 'relative',
                  }}>
                    {thumbSrc ? (
                      <img
                        src={thumbSrc}
                        alt={template.nombre}
                        style={{
                          width: '100%', height: '100%', objectFit: 'cover',
                          opacity: 0.7, filter: 'brightness(0.8)',
                        }}
                      />
                    ) : (
                      <FileText size={36} color="var(--color-text-muted)" style={{ opacity: 0.3 }} />
                    )}

                    {/* AI analyzing badge */}
                    {isAnalyzing && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', gap: '0.5rem',
                      }}>
                        <Sparkles size={20} color="var(--color-primary)" className="animate-spin" />
                        <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: 600 }}>
                          IA analizando campos...
                        </span>
                      </div>
                    )}

                    {/* Mapping count badge */}
                    {mappingCount > 0 && !isAnalyzing && (
                      <div style={{
                        position: 'absolute', top: '8px', right: '8px',
                        background: 'rgba(59,130,246,0.9)', color: 'white',
                        fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                      }}>
                        {mappingCount} campos
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '0.85rem 1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                      fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem',
                      color: 'var(--color-text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {template.nombre}
                    </div>
                    <div style={{
                      fontSize: '0.68rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem',
                    }}>
                      {new Date(template.creado_en).toLocaleDateString()}
                      {template.actualizado_en && template.actualizado_en !== template.creado_en ? (
                        <span> • Actualizado: {new Date(template.actualizado_en).toLocaleDateString()}</span>
                      ) : null}
                      <span> • {template.tipo_contenido?.split('/')[1]?.toUpperCase() || 'DOC'}</span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: 'auto' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setEditorTemplate(template)}
                        style={{
                          flex: 1, fontSize: '0.72rem', padding: '0.35rem 0.5rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                        }}
                        title="Editar posiciones de los campos"
                      >
                        <Tag size={13} /> Mapeo
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => setPreviewTemplate(template)}
                        disabled={mappingCount === 0}
                        style={{
                          flex: 1, fontSize: '0.72rem', padding: '0.35rem 0.5rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                          opacity: mappingCount === 0 ? 0.5 : 1,
                        }}
                        title={mappingCount === 0 ? 'Primero mapea los campos' : 'Generar copia con datos del cliente'}
                      >
                        <Eye size={13} /> Generar
                      </button>
                      <button
                        className="btn btn-ghost"
                        onClick={() => handleDelete(template)}
                        style={{
                          padding: '0.35rem 0.5rem', color: 'var(--color-danger)',
                          flexShrink: 0,
                        }}
                        title="Eliminar plantilla"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
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
    </>
  );
}
