// Importar la versión optimizada del archivo
const cfg = window.SUPABASE_CONFIG || {};

const dashboardFetch = (input, init = {}) => {
  const method = String(init?.method || input?.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD') {
    return fetch(input, { ...init, cache: 'no-store' });
  }
  return fetch(input, init);
};

const supabaseClient = window.supabase?.createClient && cfg.url && cfg.anonKey && !cfg.url.includes('__SUPABASE')
  ? window.supabase.createClient(cfg.url, cfg.anonKey, { global: { fetch: dashboardFetch } })
  : null;
const { escapeHtml, safeText, setStatus: rawSetStatus, fmt, norm, cls } = window.DashboardUtils || {};
const setStatus = (state, text) => rawSetStatus?.(state, text, 'dashboard');

window.supabaseClient = supabaseClient;

const DASH_MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DASH_PALETTE = ['#378ADD', '#1D9E75', '#D85A30', '#BA7517', '#7F77DD', '#D4537E', '#639922', '#E24B4A', '#5DCAA5', '#888780'];
const DASH_FETCH_SIZE = 1000;

let dashboardEntradas = [];
let dashboardSalidas = [];
let dashboardCatalogo = [];
let dashboardCharts = {};

// Variable para almacenar los datos ya cargados
let cachedEntradas = null;
let cachedSalidas = null;
let cachedCatalogo = null;

function getDashYear() {
  return Number(cfg.ano) || new Date().getFullYear();
}

function parseFlexibleDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [day, month, year] = raw.split('/').map(Number);
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
    const [day, month, year] = raw.split('-').map(Number);
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toInputDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseInputDateValue(value, endOfDay = false) {
  if (!value) return null;
  return new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`);
}

function getDashboardFilters() {
  return {
    mes: Number(document.getElementById('filtroMesDash')?.value || 0),
    atendente: document.getElementById('filtroAtendenteDash')?.value || 'todos',
    desde: document.getElementById('filtroFechaInicioDash')?.value || '',
    hasta: document.getElementById('filtroFechaFinDash')?.value || '',
  };
}

function pct(number) {
  const value = Number(number) || 0;
  return `${(value * 100).toFixed(1)}%`;
}

function sumValues(values) {
  return values.reduce((total, value) => total + (Number(value) || 0), 0);
}

function getEntradaDate(row) {
  return parseFlexibleDate(row?.fecha_completacion) || parseFlexibleDate(row?.fecha) || parseFlexibleDate(row?.creado_en);
}

function getSalidaDate(row) {
  return parseFlexibleDate(row?.fecha) || parseFlexibleDate(row?.creado_en);
}

function getEntryMonth(row) {
  const explicit = Number(row?.mes);
  if (explicit >= 1 && explicit <= 12) return explicit;
  const date = getEntradaDate(row);
  return date ? date.getMonth() + 1 : 0;
}

function getEntryYear(row) {
  const explicit = Number(row?.ano);
  if (explicit > 2000) return explicit;
  const date = getEntradaDate(row);
  return date ? date.getFullYear() : getDashYear();
}

function buildMonthBuckets(filters) {
  if (filters.desde && filters.hasta) {
    const start = startOfMonth(parseInputDateValue(filters.desde));
    const end = startOfMonth(parseInputDateValue(filters.hasta));
    const buckets = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      buckets.push({
        key: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`,
        label: DASH_MONTHS[cursor.getMonth()],
        year: cursor.getFullYear(),
        month: cursor.getMonth() + 1,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return buckets;
  }

  return DASH_MONTHS.map((label, index) => ({
    key: `${getDashYear()}-${String(index + 1).padStart(2, '0')}`,
    label,
    year: getDashYear(),
    month: index + 1,
  }));
}

function getFilterRange(filters) {
  const hasDateRange = Boolean(filters.desde || filters.hasta);
  return {
    hasDateRange,
    start: parseInputDateValue(filters.desde, false),
    end: parseInputDateValue(filters.hasta, true),
  };
}

function isRevenueRow(row) {
  const status = norm(row?.estado_tramite);
  return status !== 'cancelada';
}

function getRecurrenceLabel(row) {
  const value = safeText(row?.recorrencia || row?.recurrencia).trim();
  if (!value) return 'Sin recurrencia';
  const normalized = norm(value);
  if (normalized.includes('novo') || normalized.includes('nuevo')) return 'Nuevo';
  if (normalized.includes('recorr') || normalized.includes('recurrent')) return 'Recurrente';
  return value;
}

function getServiceLabel(row) {
  return safeText(row?.servicio).trim() || 'Sin servicio';
}

function getCategoryLabel(row) {
  return safeText(row?.categoria_nombre || row?.categoria || row?.categoria_codigo).trim() || 'Sin categoría';
}

function sanitizeFilterTerm(value) {
  return safeText(value).replace(/[%(),]/g, ' ').trim();
}

// Versión optimizada de fetchAllRows con paginación
async function fetchAllRowsPaginated(source, {
  select = '*',
  orderBy = 'creado_en',
  ascending = false,
  page = 0,
  pageSize = DASH_FETCH_SIZE,
} = {}) {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseClient
    .from(source)
    .select(select, { count: 'exact' })
    .range(from, to);

  if (orderBy) {
    query = query.order(orderBy, { ascending, nullsFirst: false });
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: data || [],
    count: Number(count || 0),
    page,
    pageSize,
    hasMore: (data || []).length === pageSize,
  };
}

