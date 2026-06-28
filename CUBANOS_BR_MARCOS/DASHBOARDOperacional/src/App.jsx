import { useState, useCallback, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Search,
  Bell,
  UserPlus,
  Sun,
  Moon,
  ArrowLeft,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import HomeView from './components/HomeView';
import ClientView from './components/ClientView';
import ClientListView from './components/ClientListView';
import NewClientModal from './components/NewClientModal';
import { GlobalAiChatProvider } from './context/GlobalAiChatContext';
import { GlobalAiChat } from './components/GlobalAiChat';
import { supabase } from './supabaseClient';
import { useTheme } from './context/ThemeContext';
import { useSession } from './hooks/useSession';
import { useNavigation } from './hooks/useNavigation';
import { useSearch } from './hooks/useSearch';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

function App() {
  // --- Auth ---
  const { session, loading } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  // --- Navigation (hash-based SPA routing) ---
  const {
    currentView,
    selectedClientId,
    navigateToClient,
    navigateToHome,
    navigateToClientsList,
  } = useNavigation(!!session);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Automatically close sidebar on client view
  useEffect(() => {
    if (currentView === 'client') {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [currentView]);

  // --- Search ---
  const onSearchStart = useCallback(() => {
    if (currentView === 'client') {
      navigateToClientsList();
    }
  }, [currentView, navigateToClientsList]);

  const { globalSearch, setGlobalSearch, handleSearchChange } = useSearch(onSearchStart);

  // --- Theme ---
  const { theme, toggleTheme } = useTheme();

  // --- New Client Modal ---
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

  // --- Login ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
    }
  };

  // --- Render ---
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--color-text-primary)' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--color-bg-canvas)' }}>
        <form onSubmit={handleLogin} style={{ background: 'var(--color-bg-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', width: '320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Iniciar Sesión</h2>
          {error && <div style={{ color: 'var(--color-error, #ef4444)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{error}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', padding: '0.75rem', fontWeight: 600 }}>Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <GlobalAiChatProvider selectedClientId={currentView === 'client' ? selectedClientId : null}>
      <ErrorBoundary>
        <div className="app-layout" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

          {/* Sidebar */}
          <aside style={{ 
              width: isSidebarOpen ? '240px' : '0px', 
              background: 'var(--color-bg-surface)', 
              borderRight: isSidebarOpen ? '1px solid var(--color-border)' : 'none', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'all 0.3s ease',
              overflow: 'hidden',
              opacity: isSidebarOpen ? 1 : 0
            }}>
            <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '240px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', background: 'var(--color-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} color="white" />
                </div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>OpDash</h1>
              </div>
              {currentView === 'client' && isSidebarOpen && (
                <button onClick={() => setIsSidebarOpen(false)} className="btn btn-ghost" style={{ padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Cerrar menú">
                  <X size={20} />
                </button>
              )}
            </div>

            <nav style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
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
                onClick={navigateToClientsList}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)', background: currentView === 'clients' ? 'var(--color-bg-elevated)' : 'transparent',
                  color: currentView === 'clients' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s', width: '100%', textAlign: 'left',
                  fontWeight: currentView === 'clients' ? 500 : 400
                }}
              >
                <Users size={18} />
                Clientes
              </button>
              <button
                onClick={() => setIsNewClientModalOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)', background: 'transparent',
                  color: 'var(--color-primary)', border: '1px solid var(--color-primary)', cursor: 'pointer', width: '100%', textAlign: 'left', marginTop: '1rem', justifyContent: 'center', fontWeight: 500
                }}
              >
                <UserPlus size={18} />
                Nuevo Cliente
              </button>
            </nav>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '240px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600 }}>
                  AD
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>Admin</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Operaciones</p>
                </div>
              </div>
              <button
                onClick={() => supabase.auth.signOut()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-md)', background: 'transparent',
                  color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', cursor: 'pointer', width: '100%', justifyContent: 'center', fontSize: '0.875rem'
                }}
              >
                Cerrar Sesión
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'transparent', overflow: 'hidden' }}>

              {/* Top Bar / Search */}
            <header style={{ height: '70px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', padding: '0 2.5rem', justifyContent: 'space-between', background: 'var(--color-bg-surface)', zIndex: 10, flexShrink: 0 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {currentView === 'client' && !isSidebarOpen && (
                  <button onClick={() => setIsSidebarOpen(true)} className="btn btn-ghost" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Abrir menú">
                    <Menu size={20} />
                  </button>
                )}
                {currentView === 'client' && !isSidebarOpen && (
                  <button onClick={navigateToHome} className="btn btn-ghost" style={{ paddingLeft: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowLeft size={18} /> Volver a Trámites
                  </button>
                )}
              </div>

              <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-full)', padding: '0.5rem 1rem', width: '400px', border: '1px solid var(--color-border)', maxWidth: '100%' }}>
                  <Search size={18} color="var(--color-text-muted)" style={{ marginRight: '0.5rem' }} />
                  <input
                    type="text"
                    placeholder="Buscar por cliente, CPF, email..."
                    value={globalSearch}
                    onChange={handleSearchChange}
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-text-primary)', width: '100%', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-ghost"
                  onClick={toggleTheme}
                  style={{ padding: '0.5rem' }}
                  title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                  {theme === 'dark' ? <Sun size={20} color="var(--color-text-secondary)" /> : <Moon size={20} color="var(--color-text-secondary)" />}
                </button>
                <button className="btn btn-ghost" style={{ padding: '0.5rem' }} aria-label="Notificaciones"><Bell size={20} color="var(--color-text-secondary)" /></button>
                <button className="btn btn-ghost" style={{ padding: '0.5rem' }} aria-label="Configuración"><Settings size={20} color="var(--color-text-secondary)" /></button>
              </div>
            </header>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: currentView === 'client' ? 'hidden' : 'auto' }}>
              {currentView === 'dashboard' && <HomeView onNavigateToClient={navigateToClient} onNavigateToClientsList={navigateToClientsList} searchQuery={globalSearch} />}
              {currentView === 'client' && <ClientView clientId={selectedClientId} onBack={navigateToHome} onNavigateToClient={navigateToClient} />}
              {currentView === 'clients' && <ClientListView onNavigateToClient={navigateToClient} searchQuery={globalSearch} />}
            </main>
          </div>

          {isNewClientModalOpen && (
            <NewClientModal
              onClose={() => setIsNewClientModalOpen(false)}
              onClientCreated={(client) => {
                setIsNewClientModalOpen(false);
                navigateToClient(client.id);
              }}
            />
          )}

          <GlobalAiChat isVisible={currentView !== 'client'} onNavigateToClient={navigateToClient} />
        </div>
      </ErrorBoundary>
    </GlobalAiChatProvider>
  );
}

export default App;
