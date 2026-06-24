chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "fillForm") {
    const data = request.data;
    console.log("Cubanos BR Auto-Fill: Received data to inject:", data);

    let fieldsFilled = 0;

    // A more robust filler for Angular and JSF forms (like PF / Sismigra)
    const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea');
    
    inputs.forEach(input => {
      const nameAttr = (input.name || '').toLowerCase();
      const idAttr = (input.id || '').toLowerCase();
      const formControlName = (input.getAttribute('formcontrolname') || '').toLowerCase();
      
      const identifier = `${nameAttr} ${idAttr} ${formControlName}`;

      let valueToInject = null;

      // Helper function to safely get custom data regardless of spacing or case
      const getCustom = (keyword) => {
        const foundKey = Object.keys(data).find(k => k.replace(/\s|\./g, '').includes(keyword.replace(/\s|\./g, '')));
        return foundKey ? data[foundKey] : null;
      };

      // Map identifiers to data
      if (identifier.includes('nome') || identifier.includes('name')) {
        if (!identifier.includes('mae') && !identifier.includes('pai') && !identifier.includes('filia')) {
          valueToInject = data.nombre;
        }
      }
      if (identifier.includes('cpf')) {
        valueToInject = data.cpf || getCustom('cpf');
      }
      if (identifier.includes('mail') || identifier.includes('correo')) {
        valueToInject = data.email;
      }
      if (identifier.includes('tel') || identifier.includes('celular') || identifier.includes('fone')) {
        valueToInject = data.telefono || getCustom('tel');
      }
      if (identifier.includes('pais') || identifier.includes('country') || identifier.includes('nacionalidade')) {
        valueToInject = data.pais || getCustom('nacionalidad') || getCustom('pais');
      }
      if (identifier.includes('passaporte') || identifier.includes('documento')) {
        valueToInject = data.numero_documento || getCustom('pasaporte');
      }
      if (identifier.includes('nascimento') || identifier.includes('birth')) {
        // "cidade de nascimento" vs "data de nascimento"
        if (identifier.includes('cidade') || identifier.includes('municipio')) {
          valueToInject = data.ciudad || getCustom('ciudad');
        } else if (identifier.includes('pais')) {
          valueToInject = data.pais || getCustom('pais');
        } else {
          valueToInject = getCustom('fechanac') || data.fecha_nacimiento;
        }
      }
      if (identifier.includes('estadocivil') || identifier.includes('civil')) {
        valueToInject = getCustom('estadocivil');
      }
      if (identifier.includes('sexo') || identifier.includes('gender')) {
        valueToInject = getCustom('sexo');
      }
      if (identifier.includes('filiacao') || identifier.includes('mae') || identifier.includes('pai')) {
        valueToInject = getCustom('familiar') || getCustom('madre') || getCustom('padre');
      }

      // Dynamic fallback
      if (!valueToInject) {
        for (const [key, value] of Object.entries(data)) {
          if (key.length > 2 && identifier.includes(key.replace(/\s/g, ''))) {
            valueToInject = value;
            break;
          }
        }
      }

      if (valueToInject) {
        // Handle standard inputs and textareas
        if (input.tagName !== 'SELECT') {
          input.value = valueToInject;
          fieldsFilled++;
        } else {
          // Handle <select> inputs (need to match option text if value doesn't match)
          let optionFound = false;
          // Try matching value exactly first
          for (let i = 0; i < input.options.length; i++) {
            if (input.options[i].value.toUpperCase() === valueToInject.toUpperCase()) {
              input.value = input.options[i].value;
              optionFound = true;
              break;
            }
          }
          // If value match fails, try matching the visible text
          if (!optionFound) {
            for (let i = 0; i < input.options.length; i++) {
              if (input.options[i].text.toUpperCase().includes(valueToInject.toUpperCase()) || 
                  valueToInject.toUpperCase().includes(input.options[i].text.toUpperCase())) {
                input.value = input.options[i].value;
                optionFound = true;
                break;
              }
            }
          }
          if (optionFound) fieldsFilled++;
        }
        
        // Dispatch events so React/Angular/Vue/JSF forms register the change
        if (fieldsFilled > 0) {
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('blur', { bubbles: true })); // Often triggers JSF ajax
        }
      }
    });

    sendResponse({ status: "success", count: fieldsFilled });
    return true;
  }
});
