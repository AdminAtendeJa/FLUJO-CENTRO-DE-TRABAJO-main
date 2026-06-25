import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, Search, Loader2, Filter, ArrowDownUp, Calendar } from 'lucide-react';

export default function ClientListView({ onNavigateToClient, searchQuery }) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('creado_en');
  const [sortOrder, setSortOrder] = useState('desc');

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

  const sortedClientes = [...filteredClientes].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField.includes('fecha_vencimiento')) {
      if (!valA && !valB) return 0;
      if (!valA) return 1; // Sin fecha al final
      if (!valB) return -1;
      
      const dateA = new Date(valA);
      const dateB = new Date(valB);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    }

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (!valA && valB) return 1;
    if (valA && !valB) return -1;

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSortFieldChange = (e) => {
    const newField = e.target.value;
    setSortField(newField);
    if (newField.includes('fecha_vencimiento')) {
      setSortOrder('asc'); // Más cercanas a vencer primero
    } else {
      setSortOrder('desc'); // Por defecto más recientes / Z-A
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    // Add timezone offset so it doesn't shift days
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    return d.toLocaleDateString();
  };

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

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--color-text-secondary)" />
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Ordenar por campo:</span>
          <select className="form-input" value={sortField} onChange={handleSortFieldChange} style={{ padding: '0.4rem 2rem 0.4rem 0.5rem', fontSize: '0.875rem', minWidth: '200px' }}>
            <option value="creado_en">Fecha de Registro</option>
            <option value="nombre">Nombre</option>
            <option value="cpf">CPF</option>
            <option value="email">Email</option>
            <option value="nacionalidad">Nacionalidad</option>
            <option value="fecha_vencimiento_refugio">Vencimiento Refugio</option>
            <option value="fecha_vencimiento_pasaporte">Vencimiento Pasaporte</option>
            <option value="estado_cliente">Estado del Cliente</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowDownUp size={16} color="var(--color-text-secondary)" />
          <select className="form-input" value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={{ padding: '0.4rem 2rem 0.4rem 0.5rem', fontSize: '0.875rem' }}>
            {sortField.includes('fecha_vencimiento') ? (
              <>
                <option value="asc">Más cercanas a vencer</option>
                <option value="desc">Más lejanas a vencer</option>
              </>
            ) : (
              <>
                <option value="desc">Más Recientes / Z-A</option>
                <option value="asc">Más Antiguos / A-Z</option>
              </>
            )}
          </select>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
              <th style={{ padding: '1rem', fontWeight: 500 }}>Nombre</th>
              <th style={{ padding: '1rem', fontWeight: 500 }}>CPF</th>
              {sortField.includes('fecha_vencimiento') ? (
                <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--color-primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={14} /> Vencimiento
                  </div>
                </th>
              ) : (
                <th style={{ padding: '1rem', fontWeight: 500 }}>Teléfono</th>
              )}
              <th style={{ padding: '1rem', fontWeight: 500 }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {sortedClientes.map(cliente => (
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
                {sortField.includes('fecha_vencimiento') ? (
                  <td style={{ padding: '1rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                    {cliente[sortField] ? formatDate(cliente[sortField]) : <span style={{color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 400}}>Sin fecha</span>}
                  </td>
                ) : (
                  <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>{cliente.telefono || '—'}</td>
                )}
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
        
        {sortedClientes.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No se encontraron clientes.
          </div>
        )}
      </div>
    </div>
  );
}
