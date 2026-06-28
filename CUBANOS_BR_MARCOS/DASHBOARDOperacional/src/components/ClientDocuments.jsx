import React, { useRef } from 'react';
import { FileText, Loader2, UploadCloud, X } from 'lucide-react';
import EmptyState from './ui/EmptyState';

const ClientDocuments = ({
  documentos = [],
  uploading,
  isDragging,
  draggedDocument,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileUpload,
  setDraggedDocument,
  setDragOverRelId,
  setViewingDocument,
  handleDeleteDocument
}) => {
  const inputRef = useRef(null);

  const openFilePicker = () => inputRef.current?.click();

  return (
    <section id="documentos-subidos" className="glass-panel" style={{ padding: 'var(--section-gap, 16px)' }}>
      <h2 style={{ font: 'var(--font-page-title)', display: 'flex', alignItems: 'center', gap: 'var(--gap-sm, 8px)', margin: '0 0 var(--section-gap, 16px)' }}>
        <FileText size={18} color="var(--brand-primary)" /> Documentos
      </h2>

      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openFilePicker();
          }
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--gap-sm, 8px)',
          minHeight: 118,
          border: `2px dashed ${isDragging ? 'var(--brand-primary)' : 'var(--border-default)'}`,
          backgroundColor: isDragging ? 'var(--brand-primary-light)' : 'transparent',
          borderRadius: 'var(--card-radius, 10px)',
          padding: 'var(--section-gap, 16px)',
          textAlign: 'center',
          cursor: uploading ? 'wait' : 'pointer',
          transition: 'border-color var(--transition-normal), background var(--transition-normal)',
          marginBottom: 'var(--section-gap, 16px)',
          color: isDragging ? 'var(--brand-primary)' : 'var(--color-text-secondary)'
        }}
        aria-label="Subir documento o arrastrar archivo aquí"
      >
        <input
          ref={inputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
          disabled={uploading}
        />
        {uploading ? (
          <Loader2 className="animate-spin" size={24} color="var(--brand-primary)" />
        ) : (
          <UploadCloud size={24} color={isDragging ? 'var(--brand-primary)' : 'var(--color-text-muted)'} />
        )}
        <div style={{ font: 'var(--font-body)', fontWeight: 500 }}>
          {uploading ? 'Subiendo documento...' : isDragging ? 'Suelta el documento aquí' : 'Subir documento'}
        </div>
        <div style={{ font: 'var(--font-body)', color: 'var(--color-text-muted)' }}>
          Doble click en una miniatura para abrirla. Arrastra a relacionamientos para copiar.
        </div>
      </label>

      {documentos.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(86px, 1fr))',
          gap: 'var(--gap-sm, 8px)'
        }}>
          {documentos.map(doc => {
            const selected = draggedDocument?.id === doc.id;
            const verified = doc.estado === 'verificado';
            return (
              <div
                key={doc.id}
                role="button"
                tabIndex={0}
                aria-label={`Documento ${doc.nombre_archivo || 'sin nombre'}`}
                draggable
                onKeyDown={(event) => {
                  if (event.key === 'Enter') setViewingDocument(doc);
                }}
                onDragStart={(event) => {
                  setDraggedDocument(doc);
                  event.dataTransfer.setData('text/plain', doc.nombre_archivo || 'documento');
                  
                  const isPdf = doc.url_archivo?.toLowerCase().endsWith('.pdf') || doc.tipo_contenido === 'application/pdf';
                  const mimeType = doc.tipo_contenido || (isPdf ? 'application/pdf' : 'application/octet-stream');
                  let fileName = doc.nombre_archivo || 'documento';
                  if (!fileName.includes('.')) fileName += isPdf ? '.pdf' : '';
                  // Eliminar espacios para evitar problemas en algunos navegadores con DownloadURL
                  const safeFileName = fileName.replace(/\s+/g, '_');
                  
                  event.dataTransfer.setData('DownloadURL', `${mimeType}:${safeFileName}:${doc.url_archivo}`);
                  try { event.dataTransfer.setData('text/uri-list', doc.url_archivo); } catch (err) { }
                  event.dataTransfer.effectAllowed = 'copyLink';
                }}
                onDragEnd={() => { setDraggedDocument(null); setDragOverRelId(null); }}
                onDoubleClick={() => setViewingDocument(doc)}
                className="card-clickable"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 'var(--card-radius, 10px)',
                  aspectRatio: '1',
                  background: selected ? 'var(--brand-primary-light)' : 'var(--surface-raised)',
                  border: `1px solid ${verified ? 'var(--color-success)' : 'var(--border-default)'}`,
                  cursor: 'grab',
                  transition: 'border-color var(--transition-normal), background var(--transition-normal), opacity var(--transition-normal)',
                  opacity: selected ? 0.55 : 1,
                  outline: selected ? '2px solid var(--brand-primary)' : 'none'
                }}
              >
                {/* Drag overlay to enable native HTML5 file drag in Chrome */}
                <a 
                  href={doc.url_archivo} 
                  download={doc.nombre_archivo || 'documento'} 
                  draggable 
                  onClick={(e) => e.preventDefault()}
                  style={{ position: 'absolute', inset: 0, zIndex: 1, color: 'transparent' }}
                  aria-hidden="true"
                >_</a>

                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  {doc.url_archivo && doc.tipo_contenido?.startsWith('image/') ? (
                    <img src={doc.url_archivo} alt={doc.nombre_archivo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <FileText size={24} color="var(--color-text-muted)" />
                  )}
                </div>
                
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '4px 6px',
                  background: 'rgba(10,20,35,0.86)',
                  fontSize: 10,
                  color: 'white',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  zIndex: 2,
                  pointerEvents: 'none'
                }}>
                  {doc.nombre_archivo || 'Documento'}
                </div>
                <span
                  aria-label={verified ? 'Documento verificado' : 'Documento pendiente'}
                  title={verified ? 'Verificado' : 'Pendiente'}
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: verified ? 'var(--color-success)' : 'var(--color-warning)',
                    border: '1px solid rgba(0,0,0,0.35)',
                    zIndex: 2
                  }}
                />
                <button
                  type="button"
                  onClick={(event) => { event.stopPropagation(); handleDeleteDocument(doc); }}
                  aria-label={`Eliminar documento ${doc.nombre_archivo || ''}`}
                  style={{
                    position: 'absolute',
                    top: 4,
                    left: 4,
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--color-danger-bg)',
                    color: 'var(--color-danger)',
                    border: '1px solid var(--color-danger-border)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    padding: 0,
                    zIndex: 10
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<FileText size={32} />}
          title="Sin documentos"
          description="Aún no hay documentos subidos para este cliente."
          actionLabel="Subir documento"
          onAction={openFilePicker}
          style={{ padding: 'var(--section-gap, 16px)' }}
        />
      )}
    </section>
  );
};

export default ClientDocuments;