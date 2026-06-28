import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Clock, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
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

export default function HomeView({ onNavigateToClient, onNavigateToClientsList }) {
  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEntradas() {
      try {
        const { data, error } = await supabase
          .from('entradas')
          .select('*, clientes(*)')
          .neq("estado_tramite", "completada")
          .order('creado_en', { ascending: false });
        if (error) throw error;
        setPendientes(data || []);
      } catch (err) {
        console.error('Error fetching entradas:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEntradas();
  }, []);

  const sortedPendientes = [...pendientes].sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));

  return (
    <div style={{ padding: 'var(--section-gap, 16px)', maxWidth: '1080px', margin: '0 auto', width: '100%' }} className="animate-fade-in">
      <header style={{ marginBottom: 'var(--section-gap, 16px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--gap-md, 12px)', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ font: 'var(--font-page-title)', marginBottom: '4px' }}>Trámites Operacionales</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>Gestiona los clientes y sus documentos</p>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--gap-sm, 8px)', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
          <Sparkles size={14} color="var(--brand-primary)" />
          Prioridad por antigüedad
        </div>
      </header>
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: 'var(--card-padding, 14px 16px)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--gap-sm, 8px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-sm, 8px)' }}>
            <Clock size={18} color="var(--color-warning)" />
            <h2 style={{ font: '500 15px/1.4 Inter, sans-serif', fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>Cola de Trámites Pendientes</h2>
          </div>
          <span style={{ font: 'var(--font-section)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>{sortedPendientes.length} en cola</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-sm, 8px)', padding: 'var(--section-gap, 16px)' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-sm, 8px)' }}>
              <SkeletonTramiteCard />
              <SkeletonTramiteCard />
              <SkeletonTramiteCard />
            </div>
          ) : sortedPendientes.length === 0 ? (
            <EmptyState icon={<Clock size={32} />} title="Todo al día" description="No hay trámites pendientes en este momento." />
          ) : (
            sortedPendientes.map((entrada) => {
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
                    if (clientId) {
                      return onNavigateToClient(clientId);
                    }
                    if (clientName) {
                      return onNavigateToClientsList?.(clientName);
                    }
                  }}
                  className={`tramite-card tramite-card-${statusKey}`}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    borderBottom: '1px solid var(--color-border)', 
                    gap: 'var(--gap-md, 12px)', 
                    padding: 'var(--card-padding, 14px 16px)',
                    opacity: hasValidClient ? 1 : 0.5
                    , zIndex: 5
                  }}
                  role={clickableAny ? "button" : undefined}
                  tabIndex={clickableAny ? 0 : -1}
                  onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && (clientId || clientName)) {
                    if (clientId) return onNavigateToClient(clientId);
                    if (clientName) return onNavigateToClientsList?.(clientName);
                  } }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--gap-md, 12px)', minWidth: 0 }}>
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
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>• {daysInStatus === 0 ? 'Hoy' : `${daysInStatus}d`}</span>
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
            })
          )}
        </div>
      </div>
    </div>
  );
}
