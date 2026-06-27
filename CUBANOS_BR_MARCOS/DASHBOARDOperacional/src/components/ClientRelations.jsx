import React from 'react';
import { Users, Plus, Trash2 } from 'lucide-react';

const ClientRelations = ({
  relaciones,
  clientId,
  draggedDocument,
  dragOverRelId,
  setDragOverRelId,
  handleCopyDocumentToClient,
  onNavigateToClient,
  editingRelId,
  setEditingRelId,
  handleUpdateRelationType,
  handleDeleteRelation,
  setSearchQuery,
  setSelectedRelateId,
  setIsRelateModalOpen
}) => {
  return (
    <section id="relacionamientos-clientes" className="glass-panel" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Users size={18} color="var(--color-primary)" /> Relacionamientos
        </h2>
        <button className="btn btn-ghost" style={{ padding: '0.25rem' }} onClick={() => { setSearchQuery(''); setSelectedRelateId(''); setIsRelateModalOpen(true); }}><Plus size={18} /></button>
      </div>

      {/* Indicación de arrastrar documentos a relacionamientos */}
      <div style={{
        marginBottom: '0.75rem', padding: '0.5rem 0.75rem',
        background: 'rgba(99,102,241,0.08)', borderRadius: 'var(--radius-md)',
        border: '1px dashed rgba(99,102,241,0.3)',
        fontSize: '0.7rem', color: 'var(--color-text-secondary)',
        display: 'flex', alignItems: 'center', gap: '0.4rem'
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="5 9 2 12 5 15"></polyline>
          <polyline points="9 5 12 2 15 5"></polyline>
          <path d="M2 12h20"></path>
          <path d="M12 2v20"></path>
        </svg>
        Arrastra documentos aquí para copiarlos al cliente relacionado
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {relaciones.map(rel => {
          const isPrincipal = rel.cliente_id === clientId;
          const related = isPrincipal ? rel.cliente_secundario : rel.cliente_principal;
          if (!related) return null;
          const relKey = `rel-${rel.id}`;
          const isDragOver = dragOverRelId === relKey;
          return (
            <div
              key={rel.id}
              onDragOver={(e) => {
                if (draggedDocument) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                  setDragOverRelId(relKey);
                }
              }}
              onDragLeave={(e) => {
                setDragOverRelId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverRelId(null);
                if (draggedDocument) {
                  handleCopyDocumentToClient(draggedDocument, related.id);
                }
              }}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.65rem 0.75rem',
                background: isDragOver ? 'rgba(99,102,241,0.12)' : 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: isDragOver ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                transition: 'all 0.2s',
                cursor: draggedDocument ? 'copy' : 'default',
                position: 'relative'
              }}
            >
              {isDragOver && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 'var(--radius-md)',
                  border: '2px dashed var(--color-primary)',
                  pointerEvents: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(99,102,241,0.05)'
                }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                    SOLTAR PARA COPIAR DOCUMENTO
                  </span>
                </div>
              )}
              <button
                onClick={() => onNavigateToClient?.(related.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                  background: 'none', border: 'none', cursor: onNavigateToClient ? 'pointer' : 'default',
                  padding: 0, flex: 1, textAlign: 'left',
                  opacity: isDragOver ? 0.2 : 1
                }}
                title={onNavigateToClient ? `Ver perfil de ${related.nombre}` : ''}
              >
                <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {related.nombre}
                  {onNavigateToClient && <span style={{ fontSize: '0.65rem', color: 'var(--color-primary)', opacity: 0.8 }}>→</span>}
                </div>

                {editingRelId === rel.id ? (
                  <select
                    autoFocus
                    onBlur={() => setEditingRelId(null)}
                    onChange={(e) => handleUpdateRelationType(rel.id, e.target.value)}
                    defaultValue={rel.tipo_relacion}
                    onClick={(e) => e.stopPropagation()}
                    style={{ fontSize: '0.68rem', color: 'var(--color-text-primary)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-primary)', borderRadius: '4px', marginTop: '4px', padding: '2px', cursor: 'pointer' }}
                  >
                    <option value="conyuge">Cónyuge</option>
                    <option value="hijo/hija">Hijo / Hija</option>
                    <option value="padre/madre">Padre / Madre</option>
                    <option value="hermano/hermana">Hermano / Hermana</option>
                    <option value="familiar">Otro Familiar</option>
                    <option value="amigo">Amigo</option>
                    <option value="otro">Otro</option>
                  </select>
                ) : (
                  <div
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingRelId(rel.id); }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                    style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '4px', cursor: 'pointer', transition: 'color 0.2s', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', display: 'inline-block' }}
                    title="Clic para cambiar relación"
                  >
                    {rel.tipo_relacion}
                  </div>
                )}

              </button>
              <button className="btn btn-ghost" onClick={() => handleDeleteRelation(rel.id)} style={{ color: 'var(--color-danger)', padding: '0.3rem', flexShrink: 0 }} title="Eliminar vinculo">
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
        {relaciones.length === 0 && <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>No hay familiares o amigos vinculados.</div>}
      </div>
    </section>
  );
};

export default ClientRelations;