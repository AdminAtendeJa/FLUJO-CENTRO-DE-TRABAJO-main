import React, { useState, useEffect } from 'react';
import { getPerfiles, createTeamMember } from '../services/equipoService';
import { Shield, UserPlus, Mail, Lock, User, Plus } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import toast from 'react-hot-toast';

export default function TeamManagement() {
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('miembro');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPerfiles();
  }, []);

  const loadPerfiles = async () => {
    try {
      const data = await getPerfiles();
      setPerfiles(data);
    } catch (error) {
      console.error('Error loading perfiles:', error);
      toast.error('Error al cargar el equipo');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createTeamMember(email, password, nombre, rol);
      toast.success('Miembro creado exitosamente. Se ha iniciado sesión con su cuenta automáticamente.');
      // En un flujo real, la creación desde el admin no debería desloguear al admin.
      // Pero con signUp desde cliente, esto cierra sesión.
      // Por eso, la app recargará o cambiará de estado de Auth.
      setIsModalOpen(false);
      // Opcional: window.location.reload() si queremos forzar refresh
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Error al crear miembro');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><LoadingSpinner /></div>;

  return (
    <div style={{ padding: '2rem', background: 'var(--color-bg-canvas)', height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>Gestión de Equipo</h1>
            <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0 0 0' }}>Administra los miembros de tu equipo operativo</p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={18} /> Agregar Miembro
          </button>
        </div>

        <div style={{ background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border)' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Usuario</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Rol</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Fecha Registro</th>
              </tr>
            </thead>
            <tbody>
              {perfiles.map((perfil) => (
                <tr key={perfil.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
                      {perfil.nombre.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{perfil.nombre}</span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>{perfil.email || 'N/A'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', 
                      borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 500,
                      background: perfil.rol === 'admin' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: perfil.rol === 'admin' ? '#3b82f6' : '#10b981'
                    }}>
                      {perfil.rol === 'admin' ? <Shield size={12} /> : <User size={12} />}
                      {perfil.rol.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>
                    {new Date(perfil.creado_en).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--color-bg-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', width: '400px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--color-text-primary)', fontSize: '1.25rem', fontWeight: 600 }}>Nuevo Miembro de Equipo</h2>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Nombre Completo</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }} placeholder="Ej. Victor" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Correo Electrónico</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }} placeholder="victor@equipo.com" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Contraseña Temporal</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }} placeholder="Mínimo 6 caracteres" minLength={6} />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: '0.5rem' }}>Nota: Esta acción cerrará tu sesión actual para iniciar con la cuenta nueva. (Comportamiento por defecto de Supabase Auth en cliente).</p>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Rol</label>
                <select value={rol} onChange={e => setRol(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}>
                  <option value="miembro">Miembro</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? 'Guardando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
