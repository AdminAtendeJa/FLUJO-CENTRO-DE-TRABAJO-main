const cfg = window.SUPABASE_CONFIG || {};
const supabaseClient = window.supabase?.createClient && cfg.url && cfg.anonKey && !cfg.url.includes('__SUPABASE')
  ? window.supabase.createClient(cfg.url, cfg.anonKey)
  : null;

window.supabaseClient = supabaseClient;

const DASH_MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DASH_COLORS = ['#378ADD', '#1D9E75', '#D85A30', '#BA7517', '#7F77DD', '#888780', '#D4537E', '#639922', '#E24B4A', '#5DCAA5'];

const DEFAULT_COSTS = {
  labels: ['Marketing', 'Ventas', 'Pessoal', 'Estructura', 'Softwares', 'Otros'],
  values: [16742, 9937, 19900, 5481, 500, 2000],
  colors: ['#D85A30', '#BA7517', '#378ADD', '#7F77DD', '#1D9E75', '#888780'],
};

const DEFAULT_SERVICES = [
  { nombre: 'TRAD. CNH', valor: 120, cv: 74.1, lucro: 9.9, mc: 0.6175, roi: 0.09 },
  { nombre: 'AG. PF.', valor: 120, cv: 55.5, lucro: 28.5, mc: 0.4625, roi: 0.311 },
  { nombre: 'CAMB. END.', valor: 97, cv: 22.3, lucro: 45.6, mc: 0.23, roi: 0.887 },
  { nombre: 'DES. REF.', valor: 147, cv: 33.8, lucro: 69.1, mc: 0.23, roi: 0.887 },
  { nombre: 'PDF UNICO', valor: 147, cv: 33.8, lucro: 69.1, mc: 0.23, roi: 0.887 },
  { nombre: 'RES. PMT.', valor: 600, cv: 138, lucro: 282, mc: 0.23, roi: 0.887 },
  { nombre: 'VISA REU.', valor: 600, cv: 138, lucro: 282, mc: 0.23, roi: 0.887 },
  { nombre: 'SISCONARE', valor: 147, cv: 33.8, lucro: 69.1, mc: 0.23, roi: 0.887 },
  { nombre: 'CPF', valor: 80, cv: 18.4, lucro: 21.6, mc: 0.23, roi: 0.887 },
  { nombre: 'CURRICULO', valor: 60, cv: 13.8, lucro: 28.2, mc: 0.23, roi: 0.887 },
];

const DEFAULT_COLLABORATORS = [
  { nombre: 'Jessica', salario: 1900, comision: 1667 },
  { nombre: 'Solange', salario: 1900, comision: 1667 },
  { nombre: 'Eric', salario: 1900, comision: 1667 },
  { nombre: 'Jorge', salario: 1900, comision: 1000 },
  { nombre: 'Victor', salario: 1900, comision: 500 },
  { nombre: 'Angel', salario: 1900, comision: 2000 },
];

let dashboardRows = [];
let dashboardCharts = {};

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

function setStatus(state, text) {
  const badge = document.getElementById('statusBadge');
  if (!badge) return;
  badge.className = 'status-badge status-' + state;
  badge.textContent = text;
}

function fmt(n) {
  const value = Number(n) || 0;
  return 'R$ ' + Math.round(value).toLocaleString('pt-BR');
}

function pct(n) {
  const value = Number.isFinite(n) ? n : 0;
  return (value * 100).toFixed(1) + '%';
}

function norm(value) {
  return safeText(value).trim().toLowerCase();
}

function getDashYear() {
  return Number(cfg.ano) || new Date().getFullYear();
}

function getEntryMonth(row) {
  const explicit = Number(row.mes);
  if (explicit >= 1 && explicit <= 12) return explicit;
  const date = new Date(row.fecha || row.creado_en || row.created_at);
  return Number.isNaN(date.getTime()) ? 0 : date.getMonth() + 1;
}

