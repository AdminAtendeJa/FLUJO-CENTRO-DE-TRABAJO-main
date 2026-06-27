import React from 'react';
import { Sparkles } from 'lucide-react';

export default function ClientViewExtractionModal({
  isOpen,
  extractedData,
  onClose,
  onExtractedDataChange,
  onSave,
  isSaving,
}) {
  if (!isOpen || !extractedData) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '1rem' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
          <Sparkles size={18} /> IA Detectó Datos del Documento
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          Se extrajeron los siguientes datos del documento. ¿Deseas guardarlos?
        </p>
        {extractedData.ILEGIBLE && (
          <div style={{ background: 'rgba(216,90,48,0.1)', color: '#D85A30', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 600 }}>⚠️ Aviso:</span> La parte superior del documento estaba borrosa, verifica que sean correctos.
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', maxHeight: '300px', overflowY: 'auto' }}>
          {Object.entries(extractedData).map(([k, v]) => (
            v && k !== 'ILEGIBLE' && (
              <div key={k} style={{ background: 'var(--color-bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>{k}</div>
                <input
                  className="form-input"
                  type="text"
                  value={v || ''}
                  onChange={(e) => onExtractedDataChange({ ...extractedData, [k]: e.target.value })}
                  style={{ fontSize: '0.875rem', fontWeight: 500, width: '100%' }}
                />
              </div>
            )
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn btn-ghost" onClick={onClose}>Descartar</button>
          <button className="btn btn-primary" onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Datos'}
          </button>
        </div>
      </div>
    </div>
  );
}
