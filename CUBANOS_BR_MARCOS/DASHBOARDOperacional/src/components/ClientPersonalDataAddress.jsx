import React from 'react';
import { MapPin, Copy, Check } from 'lucide-react';

export default function ClientPersonalDataAddress({
  address,
  onCopyClick,
  copiedId
}) {
  if (!address) return null;

  const {
    cep = '',
    endereco = '',
    numero = '',
    complemento = '',
    bairro = '',
    cidade = '',
    estado = '',
    ponto_referencia = ''
  } = address;

  const hasAddress = endereco || numero || bairro || cidade;
  if (!hasAddress) return null;

  return (
    <div style={{ gridColumn: '1 / -1' }}>
      <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={14} /> Dirección Completa
        </h3>
      </div>
      <div style={{ background: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          {cep && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>CEP</div>
              <div style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{cep}</div>
            </div>
          )}
          {endereco && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Endereço</div>
              <div style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{endereco}</div>
            </div>
          )}
          {numero && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Número</div>
              <div style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{numero}</div>
            </div>
          )}
          {complemento && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Complemento</div>
              <div style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{complemento}</div>
            </div>
          )}
          {bairro && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Bairro</div>
              <div style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{bairro}</div>
            </div>
          )}
          {cidade && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Cidade</div>
              <div style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{cidade}</div>
            </div>
          )}
          {estado && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Estado</div>
              <div style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{estado}</div>
            </div>
          )}
          {ponto_referencia && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Punto de Referencia</div>
              <div style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{ponto_referencia}</div>
            </div>
          )}
        </div>
        <button
          className="btn btn-ghost"
          style={{ marginTop: '1rem', padding: '0.4rem' }}
          onClick={() => onCopyClick('direccion')}
          title="Copiar dirección"
        >
          {copiedId === 'direccion' ? (
            <><Check size={14} /> Copiado</> 
          ) : (
            <><Copy size={14} /> Copiar Dirección</>
          )}
        </button>
      </div>
    </div>
  );
}