function getEntryYear(row) {
  const explicit = Number(row.ano);
  if (explicit > 2000) return explicit;
  const date = new Date(row.fecha || row.creado_en || row.created_at);
  return Number.isNaN(date.getTime()) ? getDashYear() : date.getFullYear();
}

function getDashboardFilters() {
  return {
    mes: Number(document.getElementById('filtroMesDash')?.value || 0),
    atendente: document.getElementById('filtroAtendenteDash')?.value || 'todos',
  };
}

function filterDashboardRows() {
  const filters = getDashboardFilters();
  return dashboardRows.filter(row => {
    if (getEntryYear(row) !== getDashYear()) return false;
    if (filters.mes && getEntryMonth(row) !== filters.mes) return false;
    if (filters.atendente !== 'todos' && norm(row.atendente) !== norm(filters.atendente)) return false;
    return true;
  });
}

function completedRows(rows) {
  return rows.filter(row => {
    const status = norm(row.estado_tramite);
    return !status || status === 'completada' || status === 'completo' || status === 'finalizada';
  });
}

function buildMonthlyData(rows) {
  const entradas = Array(12).fill(0);
  completedRows(rows).forEach(row => {
    const month = getEntryMonth(row);
    if (month >= 1 && month <= 12) entradas[month - 1] += Number(row.valor) || 0;
  });

  const fixedCosts = DEFAULT_COSTS.values.reduce((sum, value) => sum + value, 0);
  const costs = entradas.map(value => value > 0 ? Math.round(value * 0.42) : 0);
  const hasRevenue = entradas.some(Boolean);
  if (!hasRevenue) {
    return {
      labels: DASH_MONTHS.slice(0, 5),
      entradas: [60086, 61156, 87179, 100309, 1535],
      costos: [35611, 39596, 47225, 58748, 0],
      lucro: [24475, 21560, 39833, 39935, 0],
    };
  }

  const activeMonths = entradas.filter(Boolean).length || 1;
  const sharedCost = fixedCosts / activeMonths;
  const adjustedCosts = costs.map((value, index) => entradas[index] > 0 ? value + sharedCost : 0);
  return {
    labels: DASH_MONTHS,
    entradas,
    costos: adjustedCosts,
    lucro: entradas.map((value, index) => value - adjustedCosts[index]),
  };
}

function sumValues(values) {
  return values.reduce((sum, value) => sum + (Number(value) || 0), 0);
}

function populateDashboardFilters() {
  const monthSelect = document.getElementById('filtroMesDash');
  const atendenteSelect = document.getElementById('filtroAtendenteDash');
  if (monthSelect && monthSelect.options.length <= 1) {
    DASH_MONTHS.forEach((month, index) => {
      const option = document.createElement('option');
      option.value = String(index + 1);
      option.textContent = month;
      monthSelect.appendChild(option);
    });
  }
  if (!atendenteSelect) return;
  const current = atendenteSelect.value;
  const atendentes = [...new Set(dashboardRows.map(row => safeText(row.atendente).trim()).filter(Boolean))].sort();
  atendenteSelect.innerHTML = '<option value="todos">Todos</option>';
  atendentes.forEach(atendente => {
    const option = document.createElement('option');
    option.value = atendente;
    option.textContent = atendente;
    option.selected = atendente === current;
    atendenteSelect.appendChild(option);
  });
}

function destroyChart(key) {
  if (dashboardCharts[key]) dashboardCharts[key].destroy();
}

