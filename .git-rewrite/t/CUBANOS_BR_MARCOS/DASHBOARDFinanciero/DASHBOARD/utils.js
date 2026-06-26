// utils.js

function escapeHtml(value) {
    return (value || '').toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;'); // Escapar comillas simples
}

function safeText(value) {
    return value === null || value === undefined ? '' : String(value);
}

function setStatus(state, text) {
    const badge = document.getElementById('statusBadge');
    if (!badge) return;
    badge.className = 'status-badge status-' + state;
    badge.textContent = text;
}

function fmt(n) {
    return 'R$ ' + Math.round(n).toLocaleString('pt-BR');
}

function norm(s) {
    return (s || '').toString().trim().toLowerCase();
}
