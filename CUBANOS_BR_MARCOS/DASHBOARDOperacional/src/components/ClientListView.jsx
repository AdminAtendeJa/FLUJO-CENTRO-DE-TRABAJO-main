import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, Search, Loader2 } from 'lucide-react';

export default function ClientListView({ onNavigateToClient, searchQuery }) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClientes() {
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .order('creado_en', { ascending: false });
          
        if (error) throw error;
        setClientes(data || []);
      } catch (err) {
        console.error('Error fetching clientes:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchClientes();
  }, []);

  const filteredClientes = clientes.filter(c => {
    if (!searchQuery) return true;
    const lowerQ = searchQuery.toLowerCase();
    return (
      (c.nombre && c.nombre.toLowerCase().includes(lowerQ)) ||
      (c.cpf && c.cpf.includes(searchQuery)) ||
      (c.email && c.email.toLowerCase().includes(lowerQ))
    );
  });

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}><Loader2 className="animate-spin" size={32} style={{margin:'0 auto'}} /></div>;
  }

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Directorio de Clientes</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Gestiona y busca en tu base de datos de clientes.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
              <th style={{ padding: '1rem', fontWeight: 500 }}>Nombre</th>
              <th style={{ padding: '1rem', fontWeight: 500 }}>CPF</th>
              <th style={{ padding: '1rem', fontWeight: 500 }}>Teléfono</th>
              <th style={{ padding: '1rem', fontWeight: 500 }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredClientes.map(cliente => (
              <tr 
                key={cliente.id} 
                onClick={() => onNavigateToClient(cliente.id)}
                style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                      {cliente.nombre ? cliente.nombre.substring(0, 2).toUpperCase() : 'CL'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{cliente.nombre || 'Sin nombre'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{cliente.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>{cliente.cpf || '—'}</td>
                <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>{cliente.telefono || '—'}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500, textTransform: 'capitalize',
                    background: cliente.estado_cliente === 'nuevo' ? 'rgba(55, 138, 221, 0.2)' : 'rgba(29, 158, 117, 0.2)',
                    color: cliente.estado_cliente === 'nuevo' ? '#378ADD' : '#1D9E75'
                  }}>
                    {cliente.estado_cliente || 'nuevo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredClientes.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No se encontraron clientes.
          </div>
        )}
      </div>
    </div>
  );
}
