import React, { useState } from 'react';
import { Sparkles, X, ArrowRight } from 'lucide-react';

const fieldMap = {
  'NOMBRE_COMPLETO': 'nombre',
  'CPF': 'cpf',
  'RNM': 'rnm',
  'CARNET_IDENTIDAD': 'carnet_identidad',
  'FECHA_NACIMIENTO': 'fecha_nacimiento',
  'LUGAR_NACIMIENTO': 'lugar_nacimiento',
  'NACIONALIDAD': 'nacionalidad',
  'NUMERO_DOCUMENTO': 'numero_pasaporte',
  'NUMERO_REFUGIO': 'numero_refugio',
  'FECHA_EMISION_PASAPORTE': 'fecha_emision_pasaporte',
  'FECHA_VENCIMIENTO_PASAPORTE': 'fecha_vencimiento_pasaporte',
  'FECHA_VENCIMIENTO_REFUGIO': 'fecha_vencimiento_refugio',
  'SEXO': 'sexo',
  'NOMBRE_MADRE': 'nombre_madre',
  'NOMBRE_PADRE': 'nombre_padre'
};

export default function ClientViewExtractionModal({
  isOpen,
  extractedData,
  cliente,
  onClose,
  onExtractedDataChange,
  onSave,
  isSaving,
}) {
  if (!isOpen || !extractedData) return null;

  const handleDiscardField = (key) => {
    const newData = { ...extractedData };
    delete newData[key];
    onExtractedDataChange(newData);
  };

  const hasExtractableFields = Object.keys(extractedData).some(k => k !== 'ILEGIBLE' && extractedData[k]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '1rem' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '700px', padding: '1.5rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', flexShrink: 0 }}>
          <Sparkles size={18} /> Datos Extraídos vs Actuales
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', flexShrink: 0 }}>
          Revisa los datos extraídos por la IA (izquierda). Pulsa la "X" si prefieres mantener el dato que ya tenías (derecha).
        </p>
        
        {extractedData.ILEGIBLE && (
          <div style={{ background: 'rgba(216,90,48,0.1)', color: '#D85A30', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <span style={{ fontWeight: 600 }}>⚠️ Aviso:</span> La parte superior del documento estaba borrosa, verifica que sean correctos.
          </div>
        )}

        {!hasExtractableFields && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
            No hay más datos extraídos para revisar.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
          {Object.entries(extractedData).map(([k, v]) => {
            if (!v || k === 'ILEGIBLE') return null;
            const clientField = fieldMap[k];
            const existingValue = clientField && cliente ? cliente[clientField] : '';
            
            return (
              <div key={k} style={{ display: 'flex', gap: '1rem', alignItems: 'stretch' }}>
                {/* AI Extracted Data */}
                <div style={{ flex: 1, background: 'var(--color-bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary)', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', textTransform: 'uppercase', fontWeight: 600 }}>Extraído: {k}</div>
                    <button 
                      onClick={() => handleDiscardField(k)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '2px', borderRadius: '4px' }}
                      title="Descartar este dato y usar el actual"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <input
                    className="form-input"
                    type="text"
                    value={v || ''}
                    onChange={(e) => onExtractedDataChange({ ...extractedData, [k]: e.target.value })}
                    style={{ fontSize: '0.875rem', fontWeight: 500, width: '100%', borderColor: 'transparent', background: 'var(--color-bg-canvas)' }}
                  />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)' }}>
                  <ArrowRight size={16} />
                </div>

                {/* Existing Data */}
                <div style={{ flex: 1, background: 'rgba(0,0,0,0.1)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', opacity: 0.7 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 500 }}>Dato Actual ({clientField || 'Desconocido'})</div>
                  <input
                    className="form-input"
                    type="text"
                    value={existingValue || '—'}
                    disabled
                    style={{ fontSize: '0.875rem', fontWeight: 500, width: '100%', background: 'transparent', borderColor: 'transparent', color: 'var(--color-text-secondary)', cursor: 'not-allowed' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', flexShrink: 0, marginTop: '1rem' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={onSave} disabled={isSaving || !hasExtractableFields}>
            {isSaving ? 'Guardando...' : 'Aplicar Extraídos'}
          </button>
        </div>
      </div>
    </div>
  );
}
