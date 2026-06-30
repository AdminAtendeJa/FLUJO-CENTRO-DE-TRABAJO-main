import React from 'react';
import KanbanColumn from './KanbanColumn';

export default function KanbanBoard({ entradas, onMoveCard, stages, onNavigateToClient, onNavigateToClientsList }) {
  const handleMoveCard = (entradaId, newStageId) => {
    onMoveCard(entradaId, newStageId);
  };

  return (
    <div style={{ 
      display: 'flex', 
      gap: '1.5rem', 
      overflowX: 'auto', 
      paddingBottom: '1.5rem', 
      height: '100%',
      width: '100%' 
    }}>
      {stages.map(stage => {
        const columnEntradas = entradas.filter(e => {
          let currentState = e.estado_tramite || 'entrante';
          // Map legacy states
          if (currentState === 'pendiente') currentState = 'entrante';
          if (currentState === 'esperando_docs') currentState = 'esperando_cliente';
          if (currentState === 'procesando') currentState = 'esperando';
          if (currentState === 'completada') currentState = 'logrado';
          if (currentState === 'cancelada') currentState = 'cobranza';
          
          return currentState === stage.id;
        });

        return (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            entradas={columnEntradas}
            onMoveCard={handleMoveCard}
            onNavigateToClient={onNavigateToClient}
            onNavigateToClientsList={onNavigateToClientsList}
          />
        );
      })}
    </div>
  );
}
