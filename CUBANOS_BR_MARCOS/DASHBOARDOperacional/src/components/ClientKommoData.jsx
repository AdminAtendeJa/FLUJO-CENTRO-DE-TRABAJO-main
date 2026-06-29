import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {  FileText, CheckCircle, Clock, AlertCircle, MessageSquare, Trash2 , ChevronDown, ChevronUp } from 'lucide-react';
import { EmptyState } from './ui/EmptyState';

export default function ClientKommoData({ clientId, onDocumentVerified, setViewingDocument }) {
  const [pendingDocs, setPendingDocs] = useState([]);
  const [notes, setNotes] = useState([]);
  const [isNotasExpanded, setIsNotasExpanded] = useState(true);
  const [isVerificarExpanded, setIsVerificarExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);

  useEffect(() => {
    fetchPendingDocs();
  }, [clientId]);

  const fetchPendingDocs = async () => {
    setLoading(true);
    try {
      const [docsResponse, notesResponse] = await Promise.all([
        supabase
          .from('documentos_pendientes')
          .select('*')
          .eq('cliente_id', clientId)
          .eq('verificado', false)
          .order('fecha_recepcion', { ascending: false }),
        
        supabase
          .from('notas_kommo')
          .select('*')
          .eq('cliente_id', clientId)
          .order('fecha_recepcion', { ascending: false })
      ]);

      if (docsResponse.error && docsResponse.error.code !== '42P01') {
         throw docsResponse.error;
      }
      if (notesResponse.error && notesResponse.error.code !== '42P01') {
         console.error('Error fetching notes:', notesResponse.error);
      }
      
      setPendingDocs(docsResponse.data || []);
      setNotes(notesResponse.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (doc) => {
    setVerifyingId(doc.id);
    try {
      // 1. Mover a documentos_operacionales
      const { error: insertError } = await supabase
        .from('documentos_operacionales')
        .insert({
          id_cliente: doc.cliente_id,
          url_archivo: doc.url_archivo,
          nombre_archivo: doc.nombre_archivo || 'Documento de Kommo',
          tipo_documento: doc.url_archivo?.toLowerCase().endsWith('.pdf') ? 'Documento Kommo' : 'Imagen Kommo',
          subido_por: 'Kommo'
        });

      if (insertError) throw insertError;

      // 2. Marcar como verificado (eliminar de la tabla de pendientes)
      const { error: deleteError } = await supabase
        .from('documentos_pendientes')
        .delete()
        .eq('id', doc.id);

      if (deleteError) throw deleteError;

      // 3. Actualizar UI
      setPendingDocs(prev => prev.filter(d => d.id !== doc.id));
      
      // 4. Notificar al padre para que dispare la IA y actualice la lista de documentos
      if (onDocumentVerified) {
        onDocumentVerified(doc.url_archivo);
      }

    } catch (err) {
      console.error('Error verifying document:', err);
      alert('Error al verificar el documento.');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('¿Seguro que deseas descartar esta imagen?')) return;
    try {
      const { error } = await supabase
        .from('documentos_pendientes')
        .delete()
        .eq('id', docId);

      if (error) throw error;
      setPendingDocs(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Error al eliminar la imagen.');
    }
  };

  const chatMessages = notes.filter(n => 
    n.remitente !== 'nota_interna' && 
    !n.texto?.includes('mensagem de mídia') && 
    !n.texto?.includes('mensagem de media')
  );
  const internalNotes = notes.filter(n => n.remitente === 'nota_interna');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flexShrink: 0 }}>


      {/* Sección de Notas Internas (Lead Notes) */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flexShrink: 0 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', margin: 0 }}>
          <FileText size={18} /> Notas Internas del Lead
        </h3>
        <div style={{ background: 'var(--color-bg-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.875rem', color: 'var(--color-text-secondary)', minHeight: '80px', maxHeight: '200px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {loading ? (
              <div style={{ textAlign: 'center', opacity: 0.5 }}>Cargando notas...</div>
            ) : internalNotes.length === 0 ? (
              <p style={{ margin: 0 }}><em>No hay notas internas registradas en Kommo.</em></p>
            ) : (
              internalNotes.map(nota => (
                <div key={nota.id} style={{ background: 'var(--color-bg-canvas)', padding: '0.75rem', borderRadius: '6px', borderLeft: '3px solid #f59e0b' }}>
                  <p style={{ margin: '0 0 0.25rem 0', color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap' }}>{nota.texto}</p>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                    {new Date(nota.fecha_recepcion).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sección de Documentos Pendientes */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: '300px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', margin: 0 }}>
            <Clock size={18} /> Por Verificar
          </h3>
          <span style={{ background: 'var(--color-primary)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
            {pendingDocs.length}
          </span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
          Imágenes enviadas por el cliente a través de Kommo.
        </p>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <div className="animate-spin" style={{ width: '24px', height: '24px', border: '2px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
            </div>
          ) : pendingDocs.length === 0 ? (
            <EmptyState 
              icon={<CheckCircle size={48} />} 
              title="Todo al día" 
              description="No hay documentos pendientes de verificar para este cliente." 
            />
          ) : (
            pendingDocs.map(doc => (
              <div 
                key={doc.id} 
                style={{ flexShrink: 0, background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: setViewingDocument ? 'pointer' : 'default' }}
                onDoubleClick={() => {
                  if (setViewingDocument) {
                    const lowerUrl = doc.url_archivo?.toLowerCase() || '';
                    const lowerName = doc.nombre_archivo?.toLowerCase() || '';
                    const isPdf = lowerUrl.includes('.pdf') || lowerName.includes('.pdf');
                    let tipoContenido = 'image/jpeg';
                    if (isPdf) tipoContenido = 'application/pdf';
                    else if (lowerUrl.includes('.png') || lowerName.includes('.png')) tipoContenido = 'image/png';
                    else if (lowerUrl.includes('.gif') || lowerName.includes('.gif')) tipoContenido = 'image/gif';
                    
                    setViewingDocument({
                      ...doc,
                      nombre_archivo: doc.nombre_archivo || 'Documento de Kommo',
                      tipo_documento: isPdf ? 'Documento Kommo' : 'Imagen Kommo',
                      tipo_contenido: tipoContenido
                    });
                  }
                }}
              >
                <div style={{ height: '150px', background: 'var(--color-bg-canvas)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {doc.url_archivo?.match(/\.(jpeg|jpg|gif|png)$/i) || !doc.url_archivo?.match(/\./) ? (
                    <img src={doc.url_archivo} alt="Documento Kommo" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <FileText size={48} color="var(--color-text-muted)" />
                  )}
                </div>
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AlertCircle size={14} /> Sin verificar
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                      onClick={() => handleVerify(doc)}
                      disabled={verifyingId === doc.id}
                    >
                      {verifyingId === doc.id ? (
                        <span className="animate-pulse">Verificando...</span>
                      ) : (
                        <>
                          <CheckCircle size={16} /> Procesar
                        </>
                      )}
                    </button>
                    <button
                      className="btn"
                      style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-danger)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                      onClick={() => handleDeleteDocument(doc.id)}
                      title="Descartar imagen"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