// Función para cargar datos con caché
async function fetchWithCache(cacheKey, fetchDataFn) {
  if (cacheKey === 'entradas' && cachedEntradas) return cachedEntradas;
  if (cacheKey === 'salidas' && cachedSalidas) return cachedSalidas;
  if (cacheKey === 'catalogo' && cachedCatalogo) return cachedCatalogo;

  const data = await fetchDataFn();

  // Almacenar en caché
  if (cacheKey === 'entradas') cachedEntradas = data;
  if (cacheKey === 'salidas') cachedSalidas = data;
  if (cacheKey === 'catalogo') cachedCatalogo = data;

  return data;
}

// Versión optimizada de fetchAllRows con límite configurable
async function fetchAllRows(source, {
  select = '*',
  orderBy = 'creado_en',
  ascending = false,
  limit = 10000, // Límite por defecto para evitar sobrecarga
} = {}) {
  const rows = [];
  let from = 0;
  let guard = 0;
  const maxIterations = Math.ceil(limit / DASH_FETCH_SIZE); // Limitar número de iteraciones

  while (guard < maxIterations) {
    let query = supabaseClient
      .from(source)
      .select(select, { count: 'exact' })
      .range(from, from + DASH_FETCH_SIZE - 1);

    if (orderBy) {
      query = query.order(orderBy, { ascending, nullsFirst: false });
    }

    const { data, error, count } = await query;

    if (error) throw error;
    const batch = data || [];
    rows.push(...batch);

    // Si no hay más datos o alcanzamos el límite, salir
    if (!batch.length || batch.length < DASH_FETCH_SIZE || rows.length >= limit) {
      break;
    }

    from += DASH_FETCH_SIZE;
    guard += 1;
  }

  return rows;
}

async function fetchCatalogRows() {
  try {
    return await fetchWithCache('catalogo', async () => {
      try {
        return await fetchAllRows('v_tramites_precios_vigentes', { orderBy: 'tramite_nombre', ascending: true });
      } catch (error) {
        console.warn('No se pudo cargar v_tramites_precios_vigentes:', error?.message || error);
      }

      try {
        return await fetchAllRows('tramites_catalogo', { orderBy: 'nombre', ascending: true });
      } catch (error) {
        console.warn('No se pudo cargar tramites_catalogo:', error?.message || error);
        return [];
      }
    });
  } catch (error) {
    console.error('Error fetching catalog rows:', error);
    return [];
  }
}

function buildCatalogIndex(rows) {
  const index = new Map();

  rows.forEach(row => {
    const normalizedNames = [
      norm(row?.tramite_nombre),
      norm(row?.tramite_codigo),
      norm(row?.nombre),
      norm(row?.codigo),
    ].filter(Boolean);

    const payload = {
      code: safeText(row?.tramite_codigo || row?.codigo).trim(),
      name: safeText(row?.tramite_nombre || row?.nombre).trim(),
      category: safeText(row?.categoria_nombre).trim(),
      price: Number(row?.precio ?? row?.precio_base ?? 0) || 0,
      cost: Number(row?.costo ?? row?.costo_base ?? 0) || 0,
      marginTarget: Number(row?.margen_objetivo ?? 0) || 0,
    };

    normalizedNames.forEach(key => index.set(key, payload));
  });

  return index;
}

// Función para limpiar la caché cuando sea necesario
function clearCache() {
  cachedEntradas = null;
  cachedSalidas = null;
  cachedCatalogo = null;
}

// Implementar debounce para funciones que se llaman frecuentemente
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Exportar funciones para que estén disponibles globalmente si es necesario
window.dashboardUtils = {
  ...window.dashboardUtils,
  fetchAllRowsPaginated,
  fetchWithCache,
  clearCache,
  debounce
};

function getCostEstimate(row, catalogIndex) {
  const service = safeText(row?.servicio).trim();
  const normalized = norm(service);
  const catalog = catalogIndex.get(normalized);
  if (catalog) return catalog.cost;

  const value = Number(row?.valor) || 0;
  return value * 0.23;
}

function populateDashboardFilters() {
  const monthSelect = document.getElementById('filtroMesDash');
  const atendenteSelect = document.getElementById('filtroAtendenteDash');
  const dateStart = document.getElementById('filtroFechaInicioDash');
  const dateEnd = document.getElementById('filtroFechaFinDash');
  const allDates = [
    ...dashboardEntradas.map(getEntradaDate),
    ...dashboardSalidas.map(getSalidaDate),
  ].filter(Boolean).sort((left, right) => left.getTime() - right.getTime());

  if (monthSelect && monthSelect.options.length <= 1) {
    DASH_MONTHS.forEach((month, index) => {
      const option = document.createElement('option');
      option.value = String(index + 1);
      option.textContent = month;
      monthSelect.appendChild(option);
    });
  }

  if (allDates.length) {
    const minDate = toInputDateValue(allDates[0]);
    const maxDate = toInputDateValue(allDates[allDates.length - 1]);
    if (dateStart) {
      dateStart.min = minDate;
      dateStart.max = maxDate;
    }
    if (dateEnd) {
      dateEnd.min = minDate;
      dateEnd.max = maxDate;
    }
  }

  if (atendenteSelect) {
    const current = atendenteSelect.value;
    const atendentes = [...new Set(
      dashboardEntradas
        .map(row => safeText(row?.atendente).trim())
        .filter(Boolean)
    )].sort((left, right) => left.localeCompare(right));

    atendenteSelect.innerHTML = '<option value="todos">Todos</option>';
    atendentes.forEach(atendente => {
      const option = document.createElement('option');
      option.value = atendente;
      option.textContent = atendente;
      option.selected = atendente === current;
      atendenteSelect.appendChild(option);
    });
  }
}

