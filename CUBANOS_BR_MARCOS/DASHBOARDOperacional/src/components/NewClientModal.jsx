import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserPlus, Loader2 } from 'lucide-react';

export default function NewClientModal({ onClose, onClientCreated }) {
  const [formData, setFormData] = useState({ nombre: '', cpf: '', telefono: '', email: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre) return alert('El nombre es obligatorio');
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([{
          nombre: formData.nombre.toUpperCase(),
          cpf: formData.cpf,
          telefono: formData.telefono,
          email: formData.email.toLowerCase(),
          estado_cliente: 'nuevo'
        }])
        .select()
        .single();
        
      if (error) throw error;
      onClientCreated(data);
    } catch (err) {
      console.error('Error creating client:', err);
      alert('Error al crear el cliente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1rem' }}>
      <form onSubmit={handleSubmit} className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserPlus size={20} color="var(--color-primary)" /> Nuevo Cliente
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Nombre *</label>
            <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} style={{width: '100%'}} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>CPF</label>
            <input type="text" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} style={{width: '100%'}} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Teléfono</label>
            <input type="text" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} style={{width: '100%'}} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Email</label>
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{width: '100%'}} />
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={16} /> : 'Crear Cliente'}
          </button>
        </div>
      </form>
    </div>
  );
}
