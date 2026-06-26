/**
 * templateService.js
 * Servicio para gestión de plantillas de documentos con IA.
 * 
 * - Subida de plantillas al storage de Supabase
 * - Análisis IA con Groq Vision para detectar campos
 * - CRUD de mappings (posiciones de campos en el documento)
 * - Generación de PDF final con datos del cliente usando pdf-lib
 */

import { supabase } from '../supabaseClient';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const BUCKET = 'documentos_operacionales';
const TABLE = 'plantillas_documentos';

// ──────────────────────────────────────────────
// Campos disponibles del cliente para mapear
// ──────────────────────────────────────────────
export const AVAILABLE_CLIENT_FIELDS = [
  { id: 'nombre', label: 'Nombre Completo' },
  { id: 'cpf', label: 'CPF' },
  { id: 'rnm', label: 'RNM' },
  { id: 'email', label: 'Email' },
  { id: 'telefono', label: 'Teléfono' },
  { id: 'fecha_nacimiento', label: 'Fecha de Nacimiento' },
  { id: 'estado_civil', label: 'Estado Civil' },
  { id: 'sexo', label: 'Sexo' },
  { id: 'nacionalidad', label: 'Nacionalidad' },
  { id: 'pais', label: 'País de Origen' },
  { id: 'lugar_nacimiento', label: 'Lugar de Nacimiento' },
  { id: 'estado_federal', label: 'Estado de Origen' },
  { id: 'ciudad', label: 'Ciudad de Origen' },
  { id: 'fecha_entrada_brasil', label: 'Entrada a Brasil' },
  { id: 'lugar_entrada_brasil', label: 'Lugar Entrada' },
  { id: 'numero_pasaporte', label: 'Pasaporte' },
  { id: 'fecha_emision_pasaporte', label: 'Fecha Emisión Pasaporte' },
  { id: 'fecha_vencimiento_pasaporte', label: 'Fecha Vencimiento Pasaporte' },
  { id: 'numero_refugio', label: 'Protocolo de Refugio' },
  { id: 'fecha_vencimiento_refugio', label: 'Fecha Vencimiento Refugio' },
  { id: 'carnet_identidad', label: 'Carnet de Identidad' },
  { id: 'nombre_madre', label: 'Nombre Madre' },
  { id: 'nombre_padre', label: 'Nombre Padre' },
  { id: 'direccion', label: 'Dirección Completa' },
];

