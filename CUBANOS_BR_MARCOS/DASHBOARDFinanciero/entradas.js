(() => {
const { escapeHtml, safeText, setStatus: rawSetStatus, norm } = window.DashboardUtils || {};
const setStatus = (state, text) => rawSetStatus?.(state, text, 'entradas');
const cfg = window.SUPABASE_CONFIG || {};
const supabaseClient = window.supabaseClient || (
  window.supabase?.createClient && cfg.url && cfg.anonKey && !cfg.url.includes('__SUPABASE')
    ? window.supabase.createClient(cfg.url, cfg.anonKey)
    : null
);

const ENTRY_EDITABLE = [
  { name: 'cliente', label: 'Cliente', type: 'text' },
  { name: 'nombre_pix', label: 'Nombre PIX', type: 'text' },
  { name: 'servicio', label: 'Servicio', type: 'text' },
  { name: 'valor', label: 'Valor (R$)', type: 'number' },
  { name: 'atendente', label: 'Atendente', type: 'text' },
  { name: 'operario', label: 'Operario', type: 'text' },
  { name: 'estado_tramite', label: 'Estado Trámite', type: 'select', options: ['pendiente', 'procesando', 'completada', 'cancelada'] },
  { name: 'fecha_completacion', label: 'Fecha Completación', type: 'date' },
  { name: 'telefono', label: 'Teléfono', type: 'text' },
  { name: 'email', label: 'Email', type: 'text' },
  { name: 'pais', label: 'País', type: 'text' },
  { name: 'estado', label: 'Estado (UF)', type: 'select_geo_estado' },
  { name: 'ciudad', label: 'Ciudad', type: 'select_geo_ciudad' },
  { name: 'recorrencia', label: 'Recurrencia', type: 'text' },
  { name: 'cpf', label: 'CPF', type: 'text' },
  { name: 'observaciones', label: 'Observaciones', type: 'textarea' },
];
const LOCKED_CLIENT_FIELDS = ['cliente', 'email', 'cpf', 'pais', 'estado', 'ciudad'];
const UPPERCASE_FIELDS = new Set(['cliente', 'email', 'cpf', 'pais', 'estado', 'ciudad', 'telefono']);

let entradas = [];
let activeTabEntradas = 'todas';
let editModalData = null;
let historialState = null;
const ENTRADAS_PAGE_SIZE = 1000;
let currentEntradasPage = 1;
let entradasTotalCount = 0;
let entradasTotalPages = 1;
let entradasFetchToken = 0;
let pendingEntradasTotal = 0;
let pipelineEntradasTotal = 0;
let estadosBr = [];
let cidadesByUf = new Map();
let telefonoMatchesEntradas = [];
let selectedTelefonoMatchId = null;

function fmtDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateForInput(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function fmtValor(value) {
  const number = Number(value);
  return Number.isNaN(number) ? '—' : 'R$ ' + Math.round(number).toLocaleString('pt-BR');
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(String(value).replace(/[^0-9.,-]/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function toUpperValue(value) {
  const text = safeText(value).trim();
  return text ? text.toUpperCase() : '';
}

function normalizeEntradaField(field, value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (UPPERCASE_FIELDS.has(field)) return trimmed.toUpperCase();
  return trimmed;
}

async function loadGeoCatalogEntradas() {
  try {
    const { data: states, error: statesError } = await supabaseClient
      .from('estados_br')
      .select('uf, nome')
      .eq('ativo', true)
      .order('nome', { ascending: true });
    if (statesError) throw statesError;

    const { data: cities, error: citiesError } = await supabaseClient
      .from('cidades_br')
      .select('nome, uf')
      .eq('ativo', true)
      .order('nome', { ascending: true });
    if (citiesError) throw citiesError;

    estadosBr = states || [];
    cidadesByUf = new Map();
    (cities || []).forEach(city => {
      const uf = toUpperValue(city.uf);
      const list = cidadesByUf.get(uf) || [];
      list.push(toUpperValue(city.nome));
      cidadesByUf.set(uf, list);
    });
  } catch (error) {
    console.warn('No se pudo cargar catálogo geográfico en entradas:', error?.message || error);
  }
}

function validateEstadoCiudadEntrada(payload) {
  const uf = toUpperValue(payload.estado);
  const cidade = toUpperValue(payload.ciudad);
  if (!uf || !cidade || !estadosBr.length) return true;
  const validUf = estadosBr.some(item => toUpperValue(item.uf) === uf);
  if (!validUf) return false;
  const cities = cidadesByUf.get(uf) || [];
  return cities.includes(cidade);
}

function entryMonth(row) {
  const explicit = Number(row.mes);
  if (explicit >= 1 && explicit <= 12) return explicit;
  const date = new Date(row.fecha || row.creado_en || row.created_at);
  return Number.isNaN(date.getTime()) ? 0 : date.getMonth() + 1;
}

function entryYear(row) {
  const explicit = Number(row.ano);
  if (explicit > 2000) return explicit;
  const date = new Date(row.fecha || row.creado_en || row.created_at);
  return Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
}

function estadoBadge(estado) {
  const key = norm(estado) || 'pendiente';
  const labels = {
    pendiente: '🔴 Pendiente',
    procesando: '🟡 Procesando',
    completada: '🟢 Completada',
    cancelada: '⚫ Cancelada',
  };
  const safeClass = Object.prototype.hasOwnProperty.call(labels, key) ? key : 'pendiente';
  return `<span class="badge-estado badge-${safeClass}">${escapeHtml(labels[key] || key)}</span>`;
}

function getFilters() {
  return {
    search: (document.getElementById('searchInputEntradas')?.value || '').toLowerCase().trim(),
    mes: parseInt(document.getElementById('filtroMesEntradas')?.value || '0', 10),
    atendente: document.getElementById('filtroAtendenteEntradas')?.value || 'todos',
  };
}

function getEntradasYearBounds() {
  const year = Number(window.SUPABASE_CONFIG?.ano) || new Date().getFullYear();
  return {
    year,
    start: new Date(Date.UTC(year, 0, 1)).toISOString(),
    end: new Date(Date.UTC(year + 1, 0, 1)).toISOString(),
  };
}

function getEntradasPageBounds(page) {
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * ENTRADAS_PAGE_SIZE;
  return { from, to: from + ENTRADAS_PAGE_SIZE - 1 };
}

function applyEntradasFilters(query, filters, includeActiveTab = true) {
  const { start, end } = getEntradasYearBounds();
  let next = query.gte('creado_en', start).lt('creado_en', end);

  if (includeActiveTab && activeTabEntradas !== 'todas') {
    next = next.eq('estado_tramite', activeTabEntradas);
  }

  if (filters.mes > 0) {
    const year = Number(window.SUPABASE_CONFIG?.ano) || new Date().getFullYear();
    const monthStart = new Date(Date.UTC(year, filters.mes - 1, 1)).toISOString();
    const monthEnd = new Date(Date.UTC(year, filters.mes, 1)).toISOString();
    next = next.gte('creado_en', monthStart).lt('creado_en', monthEnd);
  }

  if (filters.atendente !== 'todos') {
    next = next.eq('atendente', filters.atendente);
  }

  if (filters.search) {
    const term = filters.search.replace(/[%(),]/g, ' ').trim();
    if (term) {
      next = next.or([
        `cliente.ilike.%${term}%`,
        `telefono.ilike.%${term}%`,
        `nombre_pix.ilike.%${term}%`,
        `servicio.ilike.%${term}%`,
        `atendente.ilike.%${term}%`,
        `operario.ilike.%${term}%`,
        `observaciones.ilike.%${term}%`,
        `estado_tramite.ilike.%${term}%`,
      ].join(','));
    }
  }

  return next;
}

function renderPendingTabCount() {
  const pendingTab = document.querySelector('.tabs-4 .tab[data-tab="pendiente"]');
  if (!pendingTab) return;
  pendingTab.textContent = `🔴 Pendientes (${pendingEntradasTotal})`;
}

async function fetchPendingCount(filters) {
  if (activeTabEntradas === 'pendiente') return entradasTotalCount;
  const query = applyEntradasFilters(
    supabaseClient.from('entradas').select('id', { count: 'exact', head: true }).eq('estado_tramite', 'pendiente'),
    filters,
    false
  );
  const { count, error } = await query;
  if (error) throw error;
  return Number(count || 0);
}

async function fetchEntradasSumByStatus(filters, statuses) {
  const pageSize = 1000;
  let from = 0;
  let totalRows = 0;
  let total = 0;

  while (true) {
    const query = applyEntradasFilters(
      supabaseClient
        .from('entradas')
        .select('valor', { count: 'exact' })
        .in('estado_tramite', statuses),
      filters,
      false
    ).range(from, from + pageSize - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    if (from === 0) totalRows = Number(count || 0);
    const rows = data || [];
    total += rows.reduce((sum, row) => sum + (Number(row.valor) || 0), 0);

    if (!rows.length || (from + rows.length) >= totalRows) break;
    from += pageSize;
  }

  return total;
}

function renderEntradasPagination() {
  const paginationContainer = document.getElementById('paginationEntradas');
  if (!paginationContainer) return;

  const totalPages = Math.max(1, entradasTotalPages || Math.ceil((entradasTotalCount || 0) / ENTRADAS_PAGE_SIZE) || 1);
  const hasRows = entradasTotalCount > 0 && entradas.length > 0;
  const startItem = hasRows ? ((currentEntradasPage - 1) * ENTRADAS_PAGE_SIZE) + 1 : 0;
  const endItem = hasRows ? Math.min(startItem + entradas.length - 1, entradasTotalCount) : 0;
  const statusText = entradasTotalCount > 0
    ? `Página ${currentEntradasPage} de ${totalPages} · ${startItem}-${endItem} de ${entradasTotalCount}`
    : 'Sin registros';

  paginationContainer.innerHTML = `
    <button type="button" class="page-button" data-page-nav="prev" ${currentEntradasPage <= 1 ? 'disabled' : ''}>Anterior</button>
    <span class="page-status" style="align-self:center; padding:0 12px; color:#475569; font-size:13px;">${escapeHtml(statusText)}</span>
    <button type="button" class="page-button" data-page-nav="next" ${currentEntradasPage >= totalPages ? 'disabled' : ''}>Siguiente</button>
  `;
}

function buildEntradasQuery() {
  const filters = getFilters();
  let query = applyEntradasFilters(
    supabaseClient
    .from('entradas')
    .select('*', { count: 'exact' })
    .order('creado_en', { ascending: false, nullsFirst: false }),
    filters,
    true
  );

  return query;
}

async function fetchEntradasPage(page = currentEntradasPage) {
  const requestToken = ++entradasFetchToken;
  const targetPage = Math.max(1, page);
  const { from, to } = getEntradasPageBounds(targetPage);

  try {
    setStatus('loading', 'Cargando entradas...');
    const { data, error, count } = await buildEntradasQuery().range(from, to);
    if (requestToken !== entradasFetchToken) return;
    if (error) throw error;

    entradas = data || [];
    entradasTotalCount = Number(count || 0);
    entradasTotalPages = Math.max(1, Math.ceil(entradasTotalCount / ENTRADAS_PAGE_SIZE));
    currentEntradasPage = Math.min(targetPage, entradasTotalPages);

    if (targetPage > entradasTotalPages && entradasTotalCount > 0) {
      await fetchEntradasPage(entradasTotalPages);
      return;
    }

    const filters = getFilters();
    pendingEntradasTotal = await fetchPendingCount(filters);
    pipelineEntradasTotal = await fetchEntradasSumByStatus(filters, ['pendiente', 'procesando']);

    populateAtendenteFilter();
    renderPendingTabCount();
    renderSummary();
    renderTableEntradas();
    setStatus('live', 'Conectado');
  } catch (error) {
    if (requestToken === entradasFetchToken) {
      console.error('fetchEntradas error:', error);
      setStatus('error', error?.message || 'Error al cargar entradas');
    }
  }
}

function refreshEntradasPage(page = currentEntradasPage) {
  return fetchEntradasPage(page);
}

function goToEntradasPage(page) {
  const totalPages = Math.max(1, entradasTotalPages || 1);
  const targetPage = Math.min(Math.max(1, page), totalPages);
  currentEntradasPage = targetPage;
  refreshEntradasPage(targetPage);
}

function filterEntradas() {
  return [...entradas];
}

function renderSummary() {
  const total = entradasTotalCount;
  const pendientes = pendingEntradasTotal;
  const procesando = entradas.filter(row => norm(row.estado_tramite) === 'procesando').length;
  const completadas = entradas.filter(row => norm(row.estado_tramite) === 'completada').length;
  const canceladas = entradas.filter(row => norm(row.estado_tramite) === 'cancelada').length;
  const valorTotal = entradas.filter(row => norm(row.estado_tramite) === 'completada').reduce((sum, row) => sum + (Number(row.valor) || 0), 0);
  const valorPipeline = pipelineEntradasTotal;
  const tasaComp = total > 0 ? ((completadas / total) * 100).toFixed(1) : '0.0';

  const cards = [
    { label: 'Total entradas', value: total },
    { label: 'Pendientes', value: pendientes, cls: pendientes > 0 ? 'red' : '' },
    { label: 'Procesando', value: procesando, cls: procesando > 0 ? 'amber' : '' },
    { label: 'Completadas', value: completadas, cls: 'green' },
    { label: 'Valor completado', value: fmtValor(valorTotal), cls: 'green' },
    { label: 'Pipeline', value: fmtValor(valorPipeline), cls: 'amber' },
    { label: 'Tasa completación', value: tasaComp + '%', cls: Number(tasaComp) >= 70 ? 'green' : 'amber' },
    { label: 'Canceladas', value: canceladas },
  ];

  const summaryGrid = document.getElementById('summaryGrid');
  if (summaryGrid) {
    summaryGrid.innerHTML = cards.map(card => `
      <div class="summary-card">
        <div class="summary-label">${escapeHtml(card.label)}</div>
        <div class="summary-value ${card.cls || ''}">${escapeHtml(card.value)}</div>
      </div>
    `).join('');
  }
}

function renderTableEntradas() {
  const container = document.getElementById('entradasTabla');
  if (!container) return;

  const rows = filterEntradas();
  if (!rows.length) {
    container.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:24px; color:#6b6b6b;">No se encontraron entradas para esta vista.</td></tr>';
    renderEntradasPagination();
    return;
  }

  container.innerHTML = rows.map(row => `
    <tr data-id="${escapeHtml(row.id)}">
      <td>${escapeHtml(fmtDate(row.fecha || row.fecha_completacion || row.creado_en))}</td>
      <td style="font-weight:500">${escapeHtml(row.cliente || '—')}</td>
      <td>${escapeHtml(row.telefono || '—')}</td>
      <td>${escapeHtml(row.nombre_pix || '—')}</td>
      <td>${escapeHtml(row.servicio || '—')}</td>
      <td>${escapeHtml(fmtValor(row.valor))}</td>
      <td>${escapeHtml(row.atendente || '—')}</td>
      <td>${estadoBadge(row.estado_tramite)}</td>
      <td>${escapeHtml(row.operario || '—')}</td>
      <td class="actions-cell">
        <button type="button" class="button secondary" data-action="edit" data-id="${escapeHtml(row.id)}">Editar</button>
        <button type="button" class="button secondary" data-action="history" data-id="${escapeHtml(row.id)}">Historial</button>
        <button type="button" class="button danger" data-action="delete" data-id="${escapeHtml(row.id)}">Borrar</button>
      </td>
    </tr>
  `).join('');
  renderEntradasPagination();
}

function populateAtendenteFilter() {
  const select = document.getElementById('filtroAtendenteEntradas');
  if (!select) return;
  const current = select.value;
  const atendentes = [...new Set(entradas.map(row => safeText(row.atendente).trim()).filter(Boolean))].sort();
  select.innerHTML = '<option value="todos">Todos atendentes</option>';
  atendentes.forEach(atendente => {
    const option = document.createElement('option');
    option.value = atendente;
    option.textContent = atendente;
    option.selected = atendente === current;
    select.appendChild(option);
  });
}

function refreshCiudadOptionsEntrada(selectedCity = '') {
  const estadoSelect = document.getElementById('modal_estado');
  const ciudadSelect = document.getElementById('modal_ciudad');
  if (!estadoSelect || !ciudadSelect) return;
  const uf = toUpperValue(estadoSelect.value);
  const cities = cidadesByUf.get(uf) || [];
  ciudadSelect.innerHTML = '<option value="">Seleccione ciudad</option>' + cities.map(city => {
    const selected = toUpperValue(selectedCity) === city ? 'selected' : '';
    return `<option value="${escapeHtml(city)}" ${selected}>${escapeHtml(city)}</option>`;
  }).join('');
}

function setEntradaFieldsLocked(locked) {
  LOCKED_CLIENT_FIELDS.forEach(field => {
    const element = document.getElementById(`modal_${field}`);
    if (!element) return;
    if (element.tagName === 'SELECT') {
      element.disabled = locked;
    } else {
      element.readOnly = locked;
      element.classList.toggle('readonly', locked);
    }
  });
}

function applyMatchedClienteToEntrada(cliente) {
  if (!cliente) return;
  const patch = {
    cliente: toUpperValue(cliente.nombre),
    email: toUpperValue(cliente.email),
    cpf: toUpperValue(cliente.cpf),
    pais: 'BRASIL',
    estado: toUpperValue(cliente.estado || cliente.estado_federal),
    ciudad: toUpperValue(cliente.ciudad),
  };
  Object.entries(patch).forEach(([field, value]) => {
    const element = document.getElementById(`modal_${field}`);
    if (!element) return;
    element.value = value || '';
  });
  refreshCiudadOptionsEntrada(patch.ciudad);
  selectedTelefonoMatchId = Number(cliente.id);
  setEntradaFieldsLocked(true);
}

function clearMatchedClienteInEntrada() {
  selectedTelefonoMatchId = null;
  setEntradaFieldsLocked(false);
}

function renderTelefonoMatchesEntradas(matches) {
  const info = document.getElementById('telefonoMatchInfo');
  const select = document.getElementById('telefonoMatchSelect');
  if (!info || !select) return;

  if (!matches.length) {
    info.textContent = 'Sin coincidencias de teléfono.';
    select.style.display = 'none';
    select.innerHTML = '';
    clearMatchedClienteInEntrada();
    return;
  }

  if (matches.length === 1) {
    info.textContent = 'Cliente encontrado y vinculado automáticamente.';
    select.style.display = 'none';
    select.innerHTML = '';
    applyMatchedClienteToEntrada(matches[0]);
    return;
  }

  info.textContent = `Se encontraron ${matches.length} clientes. Selecciona uno para continuar.`;
  select.style.display = 'block';
  select.innerHTML = `<option value="">Seleccione cliente</option>` + matches.map(item => `
    <option value="${escapeHtml(item.id)}">${escapeHtml(toUpperValue(item.nombre))} · ${escapeHtml(toUpperValue(item.cpf || '-'))} · ${escapeHtml(toUpperValue(item.email || '-'))}</option>
  `).join('');
  clearMatchedClienteInEntrada();
}

async function lookupClienteByTelefonoEntrada(phone) {
  const normalizedPhone = toUpperValue(phone);
  if (!normalizedPhone) {
    renderTelefonoMatchesEntradas([]);
    telefonoMatchesEntradas = [];
    return;
  }

  const { data, error } = await supabaseClient
    .from('clientes')
    .select('id, nombre, email, cpf, pais, estado, estado_federal, ciudad')
    .eq('telefono', normalizedPhone)
    .order('creado_en', { ascending: false, nullsFirst: false })
    .limit(20);
  if (error) throw error;

  telefonoMatchesEntradas = data || [];
  renderTelefonoMatchesEntradas(telefonoMatchesEntradas);
}

function renderEditForm(record) {
  const form = document.getElementById('editFormFieldsEntradas');
  if (!form) return;

  const lookupBox = `
    <div class="modal-field" style="grid-column: 1 / -1;">
      <label class="modal-label">Coincidencia por teléfono</label>
      <div id="telefonoMatchInfo" style="font-size:12px; color:#64748B;">Sin búsqueda</div>
      <select id="telefonoMatchSelect" class="editable-input" style="display:none;"></select>
    </div>
  `;

  const html = ENTRY_EDITABLE.map(field => {
    const value = record[field.name];
    let input = '';

    if (field.type === 'select') {
      const options = field.options.map(option => `
        <option value="${option}" ${norm(value) === option ? 'selected' : ''}>${option.charAt(0).toUpperCase() + option.slice(1)}</option>
      `).join('');
      input = `<select id="modal_${field.name}" name="${field.name}">${options}</select>`;
    } else if (field.type === 'select_geo_estado') {
      const options = ['<option value="">Seleccione estado</option>'].concat(
        estadosBr.map(item => {
          const uf = toUpperValue(item.uf);
          const selected = toUpperValue(value) === uf ? 'selected' : '';
          return `<option value="${escapeHtml(uf)}" ${selected}>${escapeHtml(uf)} - ${escapeHtml(item.nome)}</option>`;
        })
      ).join('');
      input = `<select id="modal_${field.name}" name="${field.name}">${options}</select>`;
    } else if (field.type === 'select_geo_ciudad') {
      input = `<select id="modal_${field.name}" name="${field.name}"><option value="">Seleccione ciudad</option></select>`;
    } else if (field.type === 'textarea') {
      input = `<textarea id="modal_${field.name}" name="${field.name}">${escapeHtml(value)}</textarea>`;
    } else if (field.type === 'date') {
      input = `<input id="modal_${field.name}" name="${field.name}" type="date" value="${escapeHtml(fmtDateForInput(value))}">`;
    } else if (field.type === 'number') {
      input = `<input id="modal_${field.name}" name="${field.name}" type="number" step="0.01" value="${escapeHtml(value)}">`;
    } else {
      input = `<input id="modal_${field.name}" name="${field.name}" type="text" value="${escapeHtml(value)}">`;
    }

    return `
      <div class="modal-field">
        <label class="modal-label" for="modal_${field.name}">${field.label}</label>
        ${input}
      </div>
    `;
  }).join('');

  form.innerHTML = `<div class="modal-grid-2">${lookupBox}${html}</div>`;
  refreshCiudadOptionsEntrada(record.ciudad || '');
}

function openEntryModal(record, isNew = false) {
  telefonoMatchesEntradas = [];
  selectedTelefonoMatchId = null;
  editModalData = isNew ? { isNew: true } : { id: record.id, record, selectedClientId: record.id_cliente || null };
  const title = document.getElementById('editModalTitleEntradas');
  if (title) title.textContent = isNew ? 'Nueva Entrada' : `Editar: ${safeText(record?.servicio) || 'Entrada'} — ${safeText(record?.cliente) || 'Sin cliente'}`;
  renderEditForm(record || {});
  if (!isNew && record?.id_cliente) {
    selectedTelefonoMatchId = Number(record.id_cliente);
    setEntradaFieldsLocked(true);
    const info = document.getElementById('telefonoMatchInfo');
    if (info) info.textContent = 'Cliente vinculado desde la entrada.';
  }

  const modal = document.getElementById('editModalEntradas');
  if (modal) {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }
}

function closeEditModal() {
  const modal = document.getElementById('editModalEntradas');
  if (modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }
  editModalData = null;
  telefonoMatchesEntradas = [];
  selectedTelefonoMatchId = null;
}

function renderTramitesPanel(record) {
  const body = document.getElementById('historialTramitesBody');
  if (!body) return;

  const clientId = record?.id_cliente || record?.cliente_id || null;
  const relatedRows = clientId
    ? (record?.__relatedRows || entradas.filter(row => String(row.id_cliente || row.cliente_id || '') === String(clientId)))
    : [record];

  if (!relatedRows.length) {
    body.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:18px; color:#94A3B8;">Sin trámites relacionados.</td></tr>';
    return;
  }

  body.innerHTML = relatedRows.map(row => `
    <tr>
      <td>${escapeHtml(row.servicio || '—')}</td>
      <td>${escapeHtml(fmtValor(row.valor))}</td>
      <td>${estadoBadge(row.estado_tramite)}</td>
      <td>${escapeHtml(row.atendente || '—')}</td>
      <td>${escapeHtml(fmtDate(row.fecha || row.creado_en || row.created_at))}</td>
    </tr>
  `).join('');
}

function renderTimeline(items) {
  const timeline = document.getElementById('historialTimeline');
  if (!timeline) return;

  if (!items.length) {
    timeline.innerHTML = '<div style="color:#94A3B8; text-align:center; padding:16px;">Sin cambios registrados.</div>';
    return;
  }

  timeline.innerHTML = items.map(item => {
    const date = fmtDate(item.creado_en || item.created_at || item.fecha || '');
    const field = safeText(item.campo || item.campo_modificado || item.accion || 'cambio');
    const before = safeText(item.valor_anterior || item.anterior || '');
    const after = safeText(item.valor_nuevo || item.nuevo || '');
    const meta = [item.usuario, item.atendente, item.operario].map(safeText).filter(Boolean).join(' · ');

    return `
      <div class="timeline-item">
        <div class="timeline-dot dot-cambio"></div>
        <div class="timeline-date">${escapeHtml(date)}</div>
        <div class="timeline-content">
          <strong>${escapeHtml(field)}</strong>
          ${before || after ? `<div>${escapeHtml(before || '—')} → ${escapeHtml(after || '—')}</div>` : ''}
        </div>
        ${meta ? `<div class="timeline-meta">${escapeHtml(meta)}</div>` : ''}
      </div>
    `;
  }).join('');
}

async function openHistorialModal(record) {
  if (!record) return;
  historialState = record;

  const modal = document.getElementById('historialModal');
  const title = document.getElementById('historialModalTitle');
  if (title) title.textContent = `${safeText(record.cliente) || 'Entrada'} · ${safeText(record.servicio) || 'Historial'}`;

  if (modal) {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }

  try {
    const clientId = getRelatedClientId(record);
    let relatedRows = [record];

    if (clientId) {
      const { data: relatedData, error: relatedError } = await supabaseClient
        .from('entradas')
        .select('*')
        .eq('id_cliente', clientId)
        .order('creado_en', { ascending: false, nullsFirst: false });

      if (relatedError) throw relatedError;
      relatedRows = relatedData || [record];
    }

    renderTramitesPanel({ ...record, __relatedRows: relatedRows });

    const { data, error } = await supabaseClient
      .from('historial_cambios')
      .select('*')
      .eq('id_entrada', record.id);

    if (error) throw error;
    const items = (data || []).slice().sort((a, b) => {
      const left = new Date(a.creado_en || a.created_at || a.fecha || 0).getTime();
      const right = new Date(b.creado_en || b.created_at || b.fecha || 0).getTime();
      return right - left;
    });
    renderTimeline(items);
  } catch (error) {
    console.error('openHistorialModal error:', error);
    renderTimeline([]);
  }
}

function closeHistorialModal() {
  const modal = document.getElementById('historialModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }
  historialState = null;
}

function getRelatedClientId(record) {
  return record.id_cliente || record.cliente_id || null;
}

async function saveHistorialChanges(record, changes) {
  if (!changes.length) return;

  const payload = changes.map(change => ({
    id_entrada: record.id,
    id_cliente: getRelatedClientId(record),
    campo: change.campo,
    valor_anterior: change.valor_anterior,
    valor_nuevo: change.valor_nuevo,
    creado_en: new Date().toISOString(),
  }));

  const { error } = await supabaseClient.from('historial_cambios').insert(payload);
  if (error) throw error;
}

async function saveEntrada(id, updates) {
  try {
    const record = entradas.find(row => row.id === id);
    if (!record) {
      setStatus('error', 'Entrada no encontrada');
      return;
    }

    const cleanedUpdates = {};
    const changes = [];
    const allowedFields = new Set(ENTRY_EDITABLE.map(field => field.name));

    Object.entries(updates).forEach(([field, value]) => {
      if (!allowedFields.has(field)) return;

      let cleaned = typeof value === 'string' ? normalizeEntradaField(field, value) : value;
      if (cleaned === '') cleaned = null;
      if (field === 'valor') cleaned = parseNumber(cleaned);

      const oldValue = record[field];
      const oldText = oldValue === null || oldValue === undefined ? null : String(oldValue).trim();
      const newText = cleaned === null || cleaned === undefined ? null : String(cleaned).trim();

      if (oldText !== newText) {
        cleanedUpdates[field] = cleaned;
        changes.push({ campo: field, valor_anterior: oldText, valor_nuevo: newText });
      }
    });

    if (!Object.keys(cleanedUpdates).length) {
      setStatus('live', 'Sin cambios');
      return true;
    }

    const now = new Date();
    if (selectedTelefonoMatchId) {
      const { data: selectedClient } = await supabaseClient
        .from('clientes')
        .select('id, nombre, email, cpf, estado, estado_federal, ciudad')
        .eq('id', selectedTelefonoMatchId)
        .limit(1)
        .maybeSingle();
      if (selectedClient) {
        cleanedUpdates.id_cliente = Number(selectedClient.id);
        cleanedUpdates.cliente = toUpperValue(selectedClient.nombre);
        cleanedUpdates.email = toUpperValue(selectedClient.email);
        cleanedUpdates.cpf = toUpperValue(selectedClient.cpf);
        cleanedUpdates.pais = 'BRASIL';
        cleanedUpdates.estado = toUpperValue(selectedClient.estado || selectedClient.estado_federal);
        cleanedUpdates.ciudad = toUpperValue(selectedClient.ciudad);
      }
    }

    if (!validateEstadoCiudadEntrada({ ...record, ...cleanedUpdates })) {
      setStatus('error', 'Estado/Ciudad inválidos para Brasil.');
      return false;
    }

    if (cleanedUpdates.estado_tramite === 'completada' && !cleanedUpdates.fecha_completacion) {
      cleanedUpdates.fecha_completacion = now.toISOString();
    }

    setStatus('loading', 'Guardando...');
    const { data: updatedRows, error } = await supabaseClient
      .from('entradas')
      .update(cleanedUpdates)
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!updatedRows?.length) throw new Error('No se actualizó ningún registro');

    if (changes.length) {
      try {
        await saveHistorialChanges(updatedRows[0], changes);
      } catch (historyError) {
        console.warn('No se pudo registrar historial:', historyError);
      }
    }

    await refreshEntradasPage(currentEntradasPage);
    if (historialState && historialState.id === id) {
      await openHistorialModal(updatedRows[0]);
    }
    if (typeof window.fetchDashboardRows === 'function') window.fetchDashboardRows();
    setStatus('live', 'Entrada guardada');
    return true;
  } catch (error) {
    console.error('saveEntrada error:', error);
    setStatus('error', error?.message || 'Error al guardar');
    return false;
  }
}

async function resolveClienteIdForEntrada(payload) {
  if (payload.id_cliente) return Number(payload.id_cliente);
  if (!payload.cliente && !payload.cpf && !payload.telefono && !payload.email) return null;

  const exactFilters = [];
  if (payload.cpf) exactFilters.push(`cpf.eq.${payload.cpf}`);
  if (payload.telefono) exactFilters.push(`telefono.eq.${payload.telefono}`);
  if (payload.email) exactFilters.push(`email.eq.${payload.email}`);

  if (exactFilters.length) {
    const { data, error } = await supabaseClient
      .from('clientes')
      .select('id')
      .or(exactFilters.join(','))
      .limit(1);
    if (!error && data?.length) return Number(data[0].id);
  }

  if (payload.cliente) {
    const { data, error } = await supabaseClient
      .from('clientes')
      .select('id')
      .ilike('nombre', payload.cliente.trim())
      .limit(1);
    if (!error && data?.length) return Number(data[0].id);
  }

  return null;
}

async function createEntrada(updates) {
  try {
    const cleanedUpdates = {};
    const allowedFields = new Set(ENTRY_EDITABLE.map(field => field.name));

    Object.entries(updates).forEach(([field, value]) => {
      if (!allowedFields.has(field)) return;
      let cleaned = typeof value === 'string' ? normalizeEntradaField(field, value) : value;
      if (cleaned === '') cleaned = null;
      if (field === 'valor') cleaned = parseNumber(cleaned);
      cleanedUpdates[field] = cleaned;
    });

    const now = new Date();
    cleanedUpdates.creado_en = now.toISOString();
    cleanedUpdates.fecha = cleanedUpdates.fecha || now.toISOString();
    cleanedUpdates.ano = now.getFullYear();
    cleanedUpdates.mes = now.getMonth() + 1;
    cleanedUpdates.estado_tramite = cleanedUpdates.estado_tramite || 'pendiente';
    let resolvedClienteId = selectedTelefonoMatchId ? Number(selectedTelefonoMatchId) : null;
    if (!resolvedClienteId) {
      resolvedClienteId = await resolveClienteIdForEntrada(cleanedUpdates);
    }
    if (resolvedClienteId) cleanedUpdates.id_cliente = resolvedClienteId;

    if (telefonoMatchesEntradas.length > 1 && !selectedTelefonoMatchId) {
      setStatus('error', 'Debes seleccionar un cliente para ese teléfono.');
      return false;
    }

    if (cleanedUpdates.id_cliente) {
      const { data: selectedClient } = await supabaseClient
        .from('clientes')
        .select('id, nombre, email, cpf, estado, estado_federal, ciudad')
        .eq('id', cleanedUpdates.id_cliente)
        .limit(1)
        .maybeSingle();
      if (selectedClient) {
        cleanedUpdates.cliente = toUpperValue(selectedClient.nombre);
        cleanedUpdates.email = toUpperValue(selectedClient.email);
        cleanedUpdates.cpf = toUpperValue(selectedClient.cpf);
        cleanedUpdates.pais = 'BRASIL';
        cleanedUpdates.estado = toUpperValue(selectedClient.estado || selectedClient.estado_federal);
        cleanedUpdates.ciudad = toUpperValue(selectedClient.ciudad);
      }
    }

    if (!validateEstadoCiudadEntrada(cleanedUpdates)) {
      setStatus('error', 'Estado/Ciudad inválidos para Brasil.');
      return false;
    }

    if (cleanedUpdates.estado_tramite === 'completada' && !cleanedUpdates.fecha_completacion) {
      cleanedUpdates.fecha_completacion = now.toISOString();
    }

    setStatus('loading', 'Guardando...');
    const { data: newRows, error } = await supabaseClient
      .from('entradas')
      .insert([cleanedUpdates])
      .select();

    if (error) throw error;
    if (!newRows?.length) throw new Error('No se pudo crear la entrada');
    currentEntradasPage = 1;
    await refreshEntradasPage(1);
    if (typeof window.fetchDashboardRows === 'function') window.fetchDashboardRows();
    setStatus('live', 'Entrada creada');
    return true;
  } catch (error) {
    console.error('createEntrada error:', error);
    setStatus('error', error?.message || 'Error al crear');
    return false;
  }
}

async function deleteEntrada(id) {
  try {
    const record = entradas.find(row => row.id === id);
    if (!record) {
      setStatus('error', 'Entrada no encontrada');
      return;
    }

    const label = `${safeText(record.cliente) || 'Cliente'} - ${safeText(record.servicio) || 'Entrada'}`;
    if (!window.confirm(`Se borrará ${label}. Esta acción no se puede deshacer.`)) return;

    setStatus('loading', 'Borrando entrada...');

    const { data: rpcDeleted, error: rpcError } = await supabaseClient
      .rpc('delete_entrada_cascade', { p_entrada_id: id });

    if (!rpcError) {
      if (rpcDeleted !== true) throw new Error('No se pudo borrar la entrada en Supabase');
    } else {
      const { error: histError } = await supabaseClient
        .from('historial_cambios')
        .delete()
        .eq('id_entrada', id);
      if (histError) throw histError;

      const { data: deletedRows, error } = await supabaseClient
        .from('entradas')
        .delete()
        .eq('id', id)
        .select('id');
      if (error) throw error;
      if (!deletedRows?.length) throw new Error('No se pudo borrar la entrada en Supabase');
    }
  } catch (error) {
    console.error('deleteEntrada error:', error);
    setStatus('error', error?.message || 'Error al borrar');
    return false;
  }

  try {
    await refreshEntradasPage(currentEntradasPage);
    if (historialState && historialState.id === id) closeHistorialModal();
    if (typeof window.fetchDashboardRows === 'function') window.fetchDashboardRows();
    setStatus('live', 'Entrada borrada');
    return true;
  } catch (refreshError) {
    console.error('post-delete refresh error:', refreshError);
    setStatus('error', refreshError?.message || 'Error al refrescar después de borrar');
    return false;
  }
}

function setupEventsEntradas() {
  document.getElementById('searchInputEntradas')?.addEventListener('input', () => refreshEntradasPage(1));
  document.getElementById('filtroMesEntradas')?.addEventListener('change', () => refreshEntradasPage(1));
  document.getElementById('filtroAtendenteEntradas')?.addEventListener('change', () => refreshEntradasPage(1));

  document.getElementById('paginationEntradas')?.addEventListener('click', event => {
    const button = event.target.closest('button[data-page-nav]');
    if (!button || button.disabled) return;
    if (button.dataset.pageNav === 'prev') {
      goToEntradasPage(currentEntradasPage - 1);
    } else if (button.dataset.pageNav === 'next') {
      goToEntradasPage(currentEntradasPage + 1);
    }
  });

  document.querySelectorAll('.tabs-4 .tab').forEach(button => {
    button.addEventListener('click', () => {
      activeTabEntradas = button.dataset.tab;
      currentEntradasPage = 1;
      document.querySelectorAll('.tabs-4 .tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === activeTabEntradas);
      });
      refreshEntradasPage(1);
    });
  });

  document.getElementById('entradasTabla')?.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;

    const id = Number(button.dataset.id);
    const record = entradas.find(row => row.id === id);
    if (!record) return;

    if (button.dataset.action === 'edit') {
      openEntryModal(record, false);
    } else if (button.dataset.action === 'delete') {
      deleteEntrada(id);
    } else if (button.dataset.action === 'history') {
      openHistorialModal(record);
    }
  });

  document.getElementById('editModalCloseEntradas')?.addEventListener('click', closeEditModal);
  document.getElementById('editModalCancelEntradas')?.addEventListener('click', closeEditModal);
  document.getElementById('editModalEntradas')?.addEventListener('click', event => {
    if (event.target === event.currentTarget) closeEditModal();
  });

  document.getElementById('historialModalClose')?.addEventListener('click', closeHistorialModal);
  document.getElementById('historialModal')?.addEventListener('click', event => {
    if (event.target === event.currentTarget) closeHistorialModal();
  });

  document.getElementById('editModalFormEntradas')?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!editModalData) return;

    const submitButton = event.submitter;
    if (submitButton) submitButton.classList.add('loading');

    const updates = {};
    document.querySelectorAll('#editModalFormEntradas [name]').forEach(element => {
      updates[element.name] = element.value;
    });

    if (editModalData.isNew) {
      const ok = await createEntrada(updates);
      if (ok) closeEditModal();
    } else {
      const ok = await saveEntrada(editModalData.id, updates);
      if (ok) closeEditModal();
    }

    if (submitButton) submitButton.classList.remove('loading');
  });

  document.getElementById('editModalFormEntradas')?.addEventListener('input', async event => {
    if (event.target?.name === 'telefono' && editModalData?.isNew) {
      try {
        await lookupClienteByTelefonoEntrada(event.target.value);
      } catch (error) {
        console.warn('lookup telefono error:', error);
      }
    }
  });

  document.getElementById('editModalFormEntradas')?.addEventListener('change', event => {
    if (event.target?.id === 'telefonoMatchSelect') {
      const selectedId = Number(event.target.value || 0);
      const selected = telefonoMatchesEntradas.find(item => Number(item.id) === selectedId);
      if (selected) applyMatchedClienteToEntrada(selected);
    }
    if (event.target?.id === 'modal_estado') {
      refreshCiudadOptionsEntrada('');
    }
  });
}

function setupRealtimeEntradas() {
  if (!supabaseClient?.channel) return;
  supabaseClient.channel('entradas-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'entradas' }, () => refreshEntradasPage(currentEntradasPage))
    .subscribe(status => {
      if (status === 'SUBSCRIBED') setStatus('live', 'En vivo');
      if (status === 'CHANNEL_ERROR') setStatus('error', 'Realtime desconectado');
    });
}

async function fetchEntradas() {
  await fetchEntradasPage(currentEntradasPage);
}

window.openNewEntradaModal = function openNewEntradaModal() {
  openEntryModal({}, true);
};

window.openHistorialModal = openHistorialModal;

async function initEntradas() {
  try {
    const cfg = window.SUPABASE_CONFIG;
    if (!cfg?.url || !cfg?.anonKey || cfg.url.includes('__SUPABASE')) {
      setStatus('error', 'Configura Supabase en config.js');
      return;
    }
    if (!window.supabase?.createClient) {
      setStatus('error', 'No se cargó el SDK de Supabase');
      return;
    }

    await loadGeoCatalogEntradas();
    setupEventsEntradas();
    await fetchEntradas();
    setupRealtimeEntradas();
  } catch (error) {
    console.error('initEntradas error:', error);
    setStatus('error', error?.message || 'Error al inicializar');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEntradas);
} else {
  initEntradas();
}
})();
