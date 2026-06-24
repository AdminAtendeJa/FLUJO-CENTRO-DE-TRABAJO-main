
// Manejo opcional para carga segura catálogo estados_br que puede faltar
async function loadGeoCatalog() {
  try {
    const { data, error } = await supabaseClient
      .from('estados_br')
      .select('uf,nome')
      .eq('ativo', true)
      .order('nome', { ascending: true });

    if (error) {
      console.warn('Catálogo estados_br no disponible:', error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn('Error al cargar catálogo estados_br', e.message);
    return [];
  }
}

// Reemplazar llamada original a loadGeoCatalog por esta versión segura
window.loadGeoCatalog = loadGeoCatalog;

(() => {
// Código actualizado de clientes.js con paginación

// Helper function para crear botones consistentemente
function createButton({ type = 'button', classes = '', text = '', dataset = {} }) {
    const ds = Object.entries(dataset).map(([k, v]) => `data-${k}="${v}"`).join(' ');
    return `<button type="${type}" class="${classes}" ${ds}>${text}</button>`;
}

const CLIENT_FIELDS = ['fecha', 'id_kommo', 'cpf', 'nombre', 'telefono', 'email', 'valor_total', 'pais', 'ciudad', 'estado', 'canal_adquisicion', 'atendente', 'policia_federal', 'tramite', 'valor_pago_inicial', 'fecha_entrada_cliente', 'recurrencia', 'estado_cliente', 'fecha_ultimo_contacto', 'cantidad_tramites', 'actualizado_en', 'estado_federal'];
const RECENT_DAYS = 7;

let clients = [];
let activeTabClientes = 'recent';
let editModalClientData = null;
let searchTerm = '';
let currentPage = 1;
const itemsPerPage = 10;

function setStatus(state, text) {
    const badge = document.getElementById('statusBadge');
    if (!badge) return;
    badge.className = 'status-badge status-' + state;
    badge.textContent = text;
}

function safeText(value) {
    if (value === null || value === undefined) return '';
    return String(value);
}

function escapeHtml(value) {
    return safeText(value)
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#39;');
}

function formatDateForInput(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function getPrimaryKeyName(record) {
    const candidateKeys = ['id', 'uuid', 'uid', 'id_cliente', 'cliente_id', 'id_kommo'];
    return candidateKeys.find(key => {
        if (!Object.prototype.hasOwnProperty.call(record, key)) return false;
        const value = record[key];
        return value !== null && value !== undefined && String(value).trim() !== '';
    });
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

function filterClients() {
    if (activeTabClientes === 'all') {
        return clients.filter(record =>
            CLIENT_FIELDS.some(field => safeText(record[field]).toLowerCase().includes(searchTerm))
        );
    }

    let rows = [...clients];
    if (activeTabClientes === 'recent') {
        rows = rows.filter(isRecentCandidate);
    }
    if (searchTerm) {
        rows = rows.filter(record =>
            CLIENT_FIELDS.some(field => safeText(record[field]).toLowerCase().includes(searchTerm))
        );
    }
    return rows;
}

function buildCell(value, name) {
    return `<td><div>${escapeHtml(value)}</div></td>`;
}

function renderTableClientes() {
    const container = document.getElementById('clientesTabla');
    const rows = filterClients();
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedRows = rows.slice(start, end);

    if (!container) return;

    if (!paginatedRows.length) {
        container.innerHTML = '<tr><td colspan="13" style="text-align:center; padding: 24px; color: #6b6b6b;">No se encontraron clientes para esta vista.</td></tr>';
        return;
    }

    container.innerHTML = paginatedRows.map(record => {
        const keyValue = getPrimaryKeyValue(record);
        const keyName = getPrimaryKeyName(record);
        const cells = CLIENT_FIELDS.map(field => buildCell(record[field], field)).join('');
        const badge = isKommoClient(record) ? '<span class="pill">Kommo</span>' : '';
        const pendingBadge = isRecentCandidate(record) ? '<span class="pill" style="background:#FEF3C7;color:#92400E;">Pendiente</span>' : '';
        const validatedBadge = !isRecentCandidate(record) && safeText(record.estado_cliente).trim() !== ''
            ? '<span class="pill pill-validated">Validado</span>'
            : '';
        const editButton = createButton({
            classes: 'button secondary',
            text: 'Editar',
            dataset: {
                action: 'edit',
                'key-name': escapeHtml(keyName),
                'key-value': escapeHtml(keyValue)
            }
        });

        return `<tr data-key-name="${escapeHtml(keyName)}" data-key-value="${escapeHtml(keyValue)}">${cells}<td class="actions-cell">${badge}${pendingBadge}${validatedBadge}${editButton}</td></tr>`;
    }).join('');

    renderPagination(rows.length);
}

function renderPagination(totalItems) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (currentPage > totalPages) currentPage = Math.max(totalPages, 1);
    
    paginationContainer.innerHTML = Array.from({ length: totalPages }, (_, i) => `
        <button class="page-button ${currentPage === i + 1 ? 'active' : ''}" data-page="${i + 1}">${i + 1}</button>
    `).join('');
    
    document.querySelectorAll('.page-button').forEach(button => {
        button.addEventListener('click', () => {
            currentPage = Number(button.dataset.page);
            renderTableClientes();
        });
    });
}

function setActiveTabClientes(tab) {
    activeTabClientes = tab;
    currentPage = 1;
    document.querySelectorAll('#view-clientes .tab').forEach(button => {
        const isActive = button.dataset.tab === tab;
        button.classList.toggle('active', isActive);
    });
    renderTableClientes();
}

async function fetchClients() {
  try {
    setStatus('loading', 'Cargando clientes...');
    const { data, error } = await supabaseClient
      .from('clientes')
      .select('*')
      .order('fecha', { ascending: false, nullsFirst: false })
      .limit(5000);

    if (error) throw error;
    clients = data || [];
    renderTableClientes();
    setStatus('live', 'Conectado');
  } catch (error) {
    console.error('fetchClients error:', error);
    setStatus('error', error?.message || 'Error al cargar clientes');
  }
}

async function saveClient(keyName, keyValue, updates) {
    try {
        const record = getRecordByPrimaryKey(keyName, keyValue);
        if (!record) { setStatus('error', 'Cliente no encontrado'); return; }

        const isPending = /^(|pendiente|pendente|nuevo|novo|por validar|sin validar|espera|pending)$/i;
        if (isPending.test(safeText(record.estado_cliente).trim()) || isPending.test(safeText(updates.estado_cliente).trim())) {
            updates.estado_cliente = 'Validado';
        }

        // Procesar valor_total para sumar al valor actual
        if (updates.valor_total) {
            const increment = Number(updates.valor_total.toString().replace(/[^0-9.,-]/g, '').replace(',', '.'));
            if (Number.isFinite(increment)) {
                const currentVal = Number(record.valor_total) || 0;
                updates.valor_total = currentVal + increment;
            } else {
                updates.valor_total = record.valor_total;
            }
        }

        // Incrementar recurrencia en 1 automáticamente
        if (updates.recurrencia !== undefined) {
            const currentRec = Number(record.recurrencia) || 0;
            updates.recurrencia = currentRec + 1;
        }

        const cleanedUpdates = {};
        const allowedFields = new Set(CLIENT_FIELDS);
        Object.entries(updates).forEach(([field, value]) => {
            if (!allowedFields.has(field)) return;
            let v = typeof value === 'string' ? value.trim() : value;
            if (v === '') v = null;
            const orig = record[field] == null ? null : String(record[field]).trim();
            const nw = v === null ? null : String(v).trim();
            if (orig !== nw) cleanedUpdates[field] = v;
        });

        if (!Object.keys(cleanedUpdates).length) { setStatus('live', 'Sin cambios'); return; }

        const updateKey = record.id != null ? 'id' : keyName;
        const matchValue = updateKey === 'id' ? Number(record.id) : record[keyName] || keyValue;

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
        renderTableClientes();
        setStatus('live', 'Guardado');
    } catch (error) {
        console.error('saveClient error:', error);
        setStatus('error', error?.message || 'Error al guardar');
    }
}

async function createCliente(updates) {
  try {
    const cleanedUpdates = {};
    const allowedFields = new Set(CLIENT_FIELDS);
    for (const [field, newValue] of Object.entries(updates)) {
      if (!allowedFields.has(field)) continue;
      let cleaned = typeof newValue === 'string' ? newValue.trim() : newValue;
      if (cleaned === '') cleaned = null;

      // Special handling: parse numeric fields
      if (field === 'valor_total' || field === 'valor_pago_inicial') {
        const parsed = Number(String(cleaned).replace(/[^0-9.,-]/g, '').replace(',', '.'));
        if (Number.isFinite(parsed)) cleaned = parsed;
      }

      cleanedUpdates[field] = cleaned;
    }

    cleanedUpdates.fecha = new Date().toISOString();

    setStatus('loading', 'Guardando...');

    const { data: newRows, error } = await supabaseClient
      .from('clientes')
      .insert([cleanedUpdates])
      .select();

    if (error) throw error;

    if (newRows && newRows.length > 0) {
      clients.unshift(newRows[0]);
    }

    renderTableClientes();
    setStatus('live', 'Cliente creado');
  } catch (error) {
    console.error('Error en createCliente:', error);
    setStatus('error', error?.message || 'Error al crear cliente');
  }
}

window.openNewClienteModal = function() {
  editModalClientData = { isNew: true };
  document.getElementById('editModalTitleClientes').textContent = 'Nuevo Cliente';

  const form = document.getElementById('editFormFieldsClientes');
  const html = CLIENT_FIELDS.map(f => {
    const isDate = (f === 'fecha' || f === 'fecha_entrada_cliente' || f === 'fecha_ultimo_contacto' || f === 'actualizado_en');
    const inputType = isDate ? 'date' : ['valor_total', 'valor_pago_inicial'].includes(f) ? 'number' : 'text';
    return `
      <div class="modal-field">
        <label class="modal-label">${f.toUpperCase().replace('_', ' ')}</label>
        <input name="${f}" type="${inputType}" value="">
      </div>`;
  }).join('');
  form.innerHTML = html;

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
    form.innerHTML = CLIENT_FIELDS.map(field => {
        const label = field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const isDate = field === 'fecha';
        const val = isDate ? formatDateForInput(record[field]) : escapeHtml(record[field]);
        const isDisabled = (field === 'valor_total' || field === 'recurrencia');
        return `<div class="modal-field">
            <label class="modal-label" for="modal_${field}">${label}</label>
            <input id="modal_${field}" class="editable-input" name="${field}" type="${isDate ? 'date' : 'text'}" value="${val}" ${isDisabled ? 'disabled' : ''}>
        </div>`;
    }).join('');

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
    document.getElementById('searchInputClientes').addEventListener('input', () => {
        updateFilters();
        currentPage = 1;
        renderTableClientes();
    });

    document.querySelectorAll('#view-clientes .tab').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            setActiveTabClientes(button.dataset.tab);
        });
    });

    document.getElementById('clientesTabla').addEventListener('click', event => {
        const button = event.target.closest('button');
        if (!button || button.dataset.action !== 'edit') return;
        const record = getRecordByPrimaryKey(button.dataset.keyName, button.dataset.keyValue);
        if (record) openEditModal(record);
    });

    document.getElementById('editModalCloseClientes').addEventListener('click', closeEditModal);
    document.getElementById('editModalCancelClientes').addEventListener('click', closeEditModal);
    document.getElementById('editModalClientes').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeEditModal();
    });

    document.getElementById('editModalFormClientes').addEventListener('submit', async event => {
        event.preventDefault();
        if (!editModalClientData) return;
        const btn = event.submitter;
        if (btn) btn.classList.add('loading');

        const { keyName, keyValue } = editModalClientData;
        const updates = {};
        document.querySelectorAll('#editModalFormClientes [name]').forEach(el => {
            updates[el.name] = el.value;
        });

        if (editModalClientData.isNew) {
            await createCliente(updates);
        } else {
            await saveClient(keyName, keyValue, updates);
        }

        if (btn) btn.classList.remove('loading');
        closeEditModal();
    });
}

