import React from 'react';
import { Search, Trash2, Plus, X } from 'lucide-react';

export default function ClientViewEditModal({
  isOpen,
  onClose,
  categorias = [],
  campos = [],
  clienteDatos = [],
  client = {},
  editFormData = [],
  onEditFormDataChange,
  newFields = [],
  onNewFieldsChange,
  onSaveEdits,
  isSaving,
  searchQuery,
  onSearchChange,
  fixedFieldsCatalog = [],
  handleCepSearch,
  toIsoDate,
  toSlashDate,
}) {
  if (!isOpen) return null;

  const ESTADO_CIVIL_OPTIONS = [
    "Casado(a)", "Divorciado(a)", "Outro", "Separado(a) Judicialmente",
    "Solteiro(a)", "União Estável", "Viúvo(a)"
  ];

  const SEXO_OPTIONS = ["Masculino", "Feminino"];

  const normalizeEditSearchText = (value = '') =>
    String(value || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const editModalQuery = normalizeEditSearchText(searchQuery);
  const filteredEditFormData = editFormData.filter(field => {
    if (!editModalQuery) return true;
    const fieldName = normalizeEditSearchText(field.nombre_campo);
    let fieldValue = '';
    if (field.id === 'nombre') {
      fieldValue = normalizeEditSearchText(`${field._nombres || ''} ${field._apellidos || ''}`);
    } else if (field.id === 'direccion') {
      fieldValue = normalizeEditSearchText(`${field._endereco || ''} ${field._numero || ''} ${field._bairro || ''} ${field._cidade || ''}`);
    } else {
      fieldValue = normalizeEditSearchText(field.valor);
    }
    return fieldName.includes(editModalQuery) || fieldValue.includes(editModalQuery);
  });

  const hasEditModalResults = filteredEditFormData.length > 0 || newFields.length > 0;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Editar Datos del Cliente</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: '400px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Filtrar campos..."
                className="form-input"
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                style={{ paddingLeft: '2.2rem', width: '100%', fontSize: '0.875rem' }}
              />
            </div>
            <button className="btn btn-ghost" style={{ padding: '0.5rem', flexShrink: 0 }} onClick={onClose}>✕</button>
          </div>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {!hasEditModalResults ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              No se encontraron campos que coincidan con "{searchQuery}"
            </div>
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Contenido del modal de edición (simplificado). Aquí van todos los campos de edición.
            </p>
          )}
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={onSaveEdits} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
