import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Download, X, FileText, Image as ImageIcon, Loader2, Maximize2 } from 'lucide-react';

const MIN_WIDTH = 320;
const MIN_HEIGHT = 240;

export default function DocumentViewerModal({ document: doc, onClose }) {
    const [position, setPosition] = useState({ x: 80, y: 40 });
    const [size, setSize] = useState({ width: 800, height: 600 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [resizeDirection, setResizeDirection] = useState(null);
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
    const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 });
    const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
    const [isDownloading, setIsDownloading] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgError, setImgError] = useState(false);
    const modalRef = useRef(null);

    // Center on mount
    useEffect(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        setPosition({
            x: Math.max(20, (vw - 800) / 2),
            y: Math.max(20, (vh - 600) / 2),
        });
    }, []);

    // Close on Escape
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    // Global mouse move / up for dragging & resizing
    const handleMouseMove = useCallback((e) => {
        if (isDragging) {
            setPosition((prev) => ({
                x: Math.max(0, e.clientX - dragOffset.x),
                y: Math.max(0, e.clientY - dragOffset.y),
            }));
        }
        if (resizeDirection) {
            const dx = e.clientX - resizeStart.x;
            const dy = e.clientY - resizeStart.y;

            let newWidth = resizeStartSize.width;
            let newHeight = resizeStartSize.height;
            let newX = resizeStartPos.x;
            let newY = resizeStartPos.y;

            const dir = resizeDirection;

            // Horizontal
            if (dir.includes('e')) {
                newWidth = Math.max(MIN_WIDTH, resizeStartSize.width + dx);
            }
            if (dir.includes('w')) {
                const delta = resizeStartSize.width - Math.max(MIN_WIDTH, resizeStartSize.width - dx);
                newWidth = resizeStartSize.width - delta;
                newX = resizeStartPos.x + delta;
            }

            // Vertical
            if (dir.includes('s')) {
                newHeight = Math.max(MIN_HEIGHT, resizeStartSize.height + dy);
            }
            if (dir.includes('n')) {
                const delta = resizeStartSize.height - Math.max(MIN_HEIGHT, resizeStartSize.height - dy);
                newHeight = resizeStartSize.height - delta;
                newY = resizeStartPos.y + delta;
            }

            setSize({ width: newWidth, height: newHeight });
            setPosition({ x: newX, y: newY });
        }
    }, [isDragging, resizeDirection, dragOffset, resizeStart, resizeStartSize, resizeStartPos]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setResizeDirection(null);
    }, []);

    useEffect(() => {
        if (isDragging || resizeDirection) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, resizeDirection, handleMouseMove, handleMouseUp]);

    const handleHeaderMouseDown = (e) => {
        // Only left click on header (not on buttons)
        if (e.button !== 0) return;
        const rect = modalRef.current.getBoundingClientRect();
        setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setIsDragging(true);
    };

    const handleResizeMouseDown = (direction, e) => {
        e.preventDefault();
        e.stopPropagation();
        setResizeDirection(direction);
        setResizeStart({ x: e.clientX, y: e.clientY });
        setResizeStartSize({ width: size.width, height: size.height });
        setResizeStartPos({ x: position.x, y: position.y });
    };

    const handleDownload = async () => {
        if (!doc?.url_archivo) return;
        setIsDownloading(true);
        try {
            const response = await fetch(doc.url_archivo);
            if (!response.ok) throw new Error('Network response was not ok');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.nombre_archivo || 'documento';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Download error:', err);
            // Fallback: open in new tab
            window.open(doc.url_archivo, '_blank');
        } finally {
            setIsDownloading(false);
        }
    };

    const isImage = doc?.tipo_contenido?.startsWith('image/');
    const isPdf = doc?.tipo_contenido === 'application/pdf';

    // Resize handle style
    const handleStyle = {
        position: 'absolute',
        zIndex: 10,
    };

    const edgeHandle = (dir, style) => (
        <div
            style={{
                ...handleStyle,
                ...style,
                cursor: dir === 'n' || dir === 's' ? 'ns-resize' : dir === 'e' || dir === 'w' ? 'ew-resize' : 'nwse-resize',
            }}
            onMouseDown={(e) => handleResizeMouseDown(dir, e)}
        />
    );

    const cornerHandle = (dir, style) => (
        <div
            style={{
                ...handleStyle,
                width: '16px',
                height: '16px',
                ...style,
                cursor: dir === 'se' || dir === 'nw' ? 'nwse-resize' : 'nesw-resize',
            }}
            onMouseDown={(e) => handleResizeMouseDown(dir, e)}
        />
    );

    return (
        <>
            {/* Backdrop */}
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(3px)',
                    zIndex: 200,
                }}
                onClick={onClose}
            />

            {/* Modal window */}
            <div
                ref={modalRef}
                className="animate-fade-in"
                style={{
                    position: 'fixed',
                    left: position.x,
                    top: position.y,
                    width: size.width,
                    height: size.height,
                    minWidth: MIN_WIDTH,
                    minHeight: MIN_HEIGHT,
                    background: 'var(--color-bg-base)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                    zIndex: 201,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    userSelect: isDragging || resizeDirection ? 'none' : 'auto',
                }}
            >
                {/* Resize edges */}
                {edgeHandle('n', { top: -4, left: 8, right: 8, height: 8 })}
                {edgeHandle('s', { bottom: -4, left: 8, right: 8, height: 8 })}
                {edgeHandle('w', { left: -4, top: 8, bottom: 8, width: 8 })}
                {edgeHandle('e', { right: -4, top: 8, bottom: 8, width: 8 })}

                {/* Resize corners */}
                {cornerHandle('nw', { top: -8, left: -8 })}
                {cornerHandle('ne', { top: -8, right: -8 })}
                {cornerHandle('sw', { bottom: -8, left: -8 })}
                {cornerHandle('se', { bottom: -8, right: -8 })}

                {/* Header */}
                <div
                    onMouseDown={handleHeaderMouseDown}
                    style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid var(--color-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        background: 'var(--color-bg-elevated)',
                        flexShrink: 0,
                        borderTopLeftRadius: 'var(--radius-lg)',
                        borderTopRightRadius: 'var(--radius-lg)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                        {isImage ? (
                            <ImageIcon size={18} color="var(--color-primary)" />
                        ) : (
                            <FileText size={18} color="var(--color-primary)" />
                        )}
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {doc?.nombre_archivo || 'Documento'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={handleDownload}
                            disabled={isDownloading}
                            title="Descargar archivo completo"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                        >
                            {isDownloading ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Download size={14} />
                            )}
                            {isDownloading ? 'Descargando...' : 'Descargar'}
                        </button>
                        <button
                            className="btn btn-ghost"
                            onClick={onClose}
                            style={{ padding: '0.35rem', borderRadius: 'var(--radius-md)' }}
                            title="Cerrar (Esc)"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content area */}
                <div
                    style={{
                        flex: 1,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--color-bg-base)',
                        position: 'relative',
                    }}
                >
                    {isImage ? (
                        <>
                            {!imgLoaded && !imgError && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
                                    <Loader2 size={32} className="animate-spin" />
                                    <span style={{ fontSize: '0.875rem' }}>Cargando imagen...</span>
                                </div>
                            )}
                            {imgError && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
                                    <ImageIcon size={48} opacity={0.4} />
                                    <span style={{ fontSize: '0.875rem' }}>No se pudo cargar la imagen</span>
                                </div>
                            )}
                            <img
                                src={doc?.url_archivo}
                                alt={doc?.nombre_archivo || 'Imagen'}
                                onLoad={() => setImgLoaded(true)}
                                onError={() => setImgError(true)}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    objectFit: 'contain',
                                    display: imgLoaded && !imgError ? 'block' : 'none',
                                }}
                                draggable={false}
                            />
                        </>
                    ) : isPdf ? (
                        <iframe
                            src={doc?.url_archivo}
                            title={doc?.nombre_archivo || 'PDF'}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                        />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--color-text-muted)', padding: '2rem' }}>
                            <FileText size={64} opacity={0.3} />
                            <span style={{ fontSize: '1rem', fontWeight: 500, textAlign: 'center', wordBreak: 'break-word' }}>
                                {doc?.nombre_archivo || 'Documento'}
                            </span>
                            <span style={{ fontSize: '0.8rem' }}>
                                Tipo: {doc?.tipo_contenido || 'Desconocido'}
                            </span>
                            <span style={{ fontSize: '0.8rem' }}>
                                Vista previa no disponible para este tipo de archivo
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer with download button */}
                <div
                    style={{
                        padding: '0.5rem 1rem',
                        borderTop: '1px solid var(--color-border)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'var(--color-bg-elevated)',
                        flexShrink: 0,
                    }}
                >
                    <button
                        className="btn btn-primary"
                        onClick={handleDownload}
                        disabled={isDownloading}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}
                    >
                        {isDownloading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Download size={16} />
                        )}
                        {isDownloading ? 'Descargando...' : `Descargar ${doc?.nombre_archivo || 'archivo'}`}
                    </button>
                </div>

                {/* Size indicator */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '2.5rem',
                        right: '0.5rem',
                        fontSize: '0.6rem',
                        color: 'var(--color-text-muted)',
                        background: 'rgba(0,0,0,0.6)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        pointerEvents: 'none',
                        opacity: resizeDirection ? 1 : 0,
                        transition: 'opacity 0.15s',
                    }}
                >
                    {size.width} × {size.height}
                </div>
            </div>
        </>
    );
}