function filterEntradasForDashboard(filters) {
  const range = getFilterRange(filters);

  return dashboardEntradas.filter(row => {
    const date = getEntradaDate(row);
    if (!date) return false;
    if (!range.hasDateRange && getEntryYear(row) !== getDashYear()) return false;
    if (range.start && date < range.start) return false;
    if (range.end && date > range.end) return false;
    if (filters.mes && getEntryMonth(row) !== filters.mes) return false;
    if (filters.atendente !== 'todos' && norm(row?.atendente) !== norm(filters.atendente)) return false;
    return true;
  });
}

function filterSalidasForDashboard(filters) {
  const range = getFilterRange(filters);

  return dashboardSalidas.filter(row => {
    const date = getSalidaDate(row);
    if (!date) return false;
    if (!range.hasDateRange && date.getFullYear() !== getDashYear()) return false;
    if (range.start && date < range.start) return false;
    if (range.end && date > range.end) return false;
    if (filters.mes && (date.getMonth() + 1) !== filters.mes) return false;
    return true;
  });
}

function buildDashboardModel(overrideFilters = {}) {
  const filters = { ...getDashboardFilters(), ...overrideFilters };
  const filteredEntradas = filterEntradasForDashboard(filters);
  const filteredSalidas = filterSalidasForDashboard(filters);
  const revenueRows = filteredEntradas.filter(isRevenueRow);
  const monthBuckets = buildMonthBuckets(filters);
  const monthlyIndex = new Map(monthBuckets.map(item => [item.key, {
    label: item.label,
    revenue: 0,
    expense: 0,
    result: 0,
  }]));
  const catalogIndex = buildCatalogIndex(dashboardCatalogo);
  const recurrenceMap = new Map();
  const serviceMap = new Map();
  const categoryMap = new Map();
  const atendenteMap = new Map();

  revenueRows.forEach(row => {
    const date = getEntradaDate(row);
    if (!date) return;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const bucket = monthlyIndex.get(key);
    const revenue = Number(row?.valor) || 0;
    const service = getServiceLabel(row);
    const recurrence = getRecurrenceLabel(row);
    const directCost = getCostEstimate(row, catalogIndex);

    if (bucket) {
      bucket.revenue += revenue;
    }

    const recurrenceItem = recurrenceMap.get(recurrence) || { label: recurrence, revenue: 0, count: 0 };
    recurrenceItem.revenue += revenue;
    recurrenceItem.count += 1;
    recurrenceMap.set(recurrence, recurrenceItem);

    const atendente = safeText(row?.atendente).trim() || 'Sin atendente';
    const atendenteItem = atendenteMap.get(atendente) || { label: atendente, revenue: 0, count: 0 };
    atendenteItem.revenue += revenue;
    atendenteItem.count += 1;
    atendenteMap.set(atendente, atendenteItem);

    const serviceItem = serviceMap.get(service) || { label: service, revenue: 0, directCost: 0, count: 0 };
    serviceItem.revenue += revenue;
    serviceItem.directCost += directCost;
    serviceItem.count += 1;
    serviceMap.set(service, serviceItem);
  });

  filteredSalidas.forEach(row => {
    const date = getSalidaDate(row);
    if (!date) return;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const bucket = monthlyIndex.get(key);
    const expense = Number(row?.valor) || 0;
    const category = safeText(row?.categoria).trim() || 'Sin categoría';
    const item = categoryMap.get(category) || { label: category, expense: 0, count: 0, verifiedCount: 0 };

    if (bucket) {
      bucket.expense += expense;
    }

    item.expense += expense;
    item.count += 1;
    if (row?.verificado) item.verifiedCount += 1;
    categoryMap.set(category, item);
  });

  const monthly = monthBuckets.map(item => {
    const bucket = monthlyIndex.get(item.key) || { label: item.label, revenue: 0, expense: 0, result: 0 };
    bucket.result = bucket.revenue - bucket.expense;
    return bucket;
  });

  const revenueTotal = sumValues(monthly.map(item => item.revenue));
  const expenseTotal = sumValues(monthly.map(item => item.expense));
  const resultTotal = revenueTotal - expenseTotal;
  const rentability = revenueTotal > 0 ? resultTotal / revenueTotal : 0;
  const avgTicket = revenueRows.length ? revenueTotal / revenueRows.length : 0;
  const totalOperationalExpenses = sumValues(filteredSalidas.map(row => row?.valor));

  const services = [...serviceMap.values()]
    .map(item => {
      const sharedExpense = revenueTotal > 0 ? totalOperationalExpenses * (item.revenue / revenueTotal) : 0;
      const expense = item.directCost + sharedExpense;
      const result = item.revenue - expense;
      return {
        ...item,
        expense,
        sharedExpense,
        result,
        margin: item.revenue > 0 ? result / item.revenue : 0,
        roi: expense > 0 ? result / expense : 0,
      };
    })
    .sort((left, right) => right.revenue - left.revenue);

  const categories = [...categoryMap.values()]
    .map(item => ({
      ...item,
      share: expenseTotal > 0 ? item.expense / expenseTotal : 0,
      verifiedRatio: item.count > 0 ? item.verifiedCount / item.count : 0,
    }))
    .sort((left, right) => right.expense - left.expense);

  const recurrence = [...recurrenceMap.values()]
    .sort((left, right) => right.revenue - left.revenue);

  return {
    filters,
    entries: filteredEntradas,
    salidas: filteredSalidas,
    revenueRows,
    monthly,
    services,
    categories,
    recurrence,
    atendentes: [...atendenteMap.values()].sort((left, right) => right.revenue - left.revenue),
    summary: {
      revenueTotal,
      expenseTotal,
      resultTotal,
      rentability,
      avgTicket,
      revenueCount: revenueRows.length,
    },
  };
}

