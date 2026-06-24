(() => {
const { escapeHtml, safeText, setStatus: rawSetStatus } = window.DashboardUtils || {};
const setStatus = (state, text) => rawSetStatus?.(state, text, 'clientes');
const cfg = window.SUPABASE_CONFIG || {};
const supabaseClient = window.supabaseClient || (
    window.supabase?.createClient && cfg.url && cfg.anonKey && !cfg.url.includes('__SUPABASE')
        ? window.supabase.createClient(cfg.url, cfg.anonKey)
        : null
);

const CLIENT_TABLE_FIELDS = ['fecha', 'id_kommo', 'cpf', 'nombre', 'telefono', 'email', 'valor_total', 'pais', 'ciudad', 'estado', 'canal_adquisicion', 'atendente'];
const CLIENT_FORM_FIELDS = ['fecha', 'id_kommo', 'cpf', 'nombre', 'telefono', 'email', 'valor_total', 'pais', 'estado', 'ciudad', 'canal_adquisicion', 'atendente', 'estado_cliente'];
const UPPERCASE_FIELDS = new Set(['nombre', 'email', 'cpf', 'pais', 'estado', 'ciudad', 'telefono']);
const RECENT_DAYS = 7;

let clients = [];
let activeTabClientes = 'recent';
let editModalClientData = null;
let searchTerm = '';
let currentPage = 1;
const itemsPerPage = 1000;
let totalClientsCount = 0;
let totalClientsPages = 1;
let clientsFetchToken = 0;
let estadosBr = [];
let cidadesByUf = new Map();

function toUpperValue(value) {
    const text = safeText(value).trim();
    return text ? text.toUpperCase() : '';
}

function normalizeField(field, value) {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (UPPERCASE_FIELDS.has(field)) return trimmed.toUpperCase();
    return trimmed;
}

function formatDateForInput(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function getPrimaryKeyName(record) {
    if (!record || !Object.prototype.hasOwnProperty.call(record, 'id')) return null;
    const value = record.id;
    return value !== null && value !== undefined && String(value).trim() !== '' ? 'id' : null;
}

function getPrimaryKeyValue(record) {
    const key = getPrimaryKeyName(record);
    return key ? record[key] : null;
}

function getRecordByPrimaryKey(keyName, keyValue) {
    return clients.find(record => String(record[keyName]) === String(keyValue)) || null;
}

function isRecentClient(record) {
    const dateString = record.creado_en || record.fecha || record.created_at;
    if (!dateString) return false;
    const value = new Date(dateString);
    if (Number.isNaN(value.getTime())) return false;
    const diff = (Date.now() - value.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= RECENT_DAYS;
}

function isKommoClient(record) {
    return safeText(record.id_kommo).trim() !== '';
}

function hasPendingStatus(record) {
    const status = safeText(record.estado_cliente).trim().toLowerCase();
    if (status === '' || status === 'nuevo') return true;
    return /pendiente|por validar|sin validar|espera|pending/.test(status);
}

function isRecentCandidate(record) {
    return hasPendingStatus(record) && isRecentClient(record);
}

function updateFilters() {
    searchTerm = document.getElementById('searchInputClientes').value.toLowerCase().trim();
}

function getClientsPageBounds(page) {
    const safePage = Math.max(1, page);
    const from = (safePage - 1) * itemsPerPage;
    return { from, to: from + itemsPerPage - 1 };
}

function getRecentDateBounds() {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - RECENT_DAYS);
    return {
        start: start.toISOString(),
        end: end.toISOString(),
    };
}

async function loadGeoCatalog() {
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
        console.warn('No se pudo cargar catálogo geográfico en clientes:', error?.message || error);
    }
}

function buildClientsQuery() {
    let query = supabaseClient
        .from('clientes')
        .select('*', { count: 'exact' })
        .order('creado_en', { ascending: false, nullsFirst: false });

    if (activeTabClientes === 'recent') {
        const { start, end } = getRecentDateBounds();
        query = query
            .gte('creado_en', start)
            .lt('creado_en', end)
            .or('estado_cliente.is.null,estado_cliente.eq.,estado_cliente.ilike.%nuevo%,estado_cliente.ilike.%pendiente%,estado_cliente.ilike.%por validar%,estado_cliente.ilike.%sin validar%,estado_cliente.ilike.%espera%,estado_cliente.ilike.%pending%');
    }

    if (searchTerm) {
        const term = searchTerm.replace(/[%(),]/g, ' ').trim();
        if (term) {
            query = query.or([
                `nombre.ilike.%${term}%`,
                `email.ilike.%${term}%`,
                `telefono.ilike.%${term}%`,
                `canal_adquisicion.ilike.%${term}%`,
                `ciudad.ilike.%${term}%`,
                `estado.ilike.%${term}%`,
                `cpf.ilike.%${term}%`,
                `id_kommo.ilike.%${term}%`,
            ].join(','));
        }
    }

    return query;
}

async function fetchClientsPage(page = currentPage) {
    const requestToken = ++clientsFetchToken;
    const targetPage = Math.max(1, page);
    const { from, to } = getClientsPageBounds(targetPage);

    try {
        setStatus('loading', 'Cargando clientes...');
        const { data, error, count } = await buildClientsQuery().range(from, to);
        if (requestToken !== clientsFetchToken) return;
        if (error) throw error;

        clients = data || [];
        totalClientsCount = Number(count || 0);
        totalClientsPages = Math.max(1, Math.ceil(totalClientsCount / itemsPerPage));
        currentPage = Math.min(targetPage, totalClientsPages);

        if (targetPage > totalClientsPages && totalClientsCount > 0) {
            await fetchClientsPage(totalClientsPages);
            return;
        }

        renderTableClientes();
        setStatus('live', 'Conectado');
    } catch (error) {
        if (requestToken === clientsFetchToken) {
            console.error('fetchClientes error:', error);
            setStatus('error', error?.message || 'Error al cargar clientes');
        }
    }
}

function refreshClientsPage(page = currentPage) {
    return fetchClientsPage(page);
}

function goToClientsPage(page) {
    const targetPage = Math.min(Math.max(1, page), Math.max(1, totalClientsPages));
    currentPage = targetPage;
    refreshClientsPage(targetPage);
}

function filterClients() {
    let rows = [...clients];
    if (activeTabClientes === 'recent') {
        rows = rows.filter(isRecentCandidate);
    }
    return rows;
}

function buildCell(value) {
    return `<td><div>${escapeHtml(value)}</div></td>`;
}

function renderTableClientes() {
    const container = document.getElementById('clientesTabla');
    const rows = filterClients();
    if (!container) return;

    if (!rows.length) {
        container.innerHTML = '<tr><td colspan="13" style="text-align:center; padding: 24px; color: #6b6b6b;">No se encontraron clientes para esta vista.</td></tr>';
        renderPagination(totalClientsCount);
        return;
    }

    container.innerHTML = rows.map(record => {
        const keyValue = getPrimaryKeyValue(record);
        const keyName = getPrimaryKeyName(record);
        const cells = CLIENT_TABLE_FIELDS.map(field => buildCell(record[field])).join('');
        const badge = isKommoClient(record) ? '<span class="pill">Kommo</span>' : '';
        const pendingBadge = isRecentCandidate(record) ? '<span class="pill" style="background:#FEF3C7;color:#92400E;">Pendiente</span>' : '';
        const validatedBadge = !isRecentCandidate(record) && safeText(record.estado_cliente).trim() !== ''
            ? '<span class="pill pill-validated">Validado</span>'
            : '';
        const editButton = `<button type="button" class="button secondary" data-action="edit" data-key-name="${escapeHtml(keyName)}" data-key-value="${escapeHtml(keyValue)}">Editar</button>`;
        const deleteButton = `<button type="button" class="button danger" data-action="delete" data-key-name="${escapeHtml(keyName)}" data-key-value="${escapeHtml(keyValue)}">Borrar</button>`;

        return `<tr data-key-name="${escapeHtml(keyName)}" data-key-value="${escapeHtml(keyValue)}">${cells}<td class="actions-cell">${badge}${pendingBadge}${validatedBadge}${editButton}${deleteButton}</td></tr>`;
    }).join('');

    renderPagination(totalClientsCount);
}

function renderPagination(totalItems) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;
    totalClientsPages = Math.max(1, Math.ceil((totalItems || 0) / itemsPerPage) || 1);
    if (currentPage > totalClientsPages) currentPage = Math.max(totalClientsPages, 1);

    const hasRows = totalItems > 0 && clients.length > 0;
    const startItem = hasRows ? ((currentPage - 1) * itemsPerPage) + 1 : 0;
    const endItem = hasRows ? Math.min(startItem + clients.length - 1, totalItems) : 0;
    const statusText = totalItems > 0
        ? `Página ${currentPage} de ${totalClientsPages} · ${startItem}-${endItem} de ${totalItems}`
        : 'Sin registros';

    paginationContainer.innerHTML = `
        <button type="button" class="page-button" data-page-nav="prev" ${currentPage <= 1 ? 'disabled' : ''}>Anterior</button>
        <span class="page-status" style="align-self:center; padding:0 12px; color:#475569; font-size:13px;">${escapeHtml(statusText)}</span>
        <button type="button" class="page-button" data-page-nav="next" ${currentPage >= totalClientsPages ? 'disabled' : ''}>Siguiente</button>
    `;
}

function setActiveTabClientes(tab) {
    activeTabClientes = tab;
    currentPage = 1;
    document.querySelectorAll('#view-clientes [data-tab]').forEach(button => {
        const isActive = button.dataset.tab === tab;
        button.classList.toggle('active', isActive);
    });
    return refreshClientsPage(1);
}

function validateEstadoCiudad(payload) {
    const uf = toUpperValue(payload.estado);
    const cidade = toUpperValue(payload.ciudad);
    if (!uf || !cidade || !estadosBr.length) return true;
    const validUf = estadosBr.some(item => toUpperValue(item.uf) === uf);
    if (!validUf) return false;
    const cities = cidadesByUf.get(uf) || [];
    return cities.includes(cidade);
}

function parseNumericValue(value) {
    const parsed = Number(String(value).replace(/[^0-9.,-]/g, '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : value;
}

async function saveClient(keyName, keyValue, updates) {
    try {
        const record = getRecordByPrimaryKey(keyName, keyValue);
        if (!record) { setStatus('error', 'Cliente no encontrado'); return false; }

        const isPending = /^(|pendiente|pendente|nuevo|novo|por validar|sin validar|espera|pending)$/i;
        if (isPending.test(safeText(record.estado_cliente).trim()) || isPending.test(safeText(updates.estado_cliente).trim())) {
            updates.estado_cliente = 'VALIDADO';
        }

        if (updates.valor_total) {
            updates.valor_total = parseNumericValue(updates.valor_total);
        }

        const cleanedUpdates = {};
        const allowedFields = new Set(CLIENT_FORM_FIELDS);
        Object.entries(updates).forEach(([field, value]) => {
            if (!allowedFields.has(field)) return;
            let normalized = normalizeField(field, value);
            if (normalized === '') normalized = null;
            const orig = record[field] == null ? null : String(record[field]).trim();
            const next = normalized == null ? null : String(normalized).trim();
            if (orig !== next) cleanedUpdates[field] = normalized;
        });

        if (!Object.keys(cleanedUpdates).length) { setStatus('live', 'Sin cambios'); return true; }
        if (!validateEstadoCiudad(cleanedUpdates)) {
            setStatus('error', 'Estado/Ciudad inválidos para Brasil.');
            return false;
        }

        const updateKey = 'id';
        const matchValue = Number(record.id);

        setStatus('loading', 'Guardando...');
        const { data: updatedRows, error } = await supabaseClient
            .from('clientes')
            .update(cleanedUpdates)
            .match({ [updateKey]: matchValue })
            .select();

        if (error) throw error;
        if (!updatedRows?.length) throw new Error('No se actualizó ningún registro');

        const idx = clients.indexOf(record);
        if (idx >= 0) clients[idx] = updatedRows[0];
        await fetchClientsPage(currentPage);
        setStatus('live', 'Guardado');
        return true;
    } catch (error) {
        console.error('saveClient error:', error);
        setStatus('error', error?.message || 'Error al guardar');
        return false;
    }
}

async function createCliente(updates) {
    try {
        const cleanedUpdates = {};
        const allowedFields = new Set(CLIENT_FORM_FIELDS);
        for (const [field, newValue] of Object.entries(updates)) {
            if (!allowedFields.has(field)) continue;
            let normalized = normalizeField(field, newValue);
            if (normalized === '') normalized = null;
            cleanedUpdates[field] = normalized;
        }

        const now = new Date().toISOString();
        cleanedUpdates.fecha = cleanedUpdates.fecha || now;
        cleanedUpdates.creado_en = cleanedUpdates.creado_en || now;
        cleanedUpdates.valor_total = cleanedUpdates.valor_total != null ? parseNumericValue(cleanedUpdates.valor_total) : cleanedUpdates.valor_total;

        if (!validateEstadoCiudad(cleanedUpdates)) {
            setStatus('error', 'Estado/Ciudad inválidos para Brasil.');
            return false;
        }

        setStatus('loading', 'Guardando...');

        const { data: newRows, error } = await supabaseClient
            .from('clientes')
            .insert([cleanedUpdates])
            .select();

        if (error) throw error;
        if (!newRows?.length) throw new Error('No se pudo crear el cliente');
        clients.unshift(newRows[0]);

        await fetchClientsPage(1);
        setStatus('live', 'Cliente creado');
        return true;
    } catch (error) {
        console.error('Error en createCliente:', error);
        setStatus('error', error?.message || 'Error al crear cliente');
        return false;
    }
}

async function deleteCliente(keyName, keyValue) {
    try {
        const record = getRecordByPrimaryKey(keyName, keyValue);
        if (!record) {
            setStatus('error', 'Cliente no encontrado');
            return false;
        }

        console.log('Attempting to delete client with id:', record.id);

        const label = safeText(record.nombre).trim() || safeText(record.email).trim() || safeText(record.id_kommo).trim() || 'este cliente';
        if (!window.confirm(`Se borrará ${label}. Esta acción no se puede deshacer.`)) return false;

        setStatus('loading', 'Verificando cliente en base de datos...');
        const { data: existingClient, error: getError } = await supabaseClient
            .from('clientes')
            .select('id')
            .eq('id', record.id)
            .limit(1)
            .maybeSingle();

        if (getError) {
            console.error('Error checking client existence:', getError);
            setStatus('error', 'Error al verificar el cliente en la base de datos');
            return false;
        }
        if (!existingClient) {
            setStatus('error', 'Cliente no encontrado en la base de datos');
            return false;
        }

        setStatus('loading', 'Borrando cliente...');
        // Use eq for deletion
        const { data, error } = await supabaseClient
            .from('clientes')
            .delete()
            .eq('id', record.id)
            .select('id');

        if (error) {
            console.error('Supabase delete error:', error);
            throw error;
        }
        if (!data?.length) {
            const { data: stillThere, error: verifyError } = await supabaseClient
                .from('clientes')
                .select('id')
                .eq('id', record.id)
                .maybeSingle();
            if (verifyError) {
                console.warn('Post-delete verification error:', verifyError);
            }
            if (stillThere) {
                throw new Error('Supabase no eliminó el registro. Revisa la policy DELETE de public.clientes.');
            }
            throw new Error('No se pudo borrar el cliente en Supabase');
        }

        clients = clients.filter(item => String(item.id) !== String(record.id));
        renderTableClientes();
        await fetchClientsPage(currentPage);
        setStatus('live', 'Cliente borrado');
        return true;
    } catch (error) {
        console.error('deleteCliente error:', error);
        const message = error?.code === '23503'
            ? 'No se puede borrar el cliente porque tiene entradas relacionadas.'
            : (error?.message || 'Error al borrar cliente');
        setStatus('error', message);
        return false;
    }
}

function buildClientField(field, value = '') {
    const label = field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const normalizedValue = value == null ? '' : value;

    if (field === 'estado') {
        const options = ['<option value="">Seleccione estado</option>'].concat(
            estadosBr.map(item => {
                const uf = toUpperValue(item.uf);
                const selected = toUpperValue(normalizedValue) === uf ? 'selected' : '';
                return `<option value="${escapeHtml(uf)}" ${selected}>${escapeHtml(uf)} - ${escapeHtml(item.nome)}</option>`;
            })
        ).join('');
        return `<div class="modal-field">
            <label class="modal-label" for="modal_${field}">${label}</label>
            <select id="modal_${field}" class="editable-input" name="${field}">${options}</select>
        </div>`;
    }

    if (field === 'ciudad') {
        return `<div class="modal-field">
            <label class="modal-label" for="modal_${field}">${label}</label>
            <select id="modal_${field}" class="editable-input" name="${field}"><option value="">Seleccione ciudad</option></select>
        </div>`;
    }

    const isDate = field === 'fecha';
    const valueText = isDate ? formatDateForInput(normalizedValue) : normalizedValue;
    return `<div class="modal-field">
        <label class="modal-label" for="modal_${field}">${label}</label>
        <input id="modal_${field}" class="editable-input" name="${field}" type="${isDate ? 'date' : 'text'}" value="${escapeHtml(valueText)}">
    </div>`;
}

function refreshCiudadOptions(selectedCity = '') {
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

window.openNewClienteModal = function openNewClienteModal() {
    editModalClientData = { isNew: true };
    document.getElementById('editModalTitleClientes').textContent = 'Nuevo Cliente';
    const form = document.getElementById('editFormFieldsClientes');
    form.innerHTML = CLIENT_FORM_FIELDS.map(field => buildClientField(field, '')).join('');
    refreshCiudadOptions('');
    const modal = document.getElementById('editModalClientes');
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
};

function openEditModal(record) {
    if (!record) return;
    const keyName = getPrimaryKeyName(record);
    const keyValue = record[keyName];
    if (!keyName || keyValue == null) return;

    editModalClientData = { keyName, keyValue, record };
    document.getElementById('editModalTitleClientes').textContent = `Editar: ${safeText(record.nombre) || keyValue}`;

    const form = document.getElementById('editFormFieldsClientes');
    form.innerHTML = CLIENT_FORM_FIELDS.map(field => buildClientField(field, record[field])).join('');
    refreshCiudadOptions(record.ciudad);
    const modal = document.getElementById('editModalClientes');
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
}

function closeEditModal() {
    document.getElementById('editModalClientes').classList.add('hidden');
    document.getElementById('editModalClientes').setAttribute('aria-hidden', 'true');
    editModalClientData = null;
}

function setupEventsClientes() {
    document.getElementById('searchInputClientes')?.addEventListener('input', () => {
        updateFilters();
        currentPage = 1;
        refreshClientsPage(1);
    });

    document.getElementById('pagination')?.addEventListener('click', event => {
        const button = event.target.closest('button[data-page-nav]');
        if (!button || button.disabled) return;
        if (button.dataset.pageNav === 'prev') goToClientsPage(currentPage - 1);
        if (button.dataset.pageNav === 'next') goToClientsPage(currentPage + 1);
    });

    document.querySelectorAll('#view-clientes [data-tab]').forEach(button => {
        button.addEventListener('click', e => {
            e.stopPropagation();
            setActiveTabClientes(button.dataset.tab);
        });
    });

    document.getElementById('clientesTabla')?.addEventListener('click', event => {
        const button = event.target.closest('button');
        if (!button) return;
        const record = getRecordByPrimaryKey(button.dataset.keyName, button.dataset.keyValue);
        if (!record) return;
        if (button.dataset.action === 'edit') openEditModal(record);
        if (button.dataset.action === 'delete') deleteCliente(button.dataset.keyName, button.dataset.keyValue);
    });

    document.getElementById('editModalCloseClientes')?.addEventListener('click', closeEditModal);
    document.getElementById('editModalCancelClientes')?.addEventListener('click', closeEditModal);
    document.getElementById('editModalClientes')?.addEventListener('click', e => {
        if (e.target === e.currentTarget) closeEditModal();
    });

    document.getElementById('editModalFormClientes')?.addEventListener('change', event => {
        if (event.target?.id === 'modal_estado') refreshCiudadOptions('');
    });

    document.getElementById('editModalFormClientes')?.addEventListener('submit', async event => {
        event.preventDefault();
        if (!editModalClientData) return;
        const btn = event.submitter;
        if (btn) btn.classList.add('loading');

        const updates = {};
        document.querySelectorAll('#editModalFormClientes [name]').forEach(el => {
            updates[el.name] = el.value;
        });

        if (editModalClientData.isNew) {
            const ok = await createCliente(updates);
            if (ok) closeEditModal();
        } else {
            const ok = await saveClient(editModalClientData.keyName, editModalClientData.keyValue, updates);
            if (ok) closeEditModal();
        }

        if (btn) btn.classList.remove('loading');
    });
}

function setupRealtimeClientes() {
    if (!supabaseClient?.channel) return;
    supabaseClient.channel('clientes-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => refreshClientsPage(currentPage))
        .subscribe(status => {
            if (status === 'SUBSCRIBED') setStatus('live', 'En vivo');
            if (status === 'CHANNEL_ERROR') setStatus('error', 'Realtime desconectado');
        });
}

async function initClientes() {
    try {
        if (!cfg?.url || !cfg?.anonKey || cfg.url.includes('__SUPABASE')) {
            setStatus('error', 'Configura Supabase en config.js');
            return;
        }
        if (!window.supabase?.createClient) {
            setStatus('error', 'No se cargó el SDK de Supabase');
            return;
        }
        await loadGeoCatalog();
        setupEventsClientes();
        await setActiveTabClientes(activeTabClientes);
        setupRealtimeClientes();
    } catch (error) {
        console.error('init error:', error);
        setStatus('error', error?.message || 'Error al inicializar');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initClientes);
} else {
    initClientes();
}

window.setActiveTabClientes = setActiveTabClientes;
})();