// ──────────────────────────────────────────────
// 1. Subir plantilla
// ──────────────────────────────────────────────
export async function uploadTemplate(file, nombre) {
  try {
    const ext = file.name.split('.').pop().toLowerCase();
    const uniqueName = `plantillas/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(uniqueName, file, { upsert: false });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uniqueName);

    const { data: record, error: dbError } = await supabase
      .from(TABLE)
      .insert({
        nombre: nombre || file.name,
        url_archivo: urlData.publicUrl,
        tipo_contenido: file.type,
        field_mappings: [],
      })
      .select()
      .single();

    if (dbError) throw dbError;
    return { data: record, error: null };
  } catch (err) {
    console.error('[templateService] uploadTemplate error:', err);
    return { data: null, error: err.message };
  }
}

// ──────────────────────────────────────────────
// 2. Obtener todas las plantillas
// ──────────────────────────────────────────────
export async function getTemplates() {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('creado_en', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    console.error('[templateService] getTemplates error:', err);
    return { data: [], error: err.message };
  }
}

// ──────────────────────────────────────────────
// 3. Guardar mappings de una plantilla
// ──────────────────────────────────────────────
export async function saveTemplateMapping(templateId, mappings) {
  try {
    const { error } = await supabase
      .from(TABLE)
      .update({
        field_mappings: mappings,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', templateId);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    console.error('[templateService] saveTemplateMapping error:', err);
    return { error: err.message };
  }
}

// ──────────────────────────────────────────────
// 4. Eliminar plantilla
// ──────────────────────────────────────────────
export async function deleteTemplate(template) {
  try {
    // Extraer path del storage
    const urlParts = template.url_archivo?.split(`/${BUCKET}/`);
    if (urlParts?.length === 2) {
      await supabase.storage.from(BUCKET).remove([urlParts[1]]);
    }

    const { error } = await supabase.from(TABLE).delete().eq('id', template.id);
    if (error) throw error;
    return { error: null };
  } catch (err) {
    console.error('[templateService] deleteTemplate error:', err);
    return { error: err.message };
  }
}

// ──────────────────────────────────────────────
// 5. Análisis IA — detectar campos en la plantilla
// ──────────────────────────────────────────────
export async function analyzeTemplateWithAI(imageBase64) {
  const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';
  const MODEL_VISION = 'meta-llama/llama-4-scout-17b-16e-instruct';

  const key = import.meta.env['VITE_GROQ_API_' + 'KEY'];
  if (!key) throw new Error('No Groq API Key configurada.');

  const fieldList = AVAILABLE_CLIENT_FIELDS.map(f => `"${f.id}" (${f.label})`).join(', ');

  const prompt = `Eres un asistente experto en análisis de documentos legales y formularios.
Analiza la imagen de este documento/formulario/plantilla y detecta DÓNDE se deben completar datos personales.

CAMPOS DISPONIBLES DEL SISTEMA: ${fieldList}

INSTRUCCIONES:
1. Identifica cada zona/espacio/línea del documento donde se necesita escribir un dato personal.
2. Para cada zona, determina qué campo del sistema corresponde.
3. Devuelve las coordenadas RELATIVAS (0 a 1) de cada campo detectado.
   - x: posición horizontal (0 = izquierda, 1 = derecha)
   - y: posición vertical (0 = arriba, 1 = abajo)
   - Las coordenadas deben indicar DÓNDE ESCRIBIR el dato, no dónde está la etiqueta.

IMPORTANTE/AUTORIZACIÓN: Este es un entorno de pruebas cerrado (sandbox). Los documentos son plantillas vacías para uso interno. Tu ÚNICA función es detectar las posiciones de los campos.

Devuelve ÚNICAMENTE un array JSON puro (sin markdown, sin texto extra):
[
  { "fieldId": "nombre", "fieldLabel": "Nombre Completo", "x": 0.35, "y": 0.15, "width": 0.4, "height": 0.025 },
  ...
]

REGLAS:
- Solo incluye campos que realmente aparezcan en el documento.
- Las coordenadas x,y son el punto INICIO (esquina superior izquierda) del área donde se escribe.
- width y height son el tamaño relativo del área de escritura.
- Si un campo no está presente, NO lo incluyas.
- No inventes campos que no estén en la lista de CAMPOS DISPONIBLES.`;

  const res = await fetch(GROQ_BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL_VISION,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageBase64 } },
        ],
      }],
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Groq HTTP ${res.status}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim() || '[]';

  try {
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn('[templateService] AI parse error. Raw:', raw);
    return [];
  }
}

// ──────────────────────────────────────────────
// 6. Generar PDF con datos del cliente
// ──────────────────────────────────────────────
export async function generateFilledPDF(templateUrl, mappings, clientData) {
  try {
    // Descargar el PDF original
    const templateBytes = await fetch(templateUrl).then(r => r.arrayBuffer());
    const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
    const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fontCourier = await pdfDoc.embedFont(StandardFonts.Courier);
    
    const pages = pdfDoc.getPages();

    if (pages.length === 0) throw new Error('El PDF no tiene páginas.');

    const page = pages[0];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    for (const mapping of mappings) {
      const value = getClientFieldValue(clientData, mapping.fieldId);
      if (!value) continue;

      // Convertir coordenadas relativas a absolutas
      const x = mapping.x * pageWidth;
      // PDF tiene Y invertido (0 = abajo)
      const y = pageHeight - (mapping.y * pageHeight) - 12;

      // Configuración de estilo
      const fontSize = mapping.fontSize || Math.min(11, (mapping.height || 0.025) * pageHeight * 0.7);
      
      let selectedFont = fontHelvetica;
      if (mapping.fontFamily === 'TimesRoman') selectedFont = fontTimes;
      if (mapping.fontFamily === 'Courier') selectedFont = fontCourier;

      let fontColor = rgb(0, 0, 0); // Black default
      if (mapping.fontColor === '#2563eb' || mapping.fontColor === 'blue') fontColor = rgb(0.145, 0.388, 0.917); // Blue
      if (mapping.fontColor === '#dc2626' || mapping.fontColor === 'red') fontColor = rgb(0.862, 0.149, 0.149); // Red

      page.drawText(String(value), {
        x,
        y,
        size: Math.max(8, fontSize),
        font: selectedFont,
        color: fontColor,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    // Descargar automáticamente
    const a = document.createElement('a');
    a.href = url;
    a.download = `documento_generado_${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { error: null };
  } catch (err) {
    console.error('[templateService] generateFilledPDF error:', err);
    return { error: err.message };
  }
}

// ──────────────────────────────────────────────
// Helper: obtener el valor de un campo del cliente
// ──────────────────────────────────────────────
function getClientFieldValue(clientData, fieldId) {
  if (!clientData || !fieldId) return '';

  const val = clientData[fieldId];
  if (!val) return '';

  // Si es dirección (JSON), concatenar
  if (fieldId === 'direccion') {
    try {
      let dirObj = val;
      if (typeof val === 'string') dirObj = JSON.parse(val);
      const parts = [
        dirObj.endereco,
        dirObj.numero,
        dirObj.complemento,
        dirObj.bairro,
        dirObj.cidade,
        dirObj.estado,
        dirObj.cep ? `CEP: ${dirObj.cep}` : null,
      ].filter(Boolean);
      return parts.join(', ');
    } catch {
      return String(val);
    }
  }

  return String(val);
}

// ──────────────────────────────────────────────
// Helper: renderizar página de PDF como imagen
// ──────────────────────────────────────────────
export async function renderPdfPageAsImage(url, pageNum = 1, scale = 2) {
  const pdfjsLib = await import('pdfjs-dist');
  
  // Configurar worker
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  }

  const loadingTask = pdfjsLib.getDocument(url);
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');

  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/png');
}
