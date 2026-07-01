// 1. Escuchar mensajes desde el Dashboard Web (localhost o dominio de producción)
window.addEventListener("message", (event) => {
  if (event.data && event.data.type === 'CUBANOS_BR_SYNC') {
    const clientData = event.data.clientData;
    console.log("Cubanos BR Auto-Fill: Datos recibidos del Dashboard", clientData);
    
    // Guardar en el storage de la extensión
    chrome.storage.local.set({ activeClient: clientData }, () => {
      console.log("Cliente activo guardado en la extensión:", clientData.nombre);
    });
  }
});

// 2. Función principal para rellenar campos
function predictValueForInput(input, data) {
  const nameAttr = (input.name || '').toLowerCase();
  const idAttr = (input.id || '').toLowerCase();
  let labelText = '';
  if (input.labels && input.labels.length > 0) {
    labelText = input.labels[0].textContent.toLowerCase();
  } else {
    const td = input.closest('td');
    if (td && td.previousElementSibling) {
      labelText = td.previousElementSibling.textContent.toLowerCase();
    } else if (input.parentElement && input.parentElement.previousElementSibling) {
      labelText = input.parentElement.previousElementSibling.textContent.toLowerCase();
    }
  }

  let fieldsetText = '';
  const fieldset = input.closest('fieldset');
  if (fieldset) {
    const legend = fieldset.querySelector('legend');
    if (legend) fieldsetText = legend.textContent.toLowerCase();
  }
  const panel = input.closest('.ui-panel, .ui-fieldset');
  if (panel) {
    const header = panel.querySelector('.ui-panel-title, .ui-fieldset-legend');
    if (header) fieldsetText += ' ' + header.textContent.toLowerCase();
  }

  const identifier = `${nameAttr} ${idAttr} ${labelText} ${fieldsetText}`.toLowerCase();

  let valueToInject = null;
  const getCustom = (keyword) => {
    const foundKey = Object.keys(data).find(k => k.replace(/\s|\./g, '').includes(keyword.replace(/\s|\./g, '')));
    return foundKey ? data[foundKey] : null;
  };

  if (identifier.includes('nome') || identifier.includes('name') || identifier.includes('nombre')) {
    if (!identifier.includes('mae') && !identifier.includes('pai') && !identifier.includes('filia') && !identifier.includes('madre') && !identifier.includes('padre')) {
      if (identifier.includes('sobrenome') || identifier.includes('apellido')) {
        if (data.apellidos) {
          valueToInject = data.apellidos;
        } else {
          const parts = (data.nombre || '').split(' ');
          valueToInject = parts.length > 1 ? parts.slice(1).join(' ') : data.nombre;
        }
      } else if (identifier.includes('completo')) {
        valueToInject = data.nombre;
      } else {
        if (data.nombres) {
          valueToInject = data.nombres;
        } else {
          valueToInject = (data.nombre || '').split(' ')[0];
        }
      }
    }
  }
  if (identifier.includes('cpf')) {
    let cpfVal = data.cpf || getCustom('cpf');
    if (cpfVal && cpfVal.length === 11 && !cpfVal.includes('.')) {
      cpfVal = cpfVal.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    valueToInject = cpfVal;
  }
  if (identifier.includes('mail') || identifier.includes('correo') || identifier.includes('eletrônico')) {
    valueToInject = data.email;
  }
  if (identifier.includes('ocupacao') || identifier.includes('profissao') || identifier.includes('ocupación')) {
    valueToInject = data.profesion || getCustom('profesion');
  }
  if (identifier.includes('sexo') || identifier.includes('gender')) {
    let sexoVal = getCustom('sexo') || data.sexo || '';
    if (identifier.includes('filia') || identifier.includes('mae') || identifier.includes('pai')) {
      if (identifier.includes('1') || identifier.includes('mae') || identifier.includes('madre')) {
        sexoVal = 'f';
      } else if (identifier.includes('2') || identifier.includes('pai') || identifier.includes('padre')) {
        sexoVal = 'm';
      }
    }

    if (input.type === 'radio') {
      const val = input.value || input.nextElementSibling?.textContent || labelText || '';
      if (sexoVal.toLowerCase() === 'm' || sexoVal.toLowerCase().includes('masc')) {
        if (val.toLowerCase().includes('masc') || val === 'm' || val === 'M') valueToInject = 'RADIO_CHECK';
      } else if (sexoVal.toLowerCase() === 'f' || sexoVal.toLowerCase().includes('fem')) {
        if (val.toLowerCase().includes('fem') || val === 'f' || val === 'F') valueToInject = 'RADIO_CHECK';
      }
    } else {
      valueToInject = sexoVal;
    }
  }
  if (identifier.includes('nascimento') || identifier.includes('birth') || identifier.includes('nacimiento')) {
    if (identifier.includes('cidade') || identifier.includes('municipio') || identifier.includes('ciudad')) {
      valueToInject = data.lugar_nacimiento || data.ciudad || getCustom('lugar') || getCustom('ciudad');
    } else if (identifier.includes('pais') || identifier.includes('país')) {
      valueToInject = data.pais || getCustom('pais');
    } else {
      let dateVal = getCustom('fechanac') || data.fecha_nacimiento;
      if (dateVal && dateVal.includes('-')) {
        const [y, m, d] = dateVal.split('-');
        if (y.length === 4) dateVal = `${d}/${m}/${y}`;
      }
      valueToInject = dateVal;
    }
  }
  if (identifier.includes('nacionalidade') || identifier.includes('nacionalidad')) {
    valueToInject = data.nacionalidad || data.pais;
  }
  if (identifier.includes('estadocivil') || identifier.includes('civil')) {
    valueToInject = getCustom('estadocivil') || data.estado_civil;
  }
  
  // NUEVOS CAMPOS: PÁGINA 2 (DATOS DEL REGISTRO Y VIAJE)
  if (identifier.includes('rnm') || identifier.includes('registro nacional de inmigrante')) {
    if (input.type === 'radio') {
      const val = input.value || input.nextElementSibling?.textContent || labelText || '';
      // Si tiene RNM, marcamos Sí. Si no, No.
      const tieneRnm = (data.rnm && data.rnm.trim() !== '');
      if (tieneRnm && (val.toLowerCase() === 'sim' || val.toLowerCase() === 'sí' || val.toLowerCase() === 'si' || val === 'S')) valueToInject = 'RADIO_CHECK';
      if (!tieneRnm && (val.toLowerCase() === 'não' || val.toLowerCase() === 'no' || val === 'N')) valueToInject = 'RADIO_CHECK';
    } else {
      let rnmVal = data.rnm || getCustom('rnm') || '';
      valueToInject = rnmVal.replace(/-/g, ''); // Quitar las rayas del RNM
    }
  }
  if (identifier.includes('responsable') && input.type === 'radio') {
     const val = input.value || input.nextElementSibling?.textContent || labelText || '';
     if (val.toLowerCase() === 'não' || val.toLowerCase() === 'no' || val === 'N') valueToInject = 'RADIO_CHECK'; // Por defecto no es dependiente de responsable
  }
  
  // NUEVOS CAMPOS MRE (MINISTERIO DAS RELACOES EXTERIORES)
  if (identifier.includes('nomes anteriores') || identifier.includes('nacionalidade brasileira')) {
    if (input.type === 'radio') {
      const val = input.value || input.nextElementSibling?.textContent || labelText || '';
      if (val.toLowerCase() === 'não' || val.toLowerCase() === 'no' || val === 'N') valueToInject = 'RADIO_CHECK';
    }
  }
  if (identifier.includes('autoridade expedidora')) {
    valueToInject = data.nacionalidad || data.pais;
  }
  if (identifier.includes('documento de viaje') || identifier.includes('passaporte') || identifier.includes('pasaporte')) {
    if (identifier.includes('tipo')) {
      valueToInject = 'PASAPORTE'; // Por defecto seleccionar Pasaporte en el dropdown
    } else if (identifier.includes('número') || identifier.includes('numero')) {
      valueToInject = data.pasaporte || data.numero_pasaporte || data.numero_documento || getCustom('pasaporte');
    } else if (identifier.includes('expedidor') || identifier.includes('emissor')) {
      valueToInject = data.nacionalidad || data.pais;
    }
  }
  if (identifier.includes('entrada')) {
    if (identifier.includes('fecha') || identifier.includes('data')) {
      let dateVal = getCustom('fechaentrada') || data.fecha_entrada || getCustom('entrada');
      if (dateVal && dateVal.includes('-')) {
        const [y, m, d] = dateVal.split('-');
        if (y.length === 4) dateVal = `${d}/${m}/${y}`;
      }
      valueToInject = dateVal;
    } else if (identifier.includes('local')) {
      valueToInject = getCustom('localentrada');
    }
  }
  if (identifier.includes('transporte')) {
    valueToInject = getCustom('transporte');
  }
  
  // NUEVOS CAMPOS: PÁGINA 3 (DIRECCIÓN)
  let dirObj = null;
  try {
    if (data.direccion && typeof data.direccion === 'string' && data.direccion.startsWith('{')) {
      dirObj = JSON.parse(data.direccion);
    }
  } catch (e) {}

  if (identifier.includes('cep') || identifier.includes('código postal')) {
    valueToInject = dirObj ? dirObj.cep : getCustom('cep');
  } else if (identifier.includes('calle') || identifier.includes('logradouro') || (identifier.includes('endereco') && !identifier.includes('alteração') && !identifier.includes('alteracao')) || identifier.includes('dirección residencial')) {
    let calle = dirObj ? dirObj.endereco : (data.direccion && !data.direccion.startsWith('{') ? data.direccion : getCustom('calle'));
    // En Brasil a veces se incluye el número en la calle si no hay campo separado
    if (dirObj && dirObj.numero && identifier.includes('calle') && !identifier.includes('número')) {
      calle = `${calle}, ${dirObj.numero}`;
    }
    valueToInject = calle;
  } else if (identifier.includes('complemento')) {
    valueToInject = dirObj ? dirObj.complemento : getCustom('complemento');
  } else if (identifier.includes('barrio') || identifier.includes('bairro')) {
    valueToInject = dirObj ? dirObj.bairro : getCustom('barrio');
  } else if (!identifier.includes('nascimento') && !identifier.includes('nacimiento') && (identifier.includes('cidade') || identifier.includes('ciudad') || identifier.includes('municipio'))) {
    valueToInject = dirObj ? dirObj.cidade : (data.ciudad || getCustom('ciudad'));
  } else if (!identifier.includes('nascimento') && !identifier.includes('nacimiento') && (identifier.includes('uf') || identifier.includes('estado'))) {
    valueToInject = dirObj ? dirObj.estado : getCustom('uf');
  } else if (identifier.includes('teléfono') || identifier.includes('telefone') || identifier.includes('celular')) {
    valueToInject = data.telefono || getCustom('telefono');
  }

  if (identifier.includes('uf') && identifier.includes('federación')) {
    valueToInject = dirObj ? dirObj.estado : getCustom('uf');
  }
  if (identifier.includes('filiacao') || identifier.includes('mae') || identifier.includes('pai') || identifier.includes('filiación')) {
    if (identifier.includes('1') || identifier.includes('mae') || identifier.includes('madre')) {
      valueToInject = getCustom('madre') || data.nombre_madre;
    } else if (identifier.includes('2') || identifier.includes('pai') || identifier.includes('padre')) {
      valueToInject = getCustom('padre') || data.nombre_padre;
    }
  }
  
  return valueToInject;
}

function injectValueToInput(input, valueToInject) {
  if (!valueToInject) return false;
  
  if (valueToInject === 'RADIO_CHECK') {
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('click', { bubbles: true }));
    return true;
  } else if (input.tagName !== 'SELECT') {
    input.focus();
    
    let finalValue = valueToInject;
    
    // En agenda-web, las máscaras (Angular/React) a menudo rechazan el texto si ya viene con puntuación.
    // Quieren los números crudos para formatearlos ellas mismas.
    if (window.location.href.includes('agenda-web')) {
      if (typeof finalValue === 'string' && finalValue.match(/^[\d.\-\/]+$/)) {
        finalValue = finalValue.replace(/[.\-\/]/g, '');
      }
    }
    
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, finalValue);
    } else {
      input.value = finalValue;
    }
    
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Tab' })); // Dispara plugins de máscara
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    
    return true;
  } else {
    let optionFound = false;
    for (let i = 0; i < input.options.length; i++) {
      if (input.options[i].text.toUpperCase().includes(valueToInject.toUpperCase()) || 
          valueToInject.toUpperCase().includes(input.options[i].text.toUpperCase())) {
        input.value = input.options[i].value;
        optionFound = true;
        break;
      }
    }
    if (optionFound) {
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
  }
  return false;
}

