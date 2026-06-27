import React from 'react';
import { FileText, UploadCloud, Loader2, X } from 'lucide-react';

const ClientDocuments = ({
  documentos,
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
  return (
    <section id="documentos-subidos" className="glass-panel" style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <FileText size={18} color="var(--color-primary)" /> Documentos
      </h2>

      {/* Upload zone */}
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          display: 'block',
          border: `2px dashed ${isDragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
          backgroundColor: isDragging ? 'rgba(99,102,241,0.05)' : 'transparent',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          marginBottom: '1.25rem'
        }}
      >
        <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
        {uploading ? (
          <Loader2 className="animate-spin" size={20} color="var(--color-primary)" style={{ margin: '0 auto 0.25rem' }} />
        ) : (
          <UploadCloud size={20} color={isDragging ? "var(--color-primary)" : "var(--color-text-muted)"} style={{ margin: '0 auto 0.25rem' }} />
        )}
        <div style={{ fontSize: '0.75rem', fontWeight: 500, color: isDragging ? "var(--color-primary)" : "inherit" }}>
          {uploading ? 'Subiendo...' : isDragging ? 'Suelta el documento aquí' : 'Subir Documento'}
        </div>
      </label>

      {/* Miniaturas de todos los documentos */}
      {documentos.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
          gap: '0.4rem'
        }}>
          {documentos.map(doc => (
            <div
              key={doc.id}
              draggable
              onDragStart={(e) => {
                setDraggedDocument(doc);
                e.dataTransfer.setData('text/plain', doc.nombre_archivo);
                const mimeType = doc.tipo_contenido || 'application/octet-stream';
                const fileName = doc.nombre_archivo || 'documento';
                e.dataTransfer.setData('DownloadURL', `${mimeType}:${fileName}:${doc.url_archivo}`);
                try { e.dataTransfer.setData('text/uri-list', doc.url_archivo); } catch (err) { }
                e.dataTransfer.effectAllowed = 'copyLink';
              }}
              onDragEnd={() => { setDraggedDocument(null); setDragOverRelId(null); }}
              onDoubleClick={() => setViewingDocument(doc)}
              style={{
                position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-md)',
                aspectRatio: '1',
                background: draggedDocument?.id === doc.id ? 'rgba(99,102,241,0.15)' : 'var(--color-bg-secondary)',
                border: `1px solid ${doc.estado === 'verificado' ? 'var(--color-success)' : 'var(--color-border)'}`,
                cursor: 'grab', transition: 'all 0.2s',
                opacity: draggedDocument?.id === doc.id ? 0.5 : 1,
                outline: draggedDocument?.id === doc.id ? '2px solid var(--color-primary)' : 'none'
              }}
            >
              {doc.url_archivo && doc.tipo_contenido?.startsWith('image/') ? (
                <img src={doc.url_archivo} alt={doc.nombre_archivo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} color="var(--color-text-muted)" />
                </div>
              )}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '0.15rem 0.25rem',
                background: 'rgba(10,20,35,0.85)',
                fontSize: '0.45rem', color: 'white',
                textAlign: 'center',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                {doc.nombre_archivo}
              </div>
              {/* Status dot */}
              <div style={{
                position: 'absolute', top: '3px', right: '3px',
                width: '6px', height: '6px', borderRadius: '50%',
                background: doc.estado === 'verificado' ? 'var(--color-success)' : 'var(--color-warning)',
                border: '1px solid rgba(0,0,0,0.3)'
              }} />
              {/* Delete small button */}
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc); }}
                style={{
                  position: 'absolute', top: '3px', left: '3px',
                  width: '14px', height: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(216,90,48,0.8)', border: 'none', borderRadius: '3px',
                  cursor: 'pointer', padding: 0, opacity: 0.7
                }}
                title="Eliminar"
              >
                <X size={8} color="white" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>
          Sin documentos subidos.
        </div>
      )}
    </section>
  );
};

export default ClientDocuments;