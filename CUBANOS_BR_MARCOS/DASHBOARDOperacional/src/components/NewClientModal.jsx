import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserPlus, Loader2 } from 'lucide-react';

export default function NewClientModal({ onClose, onClientCreated }) {
  const [formData, setFormData] = useState({ 
    nombres: '', apellidos: '', cpf: '', carnet_identidad: '', telefono: '', email: '',
    cep: '', endereco: '', numero: '', complemento: '', 
    bairro: '', cidade: '', estado: '', ponto_referencia: ''
  });
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

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
          carnet_identidad: formData.carnet_identidad,
          telefono: formData.telefono,
          email: formData.email.toLowerCase(),
          direccion: JSON.stringify({
            cep: formData.cep,
            endereco: formData.endereco,
            numero: formData.numero,
            complemento: formData.complemento,
            bairro: formData.bairro,
            cidade: formData.cidade,
            estado: formData.estado,
            ponto_referencia: formData.ponto_referencia
          }),
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

  const handleCepSearch = async (cepValue) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setCepLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            endereco: data.logradouro || prev.endereco,
            bairro: data.bairro || prev.bairro,
            cidade: data.localidade || prev.cidade,
            estado: data.uf || prev.estado
          }));
        }
      } catch (err) {
        console.error('Error fetching CEP:', err);
      } finally {
        setCepLoading(false);
      }
    }
  };

  const handleCepChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 5) val = val.substring(0, 5) + '-' + val.substring(5, 8);
    setFormData({ ...formData, cep: val });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '1rem' }}>
      <form onSubmit={handleSubmit} className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserPlus size={20} color="var(--color-primary)" /> Nuevo Cliente
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', overflowY: 'auto', paddingRight: '0.5rem', flex: 1 }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datos Personales</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Carnet Identidad (CI)</label>
              <input type="text" value={formData.carnet_identidad} onChange={e => setFormData({...formData, carnet_identidad: e.target.value})} style={{width: '100%'}} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Teléfono</label>
              <input type="text" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} style={{width: '100%'}} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Email</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{width: '100%'}} />
            </div>
          </div>

          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1rem' }}>Endereço</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, maxWidth: '200px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>CEP</label>
                <input 
                  type="text" 
                  value={formData.cep} 
                  onChange={handleCepChange} 
                  onBlur={(e) => handleCepSearch(e.target.value)}
                  placeholder="00000-000"
                  style={{width: '100%'}} 
                />
              </div>
              {cepLoading && <Loader2 className="animate-spin" size={20} color="var(--color-text-secondary)" style={{ marginBottom: '0.5rem' }} />}
              <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.875rem', color: 'var(--color-primary)', textDecoration: 'none', marginBottom: '0.5rem', marginLeft: 'auto' }}>No sé mi CEP</a>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Endereço (Calle)</label>
              <input type="text" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} style={{width: '100%'}} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Número</label>
              <input type="text" value={formData.numero} onChange={e => setFormData({...formData, numero: e.target.value})} style={{width: '100%'}} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Complemento</label>
              <input type="text" value={formData.complemento} onChange={e => setFormData({...formData, complemento: e.target.value})} style={{width: '100%'}} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Bairro</label>
              <input type="text" value={formData.bairro} onChange={e => setFormData({...formData, bairro: e.target.value})} style={{width: '100%'}} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Cidade</label>
              <input type="text" value={formData.cidade} onChange={e => setFormData({...formData, cidade: e.target.value})} style={{width: '100%'}} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Estado</label>
              <input type="text" value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})} style={{width: '100%'}} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Ponto de Referência</label>
              <input type="text" value={formData.ponto_referencia} onChange={e => setFormData({...formData, ponto_referencia: e.target.value})} style={{width: '100%'}} />
            </div>
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
