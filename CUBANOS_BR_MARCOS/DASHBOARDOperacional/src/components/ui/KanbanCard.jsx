import React from 'react';
import { MessageSquare, AlertCircle, MessageCircle } from 'lucide-react';
import { formatDate } from '../../utils/dateFormatter';

export default function KanbanCard({ entrada, onNavigateToClient, onNavigateToClientsList }) {
  const handleDragStart = (e) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', entrada.id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Optional: make it look slightly transparent while dragging
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
  };

  const handleClick = () => {
    const clientId = entrada.id_cliente || entrada.clientes?.id;
    const clientName = entrada.clientes?.nombre || entrada.cliente || entrada.nombre_pix;
    
    if (clientId && onNavigateToClient) {
      onNavigateToClient(clientId);
    } else if (clientName && onNavigateToClientsList) {
      onNavigateToClientsList(clientName);
    }
  };

  const hasPendingDocs = () => {
    const txt = [entrada.estado_tramite, entrada.servicio, entrada.clientes?.observaciones, entrada.observaciones, entrada.notas]
      .filter(Boolean).join(' ').toLowerCase();
    return ['pendiente', 'esperando', 'faltante', 'pendente', 'aguardando'].some(k => txt.includes(k));
  };

  const pendingDocs = hasPendingDocs();
  const clientName = entrada.clientes?.nombre || entrada.cliente || entrada.nombre_pix || 'Cliente Desconocido';
  const operario = entrada.operario || 'SIN ASIGNAR';
  
  // Extraer la última nota (simulada aquí porque entradas no trae el historial de notas completo, 
  // pero podemos usar observaciones si existe)
  const lastNote = entrada.notas || entrada.observaciones || entrada.clientes?.observaciones;

  return (
    <div
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      style={{
        background: 'var(--surface-elevated, #1a2332)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        cursor: 'grab',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {operario}
          </span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {entrada.servicio || 'TRÁMITE'}
          </span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
          {formatDate(entrada.creado_en)}
        </span>
      </div>

      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-info)' }}>
        {clientName}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.65rem', padding: '2px 6px', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', borderRadius: '4px', fontWeight: 500 }}>
          {entrada.servicio || 'GENERAL'}
        </span>
        {pendingDocs && (
          <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.65rem', padding: '2px 6px', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '4px', fontWeight: 600 }}>
            RETORNO PERDIDO
          </span>
        )}
      </div>

      {lastNote && (
        <div style={{ 
          marginTop: '0.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          background: 'rgba(55,138,221,0.08)', 
          padding: '0.5rem 0.75rem', 
          borderRadius: '12px',
          width: '100%',
        }}>
          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--color-info)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MessageCircle size={10} color="white" />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-info)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
            {lastNote}
          </span>
        </div>
      )}
    </div>
  );
}