const DASH_DETAIL_LIMIT = 8;
let dashboardDetailState = null;

function fmtDashboardDate(value) {
  const date = parseFlexibleDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getDashboardStatusLabel(row) {
  const status = norm(row?.estado_tramite);
  if (status === 'completada' || status === 'completo' || status === 'finalizada') return 'Completada';
  if (status === 'procesando') return 'Procesando';
  if (status === 'cancelada') return 'Cancelada';
  if (status === 'pendiente') return 'Pendiente';
  return safeText(row?.estado_tramite).trim() || 'Sin estado';
}

function buildDashboardDetailConfig(model, kind, focusValue = '') {
  const detail = {
    title: 'Detalle',
    subtitle: 'Selecciona una métrica o un atendente para ver el desglose.',
    summaries: [],
    columns: [],
    rows: [],
    actions: [],
  };

  if (kind === 'expense') {
    const topCategory = model.categories[0];
    detail.title = 'Gastos';
    detail.subtitle = 'Distribución y movimientos del período filtrado.';
    detail.summaries = [
      { label: 'Total gastos', value: fmt(model.summary.expenseTotal), cls: 'red' },
      { label: 'Movimientos', value: String(model.salidas.length), note: 'Registros en salidas' },
      { label: 'Verificados', value: String(model.categories.reduce((sum, item) => sum + (item.verifiedCount || 0), 0)), cls: 'green' },
      { label: 'Categoría líder', value: topCategory?.label || 'Sin datos', note: topCategory ? fmt(topCategory.expense) : 'Sin movimientos' },
    ];
    detail.columns = [
      { label: 'Fecha', value: row => fmtDashboardDate(row.fecha || row.creado_en) },
      { label: 'Razón', value: row => safeText(row.razon || '-') },
      { label: 'Categoría', value: row => safeText(row.categoria || '-') },
      { label: 'Subcategoría', value: row => safeText(row.subcategoria || '-') },
      { label: 'Valor', value: row => fmt(row.valor || 0) },
      { label: 'Verificado', value: row => (row.verificado ? 'Sí' : 'No') },
    ];
    detail.rows = model.salidas.slice(0, DASH_DETAIL_LIMIT);
    detail.actions = [
      { label: 'Abrir gastos', type: 'hash', value: '#gastos', primary: true },
      { label: 'Nuevo gasto', type: 'new-gasto' },
    ];
    return detail;
  }

  if (kind === 'result') {
    detail.title = 'Resultado';
    detail.subtitle = 'Comparación de entradas y gastos por mes.';
    detail.summaries = [
      { label: 'Facturación', value: fmt(model.summary.revenueTotal), cls: 'green' },
      { label: 'Gastos', value: fmt(model.summary.expenseTotal), cls: 'red' },
      { label: 'Resultado', value: fmt(model.summary.resultTotal), cls: model.summary.resultTotal >= 0 ? 'green' : 'red' },
      { label: 'Rentabilidad', value: pct(model.summary.rentability), cls: metricClass(model.summary.rentability), note: `Ticket medio ${fmt(model.summary.avgTicket)}` },
    ];
    detail.columns = [
      { label: 'Mes', value: row => row.label },
      { label: 'Facturación', value: row => fmt(row.revenue) },
      { label: 'Gastos', value: row => fmt(row.expense) },
      { label: 'Resultado', value: row => fmt(row.result) },
      { label: 'Margen', value: row => pct(row.revenue > 0 ? row.result / row.revenue : 0) },
    ];
    detail.rows = model.monthly;
    detail.actions = [
      { label: 'Ver trámites', type: 'hash', value: '#entradas', primary: true },
    ];
    return detail;
  }

  if (kind === 'rentability') {
    detail.title = 'Rentabilidad por servicio';
    detail.subtitle = 'Servicios con mayor aporte al margen del período filtrado.';
    detail.summaries = [
      { label: 'Facturación', value: fmt(model.summary.revenueTotal), cls: 'green' },
      { label: 'Gastos imputados', value: fmt(sumValues(model.services.map(item => item.expense))), cls: 'red' },
      { label: 'Resultado', value: fmt(model.summary.resultTotal), cls: model.summary.resultTotal >= 0 ? 'green' : 'red' },
      { label: 'Servicios', value: String(model.services.length), note: 'Trámites con ingresos' },
    ];
    detail.columns = [
      { label: 'Servicio', value: row => row.label },
      { label: 'Facturación', value: row => fmt(row.revenue) },
      { label: 'Gastos', value: row => fmt(row.expense) },
      { label: 'Resultado', value: row => fmt(row.result) },
      { label: 'Margen', value: row => pct(row.margin) },
      { label: 'ROI', value: row => pct(row.roi) },
    ];
    detail.rows = model.services.slice(0, DASH_DETAIL_LIMIT);
    return detail;
  }

  if (kind === 'atendente') {
    const focusedFilters = { ...model.filters, atendente: focusValue };
    const focusedModel = buildDashboardModel(focusedFilters);
    const topService = focusedModel.services[0];
    detail.title = `Atendente: ${focusValue || 'Sin atendente'}`;
    detail.subtitle = 'Desglose del atendente con los filtros actuales.';
    detail.summaries = [
      { label: 'Facturación', value: fmt(focusedModel.summary.revenueTotal), cls: 'green' },
      { label: 'Trámites', value: String(focusedModel.summary.revenueCount), note: 'Entradas completadas o activas' },
      { label: 'Ticket medio', value: fmt(focusedModel.summary.avgTicket), note: 'Promedio por trámite' },
      { label: 'Servicio líder', value: topService?.label || 'Sin datos', note: topService ? fmt(topService.revenue) : 'Sin trámites' },
    ];
    detail.columns = [
      { label: 'Fecha', value: row => fmtDashboardDate(row.fecha_completacion || row.fecha || row.creado_en) },
      { label: 'Cliente', value: row => safeText(row.cliente || '-') },
      { label: 'Servicio', value: row => safeText(row.servicio || '-') },
      { label: 'Valor', value: row => fmt(row.valor || 0) },
      { label: 'Estado', value: row => getDashboardStatusLabel(row) },
    ];
    detail.rows = focusedModel.entries.slice(0, DASH_DETAIL_LIMIT);
    detail.actions = [
      { label: 'Aplicar atendente', type: 'apply-atendente', value: focusValue, primary: true },
      { label: 'Ver trámites', type: 'hash', value: '#entradas' },
    ];
    return detail;
  }

  detail.title = 'Facturación';
  detail.subtitle = 'Resumen general del período filtrado.';
  detail.summaries = [
    { label: 'Facturación', value: fmt(model.summary.revenueTotal), cls: 'green' },
    { label: 'Trámites', value: String(model.summary.revenueCount), note: 'Entradas útiles para ingreso' },
    { label: 'Resultado', value: fmt(model.summary.resultTotal), cls: model.summary.resultTotal >= 0 ? 'green' : 'red' },
    { label: 'Rentabilidad', value: pct(model.summary.rentability), cls: metricClass(model.summary.rentability) },
  ];
  detail.columns = [
    { label: 'Fecha', value: row => fmtDashboardDate(row.fecha_completacion || row.fecha || row.creado_en) },
    { label: 'Cliente', value: row => safeText(row.cliente || '-') },
    { label: 'Servicio', value: row => safeText(row.servicio || '-') },
    { label: 'Atendente', value: row => safeText(row.atendente || '-') },
    { label: 'Valor', value: row => fmt(row.valor || 0) },
    { label: 'Estado', value: row => getDashboardStatusLabel(row) },
  ];
  detail.rows = model.revenueRows.slice(0, DASH_DETAIL_LIMIT);
  detail.actions = [
    { label: 'Ver trámites', type: 'hash', value: '#entradas', primary: true },
  ];
  return detail;
}

function renderDashboardDetailModal(detail) {
  const modal = document.getElementById('dashboardDetailModal');
  const title = document.getElementById('dashboardDetailTitle');
  const subtitle = document.getElementById('dashboardDetailSubtitle');
  const summaryGrid = document.getElementById('dashboardDetailSummary');
  const actions = document.getElementById('dashboardDetailActions');
  const head = document.getElementById('dashboardDetailHead');
  const body = document.getElementById('dashboardDetailBody');

  if (!modal || !title || !subtitle || !summaryGrid || !actions || !head || !body) return;

  title.textContent = detail.title;
  subtitle.textContent = detail.subtitle;

  summaryGrid.innerHTML = detail.summaries.map(item => {
    const noteHtml = item.note ? `<div class="detail-summary-note">${escapeHtml(item.note)}</div>` : '';
    return `
      <div class="detail-summary-card">
        <div class="detail-summary-label">${escapeHtml(item.label)}</div>
        <div class="detail-summary-value ${cls(item.cls)}">${escapeHtml(item.value)}</div>
        ${noteHtml}
      </div>
    `;
  }).join('');

  actions.innerHTML = detail.actions.map(action => {
    const valAttr = action.value ? ` data-dashboard-detail-value="${escapeHtml(action.value)}"` : '';
    const btnCls = action.primary ? 'primary' : 'secondary';
    return `
      <button type="button" class="button ${cls(btnCls)}" data-dashboard-detail-action="${escapeHtml(action.type)}"${valAttr}>${escapeHtml(action.label)}</button>
    `;
  }).join('');

  head.innerHTML = detail.columns.map(column => `<th>${escapeHtml(column.label)}</th>`).join('');
  body.innerHTML = detail.rows.length
    ? detail.rows.map(row => `
        <tr>
          ${detail.columns.map(column => `<td>${escapeHtml(column.value(row))}</td>`).join('')}
        </tr>
      `).join('')
    : `<tr><td colspan="${detail.columns.length}" style="text-align:center; padding:18px; color:#64748B;">Sin registros para este detalle.</td></tr>`;

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeDashboardDetail() {
  const modal = document.getElementById('dashboardDetailModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  dashboardDetailState = null;
}

function openDashboardDetail(kind, focusValue = '') {
  const model = buildDashboardModel(kind === 'atendente' && focusValue ? { atendente: focusValue } : {});
  const detail = buildDashboardDetailConfig(model, kind, focusValue);
  dashboardDetailState = { kind, focusValue };
  renderDashboardDetailModal(detail);
}

function destroyChart(key) {
  if (dashboardCharts[key]) {
    dashboardCharts[key].destroy();
  }
}

function metricClass(value, type = 'ratio') {
  if (type === 'currency') {
    if (value > 0) return 'green';
    if (value < 0) return 'red';
    return '';
  }

  if (value >= 0.3) return 'green';
  if (value <= 0) return 'red';
  if (value >= 0.15) return 'amber';
  return '';
}

function renderMetrics(model) {
  const filters = model.filters;
  const monthLabel = filters.mes ? DASH_MONTHS[filters.mes - 1] : 'Período filtrado';
  const cards = [
    { key: 'revenue', label: 'Facturación', value: fmt(model.summary.revenueTotal), sub: `${model.summary.revenueCount} trámites`, cls: metricClass(model.summary.revenueTotal, 'currency') },
    { key: 'expense', label: 'Gastos', value: fmt(model.summary.expenseTotal), sub: `${model.salidas.length} salidas`, cls: metricClass(model.summary.expenseTotal, 'currency') },
    { key: 'result', label: 'Resultado', value: fmt(model.summary.resultTotal), sub: monthLabel, cls: metricClass(model.summary.resultTotal, 'currency') },
    { key: 'rentability', label: 'Rentabilidad', value: pct(model.summary.rentability), sub: `Ticket medio ${fmt(model.summary.avgTicket)}`, cls: metricClass(model.summary.rentability) },
  ];

  const metricGrid = document.getElementById('metricGrid');
  if (!metricGrid) return;

  metricGrid.innerHTML = cards.map(card => `
    <button type="button" class="metric metric-button" data-dashboard-metric="${escapeHtml(card.key)}" aria-label="Ver detalle de ${escapeHtml(card.label)}">
      <div class="metric-label">${escapeHtml(card.label)}</div>
      <div class="metric-value ${cls(card.cls)}">${escapeHtml(card.value)}</div>
      <div class="metric-sub">${escapeHtml(card.sub)}</div>
      <div class="metric-action">Ver detalle</div>
    </button>
  `).join('');
}

function renderFinancialChart(model) {
  const canvas = document.getElementById('chartMensual');
  if (!canvas || !window.Chart) return;

  destroyChart('mensual');
  dashboardCharts.mensual = new Chart(canvas.getContext('2d'), {
    data: {
      labels: model.monthly.map(item => item.label),
      datasets: [
        {
          type: 'line',
          label: 'Facturación',
          data: model.monthly.map(item => item.revenue),
          borderColor: '#378ADD',
          backgroundColor: 'rgba(55, 138, 221, 0.12)',
          borderWidth: 3,
          tension: 0.35,
          fill: false,
        },
        {
          type: 'bar',
          label: 'Gastos',
          data: model.monthly.map(item => item.expense),
          backgroundColor: 'rgba(216, 90, 48, 0.78)',
          borderRadius: 8,
        },
        {
          type: 'line',
          label: 'Resultado',
          data: model.monthly.map(item => item.result),
          borderColor: '#1D9E75',
          backgroundColor: 'rgba(29, 158, 117, 0.10)',
          borderWidth: 3,
          tension: 0.35,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.dataset.label}: ${fmt(context.raw)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 12 } },
        },
        y: {
          grid: { color: 'rgba(148, 163, 184, 0.20)' },
          ticks: {
            callback(value) {
              return `R$ ${(Number(value) / 1000).toFixed(0)} mil`;
            },
          },
        },
      },
    },
  });
}

function renderLegend(legendId, rows, getValue) {
  const legend = document.getElementById(legendId);
  if (!legend) return;

  const total = sumValues(rows.map(getValue)) || 1;
  legend.innerHTML = rows.map((row, index) => {
    const color = DASH_PALETTE[index % DASH_PALETTE.length];
    const sharePct = pct(getValue(row) / total);
    return `
      <span>
        <span class="legend-dot" style="background:${color}"></span>
        ${escapeHtml(row.label)} ${sharePct}
      </span>
    `;
  }).join('');
}

function renderAtendente(model) {
  const canvas = document.getElementById('chartAtendente');
  const legend = document.getElementById('legendAtendente');
  if (!canvas || !legend || !window.Chart) return;

  const chartRows = model.atendentes.slice(0, 8);
  const rows = chartRows.length ? chartRows : [{ label: 'Sin datos', revenue: 0, count: 0 }];
  legend.innerHTML = rows.map((row, index) => {
    const color = DASH_PALETTE[index % DASH_PALETTE.length];
    return `
      <button type="button" class="legend-chip" data-dashboard-atendente="${escapeHtml(row.label)}" aria-label="Ver detalle de ${escapeHtml(row.label)}">
        <span class="legend-dot" style="background:${color}"></span>
        <span>${escapeHtml(row.label)}</span>
      </button>
    `;
  }).join('');

  destroyChart('atendente');
  dashboardCharts.atendente = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: rows.map(row => row.label),
      datasets: [{
        label: 'Facturación',
        data: rows.map(row => row.revenue),
        backgroundColor: rows.map((_, index) => DASH_PALETTE[index % DASH_PALETTE.length]),
        borderRadius: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              const item = rows[context.dataIndex];
              const count = item?.count ?? 0;
              return `${context.label}: ${fmt(context.raw)} (${count} trámites)`;
            },
          },
        },
      },
      onClick(event, elements) {
        if (!elements.length) return;
        const item = rows[elements[0].index];
        if (item?.label && item.label !== 'Sin datos') {
          openDashboardDetail('atendente', item.label);
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 12 } },
        },
        y: {
          grid: { color: 'rgba(148, 163, 184, 0.20)' },
          ticks: {
            callback(value) {
              return `R$ ${(Number(value) / 1000).toFixed(0)} mil`;
            },
          },
        },
      },
    },
  });
}

