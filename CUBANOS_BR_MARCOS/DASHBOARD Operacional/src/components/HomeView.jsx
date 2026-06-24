import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Clock, ArrowRight, User } from 'lucide-react';

export default function HomeView({ onNavigateToClient }) {
  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEntradas() {
      try {
        const { data, error } = await supabase
          .from('entradas')
          .select(`*, clientes:id_cliente (*)`)
          .neq('estado_tramite', 'completada')
          .order('creado_en', { ascending: false });
          
        if (error) throw error;
        setPendientes(data || []);
      } catch (err) {
        console.error('Error fetching entradas:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEntradas();
  }, []);

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'pendiente': return 'var(--color-warning)';
      case 'procesando': return 'var(--color-primary)';
      case 'cancelada': return 'var(--color-danger)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getStatusLabel = (estado) => {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'procesando': return 'Procesando';
      case 'cancelada': return 'Cancelada';
      default: return estado;
    }
  };

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1000px', margin: '0 auto' }} className="animate-fade-in">
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Trámites Operacionales</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Gestiona los clientes y sus documentos</p>
        </div>
      </header>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={18} color="var(--color-warning)" />
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Cola de Trámites Pendientes</h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando trámites...</div>
          ) : pendientes.map((entrada) => (
            <div 
              key={entrada.id}
              onClick={() => onNavigateToClient(entrada.id_cliente)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)',
                cursor: 'pointer', transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-border-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="var(--color-text-secondary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {entrada.clientes?.nombre || entrada.cliente || 'Cliente Desconocido'}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{entrada.servicio}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Entrada: {entrada.fecha || new Date(entrada.creado_en).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <span style={{ 
                  padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600,
                  backgroundColor: `${getStatusColor(entrada.estado_tramite)}22`,
                  color: getStatusColor(entrada.estado_tramite),
                  border: `1px solid ${getStatusColor(entrada.estado_tramite)}44`
                }}>
                  {getStatusLabel(entrada.estado_tramite)}
                </span>
                <ArrowRight size={18} color="var(--color-text-muted)" />
              </div>
            </div>
          ))}

          {(!loading && pendientes.length === 0) && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No hay trámites pendientes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
