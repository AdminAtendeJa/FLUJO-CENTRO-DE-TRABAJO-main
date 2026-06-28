import React from 'react';
import { AlertTriangle, Loader2, Trash2, Sparkles, Edit2 } from 'lucide-react';

export default function ClientViewHeader({
  client,
  duplicateContacts = [],
  setShowMergeModal,
  handleDeleteClient,
  isDeleting,
  isAiChatOpen,
  setIsAiChatOpen,
  handleSendToExtension,
  openEditModal,
}) {
  return (
    <div className="glass-panel" style={{ padding: 'var(--card-padding, 14px 16px)', marginBottom: 'var(--section-gap, 16px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, gap: 'var(--gap-md, 12px)', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 'var(--gap-md, 12px)', alignItems: 'center', minWidth: 0 }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700, color: 'white', position: 'relative', flexShrink: 0 }}>
          {client.nombre?.split(' ').map(n => n[0]).join('').substring(0, 2)}
          {duplicateContacts.length > 1 && (
            <button
              onClick={() => setShowMergeModal(true)}
              style={{
                position: 'absolute', top: '-5px', right: '-5px', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-info)', border: '2px solid var(--surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', animation: 'pulse 2s infinite', zIndex: 10
              }}
              title="¡Cliente duplicado! Haz clic para fusionar"
              aria-label="Fusionar clientes duplicados"
            >
              <AlertTriangle size={12} color="white" />
            </button>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ font: 'var(--font-page-title)', margin: '0 0 0.25rem' }}>{client.nombre}</h1>
          <div style={{ display: 'flex', gap: '0.6rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, color: 'var(--color-text-primary)' }}><span style={{ color: 'var(--brand-primary)' }}>CPF</span> {client.cpf || 'No registrado'}</span>
            <span>•</span>
            <span>{client.email || 'N/A'}</span>
            <span>•</span>
            <span>{client.telefono || 'N/A'}</span>
            <span>•</span>
            <span>{client.ciudad || 'N/A'}, {client.estado_federal || client.estado || 'N/A'}</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button className="btn btn-ghost" onClick={handleDeleteClient} disabled={isDeleting} style={{ color: 'var(--color-danger)' }}>
          {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          <span style={{ marginLeft: '4px' }}>Eliminar</span>
        </button>
        <button className="btn btn-secondary" onClick={() => setIsAiChatOpen(!isAiChatOpen)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={16} />
          {isAiChatOpen ? 'Cerrar Chat' : 'Asistente IA'}
        </button>
        <button className="btn btn-secondary" onClick={handleSendToExtension} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(23,198,113,0.1)', color: 'var(--color-success)', borderColor: 'rgba(23,198,113,0.2)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
          Enviar a Extensión
        </button>
        <button className="btn btn-secondary" onClick={() => openEditModal('ALL_PERSONAL')}><Edit2 size={16} /> Editar Datos</button>
      </div>
    </div>
  );
}
