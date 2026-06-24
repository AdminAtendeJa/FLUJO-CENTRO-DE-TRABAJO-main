(() => {
const cfg = window.SUPABASE_CONFIG || {};
const supabaseClient = window.supabaseClient || (
  window.supabase?.createClient && cfg.url && cfg.anonKey && !cfg.url.includes('__SUPABASE')
    ? window.supabase.createClient(cfg.url, cfg.anonKey)
    : null
);

const { escapeHtml, safeText, setStatus: rawSetStatus, fmt } = window.DashboardUtils || {};
const setStatus = (state, text) => rawSetStatus?.(state, text, 'gastos');

const GASTOS_PAGE_SIZE = 1000;
const GASTO_FORM_FIELDS = [
  { name: 'fecha', label: 'Fecha', type: 'date', required: true },
  { name: 'razon', label: 'Razón', type: 'text', required: true },
  { name: 'categoria', label: 'Categoría', type: 'text', required: true },
  { name: 'subcategoria', label: 'Subcategoría', type: 'text' },
  { name: 'valor', label: 'Valor (R$)', type: 'number', required: true },
  {
    name: 'verificado',
    label: 'Verificado',
    type: 'select',
    options: [
      { value: 'false', label: 'No' },
      { value: 'true', label: 'Sí' },
    ],
  },
  { name: 'observacao', label: 'Observación', type: 'textarea', fullWidth: true },
];

let gastos = [];
let gastosFetchToken = 0;
let currentGastosPage = 1;
let gastosTotalCount = 0;
let gastosTotalPages = 1;
let gastosLastModel = null;
let gastosModalData = null;

function fmtDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getGastosFilters() {
  return {
    desde: document.getElementById('filtroFechaDesdeGastos')?.value || '',
    hasta: document.getElementById('filtroFechaHastaGastos')?.value || '',
    categoria: document.getElementById('filtroCategoriaGastos')?.value || 'todas',
    verificado: document.getElementById('filtroVerificadoGastos')?.value || 'todos',
  };
}

function getGastosPageBounds(page) {
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * GASTOS_PAGE_SIZE;
  return { from, to: from + GASTOS_PAGE_SIZE - 1 };
}

function toLocalInputDate(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function fmtDateForInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return toLocalInputDate(date);
}

function normalizeBooleanInput(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function openGastoModal(record = null) {
  gastosModalData = record?.id ? { isNew: false, id: record.id } : { isNew: true };
  const title = document.getElementById('editModalTitleGastos');
  if (title) {
    title.textContent = record?.id ? `Editar gasto: ${safeText(record.razon || 'Sin razón')}` : 'Nuevo gasto';
  }

  renderGastoForm(record || {});
  const modal = document.getElementById('editModalGastos');
  modal?.classList.remove('hidden');
  modal?.setAttribute('aria-hidden', 'false');
}

function closeGastoModal() {
  const modal = document.getElementById('editModalGastos');
  modal?.classList.add('hidden');
  modal?.setAttribute('aria-hidden', 'true');
  gastosModalData = null;
}

function renderGastoForm(record = {}) {
  const form = document.getElementById('gastoFormFields');
  if (!form) return;

  const html = GASTO_FORM_FIELDS.map(field => {
    const value = field.name === 'fecha'
      ? fmtDateForInput(record[field.name] || new Date())
      : (field.name === 'verificado'
        ? String(normalizeBooleanInput(record[field.name]))
        : safeText(record[field.name]));

    let input = '';
    if (field.type === 'select') {
      const options = field.options.map(option => `
        <option value="${escapeHtml(option.value)}" ${String(value) === option.value ? 'selected' : ''}>${escapeHtml(option.label)}</option>
      `).join('');
      input = `<select id="gasto_${field.name}" name="${field.name}" ${field.required ? 'required' : ''}>${options}</select>`;
    } else if (field.type === 'textarea') {
      input = `<textarea id="gasto_${field.name}" name="${field.name}" ${field.required ? 'required' : ''}>${escapeHtml(value)}</textarea>`;
    } else {
      const step = field.type === 'number' ? ' step="0.01"' : '';
      input = `<input id="gasto_${field.name}" name="${field.name}" type="${field.type}" value="${escapeHtml(value)}" ${field.required ? 'required' : ''}${step}>`;
    }

    return `
      <div class="modal-field ${field.fullWidth ? 'modal-field-full' : ''}" ${field.fullWidth ? 'style="grid-column:1 / -1;"' : ''}>
        <label class="modal-label" for="gasto_${field.name}">${escapeHtml(field.label)}</label>
        ${input}
      </div>
    `;
  }).join('');

  form.innerHTML = `<div class="modal-grid-2">${html}</div>`;
}

async function saveGasto() {
  if (!supabaseClient) {
    setStatus('error', 'Configura Supabase en config.js');
    return;
  }

  const form = document.getElementById('editModalFormGastos');
  if (!form) return;

  const formData = new FormData(form);
  const payload = {};
  for (const [key, value] of formData.entries()) {
    payload[key] = typeof value === 'string' ? value.trim() : value;
  }

  payload.fecha = payload.fecha || toLocalInputDate();
  payload.razon = payload.razon || '';
  payload.categoria = payload.categoria || '';
  payload.subcategoria = payload.subcategoria || null;
  const rawValor = String(payload.valor ?? '').trim();
  const normalizedValor = rawValor.includes(',')
    ? rawValor.replace(/\./g, '').replace(',', '.')
    : rawValor.replace(/,/g, '');
  payload.valor = Number(normalizedValor.replace(/[^0-9.-]/g, ''));
  payload.verificado = normalizeBooleanInput(payload.verificado);
  payload.observacao = payload.observacao || null;
  payload.creado_en = new Date().toISOString();

  if (!payload.razon || !payload.categoria || !Number.isFinite(payload.valor)) {
    setStatus('error', 'Completa razón, categoría y valor válido');
    return;
  }

  try {
    setStatus('loading', gastosModalData?.isNew ? 'Guardando gasto...' : 'Actualizando gasto...');

    let result;
    if (gastosModalData?.isNew !== false || !gastosModalData?.id) {
      result = await supabaseClient
        .from('salidas')
        .insert([payload])
        .select();
    } else {
      const updatePayload = { ...payload };
      delete updatePayload.creado_en;
      result = await supabaseClient
        .from('salidas')
        .update(updatePayload)
        .eq('id', gastosModalData.id)
        .select();
    }

    const { data, error } = result;
    if (error) throw error;
    if (!data || !data.length) {
      throw new Error('No se pudo guardar el gasto. Revisa permisos RLS.');
    }

    closeGastoModal();
    currentGastosPage = 1;
    await fetchGastosPage(1);
    if (typeof window.fetchDashboardRows === 'function') {
      await window.fetchDashboardRows();
    } else {
      window.actualizar?.();
    }
    setStatus('live', 'Gasto guardado');
  } catch (error) {
    console.error('saveGasto error:', error);
    setStatus('error', error?.message || 'Error al guardar gasto');
  }
}

window.openNewGastoModal = function openNewGastoModal() {
  openGastoModal();
};

window.closeGastoModal = closeGastoModal;

function buildGastosQuery(filters, {
  withCount = true,
  columns = '*',
} = {}) {
  let query = supabaseClient
    .from('salidas')
    .select(columns, withCount ? { count: 'exact' } : undefined)
    .order('fecha', { ascending: false, nullsFirst: false });

  if (filters.desde) {
    query = query.gte('fecha', `${filters.desde}T00:00:00`);
  }
  if (filters.hasta) {
    query = query.lte('fecha', `${filters.hasta}T23:59:59`);
  }
  if (filters.categoria !== 'todas') {
    query = query.eq('categoria', filters.categoria);
  }
  if (filters.verificado === 'true') {
    query = query.eq('verificado', true);
  } else if (filters.verificado === 'false') {
    query = query.eq('verificado', false);
  }

  return query;
}

async function fetchGastosMeta(filters) {
  const { data, error } = await buildGastosQuery(filters, {
    withCount: false,
    columns: 'valor, verificado, categoria',
  });
  if (error) throw error;
  const rows = data || [];
  const total = rows.reduce((sum, row) => sum + (Number(row.valor) || 0), 0);
  const verifiedCount = rows.filter(row => row.verificado === true).length;
  const categories = [...new Set(rows.map(row => safeText(row.categoria).trim()).filter(Boolean))].sort();
  return {
    total,
    totalRows: rows.length,
    verifiedCount,
    categories,
  };
}

function renderGastosSummary(model) {
  const container = document.getElementById('gastosSummaryGrid');
  if (!container) return;
  const percent = model.totalRows > 0 ? ((model.verifiedCount / model.totalRows) * 100).toFixed(1) : '0.0';
  const cards = [
    { label: 'Total gastos', value: fmt(model.total), cls: 'red' },
    { label: 'Movimientos', value: String(model.totalRows) },
    { label: 'Verificados', value: String(model.verifiedCount), cls: 'green' },
    { label: 'Tasa verificación', value: `${percent}%`, cls: Number(percent) >= 70 ? 'green' : 'amber' },
  ];

  container.innerHTML = cards.map(card => `
    <div class="summary-card">
      <div class="summary-label">${escapeHtml(card.label)}</div>
      <div class="summary-value ${card.cls || ''}">${escapeHtml(card.value)}</div>
    </div>
  `).join('');
}

function renderGastosCategories(categories) {
  const select = document.getElementById('filtroCategoriaGastos');
  if (!select) return;
  const current = select.value || 'todas';
  select.innerHTML = '<option value="todas">Todas las categorías</option>';
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    option.selected = category === current;
    select.appendChild(option);
  });
}

function renderGastosPagination() {
  const container = document.getElementById('paginationGastos');
  if (!container) return;
  const totalPages = Math.max(1, gastosTotalPages || Math.ceil((gastosTotalCount || 0) / GASTOS_PAGE_SIZE) || 1);
  const hasRows = gastosTotalCount > 0 && gastos.length > 0;
  const startItem = hasRows ? ((currentGastosPage - 1) * GASTOS_PAGE_SIZE) + 1 : 0;
  const endItem = hasRows ? Math.min(startItem + gastos.length - 1, gastosTotalCount) : 0;
  const statusText = gastosTotalCount > 0
    ? `Página ${currentGastosPage} de ${totalPages} · ${startItem}-${endItem} de ${gastosTotalCount}`
    : 'Sin registros';

  container.innerHTML = `
    <button type="button" class="page-button" data-page-nav="prev" ${currentGastosPage <= 1 ? 'disabled' : ''}>Anterior</button>
    <span class="page-status" style="align-self:center; padding:0 12px; color:#475569; font-size:13px;">${escapeHtml(statusText)}</span>
    <button type="button" class="page-button" data-page-nav="next" ${currentGastosPage >= totalPages ? 'disabled' : ''}>Siguiente</button>
  `;
}

function renderGastosTable() {
  const container = document.getElementById('gastosTabla');
  if (!container) return;

  if (!gastos.length) {
    container.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:24px; color:#6b6b6b;">No se encontraron gastos para esta vista.</td></tr>';
    renderGastosPagination();
    return;
  }

  container.innerHTML = gastos.map(row => `
    <tr>
      <td>${escapeHtml(fmtDate(row.fecha || row.creado_en))}</td>
      <td>${escapeHtml(row.razon || '-')}</td>
      <td>${escapeHtml(row.categoria || '-')}</td>
      <td>${escapeHtml(row.subcategoria || '-')}</td>
      <td>${escapeHtml(fmt(row.valor || 0))}</td>
      <td>${row.verificado ? '<span class="badge badge-green">Sí</span>' : '<span class="badge badge-amber">No</span>'}</td>
      <td>${escapeHtml(row.observacao || '-')}</td>
    </tr>
  `).join('');

  renderGastosPagination();
}

async function fetchGastosPage(page = currentGastosPage) {
  if (!supabaseClient) return;
  const requestToken = ++gastosFetchToken;
  const targetPage = Math.max(1, page);
  const { from, to } = getGastosPageBounds(targetPage);
  const filters = getGastosFilters();

  try {
    setStatus('loading', 'Cargando gastos...');
    const [pageResult, meta] = await Promise.all([
      buildGastosQuery(filters, { withCount: true, columns: '*' }).range(from, to),
      fetchGastosMeta(filters),
    ]);

    if (requestToken !== gastosFetchToken) return;
    if (pageResult.error) throw pageResult.error;

    gastos = pageResult.data || [];
    gastosTotalCount = Number(pageResult.count || 0);
    gastosTotalPages = Math.max(1, Math.ceil(gastosTotalCount / GASTOS_PAGE_SIZE));
    currentGastosPage = Math.min(targetPage, gastosTotalPages);
    gastosLastModel = meta;

    if (targetPage > gastosTotalPages && gastosTotalCount > 0) {
      await fetchGastosPage(gastosTotalPages);
      return;
    }

    renderGastosCategories(meta.categories);
    renderGastosSummary(meta);
    renderGastosTable();
    setStatus('live', 'Conectado');
  } catch (error) {
    if (requestToken === gastosFetchToken) {
      console.error('fetchGastosPage error:', error);
      setStatus('error', error?.message || 'Error al cargar gastos');
    }
  }
}

function goToGastosPage(page) {
  const totalPages = Math.max(1, gastosTotalPages || 1);
  const targetPage = Math.min(Math.max(1, page), totalPages);
  currentGastosPage = targetPage;
  fetchGastosPage(targetPage);
}

function resetGastosFilters() {
  const desde = document.getElementById('filtroFechaDesdeGastos');
  const hasta = document.getElementById('filtroFechaHastaGastos');
  const categoria = document.getElementById('filtroCategoriaGastos');
  const verificado = document.getElementById('filtroVerificadoGastos');
  if (desde) desde.value = '';
  if (hasta) hasta.value = '';
  if (categoria) categoria.value = 'todas';
  if (verificado) verificado.value = 'todos';
  currentGastosPage = 1;
  fetchGastosPage(1);
}

function setupEventsGastos() {
  document.getElementById('openNewGastoModal')?.addEventListener('click', () => openGastoModal());
  document.getElementById('filtroFechaDesdeGastos')?.addEventListener('change', () => fetchGastosPage(1));
  document.getElementById('filtroFechaHastaGastos')?.addEventListener('change', () => fetchGastosPage(1));
  document.getElementById('filtroCategoriaGastos')?.addEventListener('change', () => fetchGastosPage(1));
  document.getElementById('filtroVerificadoGastos')?.addEventListener('change', () => fetchGastosPage(1));
  document.getElementById('resetGastosFilters')?.addEventListener('click', resetGastosFilters);
  document.getElementById('editModalCloseGastos')?.addEventListener('click', closeGastoModal);
  document.getElementById('editModalCancelGastos')?.addEventListener('click', closeGastoModal);
  document.getElementById('editModalGastos')?.addEventListener('click', event => {
    if (event.target === event.currentTarget) closeGastoModal();
  });
  document.getElementById('editModalFormGastos')?.addEventListener('submit', async event => {
    event.preventDefault();
    const submitButton = event.submitter;
    if (submitButton) submitButton.classList.add('loading');
    await saveGasto();
    if (submitButton) submitButton.classList.remove('loading');
  });

  document.getElementById('paginationGastos')?.addEventListener('click', event => {
    const button = event.target.closest('button[data-page-nav]');
    if (!button || button.disabled) return;
    if (button.dataset.pageNav === 'prev') {
      goToGastosPage(currentGastosPage - 1);
    } else if (button.dataset.pageNav === 'next') {
      goToGastosPage(currentGastosPage + 1);
    }
  });

  document.addEventListener('viewChanged', event => {
    if (event?.detail?.view === 'gastos') {
      fetchGastosPage(currentGastosPage);
    }
  });
}

function setupRealtimeGastos() {
  if (!supabaseClient?.channel) return;
  supabaseClient.channel('gastos-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'salidas' }, () => {
      if (window.__activeView === 'gastos') fetchGastosPage(currentGastosPage);
    })
    .subscribe(status => {
      if (status === 'SUBSCRIBED') setStatus('live', 'En vivo');
      if (status === 'CHANNEL_ERROR') setStatus('error', 'Realtime desconectado');
    });
}

async function initGastos() {
  try {
    if (!cfg?.url || !cfg?.anonKey || cfg.url.includes('__SUPABASE')) {
      setStatus('error', 'Configura Supabase en config.js');
      return;
    }
    if (!window.supabase?.createClient) {
      setStatus('error', 'No se cargó el SDK de Supabase');
      return;
    }
    setupEventsGastos();
    if (window.__activeView === 'gastos') {
      await fetchGastosPage(1);
    }
    setupRealtimeGastos();
  } catch (error) {
    console.error('initGastos error:', error);
    setStatus('error', error?.message || 'Error al inicializar gastos');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGastos);
} else {
  initGastos();
}
})();
