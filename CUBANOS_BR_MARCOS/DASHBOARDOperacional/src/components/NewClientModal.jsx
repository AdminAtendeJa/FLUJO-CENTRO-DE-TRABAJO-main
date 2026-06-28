import { useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { AlertTriangle, CheckCircle2, Loader2, MapPin, UserPlus } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';
import Avatar from './ui/Avatar';

const initialFormData = {
  nombres: '',
  apellidos: '',
  id_kommo: '',
  cpf: '',
  carnet_identidad: '',
  telefono: '',
  email: '',
  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  ponto_referencia: ''
};

const requiredFields = ['nombres', 'apellidos'];
const progressFields = ['nombres', 'apellidos', 'cpf', 'telefono', 'email', 'cep', 'endereco', 'cidade', 'estado'];

const validateField = (name, value) => {
  const clean = String(value || '').trim();
  if (requiredFields.includes(name) && !clean) return 'Campo obligatorio';
  if (name === 'email' && clean && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return 'Email inválido';
  if (name === 'cpf' && clean && clean.replace(/\D/g, '').length < 11) return 'CPF incompleto';
  if (name === 'cep' && clean && clean.replace(/\D/g, '').length !== 8) return 'CEP debe tener 8 dígitos';
  return '';
};

const Field = ({ label, name, value, onChange, error, required, children, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-xs, 4px)' }}>
    <label
      htmlFor={`new-client-${name}`}
      style={{
        font: 'var(--font-section)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--color-text-secondary)'
      }}
    >
      {label}{required ? ' *' : ''}
    </label>
    {children || (
      <Input
        id={`new-client-${name}`}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        error={Boolean(error)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `new-client-${name}-error` : undefined}
        {...props}
      />
    )}
    {error && (
      <span id={`new-client-${name}-error`} style={{ fontSize: 12, color: 'var(--color-danger)' }}>
        {error}
      </span>
    )}
  </div>
);

export default function NewClientModal({ onClose, onClientCreated }) {
  const [formData, setFormData] = useState(initialFormData);
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const errors = useMemo(() => {
    return Object.keys(formData).reduce((acc, key) => {
      const error = validateField(key, formData[key]);
      if (error) acc[key] = error;
      return acc;
    }, {});
  }, [formData]);

  const completedCount = progressFields.filter((field) => String(formData[field] || '').trim()).length;
  const progress = Math.round((completedCount / progressFields.length) * 100);
  const fullName = `${formData.nombres.trim()} ${formData.apellidos.trim()}`.trim().toUpperCase();
  const canSubmit = requiredFields.every((field) => !errors[field]) && !errors.email && !errors.cpf && !errors.cep;

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrorMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const allTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allTouched);
    if (!canSubmit) {
      setErrorMessage('Revisa los campos marcados antes de guardar.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([{
          id_kommo: formData.id_kommo || null,
          nombre: fullName,
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
      setErrorMessage('No se pudo crear el cliente. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCepSearch = async (cepValue) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
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
      setErrorMessage('No se pudo consultar el CEP. Puedes completar la dirección manualmente.');
    } finally {
      setCepLoading(false);
    }
  };

  const handleCepChange = (value) => {
    let val = value.replace(/\D/g, '');
    if (val.length > 5) val = `${val.substring(0, 5)}-${val.substring(5, 8)}`;
    updateField('cep', val);
  };

  const visibleError = (field) => touched[field] ? errors[field] : '';

  return (
    <Modal
      isOpen
      onClose={loading ? undefined : onClose}
      title="Nuevo cliente"
      ariaLabel="Formulario para crear nuevo cliente"
      maxWidth={820}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={loading || !canSubmit} form="new-client-form">
            {loading ? <><Loader2 className="animate-spin" size={16} /> Guardando...</> : 'Crear cliente'}
          </Button>
        </>
      )}
    >
      <form id="new-client-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap, 16px)' }}>
        {errorMessage && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--gap-sm, 8px)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-danger-border)',
              background: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              font: 'var(--font-body)'
            }}
          >
            <AlertTriangle size={16} /> {errorMessage}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(260px, 0.6fr)', gap: 'var(--section-gap, 16px)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap, 16px)' }}>
            <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-gap, 12px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-sm, 8px)', color: 'var(--brand-primary)' }}>
                <UserPlus size={18} />
                <h3 style={{ margin: 0, font: 'var(--font-page-title)' }}>Datos principales</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Nombres *</label>
                <input
                  type="text"
                  required
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                  value={formData.nombres}
                  onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                  placeholder="Ej. Juan Carlos"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Apellidos *</label>
                <input
                  type="text"
                  required
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                  value={formData.apellidos}
                  onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                  placeholder="Ej. Pérez Gómez"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>ID Kommo (Opcional)</label>
              <input
                type="text"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                value={formData.id_kommo || ''}
                onChange={(e) => setFormData({ ...formData, id_kommo: e.target.value })}
                placeholder="Ej. 23314228"
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Si se rellena, sincronizará automáticamente los mensajes de este Lead.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="CPF" name="cpf" value={formData.cpf} onChange={updateField} error={visibleError('cpf')} placeholder="000.000.000-00" />
                <Field label="Carnet / Identidad" name="carnet_identidad" value={formData.carnet_identidad} onChange={updateField} error={visibleError('carnet_identidad')} />
                <Field label="Teléfono" name="telefono" value={formData.telefono} onChange={updateField} error={visibleError('telefono')} placeholder="+55 ..." />
                <Field label="Email" name="email" type="email" value={formData.email} onChange={updateField} error={visibleError('email')} placeholder="cliente@email.com" />
              </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-gap, 12px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-sm, 8px)', color: 'var(--brand-primary)' }}>
                <MapPin size={18} />
                <h3 style={{ margin: 0, font: 'var(--font-page-title)' }}>Dirección</h3>
              </div>
              <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--card-gap, 12px)' }}>
                <Field label="CEP" name="cep" value={formData.cep} onChange={(_, value) => handleCepChange(value)} error={visibleError('cep')} placeholder="00000-000">
                  <div style={{ display: 'flex', gap: 'var(--gap-sm, 8px)', alignItems: 'center' }}>
                    <Input
                      id="new-client-cep"
                      value={formData.cep}
                      onChange={(event) => handleCepChange(event.target.value)}
                      onBlur={(event) => handleCepSearch(event.target.value)}
                      error={Boolean(visibleError('cep'))}
                      placeholder="00000-000"
                    />
                    {cepLoading && <Loader2 className="animate-spin" size={18} color="var(--brand-primary)" />}
                  </div>
                </Field>
                <Field label="Estado" name="estado" value={formData.estado} onChange={updateField} error={visibleError('estado')} />
                <Field label="Ciudad" name="cidade" value={formData.cidade} onChange={updateField} error={visibleError('cidade')} />
                <Field label="Bairro" name="bairro" value={formData.bairro} onChange={updateField} error={visibleError('bairro')} />
                <Field label="Endereço / Calle" name="endereco" value={formData.endereco} onChange={updateField} error={visibleError('endereco')} />
                <Field label="Número" name="numero" value={formData.numero} onChange={updateField} error={visibleError('numero')} />
                <Field label="Complemento" name="complemento" value={formData.complemento} onChange={updateField} error={visibleError('complemento')} />
                <Field label="Punto referencia" name="ponto_referencia" value={formData.ponto_referencia} onChange={updateField} error={visibleError('ponto_referencia')} />
              </div>
            </section>
          </div>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-gap, 12px)' }}>
            <div style={{ padding: 'var(--card-padding)', borderRadius: 'var(--card-radius)', border: '1px solid var(--border-default)', background: 'var(--surface-elevated)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-md, 12px)', marginBottom: 'var(--gap-md, 12px)' }}>
                <Avatar name={fullName || 'Nuevo Cliente'} size={48} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ font: 'var(--font-body)', fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {fullName || 'NOMBRE DEL CLIENTE'}
                  </div>
                  <div style={{ font: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
                    Preview antes de guardar
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-sm, 8px)', font: 'var(--font-body)' }}>
                <span><strong>CPF:</strong> <code style={{ font: 'var(--font-data)' }}>{formData.cpf || '—'}</code></span>
                <span><strong>Teléfono:</strong> {formData.telefono || '—'}</span>
                <span><strong>Email:</strong> {formData.email || '—'}</span>
                <span><strong>Ciudad:</strong> {[formData.cidade, formData.estado].filter(Boolean).join(' / ') || '—'}</span>
              </div>
            </div>

            <div style={{ padding: 'var(--card-padding)', borderRadius: 'var(--card-radius)', border: '1px solid var(--border-default)', background: 'var(--surface-raised)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--gap-sm, 8px)', font: 'var(--font-body)' }}>
                <span>Progreso</span>
                <strong>{completedCount}/{progressFields.length}</strong>
              </div>
              <div style={{ height: 8, borderRadius: 'var(--radius-full)', background: 'var(--surface-elevated)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--brand-primary)', transition: 'width var(--transition-normal)' }} />
              </div>
              {canSubmit && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-xs, 4px)', marginTop: 'var(--gap-sm, 8px)', color: 'var(--color-success)', font: 'var(--font-body)' }}>
                  <CheckCircle2 size={14} /> Listo para guardar
                </div>
              )}
            </div>
          </aside>
        </div>
      </form>
    </Modal>
  );
}