function renderDoughnutChart(key, canvasId, rows, valueKey) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !window.Chart) return;

  const chartRows = rows.length ? rows : [{ label: 'Sin datos', [valueKey]: 0 }];
  destroyChart(key);
  dashboardCharts[key] = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: chartRows.map(row => row.label),
      datasets: [{
        data: chartRows.map(row => row[valueKey]),
        backgroundColor: chartRows.map((_, index) => DASH_PALETTE[index % DASH_PALETTE.length]),
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.label}: ${fmt(context.raw)}`;
            },
          },
        },
      },
    },
  });
}

function renderHorizontalBarChart(key, canvasId, rows, valueKey, label) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !window.Chart) return;

  const chartRows = rows.length ? rows : [{ label: 'Sin datos', [valueKey]: 0 }];
  destroyChart(key);
  dashboardCharts[key] = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: chartRows.map(row => row.label),
      datasets: [{
        label,
        data: chartRows.map(row => row[valueKey]),
        backgroundColor: chartRows.map((_, index) => DASH_PALETTE[index % DASH_PALETTE.length]),
        borderRadius: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return `${label}: ${fmt(context.raw)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(148, 163, 184, 0.20)' },
          ticks: {
            callback(value) {
              return `R$ ${(Number(value) / 1000).toFixed(0)} mil`;
            },
          },
        },
        y: {
          grid: { display: false },
        },
      },
    },
  });
}

