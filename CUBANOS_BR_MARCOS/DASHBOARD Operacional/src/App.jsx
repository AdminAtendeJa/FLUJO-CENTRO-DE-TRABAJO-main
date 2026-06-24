import { useState } from 'react';
import { LayoutDashboard, Users, FileText, Settings, Search, Plus } from 'lucide-react';
import HomeView from './components/HomeView';
import ClientView from './components/ClientView';

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'client'
  const [selectedClientId, setSelectedClientId] = useState(null);

  const navigateToClient = (clientId) => {
    setSelectedClientId(clientId);
    setCurrentView('client');
  };

  const navigateToHome = () => {
    setSelectedClientId(null);
    setCurrentView('dashboard');
  };

  return (
    <div className="app-layout" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      
      {/* Sidebar */}
      <aside style={{ width: '240px', background: 'var(--color-bg-surface)', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--color-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={18} color="white" />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.025em' }}>OpDash</h1>
        </div>
        
        <nav style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <button 
            onClick={navigateToHome}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', 
              borderRadius: 'var(--radius-md)', background: currentView === 'dashboard' ? 'var(--color-bg-elevated)' : 'transparent',
              color: currentView === 'dashboard' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s', width: '100%', textAlign: 'left',
              fontWeight: currentView === 'dashboard' ? 500 : 400
            }}
          >
            <LayoutDashboard size={18} />
            Trámites
          </button>
          <button 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', 
              borderRadius: 'var(--radius-md)', background: 'transparent',
              color: 'var(--color-text-secondary)', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left'
            }}
          >
            <Users size={18} />
            Clientes
          </button>
          <button 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', 
              borderRadius: 'var(--radius-md)', background: 'transparent',
              color: 'var(--color-text-secondary)', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left'
            }}
          >
            <Search size={18} />
            Consultar
          </button>
        </nav>
        
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600 }}>
              AD
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>Admin</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Operaciones</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto', background: 'transparent' }}>
        {currentView === 'dashboard' && <HomeView onNavigateToClient={navigateToClient} />}
        {currentView === 'client' && <ClientView clientId={selectedClientId} onBack={navigateToHome} />}
      </main>

    </div>
  );
}

export default App;
