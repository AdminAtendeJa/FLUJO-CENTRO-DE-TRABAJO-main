// router.js

function handleRouting() {
  // Get hash or default to dashboard
  let hash = window.location.hash || '#dashboard';
  
  // Clean hash if it has extra characters
  if (hash.startsWith('#')) {
    hash = hash.substring(1);
  }

  // Define allowed routes
  const allowedRoutes = ['dashboard', 'entradas', 'clientes', 'gastos'];
  if (!allowedRoutes.includes(hash)) {
    hash = 'dashboard';
  }

  // Hide all views and show the active one
  document.querySelectorAll('.spa-view').forEach(view => {
    view.classList.remove('active');
  });
  const activeView = document.getElementById(`view-${hash}`);
  if (activeView) {
    activeView.classList.add('active');
  }
  window.__activeView = hash;

  // Update navigation links in appNav
  document.querySelectorAll('#appNav a').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${hash}`) {
      link.classList.add('active');
    }
  });

  // Update quick access links
  document.querySelectorAll('.quick-access a').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${hash}`) {
      link.classList.add('active');
    }
  });

  // Update page title context
  const titles = {
    'dashboard': 'Dashboard Financiero',
    'entradas': 'Entradas / Trámites',
    'clientes': 'Clientes',
    'gastos': 'Gastos'
  };
  
  const pageTitle = document.getElementById('pageTitleText');
  const pageSubtitle = document.getElementById('pageSubtitleText');

  if (pageTitle && pageSubtitle) {
    if (hash === 'dashboard') {
      pageSubtitle.textContent = 'Business intelligence';
      const ano = window.SUPABASE_CONFIG?.ano || new Date().getFullYear();
      pageTitle.innerHTML = `Plataforma Cubanos BR — <span id="anoLabel">${ano}</span>`;
    } else if (hash === 'entradas') {
      pageSubtitle.textContent = 'Gestión de trámites';
      pageTitle.textContent = 'Entradas / Trámites';
    } else if (hash === 'clientes') {
      pageSubtitle.textContent = 'Edición de clientes';
      pageTitle.textContent = 'Clientes Supabase';
    } else if (hash === 'gastos') {
      pageSubtitle.textContent = 'Control de egresos';
      pageTitle.textContent = 'Gastos';
    }
  }

  // If we need specific initialization per view, we can trigger custom events
  const event = new CustomEvent('viewChanged', { detail: { view: hash } });
  document.dispatchEvent(event);
}

// Listen to hash changes
window.addEventListener('hashchange', handleRouting);

// Initial route setup on load
document.addEventListener('DOMContentLoaded', () => {
  handleRouting();
});
