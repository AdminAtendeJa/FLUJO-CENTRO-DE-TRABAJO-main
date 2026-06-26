// utils.js

(() => {
  function safeText(value) {
    return value === null || value === undefined ? '' : String(value);
  }

  function escapeHtml(value) {
    return safeText(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setStatus(state, text, owner = 'global') {
    const badge = document.getElementById('statusBadge');
    if (!badge) return;
    const activeView = window.__activeView || null;
    if (owner !== 'global' && activeView && owner !== activeView) return;
    badge.className = 'status-badge status-' + state;
    badge.textContent = text;
  }

  function fmt(n) {
    const value = Number(n) || 0;
    return 'R$ ' + Math.round(value).toLocaleString('pt-BR');
  }

  function norm(value) {
    return safeText(value).trim().toLowerCase();
  }

  function cls(value) {
    return value ? String(value).trim() : '';
  }

  window.DashboardUtils = { escapeHtml, safeText, setStatus, fmt, norm, cls };
  window.escapeHtml = escapeHtml;
  window.safeText = safeText;
  window.setStatus = setStatus;
  window.fmt = fmt;
  window.norm = norm;
  window.cls = cls;
})();