function renderMetrics(monthly) {
  const filters = getDashboardFilters();
  const monthIndex = filters.mes - 1;
  const ent = filters.mes ? monthly.entradas[monthIndex] || 0 : sumValues(monthly.entradas);
  const cos = filters.mes ? monthly.costos[monthIndex] || 0 : sumValues(monthly.costos);
  const luc = ent - cos;
  const margin = ent > 0 ? luc / ent : 0;
  const inv = filters.mes ? (DEFAULT_COSTS.values[0] || 0) : DEFAULT_COSTS.values[0] * (monthly.entradas.some(Boolean) ? 1 : 0);
  const roas = inv > 0 ? ent / inv : 0;
  const metrics = [
    { label: 'Facturamiento', value: fmt(ent), sub: filters.mes ? DASH_MONTHS[monthIndex] : 'Acumulado ' + getDashYear() },
    { label: 'Costos totales', value: fmt(cos), sub: pct(ent > 0 ? cos / ent : 0) + ' del fact.' },
    { label: 'Lucro neto', value: fmt(luc), cls: luc >= 0 ? 'green' : 'red' },
    { label: 'Margen lucro', value: pct(margin), cls: margin >= 0.3 ? 'green' : 'amber' },
    { label: 'Inv. marketing', value: fmt(inv) },
    { label: 'ROAS', value: roas > 0 ? roas.toFixed(2) + 'x' : '-', cls: roas >= 6 ? 'green' : '' },
  ];
  document.getElementById('metricGrid').innerHTML = metrics.map(item => `
    <div class="metric">
      <div class="metric-label">${escapeHtml(item.label)}</div>
      <div class="metric-value ${item.cls || ''}">${escapeHtml(item.value)}</div>
      ${item.sub ? `<div class="metric-sub">${escapeHtml(item.sub)}</div>` : ''}
    </div>
  `).join('');
}

function renderMensual(monthly) {
  const canvas = document.getElementById('chartMensual');
  if (!canvas || !window.Chart) return;
  destroyChart('mensual');
  dashboardCharts.mensual = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: monthly.labels,
      datasets: [
        { label: 'Entradas', data: monthly.entradas, backgroundColor: '#378ADD', borderRadius: 3 },
        { label: 'Costos', data: monthly.costos, backgroundColor: '#D85A30', borderRadius: 3 },
        { label: 'Lucro', data: monthly.lucro, backgroundColor: '#1D9E75', borderRadius: 3 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 12 } } },
        y: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { font: { size: 11 }, callback: value => 'R$' + (value / 1000).toFixed(0) + 'k' } },
      },
    },
  });
}

function renderAtendente(rows) {
  const canvas = document.getElementById('chartAtendente');
  if (!canvas || !window.Chart) return;
  const totals = new Map();
  completedRows(rows).forEach(row => {
    const key = safeText(row.atendente).trim() || 'Sin atendente';
    totals.set(key, (totals.get(key) || 0) + (Number(row.valor) || 0));
  });
  const entries = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const labels = entries.length ? entries.map(([label]) => label) : ['Sin datos'];
  const values = entries.length ? entries.map(([, value]) => value) : [0];
  document.getElementById('legendAtendente').innerHTML = labels.map((label, index) =>
    `<span><span class="legend-dot" style="background:${DASH_COLORS[index % DASH_COLORS.length]}"></span>${escapeHtml(label)}</span>`
  ).join('');
  destroyChart('atendente');
  dashboardCharts.atendente = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Facturado', data: values, backgroundColor: DASH_COLORS, borderRadius: 3 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 12 } } },
        y: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { font: { size: 11 }, callback: value => 'R$' + (value / 1000).toFixed(0) + 'k' } },
      },
    },
  });
}

function renderServicio(rows) {
  const canvas = document.getElementById('chartServicio');
  if (!canvas || !window.Chart) return;
  const totals = new Map();
  completedRows(rows).forEach(row => {
    const key = safeText(row.servicio).trim() || 'Otros';
    totals.set(key, (totals.get(key) || 0) + (Number(row.valor) || 0));
  });
  const entries = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const labels = entries.length ? entries.map(([label]) => label) : DEFAULT_SERVICES.slice(0, 5).map(item => item.nombre);
  const values = entries.length ? entries.map(([, value]) => value) : DEFAULT_SERVICES.slice(0, 5).map(item => item.valor);
  const total = sumValues(values) || 1;
  document.getElementById('legendServicio').innerHTML = labels.slice(0, 5).map((label, index) =>
    `<span><span class="legend-dot" style="background:${DASH_COLORS[index]}"></span>${escapeHtml(label)} ${pct(values[index] / total)}</span>`
  ).join('');
  destroyChart('servicio');
  dashboardCharts.servicio = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: DASH_COLORS, borderWidth: 1, borderColor: 'transparent' }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '60%' },
  });
}

