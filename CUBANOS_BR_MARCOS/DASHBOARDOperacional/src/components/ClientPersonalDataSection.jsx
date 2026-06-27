import React from 'react';
import { Copy, Check } from 'lucide-react';

export default function ClientPersonalDataSection({
  categoryName,
  titleMap = {},
  fields,
  searchQuery = '',
  onEditClick,
  onCopyClick,
  copiedId
}) {
  const visibleFields = fields.filter(field => {
    if (!field.valor) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const fieldName = (field.nombre_campo || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const fieldVal = String(field.valor).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (!fieldName.includes(query) && !fieldVal.includes(query)) return false;
    }
    return true;
  });

  if (visibleFields.length === 0) return null;

  return (
    <>
      <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
          {titleMap[categoryName] || categoryName}
        </h3>
      </div>
      {visibleFields.map(field => (
        <div
          key={field.campo_id || field.id}
          style={{
            background: 'var(--color-bg-elevated)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem'
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              {field.nombre_campo}
            </div>
            <div style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)', wordBreak: 'break-word' }}>
              {field.id === 'nombre' ? String(field.valor).toUpperCase() : field.valor}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button
              className="btn btn-ghost"
              style={{ padding: '0.4rem' }}
              onClick={() => onCopyClick(field.campo_id || field.id)}
              title="Copiar"
            >
              {copiedId === (field.campo_id || field.id) ? (
                <Check size={16} color="var(--color-success)" />
              ) : (
                <Copy size={16} />
              )}
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