function renderTables(model) {
  const serviceBody = document.getElementById('tablaServicios');
  if (serviceBody) {
    serviceBody.innerHTML = model.services.slice(0, 12).map(service => {
      const resColor = service.result >= 0 ? '#1D9E75' : '#D85A30';
      const badgeCls = service.margin >= 0.25 ? 'badge-green' : 'badge-amber';
      return `
        <tr>
          <td>${escapeHtml(service.label)}</td>
          <td>${fmt(service.revenue)}</td>
          <td>${fmt(service.expense)}</td>
          <td style="color:${resColor}; font-weight:600">${fmt(service.result)}</td>
          <td><span class="badge ${cls(badgeCls)}">${pct(service.margin)}</span></td>
          <td>${pct(service.roi)}</td>
        </tr>
      `;
    }).join('') || '<tr><td colspan="6" style="text-align:center; padding:18px; color:#64748B;">Sin servicios para el filtro actual.</td></tr>';
  }

  const categoryBody = document.getElementById('tablaCategorias');
  if (categoryBody) {
    categoryBody.innerHTML = model.categories.slice(0, 12).map(category => `
      <tr>
        <td>${escapeHtml(category.label)}</td>
        <td>${fmt(category.expense)}</td>
        <td>${pct(category.share)}</td>
        <td>${escapeHtml(category.count)}</td>
        <td>${pct(category.verifiedRatio)}</td>
      </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center; padding:18px; color:#64748B;">Sin gastos para el filtro actual.</td></tr>';
  }

  const tramitesBody = document.getElementById('tablaTramites');
  if (tramitesBody) {
    tramitesBody.innerHTML = dashboardCatalogo.slice(0, 20).map(item => `
      <tr>
        <td>${escapeHtml(item.tramite_codigo || item.codigo || '—')}</td>
        <td>${escapeHtml(item.tramite_nombre || item.nombre || '—')}</td>
        <td>${escapeHtml(item.categoria_nombre || 'Sin categoría')}</td>
        <td>${fmt(item.precio ?? item.precio_base ?? 0)}</td>
        <td>${fmt(item.costo ?? item.costo_base ?? 0)}</td>
        <td>${escapeHtml(pct(item.margen_objetivo ?? 0))}</td>
      </tr>
    `).join('') || '<tr><td colspan="6" style="text-align:center; padding:18px; color:#64748B;">Carga el script supabase-tramites.sql para ver el catálogo.</td></tr>';
  }
}

function renderActivity(rows) {
  const activityFeed = document.getElementById('activityFeed');
  if (!activityFeed) return;

  const recent = rows.slice(0, DASH_DETAIL_LIMIT);
  if (!recent.length) {
    activityFeed.innerHTML = '<div style="text-align:center; color:#94A3B8; padding:20px;">Sin actividad reciente.</div>';
    return;
  }

  activityFeed.innerHTML = recent.map(row => {
    const date = fmtDashboardDate(row.fecha_completacion || row.fecha || row.creado_en);
    return `
      <div class="activity-item">
        <div class="activity-icon">R$</div>
        <div>
          <div class="activity-text">${escapeHtml(row.cliente || 'Cliente')} - ${escapeHtml(row.servicio || 'Entrada')} por ${escapeHtml(fmt(row.valor || 0))}</div>
          <div class="activity-time">${escapeHtml(date)}</div>
        </div>
      </div>
    `;
  }).join('');
}

function actualizar() {
  const model = buildDashboardModel();

  renderMetrics(model);
  renderFinancialChart(model);
  renderAtendente(model);

  const recurrenceRows = model.recurrence.slice(0, 6);
  renderLegend('legendRecurrencia', recurrenceRows, item => item.revenue);
  renderDoughnutChart('recurrencia', 'chartRecurrencia', recurrenceRows, 'revenue');

  const serviceRows = model.services.slice(0, 8);
  renderLegend('legendServicio', serviceRows, item => item.revenue);
  renderHorizontalBarChart('servicio', 'chartServicio', serviceRows, 'revenue', 'Facturación');

  const categoryRows = model.categories.slice(0, 8);
  renderLegend('legendCategoria', categoryRows, item => item.expense);
  renderHorizontalBarChart('categoria', 'chartCategoria', categoryRows, 'expense', 'Gasto');

  renderTables(model);
  renderActivity(model.entries);
}

window.actualizar = actualizar;

async function fetchDashboardRows() {
  if (!supabaseClient) {
    setStatus('error', 'Configura Supabase en config.js');
    return;
  }

  try {
    setStatus('loading', 'Cargando dashboard...');
    const [entradas, salidas, catalogo] = await Promise.all([
      fetchAllRows('entradas', { orderBy: 'creado_en', ascending: false }),
      fetchAllRows('salidas', { orderBy: 'fecha', ascending: false }),
      fetchCatalogRows(),
    ]);

    dashboardEntradas = entradas;
    dashboardSalidas = salidas;
    dashboardCatalogo = catalogo;

    populateDashboardFilters();
    actualizar();
    setStatus('live', 'Conectado');
  } catch (error) {
    console.error('fetchDashboardRows error:', error);
    setStatus('error', error?.message || 'Error al cargar dashboard');
    actualizar();
  }
}

window.fetchDashboardRows = fetchDashboardRows;

function resetDashboardFilters() {
  const dateStart = document.getElementById('filtroFechaInicioDash');
  const dateEnd = document.getElementById('filtroFechaFinDash');
  const monthSelect = document.getElementById('filtroMesDash');
  const atendenteSelect = document.getElementById('filtroAtendenteDash');

  if (dateStart) dateStart.value = '';
  if (dateEnd) dateEnd.value = '';
  if (monthSelect) monthSelect.value = '0';
  if (atendenteSelect) atendenteSelect.value = 'todos';

  actualizar();
}

function handleDashboardDetailAction(action, value) {
  if (action === 'hash' && value) {
    closeDashboardDetail();
    window.location.hash = value;
    return;
  }

  if (action === 'new-gasto') {
    closeDashboardDetail();
    if (typeof window.openNewGastoModal === 'function') {
      window.openNewGastoModal();
      return;
    }
    window.location.hash = '#gastos';
    return;
  }

  if (action === 'apply-atendente') {
    const atendenteSelect = document.getElementById('filtroAtendenteDash');
    if (atendenteSelect) atendenteSelect.value = value || 'todos';
    closeDashboardDetail();
    actualizar();
  }
}

function setupDashboardInteractions() {
  const metricGrid = document.getElementById('metricGrid');
  if (metricGrid) {
    metricGrid.addEventListener('click', event => {
      const target = event.target.closest('[data-dashboard-metric]');
      if (!target) return;
      openDashboardDetail(target.dataset.dashboardMetric);
    });

    metricGrid.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target.closest('[data-dashboard-metric]');
      if (!target) return;
      event.preventDefault();
      openDashboardDetail(target.dataset.dashboardMetric);
    });
  }

  const legendAtendente = document.getElementById('legendAtendente');
  if (legendAtendente) {
    legendAtendente.addEventListener('click', event => {
      const target = event.target.closest('[data-dashboard-atendente]');
      if (!target) return;
      openDashboardDetail('atendente', target.dataset.dashboardAtendente);
    });

    legendAtendente.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target.closest('[data-dashboard-atendente]');
      if (!target) return;
      event.preventDefault();
      openDashboardDetail('atendente', target.dataset.dashboardAtendente);
    });
  }

  const detailModal = document.getElementById('dashboardDetailModal');
  if (detailModal) {
    detailModal.addEventListener('click', event => {
      if (event.target === event.currentTarget) closeDashboardDetail();
    });
  }

  document.getElementById('dashboardDetailClose')?.addEventListener('click', closeDashboardDetail);
  document.getElementById('dashboardDetailActions')?.addEventListener('click', event => {
    const button = event.target.closest('[data-dashboard-detail-action]');
    if (!button) return;
    handleDashboardDetailAction(button.dataset.dashboardDetailAction, button.dataset.dashboardDetailValue || '');
  });
}

function initDashboard() {
  const yearLabel = document.getElementById('anoLabel');
  if (yearLabel) {
    yearLabel.textContent = String(getDashYear());
  }

  document.getElementById('filtroFechaInicioDash')?.addEventListener('change', actualizar);
  document.getElementById('filtroFechaFinDash')?.addEventListener('change', actualizar);
  document.getElementById('filtroMesDash')?.addEventListener('change', actualizar);
  document.getElementById('filtroAtendenteDash')?.addEventListener('change', actualizar);
  document.getElementById('resetDashboardFilters')?.addEventListener('click', resetDashboardFilters);
  setupDashboardInteractions();

  actualizar();
  fetchDashboardRows();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
