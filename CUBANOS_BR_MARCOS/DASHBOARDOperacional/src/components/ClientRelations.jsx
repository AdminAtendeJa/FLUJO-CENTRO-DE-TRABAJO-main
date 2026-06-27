import React, { useMemo, useState } from 'react';
import { Link2, Plus, Trash2, Users } from 'lucide-react';
import Avatar from './ui/Avatar';
import Button from './ui/Button';
import EmptyState from './ui/EmptyState';
import Select from './ui/Select';

const RELATION_OPTIONS = [
  { value: 'conyuge', label: '💍 Cónyuge' },
  { value: 'hijo/hija', label: '👶 Hijo / Hija' },
  { value: 'padre/madre', label: '👨‍👩‍👧 Padre / Madre' },
  { value: 'hermano/hermana', label: '🤝 Hermano / Hermana' },
  { value: 'familiar', label: '👥 Otro Familiar' },
  { value: 'amigo', label: '⭐ Amigo' },
  { value: 'otro', label: '🔗 Otro' },
];

const getRelatedClient = (rel, clientId) => {
  const isPrincipal = rel.cliente_id === clientId;
  return isPrincipal ? rel.cliente_secundario : rel.cliente_principal;
};

const ClientRelations = ({
  relaciones = [],
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
  const [expanded, setExpanded] = useState(false);

  const validRelations = useMemo(
    () => relaciones.map((rel) => ({ rel, related: getRelatedClient(rel, clientId) })).filter(item => item.related),
    [relaciones, clientId]
  );

  const previewRelations = expanded ? validRelations : validRelations.slice(0, 4);

  const openRelateModal = () => {
    setSearchQuery('');
    setSelectedRelateId('');
    setIsRelateModalOpen(true);
  };

  return (
    <section id="relacionamientos-clientes" className="glass-panel" style={{ padding: 'var(--section-gap, 16px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--section-gap, 16px)', gap: 'var(--gap-md, 12px)' }}>
        <h2 style={{ font: 'var(--font-page-title)', display: 'flex', alignItems: 'center', gap: 'var(--gap-sm, 8px)', margin: 0 }}>
          <Users size={18} color="var(--brand-primary)" /> Relacionamientos
        </h2>
        <Button variant="ghost" size="sm" onClick={openRelateModal} aria-label="Añadir relacionamiento">
          <Plus size={16} /> Añadir
        </Button>
      </div>

      {validRelations.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--gap-md, 12px)',
            padding: 'var(--card-padding, 14px 16px)',
            marginBottom: 'var(--gap-sm, 8px)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--card-radius, 10px)',
            background: 'var(--surface-raised)',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-sm, 8px)', minWidth: 0 }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              {validRelations.slice(0, 4).map(({ rel, related }, index) => (
                <span key={rel.id} style={{ marginLeft: index ? -8 : 0, position: 'relative', zIndex: 4 - index }}>
                  <Avatar name={related.nombre} size={30} style={{ border: '2px solid var(--surface-raised)' }} />
                </span>
              ))}
            </span>
            <span style={{ font: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
              {validRelations.length} cliente{validRelations.length === 1 ? '' : 's'} vinculado{validRelations.length === 1 ? '' : 's'}
            </span>
          </span>
          <span style={{ font: 'var(--font-section)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--brand-primary)' }}>
            {expanded ? 'Contraer' : 'Ver lista'}
          </span>
        </button>
      )}

      {draggedDocument && (
        <div style={{
          marginBottom: 'var(--gap-sm, 8px)',
          padding: '10px 12px',
          background: 'var(--brand-primary-light)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--brand-primary)',
          font: 'var(--font-body)',
          color: 'var(--color-text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--gap-sm, 8px)'
        }}>
          <Link2 size={14} color="var(--brand-primary)" /> Arrastra el documento sobre una relación para copiarlo.
        </div>
      )}

      {validRelations.length === 0 ? (
        <EmptyState
          icon={<Users size={32} />}
          title="Sin relacionamientos"
          description="Vincula familiares, amigos u otros contactos relacionados con este cliente."
          actionLabel="Añadir relación"
          onAction={openRelateModal}
          style={{ padding: 'var(--section-gap, 16px)' }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-sm, 8px)' }}>
          {previewRelations.map(({ rel, related }) => {
            const relKey = `rel-${rel.id}`;
            const isDragOver = dragOverRelId === relKey;
            return (
              <div
                key={rel.id}
                className="card-clickable"
                onDragOver={(event) => {
                  if (draggedDocument) {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'copy';
                    setDragOverRelId(relKey);
                  }
                }}
                onDragLeave={() => setDragOverRelId(null)}
                onDrop={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setDragOverRelId(null);
                  if (draggedDocument) handleCopyDocumentToClient(draggedDocument, related.id);
                }}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--gap-md, 12px)',
                  padding: 'var(--card-padding, 14px 16px)',
                  background: isDragOver ? 'var(--brand-primary-light)' : 'var(--surface-raised)',
                  borderRadius: 'var(--card-radius, 10px)',
                  border: isDragOver ? '2px solid var(--brand-primary)' : '1px solid var(--border-default)',
                  transition: 'border-color var(--transition-normal), background var(--transition-normal)',
                  cursor: draggedDocument ? 'copy' : 'default'
                }}
              >
                {isDragOver && (
                  <div style={{ position: 'absolute', inset: 4, borderRadius: 'var(--radius-md)', border: '1px dashed var(--brand-primary)', pointerEvents: 'none', animation: 'pulse 1s infinite' }} />
                )}
                <button
                  type="button"
                  onClick={() => onNavigateToClient?.(related.id)}
                  aria-label={`Ver perfil de ${related.nombre}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--gap-md, 12px)',
                    background: 'transparent',
                    border: 0,
                    color: 'inherit',
                    cursor: onNavigateToClient ? 'pointer' : 'default',
                    padding: 0,
                    flex: 1,
                    minWidth: 0,
                    textAlign: 'left',
                    opacity: isDragOver ? 0.25 : 1
                  }}
                >
                  <Avatar name={related.nombre} size={38} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', font: 'var(--font-body)', fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {related.nombre || 'Cliente sin nombre'}
                    </span>
                    <span style={{ display: 'block', marginTop: 2, font: 'var(--font-section)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
                      {rel.tipo_relacion || 'otro'}
                    </span>
                  </span>
                </button>

                {editingRelId === rel.id ? (
                  <Select
                    autoFocus
                    options={RELATION_OPTIONS}
                    defaultValue={rel.tipo_relacion}
                    onBlur={() => setEditingRelId(null)}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => handleUpdateRelationType(rel.id, event.target.value)}
                    aria-label="Cambiar tipo de relación"
                    style={{ maxWidth: 180 }}
                  />
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => setEditingRelId(rel.id)} aria-label={`Cambiar relación de ${related.nombre}`}>
                    Editar
                  </Button>
                )}

                <button
                  type="button"
                  onClick={() => handleDeleteRelation(rel.id)}
                  aria-label={`Eliminar vínculo con ${related.nombre}`}
                  style={{
                    width: 44,
                    height: 44,
                    border: '1px solid var(--color-danger-border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-danger-bg)',
                    color: 'var(--color-danger)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ClientRelations;