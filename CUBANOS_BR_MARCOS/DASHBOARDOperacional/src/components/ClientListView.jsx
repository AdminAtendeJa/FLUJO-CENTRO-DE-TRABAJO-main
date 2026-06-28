import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, Search, Loader2, Filter, ArrowDownUp, Calendar, X, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate } from '../utils/dateFormatter';

export default function ClientListView({ onNavigateToClient, searchQuery }) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('creado_en');
  const [sortOrder, setSortOrder] = useState('desc');

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('todos');
  const [dateFilterType, setDateFilterType] = useState('creado_en');
  const [filterNacionalidad, setFilterNacionalidad] = useState('all');
  const [filterMissingDoc, setFilterMissingDoc] = useState('all');
  const [filterDireccion, setFilterDireccion] = useState('');
  const [filterCiudadOrigen, setFilterCiudadOrigen] = useState('');
  const [filterEstadoCivil, setFilterEstadoCivil] = useState('all');
  const [filterSexo, setFilterSexo] = useState('all');

  useEffect(() => {
    async function fetchClientes() {
      try {
        const { data: clientesData, error: err1 } = await supabase
          .from('clientes')
          .select('*')
          .order('creado_en', { ascending: false });
          
        if (err1) throw err1;

        const { data: opData, error: err2 } = await supabase
          .from('cliente_datos_operacionales')
          .select('*');
          
        if (err2) throw err2;

        const merged = (clientesData || []).map(c => {
           const datos = (opData || []).filter(d => d.id_cliente === c.id);
           datos.forEach(d => {
             c[d.campo_id] = d.valor;
           });
           return c;
        });

        setClientes(merged);
      } catch (err) {
        console.error('Error fetching clientes:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchClientes();
  }, []);

  const filteredClientes = clientes.filter(c => {
    if (searchQuery) {
      const q = String(searchQuery).toLowerCase().trim();
      const qNormalized = q.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents

      const allText = Object.values(c)
        .filter(v => v && typeof v === 'string')
        .join(' ')
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      const allTextStripped = allText.replace(/[.\-()\s]/g, '');

      // Split search query into individual words/terms
      const searchTerms = qNormalized.split(/\s+/);

      // EVERY term must be found in the client's data (AND logic)
      const matchesAll = searchTerms.every(term => {
        const termStripped = term.replace(/[.\-()\s]/g, '');
        return allText.includes(term) || (termStripped.length > 0 && allTextStripped.includes(termStripped));
      });

      if (!matchesAll) {
        return false;
      }
    }

    if (dateFrom || dateTo) {
      const fieldVal = c[dateFilterType];
      if (!fieldVal) return false;
      const d = new Date(fieldVal);
      
      if (dateFrom) {
        const startD = new Date(dateFrom);
        // Ajustar a medianoche local
        startD.setHours(0,0,0,0);
        // Compensar el offset para evitar desfasajes
        startD.setMinutes(startD.getMinutes() + startD.getTimezoneOffset());
        if (d < startD) return false;
      }
      if (dateTo) {
         const endD = new Date(dateTo);
         endD.setHours(23,59,59,999);
         endD.setMinutes(endD.getMinutes() + endD.getTimezoneOffset());
         if (d > endD) return false;
      }
    }

    if (activeTab !== 'todos') {
      if (c.estado_cliente !== activeTab) return false;
    }

    if (filterNacionalidad !== 'all') {
      const nac = c.nacionalidad?.toLowerCase() || '';
      if (filterNacionalidad === 'cuba' && !nac.includes('cuba')) return false;
      if (filterNacionalidad === 'brasil' && !nac.includes('brasil')) return false;
      if (filterNacionalidad === 'otros' && (nac.includes('cuba') || nac.includes('brasil'))) return false;
    }

    if (filterEstadoCivil !== 'all') {
      const ec = c.estado_civil?.toLowerCase() || '';
      if (!ec.includes(filterEstadoCivil)) return false;
    }

    if (filterSexo !== 'all') {
      const s = c.sexo?.toLowerCase() || '';
      if (filterSexo === 'masculino' && !s.includes('masculin') && !s.startsWith('m')) return false;
      if (filterSexo === 'femenino' && !s.includes('femenin') && !s.startsWith('f')) return false;
    }

    if (filterMissingDoc !== 'all') {
      if (filterMissingDoc === 'no_cpf' && c.cpf) return false;
      if (filterMissingDoc === 'no_pasaporte' && c.numero_pasaporte) return false;
      if (filterMissingDoc === 'no_rnm' && c.rnm) return false;
    }

    if (filterDireccion.trim() !== '') {
      const q = filterDireccion.toLowerCase();
      const addr = [c.direccion, c.direccion_estado, c.direccion_ciudad, c.direccion_cep].filter(Boolean).join(' ').toLowerCase();
      if (!addr.includes(q)) return false;
    }

    if (filterCiudadOrigen.trim() !== '') {
      const q = filterCiudadOrigen.toLowerCase();
      const origin = [c.ciudad_origen, c.estado_origen, c.lugar_nacimiento, c.origen].filter(Boolean).join(' ').toLowerCase();
      if (!origin.includes(q)) return false;
    }

    return true;
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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field.includes('fecha_vencimiento') ? 'asc' : 'desc');
    }
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

      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem', position: 'relative' }}>
        {['todos', 'nuevo', 'en tramite', 'finalizado'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '1rem 2rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === tab ? 600 : 500,
              textTransform: 'capitalize',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '0.875rem'
            }}
          >
            {tab}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`btn ${showAdvancedFilters || dateFrom || dateTo || filterNacionalidad !== 'all' || filterMissingDoc !== 'all' || filterDireccion || filterCiudadOrigen ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-md)', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
          >
            <Filter size={16} />
            Filtros
          </button>
        </div>

        {showAdvancedFilters && (
          <div className="glass-panel animate-fade-in" style={{ 
            position: 'absolute', 
            top: 'calc(100% + 0.5rem)', 
            right: 0, 
            width: '350px', 
            padding: '1.5rem', 
            zIndex: 50,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            border: '1px solid var(--color-primary)'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Filtros Avanzados
              <button onClick={() => setShowAdvancedFilters(false)} className="btn btn-ghost" style={{ padding: '0.2rem' }}>
                <X size={16} />
              </button>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Rango de Fechas */}
              <div style={{ gridColumn: '1 / -1', background: 'var(--color-bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>Filtrar por Fechas</label>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Aplicar fechas a:</label>
                    <select className="form-input" value={dateFilterType} onChange={e => setDateFilterType(e.target.value)} style={{ width: '100%', fontSize: '0.875rem' }}>
                      <option value="creado_en">Fecha de Registro</option>
                      <option value="fecha_nacimiento">Fecha de Nacimiento</option>
                      <option value="fecha_vencimiento_refugio">Vencimiento de Refugio</option>
                      <option value="fecha_vencimiento_pasaporte">Vencimiento de Pasaporte</option>
                    </select>
                  </div>
                  <div style={{ flex: '1 1 120px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Desde:</label>
                    <input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%', fontSize: '0.875rem' }} />
                  </div>
                  <div style={{ flex: '1 1 120px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Hasta:</label>
                    <input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '100%', fontSize: '0.875rem' }} />
                  </div>
                </div>
              </div>

              {/* Nacionalidad */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Nacionalidad</label>
                <select className="form-input" value={filterNacionalidad} onChange={e => setFilterNacionalidad(e.target.value)} style={{ width: '100%', fontSize: '0.875rem' }}>
                  <option value="all">Cualquier Nacionalidad</option>
                  <option value="cuba">Cuba / Cubano</option>
                  <option value="brasil">Brasil / Brasileño</option>
                  <option value="otros">Otras Nacionalidades</option>
                </select>
              </div>

              {/* Estado Civil */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Estado Civil</label>
                <select className="form-input" value={filterEstadoCivil} onChange={e => setFilterEstadoCivil(e.target.value)} style={{ width: '100%', fontSize: '0.875rem' }}>
                  <option value="all">Cualquier Estado Civil</option>
                  <option value="soltero">Soltero(a)</option>
                  <option value="casado">Casado(a)</option>
                  <option value="divorciado">Divorciado(a)</option>
                  <option value="viudo">Viudo(a)</option>
                  <option value="union">Unión Estable</option>
                </select>
              </div>

              {/* Sexo */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Sexo</label>
                <select className="form-input" value={filterSexo} onChange={e => setFilterSexo(e.target.value)} style={{ width: '100%', fontSize: '0.875rem' }}>
                  <option value="all">Ambos</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                </select>
              </div>

              {/* Faltan Documentos */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Faltan Documentos</label>
                <select className="form-input" value={filterMissingDoc} onChange={e => setFilterMissingDoc(e.target.value)} style={{ width: '100%', fontSize: '0.875rem' }}>
                  <option value="all">Mostrar Todos</option>
                  <option value="no_cpf">Falta CPF</option>
                  <option value="no_pasaporte">Falta Pasaporte</option>
                  <option value="no_rnm">Falta RNM / RNE</option>
                </select>
              </div>

              {/* Dirección / Estado / Ciudad */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Dirección (Ciudad/Estado)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ej. Santa Catarina" 
                  value={filterDireccion} 
                  onChange={e => setFilterDireccion(e.target.value)} 
                  style={{ width: '100%', fontSize: '0.875rem' }} 
                />
              </div>

              {/* Ciudad de Origen */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Ciudad de Origen</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ej. La Habana" 
                  value={filterCiudadOrigen} 
                  onChange={e => setFilterCiudadOrigen(e.target.value)} 
                  style={{ width: '100%', fontSize: '0.875rem' }} 
                />
              </div>

            </div>
            
            {(filterNacionalidad !== 'all' || filterMissingDoc !== 'all' || filterDireccion || filterCiudadOrigen || filterEstadoCivil !== 'all' || filterSexo !== 'all' || dateFrom || dateTo) && (
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <button 
                  className="btn btn-ghost" 
                  onClick={() => { 
                    setFilterNacionalidad('all'); 
                    setFilterMissingDoc('all'); 
                    setFilterDireccion('');
                    setFilterCiudadOrigen('');
                    setFilterEstadoCivil('all');
                    setFilterSexo('all');
                    setDateFrom('');
                    setDateTo('');
                  }}  
                  style={{ color: 'var(--color-danger)', fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                >
                  Limpiar Filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>


      <div className="glass-panel" style={{ padding: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)', userSelect: 'none' }}>
              <th onClick={() => handleSort('nombre')} style={{ padding: '1rem', fontWeight: 500, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Nombre {sortField === 'nombre' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              <th onClick={() => handleSort('cpf')} style={{ padding: '1rem', fontWeight: 500, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Documento {sortField === 'cpf' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              <th onClick={() => handleSort('fecha_vencimiento_pasaporte')} style={{ padding: '1rem', fontWeight: 500, cursor: 'pointer', color: sortField.includes('vencimiento') ? 'var(--color-primary)' : 'inherit' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Calendar size={14} /> Vencimiento {sortField === 'fecha_vencimiento_pasaporte' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              <th onClick={() => handleSort('estado_cliente')} style={{ padding: '1rem', fontWeight: 500, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Estado {sortField === 'estado_cliente' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
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
                <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>
                  <div>{cliente.cpf || cliente.numero_pasaporte || cliente.rnm || '—'}</div>
                </td>
                <td style={{ padding: '1rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                  {cliente.fecha_vencimiento_pasaporte ? formatDate(cliente.fecha_vencimiento_pasaporte) : (cliente.fecha_vencimiento_refugio ? formatDate(cliente.fecha_vencimiento_refugio) : <span style={{color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 400}}>Sin fecha</span>)}
                </td>
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