function renderCostos() {
  const canvas = document.getElementById('chartCostos');
  if (!canvas || !window.Chart) return;
  const total = sumValues(DEFAULT_COSTS.values) || 1;
  document.getElementById('legendCostos').innerHTML = DEFAULT_COSTS.labels.map((label, index) =>
    `<span><span class="legend-dot" style="background:${DEFAULT_COSTS.colors[index]}"></span>${escapeHtml(label)} ${pct(DEFAULT_COSTS.values[index] / total)}</span>`
  ).join('');
  destroyChart('costos');
  dashboardCharts.costos = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: { labels: DEFAULT_COSTS.labels, datasets: [{ data: DEFAULT_COSTS.values, backgroundColor: DEFAULT_COSTS.colors, borderWidth: 1, borderColor: 'transparent' }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '60%' },
  });
}

function renderMarketing(monthly) {
  const filters = getDashboardFilters();
  const monthIndex = filters.mes - 1;
  const revenue = filters.mes ? monthly.entradas[monthIndex] || 0 : sumValues(monthly.entradas);
  const investment = DEFAULT_COSTS.values[0] || 0;
  const leads = Math.round(revenue / 35);
  const sales = completedRows(filterDashboardRows()).length;
  const cpl = leads > 0 ? investment / leads : 0;
  const cac = sales > 0 ? investment / sales : 0;
  const items = [
    { label: 'Inversion total', value: fmt(investment) },
    { label: 'Leads', value: leads > 0 ? leads.toLocaleString('pt-BR') : '-' },
    { label: 'Ventas nuevas', value: sales > 0 ? String(sales) : '-' },
    { label: 'CPL', value: cpl > 0 ? 'R$' + cpl.toFixed(2) : '-' },
    { label: 'CAC', value: cac > 0 ? 'R$' + cac.toFixed(2) : '-' },
    { label: 'ROAS', value: investment > 0 ? (revenue / investment).toFixed(2) + 'x' : '-' },
  ];
  document.getElementById('marketingMetrics').innerHTML = items.map(item => `
    <div class="metric">
      <div class="metric-label">${escapeHtml(item.label)}</div>
      <div class="metric-value" style="font-size:18px">${escapeHtml(item.value)}</div>
    </div>
  `).join('');
}

function renderTables(rows) {
  const serviceRows = DEFAULT_SERVICES.map(service => {
    const total = completedRows(rows)
      .filter(row => {
        const serviceName = norm(row.servicio);
        return serviceName && (serviceName.includes(norm(service.nombre)) || norm(service.nombre).includes(serviceName));
      })
      .reduce((sum, row) => sum + (Number(row.valor) || 0), 0);
    const valor = total || service.valor;
    const cost = total ? valor * 0.23 : service.cv;
    const profit = total ? valor - cost : service.lucro;
    const margin = valor > 0 ? cost / valor : service.mc;
    const roi = cost > 0 ? profit / cost : service.roi;
    return { nombre: service.nombre, valor, cost, profit, margin, roi };
  });
  document.getElementById('tablaServicios').innerHTML = serviceRows.map(service => `
    <tr>
      <td>${escapeHtml(service.nombre)}</td>
      <td>${fmt(service.valor)}</td>
      <td>${fmt(service.cost)}</td>
      <td style="color:#1D9E75; font-weight:500">${fmt(service.profit)}</td>
      <td><span class="badge ${service.margin >= 0.4 ? 'badge-green' : 'badge-amber'}">${pct(service.margin)}</span></td>
      <td>${pct(service.roi)}</td>
    </tr>
  `).join('');

  document.getElementById('tablaColaboradores').innerHTML = DEFAULT_COLLABORATORS.map(item => {
    const total = item.salario + item.comision;
    return `<tr>
      <td style="font-weight:500">${escapeHtml(item.nombre)}</td>
      <td>${fmt(item.salario)}</td>
      <td>${fmt(item.comision)}</td>
      <td style="font-weight:500">${fmt(total)}</td>
    </tr>`;
  }).join('');
}

