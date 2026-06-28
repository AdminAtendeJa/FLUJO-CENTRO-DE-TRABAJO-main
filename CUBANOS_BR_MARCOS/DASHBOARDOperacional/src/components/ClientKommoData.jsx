import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FileText, CheckCircle, Clock, AlertCircle, MessageSquare } from 'lucide-react';
import { EmptyState } from './ui/EmptyState';

export default function ClientKommoData({ clientId, onDocumentVerified }) {
  const [pendingDocs, setPendingDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);

  useEffect(() => {
    fetchPendingDocs();
  }, [clientId]);

  const fetchPendingDocs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documentos_pendientes')
        .select('*')
        .eq('cliente_id', clientId)
        .eq('verificado', false)
        .order('fecha_recepcion', { ascending: false });

      if (error && error.code !== '42P01') {
         throw error;
      }
      setPendingDocs(data || []);
    } catch (err) {
      console.error('Error fetching pending docs:', err);
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
          tipo_documento: 'Imagen Kommo',
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      {/* Sección de Notas del Lead */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flexShrink: 0 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', margin: 0 }}>
          <MessageSquare size={18} /> Notas del Lead (Kommo)
        </h3>
        <div style={{ background: 'var(--color-bg-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.875rem', color: 'var(--color-text-secondary)', minHeight: '100px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p><em>Las notas sincronizadas desde el lead de Kommo aparecerán aquí automáticamente.</em></p>
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
              <div key={doc.id} style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '150px', background: 'var(--color-bg-canvas)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {doc.url_archivo?.match(/\.(jpeg|jpg|gif|png)$/i) || !doc.url_archivo?.match(/\./) ? (
                    <img src={doc.url_archivo} alt="Documento Kommo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <FileText size={48} color="var(--color-text-muted)" />
                  )}
                </div>
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AlertCircle size={14} /> Sin verificar
                  </div>
                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                    onClick={() => handleVerify(doc)}
                    disabled={verifyingId === doc.id}
                  >
                    {verifyingId === doc.id ? (
                      <span className="animate-pulse">Verificando...</span>
                    ) : (
                      <>
                        <CheckCircle size={16} /> Verificar y Procesar
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
