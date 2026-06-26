import React, { useRef, useEffect, useCallback } from 'react';

// Componente para listas virtuales que solo renderiza elementos visibles
const VirtualizedList = ({
    items,
    itemHeight = 50,
    containerHeight = 400,
    renderItem,
    overscan = 5
}) => {
    const containerRef = useRef(null);
    const offsetRef = useRef(0);

    // Calcular cuántos elementos se pueden mostrar en la vista
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const overscanCount = visibleCount + overscan * 2;

    // Calcular el índice de inicio y fin de los elementos visibles
    const calculateRange = useCallback(() => {
        if (!containerRef.current) return { startIndex: 0, endIndex: Math.min(overscanCount, items.length) };

        const scrollTop = containerRef.current.scrollTop;
        const startIndex = Math.floor(scrollTop / itemHeight) - overscan;
        const endIndex = Math.min(items.length, startIndex + overscanCount);

        return {
            startIndex: Math.max(0, startIndex),
            endIndex
        };
    }, [items.length, itemHeight, overscan, overscanCount]);

    const { startIndex, endIndex } = calculateRange();

    // Calcular altura total de la lista
    const totalHeight = items.length * itemHeight;

    // Calcular desplazamiento superior
    const offsetTop = startIndex * itemHeight;

    // Actualizar el rango cuando se desplace la lista
    const handleScroll = useCallback(() => {
        if (containerRef.current) {
            const { startIndex: newStartIndex, endIndex: newEndIndex } = calculateRange();

            if (newStartIndex !== startIndex || newEndIndex !== endIndex) {
                // Forzar re-render cuando cambia el rango
                offsetRef.current++;
            }
        }
    }, [calculateRange, startIndex, endIndex]);

    return (
        <div
            ref={containerRef}
            className="overflow-y-auto"
            style={{ height: containerHeight }}
            onScroll={handleScroll}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                <div style={{
                    position: 'absolute',
                    top: offsetTop,
                    width: '100%',
                    transform: 'translateZ(0)' // Habilitar aceleración por hardware
                }}>
                    {items.slice(startIndex, endIndex).map((item, index) => (
                        <div
                            key={startIndex + index}
                            style={{ height: itemHeight }}
                            className="virtual-item"
                        >
                            {renderItem(item, startIndex + index)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default VirtualizedList;