function renderActivity(rows) {
  const activityFeed = document.getElementById('activityFeed');
  const recent = rows.slice(0, 8);
  if (!recent.length) {
    activityFeed.innerHTML = '<div style="text-align:center; color:#94A3B8; padding:20px;">Sin actividad reciente.</div>';
    return;
  }
  activityFeed.innerHTML = recent.map(row => {
    const date = new Date(row.creado_en || row.fecha || row.created_at);
    const when = Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-CL');
    return `<div class="activity-item">
      <div class="activity-icon">R$</div>
      <div>
        <div class="activity-text">${escapeHtml(row.cliente || 'Cliente')} - ${escapeHtml(row.servicio || 'Entrada')} por ${escapeHtml(fmt(row.valor))}</div>
        <div class="activity-time">${escapeHtml(when)}</div>
      </div>
    </div>`;
  }).join('');
}

function actualizar() {
  const rows = filterDashboardRows();
  const monthly = buildMonthlyData(rows.length ? rows : dashboardRows);
  renderMetrics(monthly);
  renderMarketing(monthly);
  renderAtendente(rows);
  renderServicio(rows);
  renderTables(rows);
  renderActivity(rows);
}

window.actualizar = actualizar;

async function fetchDashboardRows() {
  if (!supabaseClient) {
    setStatus('error', 'Configura Supabase en config.js');
    return;
  }
  try {
    setStatus('loading', 'Cargando dashboard...');
    const { data, error } = await supabaseClient
      .from('entradas')
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(10000);
    if (error) throw error;
    dashboardRows = data || [];
    populateDashboardFilters();
    actualizar();
    setStatus('live', 'Conectado');
  } catch (error) {
    console.error('fetchDashboardRows error:', error);
    setStatus('error', error?.message || 'Error al cargar dashboard');
    actualizar();
  }
}

function initDashboard() {
  const yearLabel = document.getElementById('anoLabel');
  if (yearLabel) yearLabel.textContent = String(getDashYear());
  document.getElementById('filtroMesDash')?.addEventListener('change', actualizar);
  document.getElementById('filtroAtendenteDash')?.addEventListener('change', actualizar);
  populateDashboardFilters();
  renderCostos();
  actualizar();
  fetchDashboardRows();
}

function createButton({ text, type = 'primary', onClick, disabled = false, loading = false }) {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.className = 'button ' + type;
  btn.disabled = disabled;
  if (loading) {
    btn.classList.add('loading');
  }
  if (onClick) {
    btn.addEventListener('click', onClick);
  }
  return btn;
}

function addButtonEvent(button, handler) {
  if (!button) return;
  button.addEventListener('click', handler);
}

function removeButtonEvent(button, handler) {
  if (!button) return;
  button.removeEventListener('click', handler);
}

function setupDashboardButtons() {
  const mesFilter = document.getElementById('filtroMesDash');
  const atendenteFilter = document.getElementById('filtroAtendenteDash');
  if (mesFilter) {
    mesFilter.addEventListener('change', actualizar);
  }
  if (atendenteFilter) {
    atendenteFilter.addEventListener('change', actualizar);
  }
}

function initDashboard() {
  const yearLabel = document.getElementById('anoLabel');
  if (yearLabel) yearLabel.textContent = String(getDashYear());
  populateDashboardFilters();
  renderCostos();
  actualizar();
  fetchDashboardRows();
  setupDashboardButtons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
