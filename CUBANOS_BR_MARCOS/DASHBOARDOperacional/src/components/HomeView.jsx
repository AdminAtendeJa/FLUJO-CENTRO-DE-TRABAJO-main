import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Clock, ArrowRight, AlertCircle, CheckCircle, RotateCw, XCircle } from 'lucide-react';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import { SkeletonTramiteCard } from './ui/SkeletonCard';
import Card from './ui/Card';

const DOCS_PENDING_KEYWORDS = [
  'pendiente', 'esperando', 'faltante', 'pendente', 'aguardando',
];

const hasPendingDocs = (entrada) => {
  const txt = [entrada.estado_tramite, entrada.servicio, entrada.clientes?.observaciones, entrada.observaciones, entrada.notas]
    .filter(Boolean).join(' ').toLowerCase();
  return DOCS_PENDING_KEYWORDS.some((k) => txt.includes(k));
};

const PHASES = [
  { id: 'cancelada', label: 'Canceladas', icon: XCircle, color: '#ef4444' }, // rojo
  { id: 'pendiente', label: 'Pendientes', icon: Clock, color: 'var(--color-warning)' },
  { id: 'procesando', label: 'Procesando', icon: RotateCw, color: 'var(--brand-primary)' },
  { id: 'completada', label: 'Completados', icon: CheckCircle, color: 'var(--color-success)' }
];

export default function HomeView({ onNavigateToClient, onNavigateToClientsList, searchQuery = '' }) {
  const [entradas, setEntradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('dashboard_activeTab') || 'pendiente';
  });

  useEffect(() => {
    localStorage.setItem('dashboard_activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    async function fetchEntradas() {
      try {
        const { data, error } = await supabase
          .from('entradas')
          .select('*, clientes(*)')
          .order('creado_en', { ascending: false })
          .limit(300);
        if (error) throw error;
        setEntradas(data || []);
      } catch (err) {
        console.error('Error fetching entradas:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEntradas();
  }, []);

  const renderTramiteCard = (entrada) => {
    const statusKey = entrada.estado_tramite === 'esperando_docs' ? 'esperando' : entrada.estado_tramite;
    const daysInStatus = Math.max(0, Math.floor((Date.now() - new Date(entrada.creado_en).getTime()) / 86400000));
    const pendingDocs = hasPendingDocs(entrada);
    const clientId = entrada.id_cliente ?? entrada.clientes?.id;
    const clientName = entrada.clientes?.nombre ?? entrada.cliente ?? entrada.nombre_pix;
    const hasValidClient = clientId != null && clientId !== '';
    const clickableAny = !!clientId || !!clientName;

    return (
      <Card
        key={entrada.id}
        clickable={clickableAny}
        onClick={() => {
          if (clientId) return onNavigateToClient(clientId);
          if (clientName) return onNavigateToClientsList?.(clientName);
        }}
        className={`tramite-card tramite-card-${statusKey}`}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          borderBottom: '1px solid var(--color-border)', 
          gap: 'var(--gap-md, 12px)', 
          padding: 'var(--card-padding, 14px 16px)',
          opacity: hasValidClient ? 1 : 0.5,
          zIndex: 5
        }}
        role={clickableAny ? "button" : undefined}
        tabIndex={clickableAny ? 0 : -1}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--gap-md, 12px)', minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-md, 12px)', minWidth: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{(entrada.clientes?.nombre || entrada.cliente || 'Cliente').split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'CL'}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: hasValidClient ? 'var(--color-text-primary)' : 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                {entrada.clientes?.nombre || entrada.cliente || (hasValidClient ? 'Cliente Desconocido' : 'Sin cliente asignado')}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-sm, 8px)', marginTop: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{entrada.servicio}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>• {daysInStatus === 0 ? 'Hoy' : `Hace ${daysInStatus}d`}</span>
                {pendingDocs && (
                  <span aria-label="Documentos pendientes" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: 'var(--color-warning)' }}>
                    <AlertCircle size={12} /> Docs
                  </span>
                )}
                {!hasValidClient && (
                  <span aria-label="Sin cliente" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                    ⚠ No disponible
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-md, 12px)', flexShrink: 0 }}>
            <Badge status={statusKey} />
            <ArrowRight size={18} color="var(--color-text-muted)" aria-label="Ver cliente" />
          </div>
        </div>
      </Card>
    );
  };

  const filteredEntradas = entradas.filter(entrada => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const clienteNombre = (entrada.clientes?.nombre || entrada.cliente || '').toLowerCase();
    const clienteCpf = (entrada.clientes?.cpf || '').toLowerCase();
    const servicio = (entrada.servicio || '').toLowerCase();
    return clienteNombre.includes(searchLower) || clienteCpf.includes(searchLower) || servicio.includes(searchLower);
  });

  const activePhase = PHASES.find(p => p.id === activeTab);
  const activeEntradas = filteredEntradas.filter(e => e.estado_tramite === activeTab || (activeTab === 'pendiente' && !e.estado_tramite));

  return (
    <div style={{ padding: 'var(--section-gap, 16px)', maxWidth: '1080px', margin: '0 auto', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }} className="animate-fade-in">
      <header style={{ marginBottom: 'var(--section-gap, 16px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--gap-md, 12px)', flexWrap: 'wrap', flexShrink: 0 }}>
        <div>
          <h1 style={{ font: 'var(--font-page-title)', marginBottom: '4px' }}>Trámites Operacionales</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>Gestiona el flujo de trabajo en sus 4 fases</p>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        {PHASES.map(phase => {
          const count = entradas.filter(e => e.estado_tramite === phase.id || (phase.id === 'pendiente' && !e.estado_tramite)).length;
          const isActive = activeTab === phase.id;
          const Icon = phase.icon;
          
          return (
            <button
              key={phase.id}
              onClick={() => setActiveTab(phase.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 24px', borderRadius: '10px', border: 'none',
                background: isActive ? phase.color : 'var(--surface-base)',
                color: isActive ? '#fff' : 'var(--color-text-secondary)',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? `0 4px 12px ${phase.color}40` : 'none'
              }}
            >
              <Icon size={16} />
              {phase.label}
              <span style={{ 
                background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--surface-elevated)', 
                color: isActive ? '#fff' : 'var(--color-text-primary)',
                padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' 
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ padding: 'var(--card-padding, 14px 16px)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--gap-sm, 8px)', background: 'var(--surface-base)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-sm, 8px)' }}>
            <activePhase.icon size={18} color={activePhase.color} />
            <h2 style={{ font: '500 15px/1.4 Inter, sans-serif', fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>
              {activePhase.label}
            </h2>
          </div>
          <span style={{ font: 'var(--font-section)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
            {activeEntradas.length} en total
          </span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-sm, 8px)', padding: 'var(--section-gap, 16px)', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-sm, 8px)' }}>
              <SkeletonTramiteCard />
              <SkeletonTramiteCard />
              <SkeletonTramiteCard />
            </div>
          ) : activeEntradas.length === 0 ? (
            <EmptyState icon={<activePhase.icon size={32} color={activePhase.color} />} title={`No hay ${activePhase.label.toLowerCase()}`} description="No se encontraron trámites en esta fase." />
          ) : (
            activeEntradas.map(renderTramiteCard)
          )}
        </div>
      </div>
    </div>
  );
}
