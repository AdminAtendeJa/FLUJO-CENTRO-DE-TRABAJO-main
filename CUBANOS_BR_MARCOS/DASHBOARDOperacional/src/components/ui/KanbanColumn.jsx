import React, { useState } from 'react';
import KanbanCard from './KanbanCard';

export default function KanbanColumn({ stage, entradas, onMoveCard, onNavigateToClient, onNavigateToClientsList }) {
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.style.background = 'var(--surface-elevated)';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.style.background = 'transparent';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.background = 'transparent';
    const cardId = e.dataTransfer.getData('text/plain');
    if (cardId) {
      onMoveCard(cardId, stage.id);
    }
  };

  // Calculate optional total if there was a price
  // For now, we will just display a fixed value or count
  // The screenshot shows "R$300", we'll just mock it or omit it for now since we don't have a reliable 'precio' field.
  const totalValue = 0;

  return (
    <div
      style={{
        flex: '1 1 300px',
        minWidth: '280px',
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'transparent',
        borderRadius: 'var(--radius-lg)',
        height: '100%',
        transition: 'all 0.2s ease',
      }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div style={{ padding: '0.75rem', marginBottom: '0.75rem', borderTop: `3px solid ${stage.color || 'var(--color-primary)'}`, background: 'var(--surface-base)', borderRadius: 'var(--radius-md)' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {stage.label}
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0 0', fontWeight: 500 }}>
          {entradas.length} Clientes potenciales
        </p>
      </div>

      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '0.5rem', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1rem',
        minHeight: '100px' // allow drop even if empty
      }}>
        {entradas.map(entrada => (
          <KanbanCard 
            key={entrada.id} 
            entrada={entrada} 
            onNavigateToClient={onNavigateToClient}
            onNavigateToClientsList={onNavigateToClientsList}
          />
        ))}
      </div>
    </div>
  );
}
