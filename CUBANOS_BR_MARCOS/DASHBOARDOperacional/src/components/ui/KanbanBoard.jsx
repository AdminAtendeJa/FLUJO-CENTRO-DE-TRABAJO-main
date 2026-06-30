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
          let currentState = (e.estado_tramite || 'entrante').toLowerCase();
          
          // Mapeo exhaustivo de estados legacy a los nuevos 5 estados
          if (['pendiente', 'en_proceso'].includes(currentState)) currentState = 'entrante';
          if (['esperando_docs', 'requiere_atencion'].includes(currentState)) currentState = 'esperando_cliente';
          if (['procesando'].includes(currentState)) currentState = 'esperando';
          if (['cancelada'].includes(currentState)) currentState = 'cobranza';
          if (['completada'].includes(currentState)) currentState = 'logrado';
          
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
