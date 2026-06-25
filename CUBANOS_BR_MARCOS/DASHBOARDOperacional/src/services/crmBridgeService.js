/**
 * crmBridgeService.js
 * Servicio para conectar con CRMs externos (Kommo, HubSpot, etc.) a través de n8n.
 */

export async function getChatHistoryFromN8n(idCrm) {
  if (!idCrm) {
    return "No hay ID de CRM vinculado a este cliente.";
  }

  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
  if (!webhookUrl || webhookUrl.includes('tu-n8n.com')) {
    console.warn('[CRM Bridge] El webhook de n8n no está configurado en .env. Simulando respuesta...');
    return "Simulación: No se pudo contactar al webhook de n8n. Configura VITE_N8N_WEBHOOK_URL en el .env.";
  }

  try {
    // Usamos POST para pasar el ID del CRM de forma segura en el body.
    // Dependiendo de cómo configures el webhook en n8n, podría ser GET con query params.
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id_crm: idCrm })
    });

    if (!response.ok) {
      throw new Error(`Error de n8n: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Asumimos que n8n devuelve un JSON con un campo 'historial'
    // o un array de mensajes. Adaptar según lo que devuelva tu flujo de n8n.
    return data.historial || JSON.stringify(data);

  } catch (error) {
    console.error('[CRM Bridge] Error contactando a n8n:', error);
    return "Error al recuperar historial del CRM. Detalle técnico para el desarrollador: " + error.message;
  }
}
