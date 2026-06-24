/**
 * aiService.js
 * Servicio centralizado de IA — Groq API (compatible con OpenAI SDK).
 *
 * Modelo texto/razonamiento : qwen/qwen3-27b
 * Modelo visión (documentos): meta-llama/llama-4-scout-17b-16e-instruct
 *   (Groq no ofrece Qwen vision, pero sí Llama 4 Scout con visión nativa)
 * Modelo visión (documentos): qwen/qwen3-27b
 *
 * Base URL: https://api.groq.com/openai/v1
 * Auth    : VITE_GROQ_API_KEY
 */

const GROQ_BASE_URL  = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL_TEXT     = 'llama-3.1-70b-versatile';   // Texto / razonamiento general
const MODEL_VISION   = 'llama-3.2-11b-vision-preview'; // Visión + OCR

function getApiKey() {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (!key || key.startsWith('pon_tu')) {
    throw new Error('No Groq API Key found. Agrega VITE_GROQ_API_KEY a tu archivo .env');
  }
  return key;
}

/**
 * Llamada base a Groq (openai-compatible).
 * @param {string} model
 * @param {Array}  messages
 * @param {number} temperature
 * @returns {Promise<string>} contenido del mensaje del asistente
 */
async function callGroq(model, messages, temperature = 0.1) {
  const res = await fetch(GROQ_BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, temperature }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      errData.error?.message || `Groq HTTP ${res.status} — ${res.statusText}`
    );
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

/** Limpia JSON que el modelo a veces envuelve en ```json ... ``` */
function cleanJson(raw) {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

// ──────────────────────────────────────────────────────────────
// FUNCIÓN 1 — Analizar imagen de documento de identidad (OCR IA)
// ──────────────────────────────────────────────────────────────
/**
 * Extrae datos personales de la foto de un documento.
 * @param {File} file - Imagen del documento (pasaporte, CPF, RNM, etc.)
 * @returns {Promise<object>} Campos encontrados en el documento
 */
export async function analyzeDocumentImage(file) {
  // Convertir a base64 data URL
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
  });

  const prompt = `Eres un asistente especializado en leer documentos de identidad e inmigración \
(Pasaportes, CPF, RNM de Brasil, CNH, Cédulas, etc.).
Analiza CUIDADOSAMENTE la imagen y extrae todos los datos personales visibles.
Devuelve ÚNICAMENTE un objeto JSON puro (sin markdown, sin texto extra) con estos campos:
{
  "NOMBRE_COMPLETO": null,
  "CPF": null,
  "RNM": null,
  "FECHA_NACIMIENTO": null,
  "NACIONALIDAD": null,
  "NUMERO_DOCUMENTO": null,
  "SEXO": null,
  "FECHA_VENCIMIENTO": null
}
Usa null para los campos que no estén visibles en el documento. No inventes datos.`;

  const raw = await callGroq(
    MODEL_VISION,
    [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: base64 } },
      ],
    }],
    0.1
  );

  try {
    const parsed = JSON.parse(cleanJson(raw));
    // Filtrar campos null para que el UI solo muestre los que tienen valor
    return Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== null && v !== ''));
  } catch {
    console.warn('[aiService] No se pudo parsear JSON del análisis de imagen. Respuesta cruda:', raw);
    return {};
  }
}

// ──────────────────────────────────────────────────────────────
// FUNCIÓN 2 — Chat general con qwen/qwen3-27b
// ──────────────────────────────────────────────────────────────
/**
 * Envía mensajes al modelo de razonamiento qwen3-27b.
 * @param {Array<{role: string, content: string}>} messages
 * @param {number} temperature
 * @returns {Promise<string>}
 */
export async function chat(messages, temperature = 0.7) {
  return callGroq(MODEL_TEXT, messages, temperature);
}

// ──────────────────────────────────────────────────────────────
// FUNCIÓN RAG — Chat con contexto del cliente (BD + CRM)
// ──────────────────────────────────────────────────────────────
/**
 * Genera una respuesta basada en el contexto de Supabase y Kommo CRM.
 * @param {string} userMessage - El mensaje actual del usuario.
 * @param {Array} chatHistory - Historial de la conversación con la IA.
 * @param {object} supabaseContext - Datos del cliente, trámites, etc.
 * @param {string} crmContext - Historial de WhatsApp/CRM desde n8n.
 */
export async function chatWithClientContext(userMessage, chatHistory, supabaseContext, crmContext) {
  const systemPrompt = `Eres un asistente inteligente para una agencia de gestión migratoria en Brasil.
Tu objetivo es ayudar al agente a resolver dudas, redactar respuestas o analizar el caso de un cliente específico.

A continuación, tienes TODO el contexto disponible sobre este cliente:

=== DATOS DE LA BASE DE DATOS (Supabase) ===
${JSON.stringify(supabaseContext, null, 2)}

=== HISTORIAL DE CRM / WHATSAPP ===
${crmContext}

=== INSTRUCCIONES ===
1. Responde a la pregunta o solicitud del usuario basándote ESTRICTAMENTE en la información anterior.
2. Si te piden redactar un mensaje para el cliente, hazlo en el tono adecuado (profesional pero cercano, en español o portugués según corresponda).
3. Si la información no está en el contexto, di que no tienes esa información.
4. Responde en texto claro, puedes usar markdown para formatear.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory, // Mensajes previos de la IA y el usuario
    { role: 'user', content: userMessage }
  ];

  return callGroq(MODEL_TEXT, messages, 0.5);
}

// ──────────────────────────────────────────────────────────────
// FUNCIÓN 3 — Extraer datos de cliente desde texto libre
// ──────────────────────────────────────────────────────────────
/**
 * Dado un texto (ej. copiado de un formulario), extrae datos estructurados del cliente.
 * @param {string} text
 * @returns {Promise<object>}
 */
export async function extractClientDataFromText(text) {
  const prompt = `Eres un asistente de gestión migratoria en Brasil.
Dado el siguiente texto, extrae datos del cliente y devuelve ÚNICAMENTE JSON puro:
{
  "nombre": null,
  "cpf": null,
  "rnm": null,
  "fecha_nacimiento": null,
  "nacionalidad": null,
  "numero_pasaporte": null,
  "sexo": null,
  "estado_civil": null,
  "telefono": null,
  "email": null,
  "direccion": null
}
Campos no encontrados deben ser null.

TEXTO:
${text}`;

  const raw = await callGroq(MODEL_TEXT, [{ role: 'user', content: prompt }], 0.1);
  try {
    return JSON.parse(cleanJson(raw));
  } catch {
    console.warn('[aiService] extractClientDataFromText parse error:', raw);
    return {};
  }
}

// ──────────────────────────────────────────────────────────────
// FUNCIÓN 4 — Sugerir próximo paso de un trámite
// ──────────────────────────────────────────────────────────────
/**
 * Dado el historial de un trámite, sugiere el siguiente paso a seguir.
 * @param {object} tramite - Datos del trámite
 * @param {object} cliente - Datos del cliente
 * @returns {Promise<string>} Sugerencia en texto
 */
export async function suggestNextStep(tramite, cliente) {
  const prompt = `Eres un asistente experto en trámites migratorios en Brasil (Policía Federal, MTE, etc.).
Dado el siguiente contexto, sugiere el próximo paso concreto a seguir.

Cliente: ${JSON.stringify(cliente)}
Trámite: ${JSON.stringify(tramite)}

Responde en español, de forma concisa (máx 3 oraciones). No uses markdown.`;

  return callGroq(MODEL_TEXT, [{ role: 'user', content: prompt }], 0.5);
}
