(() => {
// ============================================================

// Helper function para crear botones consistentemente
function createButton({ type = 'button', classes = '', text = '', dataset = {} }) {
  const ds = Object.entries(dataset).map(([k, v]) => `data-${k}="${v}"`).join(' ');
  return `<button type="${type}" class="${classes}" ${ds}>${text}</button>`;
}

const ENTRY_DISPLAY = ['fecha', 'cliente', 'servicio', 'valor', 'atendente', 'estado_tramite', 'operario'];
const ENTRY_EDITABLE = [
  { name: 'cliente',            label: 'Cliente',           type: 'text' },
  { name: 'nombre_pix',         label: 'Nombre PIX',        type: 'text' },
  { name: 'servicio',           label: 'Servicio',          type: 'text' },
  { name: 'valor',              label: 'Valor (R$)',        type: 'number' },
  { name: 'atendente',          label: 'Atendente',         type: 'text' },
  { name: 'operario',           label: 'Operario',          type: 'text' },
  { name: 'estado_tramite',     label: 'Estado Trámite',    type: 'select', options: ['pendiente', 'procesando', 'completada', 'cancelada'] },
  { name: 'fecha_completacion', label: 'Fecha Completación',type: 'date' },
  { name: 'telefono',           label: 'Teléfono',          type: 'text' },
  { name: 'email',              label: 'Email',             type: 'text' },
  { name: 'pais',               label: 'País',              type: 'text' },
  { name: 'ciudad',             label: 'Ciudad',            type: 'text' },
  { name: 'recorrencia',        label: 'Recurrencia',       type: 'text' },
  { name: 'cpf',                label: 'CPF',               type: 'text' },
  { name: 'observaciones',      label: 'Observaciones',     type: 'textarea' },
];

let entradas = [];
let activeTabEntradas = 'todas';
let editModalData = null;

// ── Helpers ──────────────────────────────────────────────────

function setStatus(state, text) {
  const badge = document.getElementById('statusBadge');
  if (!badge) return;
  badge.className = 'status-badge status-' + state;
  badge.textContent = text;
}

function safeText(v) {
  if (v === null || v === undefined) return '';
  return String(v);
}

function escapeHtml(v) {
  return safeText(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function norm(s) { return (s || '').toString().trim().toLowerCase(); }

function fmtDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateForInput(d) {
  if (!d) return '';
  const date = new Date(d);
  return isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function fmtValor(v) {
  const n = Number(v);
  if (isNaN(n)) return '—';
  return 'R$ ' + Math.round(n).toLocaleString('pt-BR');
}

function estadoBadge(estado) {
  const e = norm(estado) || 'pendiente';
  const labels = { pendiente: '🔴 Pendiente', procesando: '🟡 Procesando', completada: '🟢 Completada', cancelada: '⚫ Cancelada' };
  const safeClass = Object.prototype.hasOwnProperty.call(labels, e) ? e : 'pendiente';
  return `<span class="badge-estado badge-${safeClass}">${escapeHtml(labels[e] || e)}</span>`;
}

// ── Filters ──────────────────────────────────────────────────

function getFilters() {
  return {
    search: (document.getElementById('searchInputEntradas')?.value || '').toLowerCase().trim(),
    mes: parseInt(document.getElementById('filtroMesEntradas')?.value || '0', 10),
    atendente: document.getElementById('filtroAtendenteEntradas')?.value || 'todos',
  };
}

function filterEntradas() {
  const f = getFilters();
  let rows = [...entradas];

  // Tab filter
  if (activeTabEntradas !== 'todas') {
    rows = rows.filter(e => norm(e.estado_tramite) === activeTabEntradas);
  }

  // Month filter
  if (f.mes > 0) {
    rows = rows.filter(e => e.mes === f.mes);
  }

  // Atendente filter
  if (f.atendente !== 'todos') {
    rows = rows.filter(e => norm(e.atendente) === norm(f.atendente));
  }

  // Search
  if (f.search) {
    rows = rows.filter(e => {
      const text = [e.cliente, e.servicio, e.atendente, e.operario, e.nombre_pix, e.observaciones]
        .map(v => safeText(v).toLowerCase()).join(' ');
      return text.includes(f.search);
    });
  }

  return rows;
}

// ── Summary Cards ────────────────────────────────────────────

function renderSummary() {
  const total = entradas.length;
  const pendientes = entradas.filter(e => norm(e.estado_tramite) === 'pendiente').length;
  const procesando = entradas.filter(e => norm(e.estado_tramite) === 'procesando').length;
  const completadas = entradas.filter(e => norm(e.estado_tramite) === 'completada').length;
  const canceladas = entradas.filter(e => norm(e.estado_tramite) === 'cancelada').length;
  const valorTotal = entradas.filter(e => norm(e.estado_tramite) === 'completada').reduce((a, e) => a + (Number(e.valor) || 0), 0);
  const valorPipeline = entradas.filter(e => norm(e.estado_tramite) === 'pendiente' || norm(e.estado_tramite) === 'procesando').reduce((a, e) => a + (Number(e.valor) || 0), 0);
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

  document.getElementById('summaryGrid').innerHTML = cards.map(c =>
    `<div class="summary-card">
      <div class="summary-label">${c.label}</div>
      <div class="summary-value ${c.cls || ''}">${c.value}</div>
    </div>`
  ).join('');
}

// ── Table Rendering ──────────────────────────────────────────

function renderTableEntradas() {
  const container = document.getElementById('entradasTabla');
  const rows = filterEntradas();

  if (!rows.length) {
    container.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:24px; color:#6b6b6b;">No se encontraron entradas para esta vista.</td></tr>';
    return;
  }

  container.innerHTML = rows.map(e => {
    const clienteName = e.cliente || '—';
    const editButton = createButton({
      classes: 'button secondary',
      text: 'Editar',
      dataset: {
        action: 'edit',
        id: e.id
      }
    });
    return `<tr data-id="${e.id}">
      <td>${fmtDate(e.fecha)}</td>
      <td style="font-weight:500">${escapeHtml(clienteName)}</td>
      <td>${escapeHtml(e.servicio || '—')}</td>
      <td>${fmtValor(e.valor)}</td>
      <td>${escapeHtml(e.atendente || '—')}</td>
      <td>${estadoBadge(e.estado_tramite)}</td>
      <td>${escapeHtml(e.operario || '—')}</td>
      <td class="actions-cell">${editButton}</td>
    </tr>`;
  }).join('');
}

// ── Tabs ─────────────────────────────────────────────────────

function setActiveTab(tab) {
  activeTabEntradas = tab;
  document.querySelectorAll('.tabs-4 .tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  renderTableEntradas();
}

// ── Populate Atendente Filter ────────────────────────────────

function populateAtendenteFilter() {
  const atSelect = document.getElementById('filtroAtendenteEntradas');
  const current = atSelect.value;
  const atendenteSet = new Set();
  entradas.forEach(e => {
    const at = (e.atendente || '').trim();
    if (at) atendenteSet.add(at);
  });
  const sorted = [...atendenteSet].sort();
  atSelect.innerHTML = '<option value="todos">Todos atendentes</option>';
  sorted.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = a;
    if (a === current) opt.selected = true;
    atSelect.appendChild(opt);
  });
}

// ── Fetch Data ───────────────────────────────────────────────

async function fetchEntradas() {
  try {
    setStatus('loading', 'Cargando entradas...');
     const { data, error } = await supabaseClient
  .from('entradas')
  .select('*')
  .order('creado_en', { ascending: false })
  .limit(10000);
    if (error) throw error;
    entradas = data || [];
    populateAtendenteFilter();
    renderSummary();
    renderTableEntradas();
    setStatus('live', 'Conectado');
  } catch (error) {
    console.error('fetchEntradas error:', error);
    setStatus('error', error?.message || 'Error al cargar entradas');
  }
}

// ── Edit Modal ───────────────────────────────────────────────

window.openNewEntradaModal = function() {
  editModalData = { isNew: true };
  document.getElementById('editModalTitleEntradas').textContent = 'Nueva Entrada';
  renderEditForm({}); // Empty form
  const modal = document.getElementById('editModalEntradas');
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
};

function openEditModal(record) {
  if (!record) {
    setStatus('error', 'Entrada no encontrada');
    return;
  }

  editModalData = { id: record.id, record };
  document.getElementById('editModalTitleEntradas').textContent = `Editar: ${safeText(record.servicio) || 'Entrada'} — ${safeText(record.cliente) || 'Sin cliente'}`;
  renderEditForm(record);
  const modal = document.getElementById('editModalEntradas');
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeEditModal() {
  const modal = document.getElementById('editModalEntradas');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  editModalData = null;
}

function renderEditForm(record) {
  const form = document.getElementById('editFormFieldsEntradas');
  const html = ENTRY_EDITABLE.map(field => {
    const value = record[field.name];
    let input = '';

    if (field.type === 'select') {
      const opts = field.options.map(o =>
        `<option value="${o}" ${norm(value) === o ? 'selected' : ''}>${o.charAt(0).toUpperCase() + o.slice(1)}</option>`
      ).join('');
      input = `<select id="modal_${field.name}" name="${field.name}">${opts}</select>`;
    } else if (field.type === 'textarea') {
      input = `<textarea id="modal_${field.name}" name="${field.name}">${escapeHtml(value)}</textarea>`;
    } else if (field.type === 'date') {
      input = `<input id="modal_${field.name}" name="${field.name}" type="date" value="${fmtDateForInput(value)}">`;
    } else if (field.type === 'number') {
      input = `<input id="modal_${field.name}" name="${field.name}" type="number" step="0.01" value="${escapeHtml(value)}">`;
    } else {
      input = `<input id="modal_${field.name}" name="${field.name}" type="text" value="${escapeHtml(value)}">`;
    }

    return `<div class="modal-field">
      <label class="modal-label" for="modal_${field.name}">${field.label}</label>
      ${input}
    </div>`;
  }).join('');

  // Use 2-column grid for the form
  form.innerHTML = `<div class="modal-grid-2">${html}</div>`;
}

// ── Save Entry ───────────────────────────────────────────────

async function saveEntrada(id, updates) {
  try {
    const record = entradas.find(e => e.id === id);
    if (!record) {
      setStatus('error', 'Entrada no encontrada');
      return;
    }

    // Build clean updates (only changed fields)
    const cleanedUpdates = {};
    const changes = [];

    const allowedFields = new Set(ENTRY_EDITABLE.map(field => field.name));
    for (const [field, newValue] of Object.entries(updates)) {
      if (!allowedFields.has(field)) continue;
      let cleaned = typeof newValue === 'string' ? newValue.trim() : newValue;
      if (cleaned === '') cleaned = null;

      const oldValue = record[field];
      const oldStr = oldValue === null || oldValue === undefined ? null : String(oldValue).trim();
      const newStr = cleaned === null ? null : String(cleaned).trim();

      if (oldStr !== newStr) {
        cleanedUpdates[field] = cleaned;
        changes.push({ campo: field, valor_anterior: oldStr, valor_nuevo: newStr });
      }
    }

    if (!Object.keys(cleanedUpdates).length) {
      setStatus('live', 'Sin cambios');
      return;
    }

    // If estado_tramite changed to 'completada', auto-set fecha_completacion
    if (cleanedUpdates.estado_tramite === 'completada' && !cleanedUpdates.fecha_completacion) {
      cleanedUpdates.fecha_completacion = new Date().toISOString();
    }

    // Parse valor to number if present
    if (cleanedUpdates.valor !== undefined && cleanedUpdates.valor !== null) {
      const parsed = Number(String(cleanedUpdates.valor).replace(/[^0-9.,-]/g, '').replace(',', '.'));
      if (Number.isFinite(parsed)) cleanedUpdates.valor = parsed;
    }

    setStatus('loading', 'Guardando...');

    // 1. Update the entry
    const { data: updatedRows, error } = await supabaseClient
      .from('entradas')
      .update(cleanedUpdates)
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!updatedRows || updatedRows.length === 0) {
      throw new Error('No se actualizó ningún registro. Revisa permisos RLS.');
    }

    // 2. Insert historial_cambios for each change
    if (changes.length > 0) {
      const historialRows = changes.map(c => ({
        id_entrada: id,
        id_cliente: record.id_cliente || null,
        campo: c.campo,
        valor_anterior: c.valor_anterior,
        valor_nuevo: c.valor_nuevo,
        usuario: 'dashboard',
        razon: 'Edición manual desde dashboard',
      }));

      const { error: histError } = await supabaseClient
        .from('historial_cambios')
        .insert(historialRows);

      if (histError) console.warn('Error insertando historial:', histError);
    }

    // 3. Update local data
    const idx = entradas.findIndex(e => e.id === id);
    if (idx >= 0) entradas[idx] = updatedRows[0];

    renderSummary();
    renderTableEntradas();
    setStatus('live', 'Cambios guardados');
  } catch (error) {
    console.error('Error en saveEntrada:', error);
    setStatus('error', error?.message || 'Error al guardar');
  }
}

async function createEntrada(updates) {
  try {
    const cleanedUpdates = {};
    const allowedFields = new Set(ENTRY_EDITABLE.map(field => field.name));
    for (const [field, newValue] of Object.entries(updates)) {
      if (!allowedFields.has(field)) continue;
      let cleaned = typeof newValue === 'string' ? newValue.trim() : newValue;
      if (cleaned === '') cleaned = null;
      cleanedUpdates[field] = cleaned;
    }
    
    const now = new Date();
    cleanedUpdates.creado_en = now.toISOString();
    cleanedUpdates.ano = now.getFullYear();
    cleanedUpdates.mes = now.getMonth() + 1;

    if (cleanedUpdates.valor !== undefined && cleanedUpdates.valor !== null) {
      const parsed = Number(String(cleanedUpdates.valor).replace(/[^0-9.,-]/g, '').replace(',', '.'));
      if (Number.isFinite(parsed)) cleanedUpdates.valor = parsed;
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
    
    if (newRows && newRows.length > 0) {
      entradas.unshift(newRows[0]);
    }

    renderSummary();
    renderTableEntradas();
    setStatus('live', 'Entrada creada');
  } catch (error) {
    console.error('Error en createEntrada:', error);
    setStatus('error', error?.message || 'Error al crear');
  }
}

// ── Events ───────────────────────────────────────────────────

function setupEventsEntradas() {
  // Search
  document.getElementById('searchInputEntradas').addEventListener('input', () => renderTableEntradas());

  // Filters
  document.getElementById('filtroMesEntradas').addEventListener('change', () => renderTableEntradas());
  document.getElementById('filtroAtendenteEntradas').addEventListener('change', () => renderTableEntradas());

  // Tabs
  document.querySelectorAll('.tabs-4 .tab').forEach(btn => {
    btn.addEventListener('click', () => setActiveTab(btn.dataset.tab));
  });

  // Table click delegation
  document.getElementById('entradasTabla').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.action === 'edit') {
      const id = Number(button.dataset.id);
      const record = entradas.find(e => e.id === id);
      if (record) openEditModal(record);
    }
  });

  document.getElementById('editModalCloseEntradas').addEventListener('click', closeEditModal);
  document.getElementById('editModalCancelEntradas').addEventListener('click', closeEditModal);
  document.getElementById('editModalEntradas').addEventListener('click', event => {
    if (event.target === event.currentTarget) closeEditModal();
  });

  document.getElementById('editModalFormEntradas').addEventListener('submit', async event => {
    event.preventDefault();
    if (!editModalData) return;

    const btn = event.submitter;
    if (btn) btn.classList.add('loading');

    const updates = {};
    document.querySelectorAll('#editModalFormEntradas [name]').forEach(el => {
      updates[el.name] = el.value;
    });

    if (editModalData.isNew) {
      await createEntrada(updates);
    } else {
      await saveEntrada(editModalData.id, updates);
    }
    
    if (btn) btn.classList.remove('loading');
    closeEditModal();
  });
}

// ── Realtime ─────────────────────────────────────────────────

function setupRealtimeEntradas() {
  supabaseClient.channel('entradas-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'entradas' }, () => fetchEntradas())
    .subscribe(status => {
      if (status === 'SUBSCRIBED') setStatus('live', 'En vivo');
      if (status === 'CHANNEL_ERROR') setStatus('error', 'Realtime desconectado');
    });
}

// ── Init ─────────────────────────────────────────────────────

async function initEntradas() {
  try {
    const cfg = window.SUPABASE_CONFIG;
    if (!cfg?.url || !cfg?.anonKey || cfg.url.includes('__SUPABASE')) {
      setStatus('error', 'Configura Supabase en config.js');
      return;
    }
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      setStatus('error', 'No se cargó el SDK de Supabase');
      return;
    }

    // Use global supabaseClient initialized in app.js
    setupEventsEntradas();
    await fetchEntradas();
    setupRealtimeEntradas();
  } catch (error) {
    console.error('Error en init:', error);
    setStatus('error', error?.message || 'Error al inicializar');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEntradas);
} else {
  initEntradas();
}
// Corrección general para borrar entradas con validación de resultado Supabase v2
async function deleteEntrada(id) {
  try {
    const { data, error } = await supabaseClient
      .from('entradas')
      .delete()
      .eq('id', id);

    if (error) throw error;
    // En Supabase v2, data puede ser arreglo vacío indicando éxito
  } catch (error) {
    console.error('deleteEntrada error:', error);
    throw error;
  }
}

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

})();
