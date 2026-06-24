document.addEventListener('DOMContentLoaded', () => {
  const supaUrlInput = document.getElementById('supaUrl');
  const supaKeyInput = document.getElementById('supaKey');
  const searchInput = document.getElementById('searchInput');
  const resultsList = document.getElementById('resultsList');
  const configSection = document.getElementById('configSection');
  const toggleConfigBtn = document.getElementById('toggleConfig');
  const saveConfigBtn = document.getElementById('saveConfig');
  const loadingDiv = document.getElementById('loading');

  let supaUrl = '';
  let supaKey = '';

  // Load config
  chrome.storage.local.get(['supaUrl', 'supaKey'], (res) => {
    if (res.supaUrl && res.supaKey) {
      supaUrl = res.supaUrl;
      supaKey = res.supaKey;
      supaUrlInput.value = supaUrl;
      supaKeyInput.value = supaKey;
    } else {
      configSection.style.display = 'block';
    }
  });

  toggleConfigBtn.addEventListener('click', () => {
    configSection.style.display = configSection.style.display === 'none' ? 'block' : 'none';
  });

  saveConfigBtn.addEventListener('click', () => {
    supaUrl = supaUrlInput.value.trim();
    supaKey = supaKeyInput.value.trim();
    chrome.storage.local.set({ supaUrl, supaKey }, () => {
      alert('Configuración guardada');
      configSection.style.display = 'none';
    });
  });

  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const q = e.target.value.trim();
    if (q.length < 2) {
      resultsList.innerHTML = '';
      return;
    }
    
    searchTimeout = setTimeout(() => {
      searchClients(q);
    }, 500);
  });

  async function searchClients(query) {
    if (!supaUrl || !supaKey) return alert('Por favor configura Supabase primero.');
    
    loadingDiv.style.display = 'block';
    resultsList.innerHTML = '';
    
    try {
      // Using Supabase REST API
      const url = `${supaUrl}/rest/v1/clientes?or=(nombre.ilike.%25${query}%25,cpf.ilike.%25${query}%25)&select=*&limit=10`;
      const res = await fetch(url, {
        headers: {
          'apikey': supaKey,
          'Authorization': `Bearer ${supaKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) throw new Error('Error buscando clientes');
      
      const clientes = await res.json();
      
      if (clientes.length === 0) {
        resultsList.innerHTML = '<div style="font-size:12px; color:#94a3b8; text-align:center;">No se encontraron resultados.</div>';
      } else {
        clientes.forEach(client => {
          const div = document.createElement('div');
          div.className = 'client-item';
          div.innerHTML = `
            <div class="client-name">${client.nombre}</div>
            <div class="client-cpf">CPF: ${client.cpf || 'N/A'} | Tel: ${client.telefono || 'N/A'}</div>
          `;
          div.addEventListener('click', () => handleClientSelect(client));
          resultsList.appendChild(div);
        });
      }
    } catch (err) {
      console.error(err);
      resultsList.innerHTML = '<div style="font-size:12px; color:#ef4444; text-align:center;">Error de conexión. Revisa tus credenciales.</div>';
    } finally {
      loadingDiv.style.display = 'none';
    }
  }

  async function handleClientSelect(client) {
    // We should also fetch the client's custom operational data
    loadingDiv.style.display = 'block';
    try {
      const url = `${supaUrl}/rest/v1/cliente_datos_operacionales?id_cliente=eq.${client.id}&select=valor,campos_datos_operacionales(nombre_campo)`;
      const res = await fetch(url, {
        headers: { 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}` }
      });
      const customData = await res.json();
      
      // Merge basic client data with custom data
      const fullData = {
        nombre: client.nombre,
        cpf: client.cpf,
        email: client.email,
        telefono: client.telefono,
        pais: client.pais,
        ciudad: client.ciudad,
        fecha_nacimiento: client.fecha_nacimiento,
        estado_civil: client.estado_civil,
        sexo: client.sexo,
        nacionalidad: client.nacionalidad,
        numero_pasaporte: client.numero_pasaporte,
        nombre_madre: client.nombre_madre,
        nombre_padre: client.nombre_padre,
        rnm: client.rnm,
        fecha_entrada_brasil: client.fecha_entrada_brasil,
        lugar_entrada_brasil: client.lugar_entrada_brasil,
        direccion: client.direccion
      };

      if (customData && customData.length > 0) {
        customData.forEach(cd => {
          if (cd.campos_datos_operacionales && cd.campos_datos_operacionales.nombre_campo) {
            fullData[cd.campos_datos_operacionales.nombre_campo.toLowerCase()] = cd.valor;
          }
        });
      }

      // Send to active tab
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "fillForm", data: fullData }, function(response) {
          if (chrome.runtime.lastError) {
            alert("No se pudo autocompletar la página. Asegúrate de estar en una web y recarga la página.");
          } else {
            window.close(); // Close popup on success
          }
        });
      });

    } catch (err) {
      console.error(err);
      alert('Error obteniendo datos completos del cliente.');
    } finally {
      loadingDiv.style.display = 'none';
    }
  }
});
