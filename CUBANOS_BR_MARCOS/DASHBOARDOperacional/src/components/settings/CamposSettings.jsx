import React, { useState, useEffect } from 'react';
import { getCategorias, getCampos, insertCategoria, insertCampo, updateCategoria, updateCampo } from '../../services/clientesService';
import { LoadingSpinner } from '../LoadingSpinner';
import { Plus, Edit2, Check, X, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CamposSettings() {
  const [categorias, setCategorias] = useState([]);
  const [campos, setCampos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for new Categoria
  const [isAddingCategoria, setIsAddingCategoria] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  
  // States for new Campo
  const [isAddingCampoTo, setIsAddingCampoTo] = useState(null); // categoria_id
  const [newCampoForm, setNewCampoForm] = useState({ nombre: '', tipo: 'texto' });
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catData, campData] = await Promise.all([getCategorias(), getCampos()]);
      setCategorias(catData);
      setCampos(campData);
    } catch (error) {
      toast.error('Error al cargar campos operacionales');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategoria = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const maxOrden = categorias.length > 0 ? Math.max(...categorias.map(c => c.orden)) : 0;
      await insertCategoria({ nombre_categoria: newCatName, orden: maxOrden + 1 });
      toast.success('Categoría agregada');
      setNewCatName('');
      setIsAddingCategoria(false);
      loadData();
    } catch (error) {
      toast.error('Error al crear categoría');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCampo = async (e, categoriaId) => {
    e.preventDefault();
    setSaving(true);
    try {
      const camposCat = campos.filter(c => c.categoria_id === categoriaId);
      const maxOrden = camposCat.length > 0 ? Math.max(...camposCat.map(c => c.orden)) : 0;
      await insertCampo({ 
        categoria_id: categoriaId, 
        nombre_campo: newCampoForm.nombre, 
        tipo_dato: newCampoForm.tipo, 
        orden: maxOrden + 1 
      });
      toast.success('Campo agregado');
      setNewCampoForm({ nombre: '', tipo: 'texto' });
      setIsAddingCampoTo(null);
      loadData();
    } catch (error) {
      toast.error('Error al crear campo');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>Campos Dinámicos del Cliente</h2>
        <button className="btn btn-primary" onClick={() => setIsAddingCategoria(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> Nueva Categoría
        </button>
      </div>

      {isAddingCategoria && (
        <form onSubmit={handleAddCategoria} style={{ background: 'var(--color-bg-elevated)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--color-border)', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Nombre de Categoría</label>
            <input required type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }} placeholder="Ej. Datos Médicos" />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={() => setIsAddingCategoria(false)} className="btn btn-ghost" style={{ padding: '0.5rem' }}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} disabled={saving}>{saving ? '...' : 'Guardar'}</button>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {categorias.map(cat => (
          <div key={cat.id} style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ background: 'var(--color-bg-elevated)', padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Tag size={16} color="var(--color-primary)" /> {cat.nombre_categoria}
              </h3>
              <button onClick={() => setIsAddingCampoTo(cat.id)} className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Plus size={14} /> Añadir Campo
              </button>
            </div>

            {isAddingCampoTo === cat.id && (
              <form onSubmit={(e) => handleAddCampo(e, cat.id)} style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '1rem', alignItems: 'flex-end', background: 'rgba(59, 130, 246, 0.05)' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Nombre del Campo</label>
                  <input required type="text" value={newCampoForm.nombre} onChange={e => setNewCampoForm({...newCampoForm, nombre: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }} placeholder="Ej. Tipo de Sangre" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Tipo de Dato</label>
                  <select value={newCampoForm.tipo} onChange={e => setNewCampoForm({...newCampoForm, tipo: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}>
                    <option value="texto">Texto Libre</option>
                    <option value="fecha">Fecha</option>
                    <option value="numero">Número</option>
                    <option value="booleano">Sí/No</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setIsAddingCampoTo(null)} className="btn btn-ghost" style={{ padding: '0.5rem' }}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} disabled={saving}>{saving ? '...' : 'Guardar'}</button>
                </div>
              </form>
            )}

            <div style={{ padding: '1rem' }}>
              {campos.filter(c => c.categoria_id === cat.id).length === 0 ? (
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>No hay campos en esta categoría.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {campos.filter(c => c.categoria_id === cat.id).sort((a,b) => a.orden - b.orden).map(campo => (
                    <li key={campo.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderRadius: '4px', background: 'var(--color-bg-canvas)' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{campo.nombre_campo}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', background: 'var(--color-bg-elevated)', padding: '0.125rem 0.5rem', borderRadius: '12px' }}>
                        {campo.tipo_dato}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
