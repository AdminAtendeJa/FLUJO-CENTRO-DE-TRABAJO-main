import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserPlus, Loader2 } from 'lucide-react';

export default function NewClientModal({ onClose, onClientCreated }) {
  const [formData, setFormData] = useState({ nombres: '', apellidos: '', cpf: '', telefono: '', email: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombres || !formData.apellidos) return alert('Nombre(s) y Apellidos son obligatorios');
    
    setLoading(true);
    try {
      const nombreCompleto = `${formData.nombres.trim()} ${formData.apellidos.trim()}`.toUpperCase();
      const { data, error } = await supabase
        .from('clientes')
        .insert([{
          nombre: nombreCompleto,
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '1rem' }}>
      <form onSubmit={handleSubmit} className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserPlus size={20} color="var(--color-primary)" /> Nuevo Cliente
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Nombre(s) *</label>
            <input required type="text" value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} style={{width: '100%'}} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Apellidos *</label>
            <input required type="text" value={formData.apellidos} onChange={e => setFormData({...formData, apellidos: e.target.value})} style={{width: '100%'}} />
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
