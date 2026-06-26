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