function fillSismigraForm(data) {
  let fieldsFilled = 0;
  const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea');
  
  inputs.forEach(input => {
    const valueToInject = predictValueForInput(input, data);
    if (injectValueToInput(input, valueToInject)) {
      fieldsFilled++;
    }
  });

  return fieldsFilled;
}

// 3. Listener antiguo (por si clican desde el popup)
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "fillForm") {
    const fieldsFilled = fillSismigraForm(request.data);
    sendResponse({ status: "success", count: fieldsFilled });
    return true;
  }
});

// 4. Inyectar UI flotante solo si hay campos de formulario
const allowedDomains = [
  'serpro.gov.br',
  'pf.gov.br',
  'mj.gov.br'
];
const isAllowedDomain = allowedDomains.some(domain => window.location.hostname.includes(domain));

if (isAllowedDomain) {
  let floatingBtn = null;
  let currentClient = null;

  const hasFormElements = () => {
    return document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea').length > 0;
  };

  const injectOrUpdateBtn = (client) => {
    if (!hasFormElements()) {
      if (floatingBtn) floatingBtn.style.display = 'none';
      return;
    }

    if (!floatingBtn) {
      floatingBtn = document.createElement('div');
      floatingBtn.id = 'cubanos-br-autofill-btn';
      floatingBtn.innerHTML = `
        <div id="cbr-floating-container" style="position: fixed; bottom: 20px; right: 20px; z-index: 999999; background: #2563eb; color: white; padding: 12px 20px; border-radius: 8px; font-family: sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 10px; border: 2px solid #1d4ed8; transition: opacity 0.2s;">
          <div id="cbr-drag-handle" style="cursor: grab; display: flex; align-items: center; justify-content: center; padding-right: 5px;" title="Mover">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
          </div>
          <div id="cbr-action-area" style="cursor: pointer; display: flex; align-items: center; gap: 10px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            <div id="cbr-btn-content" style="display:flex; flex-direction:column;">
              <span id="cbr-btn-title" style="font-weight:bold; font-size:14px;">Autocompletar Formulario</span>
              <span id="cbr-btn-client" style="font-size:11px; opacity:0.9;">Cliente: ${client.nombre.substring(0, 25)}...</span>
            </div>
          </div>
          <div id="cbr-min-btn" style="cursor: pointer; padding-left: 10px; opacity: 0.8;" title="Minimizar/Maximizar">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          </div>
        </div>
      `;
      
      const actionArea = floatingBtn.querySelector('#cbr-action-area');
      actionArea.addEventListener('click', () => {
        chrome.storage.local.get(['activeClient'], (res) => {
          if (res.activeClient) {
            const count = fillSismigraForm(res.activeClient);
            const titleSpan = floatingBtn.querySelector('#cbr-btn-title');
            titleSpan.innerText = `¡${count} campos rellenados!`;
            setTimeout(() => {
              titleSpan.innerText = 'Autocompletar Formulario';
            }, 2000);
          }
        });
      });
      
      // Hover effects
      floatingBtn.addEventListener('mouseenter', () => floatingBtn.firstElementChild.style.transform = 'translateY(-2px)');
      floatingBtn.addEventListener('mouseleave', () => floatingBtn.firstElementChild.style.transform = 'translateY(0)');

      document.body.appendChild(floatingBtn);

      // Drag functionality
      let isDragging = false;
      let startX, startY, initialX, initialY;
      const container = floatingBtn.querySelector('#cbr-floating-container');
      const dragHandle = floatingBtn.querySelector('#cbr-drag-handle');
      
      dragHandle.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = container.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        container.style.right = 'auto';
        container.style.bottom = 'auto';
        container.style.left = initialX + 'px';
        container.style.top = initialY + 'px';
        e.preventDefault();
      });

      document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        container.style.left = (initialX + dx) + 'px';
        container.style.top = (initialY + dy) + 'px';
      });

      document.addEventListener('mouseup', () => {
        isDragging = false;
      });

      // Minimize functionality
      const minBtn = floatingBtn.querySelector('#cbr-min-btn');
      const contentArea = floatingBtn.querySelector('#cbr-btn-content');
      let isMinimized = false;
      minBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isMinimized = !isMinimized;
        contentArea.style.display = isMinimized ? 'none' : 'flex';
      });
    } else {
      floatingBtn.style.display = 'flex';
      // Update existing button text
      const clientSpan = floatingBtn.querySelector('#cbr-btn-client');
      if (clientSpan) clientSpan.innerText = `Cliente: ${client.nombre.substring(0, 25)}...`;
    }
  };

  const checkUI = () => {
    if (currentClient && currentClient.nombre) {
      injectOrUpdateBtn(currentClient);
    }
  };

  // 1. Initial check
  chrome.storage.local.get(['activeClient'], (res) => {
    if (res.activeClient && res.activeClient.nombre) {
      currentClient = res.activeClient;
      checkUI();
      
      // Observar cambios en el DOM para aplicaciones SPA (Single Page Applications)
      const observer = new MutationObserver(() => {
        checkUI();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  });

  // 2. Listen for changes so it updates instantly
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.activeClient && changes.activeClient.newValue) {
      currentClient = changes.activeClient.newValue;
      if (!currentClient || !currentClient.nombre) {
        if (floatingBtn) floatingBtn.style.display = 'none';
      } else {
        checkUI();
      }
    }
  });

  // =========================================================
  // 5. MENÚ CONTEXTUAL (AUTOCOMPLETADO AL HACER CLIC EN CAMPO)
  // =========================================================
  let currentlyFocusedInput = null;
  let contextualMenuEl = null;

  function createContextMenu() {
    if (contextualMenuEl) return;
    contextualMenuEl = document.createElement('div');
    contextualMenuEl.id = 'cbr-context-menu';
    contextualMenuEl.style.cssText = `
      position: absolute;
      z-index: 9999999;
      background: white;
      border: 1px solid #e5e7eb;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      padding: 6px;
      display: none;
      flex-direction: column;
      max-height: 250px;
      height: 250px;
      width: 250px;
      overflow-y: auto;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 12px;
    `;
    
    // Hide menu when clicking outside
    document.addEventListener('mousedown', (e) => {
      if (contextualMenuEl && !contextualMenuEl.contains(e.target) && e.target !== currentlyFocusedInput) {
        contextualMenuEl.style.display = 'none';
      }
    });
    document.body.appendChild(contextualMenuEl);
  }

  function createMenuItem(label, value, isRecommended = false) {
    const item = document.createElement('div');
    item.style.cssText = `
      padding: 8px 12px; 
      cursor: pointer; 
      border-radius: 6px; 
      transition: background 0.15s; 
      display: flex; 
      flex-direction: column;
      margin-bottom: 2px;
      ${isRecommended ? 'background: #eff6ff; border: 1px solid #bfdbfe;' : 'background: transparent;'}
    `;
    
    if (label) {
      const labelSpan = document.createElement('span');
      labelSpan.style.cssText = 'font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;';
      labelSpan.innerText = label;
      item.appendChild(labelSpan);
    }
    
    const valSpan = document.createElement('span');
    valSpan.style.cssText = `color: #111827; font-weight: ${isRecommended ? '600' : '400'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
    valSpan.innerText = value;
    item.appendChild(valSpan);

    item.addEventListener('mouseenter', () => item.style.background = isRecommended ? '#dbeafe' : '#f3f4f6');
    item.addEventListener('mouseleave', () => item.style.background = isRecommended ? '#eff6ff' : 'transparent');
    
    item.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (currentlyFocusedInput) {
        injectValueToInput(currentlyFocusedInput, value);
        contextualMenuEl.style.display = 'none';
      }
    });
    return item;
  }

  function showContextMenuForInput(input, clientData) {
    if (!contextualMenuEl) createContextMenu();
    
    // Ignorar radio, checkbox y botones
    if (input.type === 'radio' || input.type === 'checkbox' || input.type === 'hidden' || input.type === 'submit' || input.type === 'button') return;
    if (input.readOnly || input.disabled) return;

    // Crear copias de nombres y apellidos para la lista de respaldo
    const displayData = { ...clientData };
    if (displayData.nombre && !displayData.nombres && !displayData.apellidos) {
      const parts = displayData.nombre.split(' ');
      displayData.nombres = parts[0];
      displayData.apellidos = parts.length > 1 ? parts.slice(1).join(' ') : '';
      // Eliminar el 'nombre' completo de la lista si queremos que salga dividido, o dejarlo.
      // Lo dejaremos por si acaso necesitan el completo.
    }

    currentlyFocusedInput = input;
    const rect = input.getBoundingClientRect();
    
    // Posicionar justo debajo del input
    contextualMenuEl.style.top = `${window.scrollY + rect.bottom + 4}px`;
    contextualMenuEl.style.left = `${window.scrollX + rect.left}px`;
    contextualMenuEl.innerHTML = '';
    
    const predictedValue = predictValueForInput(input, displayData);
    
    // Sección Recomendada
    if (predictedValue && predictedValue !== 'RADIO_CHECK') {
      const title = document.createElement('div');
      title.innerText = 'SUGERENCIA AUTOMÁTICA';
      title.style.cssText = 'padding: 4px 10px 2px; font-weight: bold; color: #2563eb; font-size: 10px; margin-bottom: 2px;';
      contextualMenuEl.appendChild(title);
      
      const item = createMenuItem(null, predictedValue, true);
      contextualMenuEl.appendChild(item);
      
      const divider = document.createElement('div');
      divider.style.cssText = 'height: 1px; background: #e5e7eb; margin: 6px 0;';
      contextualMenuEl.appendChild(divider);
    }
    
    // Lista de fallback con todos los datos
    const title2 = document.createElement('div');
    title2.innerText = 'ELEGIR OTRO DATO';
    title2.style.cssText = 'padding: 4px 10px 2px; font-weight: bold; color: #9ca3af; font-size: 10px; margin-bottom: 4px;';
    contextualMenuEl.appendChild(title2);
    
    // Contenedor Grid para 1 columna
    const gridContainer = document.createElement('div');
    gridContainer.style.cssText = 'display: grid; grid-template-columns: 1fr; gap: 4px;';
    contextualMenuEl.appendChild(gridContainer);
    
    const dataEntries = Object.entries(displayData).filter(([k,v]) => typeof v === 'string' && v.trim().length > 0 && v !== predictedValue);
    dataEntries.forEach(([key, val]) => {
      // Ignorar campos internos
      if (key === 'id' || key === 'created_at' || key === 'user_id' || key === 'estatus') return;
      const item = createMenuItem(key.replace(/_/g, ' '), val, false);
      gridContainer.appendChild(item);
    });
    
    contextualMenuEl.style.display = 'flex';
  }

  // Escuchar doble clic para ocultar el menú
  document.addEventListener('dblclick', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      if (contextualMenuEl) {
        contextualMenuEl.style.display = 'none';
      }
    }
  });

  // Escuchar cuando el usuario entra en un campo
  document.addEventListener('focusin', (e) => {
    // Excluir SELECT porque el menú contextual interfiere con el desplegable nativo del navegador
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      chrome.storage.local.get(['activeClient'], (res) => {
        if (res.activeClient && res.activeClient.nombre) {
          showContextMenuForInput(e.target, res.activeClient);
        }
      });
    }
  });

  // Ocultar si hace scroll en la página principal o redimensiona
  window.addEventListener('scroll', (e) => { 
    if (contextualMenuEl && contextualMenuEl.style.display !== 'none') {
      // Ignorar el evento de scroll si proviene de dentro del propio menú
      if (e.target === contextualMenuEl || contextualMenuEl.contains(e.target)) {
        return;
      }
      contextualMenuEl.style.display = 'none'; 
    }
  }, true);
  window.addEventListener('resize', () => { if(contextualMenuEl) contextualMenuEl.style.display = 'none'; });
}
