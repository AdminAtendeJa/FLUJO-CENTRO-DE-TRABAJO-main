import React, { useState } from 'react';
import TramitesSettings from './settings/TramitesSettings';
import OperariosSettings from './settings/OperariosSettings';
import CamposSettings from './settings/CamposSettings';
import MantenimientoSettings from './settings/MantenimientoSettings';
import { Settings as SettingsIcon, FileText, UserSquare, Database, Wand2 } from 'lucide-react';

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('tramites');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg-canvas)' }}>
      <div style={{ padding: '2rem 2.5rem', background: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <SettingsIcon size={28} color="var(--color-primary)" />
          Configuración del Sistema
        </h1>
        <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text-secondary)' }}>
          Gestiona los catálogos y parámetros operacionales de la aplicación.
        </p>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar Interno */}
        <div style={{ width: '250px', background: 'var(--color-bg-surface)', borderRight: '1px solid var(--color-border)', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('tramites')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)', background: activeTab === 'tramites' ? 'var(--color-bg-elevated)' : 'transparent',
              color: activeTab === 'tramites' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: activeTab === 'tramites' ? 600 : 500
            }}
          >
            <FileText size={18} />
            Trámites
          </button>
          
          <button
            onClick={() => setActiveTab('operarios')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)', background: activeTab === 'operarios' ? 'var(--color-bg-elevated)' : 'transparent',
              color: activeTab === 'operarios' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: activeTab === 'operarios' ? 600 : 500
            }}
          >
            <UserSquare size={18} />
            Operarios
          </button>

          <button
            onClick={() => setActiveTab('campos')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)', background: activeTab === 'campos' ? 'var(--color-bg-elevated)' : 'transparent',
              color: activeTab === 'campos' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: activeTab === 'campos' ? 600 : 500
            }}
          >
            <Database size={18} />
            Campos Dinámicos
          </button>

          <button
            onClick={() => setActiveTab('mantenimiento')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)', background: activeTab === 'mantenimiento' ? 'var(--color-bg-elevated)' : 'transparent',
              color: activeTab === 'mantenimiento' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: activeTab === 'mantenimiento' ? 600 : 500
            }}
          >
            <Wand2 size={18} />
            Mantenimiento
          </button>
        </div>

        {/* Área de Contenido */}
        <div style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>
          <div style={{ maxWidth: '900px' }}>
            {activeTab === 'tramites' && <TramitesSettings />}
            {activeTab === 'operarios' && <OperariosSettings />}
            {activeTab === 'campos' && <CamposSettings />}
            {activeTab === 'mantenimiento' && <MantenimientoSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}