function setupRealtimeClientes() {
    supabaseClient.channel('clientes-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, fetchClients)
        .subscribe(status => {
            if (status === 'SUBSCRIBED') setStatus('live', 'En vivo');
            if (status === 'CHANNEL_ERROR') setStatus('error', 'Realtime desconectado');
        });
}

async function initClientes() {
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
        setupEventsClientes();
        await fetchClients();
        setActiveTabClientes(activeTabClientes);
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

        // Primero intentar desasociar entradas relacionadas (establecer id_cliente a null)
        setStatus('loading', 'Desasociando entradas relacionadas...');
        const { data: updateData, error: updateError } = await supabaseClient
            .from('entradas')
            .update({ id_cliente: null })
            .eq('id_cliente', record.id);

        if (updateError) {
            console.error('Error desasociando entradas:', updateError);
            setStatus('error', 'Error desasociando entradas relacionadas');
            return false;
        }

        // Ahora borrar el cliente
        setStatus('loading', 'Borrando cliente...');
        const { data, error, status } = await supabaseClient
            .from('clientes')
            .delete()
            .eq('id', record.id)
            .select();

        if (error) {
            console.error('Supabase delete error:', error);

            if (error.code === '23503') {
                setStatus('error', 'No se puede borrar el cliente porque tiene entradas relacionadas.');
                return false;
            }

            throw error;
        }
        if (status !== 204 && (!data || data.length === 0)) {
            setStatus('error', 'No se pudo borrar el cliente en Supabase');
            return false;
        }

        // Actualizar estado local
        clients = clients.filter(item => String(item.id) !== String(record.id));
        renderTableClientes();
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

})();
