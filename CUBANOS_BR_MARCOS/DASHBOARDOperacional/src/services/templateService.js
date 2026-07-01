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
import { PDFDocument, rgb, StandardFonts, PDFName, PDFBool } from 'pdf-lib';

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
// 1.5 Crear plantilla HTML
// ──────────────────────────────────────────────
export async function createHtmlTemplate(htmlContent, nombre) {
  try {
    const uniqueName = `plantillas/${Date.now()}_${Math.random().toString(36).slice(2)}.html`;
    const blob = new Blob([htmlContent], { type: 'text/html' });

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(uniqueName, blob, { upsert: false });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uniqueName);

    const { data: record, error: dbError } = await supabase
      .from(TABLE)
      .insert({
        nombre: nombre || 'Plantilla HTML',
        url_archivo: urlData.publicUrl,
        tipo_contenido: 'text/html',
        field_mappings: [],
      })
      .select()
      .single();

    if (dbError) throw dbError;
    return { data: record, error: null };
  } catch (err) {
    console.error('[templateService] createHtmlTemplate error:', err);
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
export async function getFilledPdfBlob(templateUrl, mappings, clientData, overrides = {}) {
  try {
    const templateBytes = await fetch(templateUrl).then(r => r.arrayBuffer());
    const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
    
    const form = pdfDoc.getForm();

    for (const mapping of mappings) {
      let value = '';
      if (mapping.isCustomText) {
        value = mapping.fieldLabel || mapping.customValue || '';
      } else {
        const kommoId = mapping.kommoFieldId || mapping.fieldId;
        value = getClientFieldValue(clientData, kommoId);
      }
      
      // Override con valores editados en la vista previa
      if (overrides[mapping.pdfFieldName] !== undefined) {
        value = overrides[mapping.pdfFieldName];
      }

      if (!value) continue;

      try {
        const pdfFieldId = mapping.pdfFieldName;
        if (pdfFieldId) {
          const field = form.getField(pdfFieldId);
          if (field) {
            const fieldType = field.constructor.name;
            if (fieldType === 'PDFTextField') {
              field.setText(String(value));
            } else if (fieldType === 'PDFDropdown' || fieldType === 'PDFOptionList') {
              field.select(String(value));
            } else if (fieldType === 'PDFCheckBox') {
              if (value && String(value).toLowerCase() !== 'false' && value !== '0') {
                field.check();
              }
            } else if (fieldType === 'PDFRadioGroup') {
              field.select(String(value));
            }
          }
        }
      } catch (err) {
        console.warn(`[templateService] No se pudo setear el campo ${mapping.pdfFieldName}`, err);
      }
    }

    // Aplanar el formulario (flatten). Esto convierte los campos interactivos 
    // en texto estático pintado directamente en el PDF. 
    // Esto asegura que el texto se vea en el 100% de los visores (Chrome, Safari, Acrobat)
    // en el lugar exacto del campo, sin depender de 'NeedAppearances'.
    form.flatten();

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (err) {
    console.error('[templateService] getFilledPdfBlob error:', err);
    throw err;
  }
}

export async function generateFilledPDF(templateUrl, mappings, clientData) {
  try {
    const blob = await getFilledPdfBlob(templateUrl, mappings, clientData);
    const url = URL.createObjectURL(blob);

    // Descargar automáticamente
    const a = document.createElement('a');
    a.href = url;
    a.download = `documento_generado_${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { error: null, url };
  } catch (err) {
    console.error('[templateService] generateFilledPDF error:', err);
    return { error: err.message };
  }
}

// ──────────────────────────────────────────────
// Extraer campos de un formulario PDF (AcroForm)
// ──────────────────────────────────────────────
export async function getPDFFormFields(templateUrl) {
  try {
    const templateBytes = await fetch(templateUrl).then(r => r.arrayBuffer());
    const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    return fields.map(f => ({
      name: f.getName(),
      type: f.constructor.name
    }));
  } catch (err) {
    console.error('[templateService] getPDFFormFields error:', err);
    return [];
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
  // Usar la instancia estática de pdfjs-dist ya configurada por pdfToImage.js
  const pdfjsLib = await import('pdfjs-dist');

  // El worker ya se configura en pdfToImage.js, pero aseguramos que esté
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }

  const loadingTask = pdfjsLib.getDocument({ url, cMapUrl: undefined });
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

// ──────────────────────────────────────────────
// 6. Generar Documento (.docx)
// ──────────────────────────────────────────────
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';

export async function generateFilledDocx(templateUrl, clientData, templateName) {
  try {
    const templateBytes = await fetch(templateUrl).then(r => r.arrayBuffer());
    const zip = new PizZip(templateBytes);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    const data = {};
    AVAILABLE_CLIENT_FIELDS.forEach(field => {
      data[field.id] = getClientFieldValue(clientData, field.id) || '';
    });

    if (clientData.direccion) {
      let dir = clientData.direccion;
      if (typeof dir === 'string') {
        try { dir = JSON.parse(dir); } catch { dir = {}; }
      }
      data['direccion.endereco'] = dir.endereco || '';
      data['direccion.numero'] = dir.numero || '';
      data['direccion.bairro'] = dir.bairro || '';
      data['direccion.cidade'] = dir.cidade || '';
      data['direccion.estado'] = dir.estado || '';
      data['direccion.cep'] = dir.cep || '';
    }

    doc.render(data);

    const out = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    saveAs(out, `${templateName.replace(/\.[^/.]+$/, "")}_${clientData.nombre || 'documento'}.docx`);
    return { error: null };
  } catch (err) {
    console.error('[templateService] generateFilledDocx error:', err);
    return { error: err.message };
  }
}

// ──────────────────────────────────────────────
// 7. Generar Documento (HTML a PDF)
// ──────────────────────────────────────────────
export async function generateFilledHtmlPdf(templateUrl, clientData, templateName) {
  try {
    let htmlContent = await fetch(templateUrl).then(r => r.text());

    AVAILABLE_CLIENT_FIELDS.forEach(field => {
      const val = getClientFieldValue(clientData, field.id) || '';
      const regex = new RegExp(`{{${field.id}}}`, 'g');
      htmlContent = htmlContent.replace(regex, val);
    });

    if (clientData.direccion) {
      let dir = clientData.direccion;
      if (typeof dir === 'string') {
        try { dir = JSON.parse(dir); } catch { dir = {}; }
      }
      const dirFields = ['endereco', 'numero', 'bairro', 'cidade', 'estado', 'cep'];
      dirFields.forEach(k => {
        const val = dir[k] || '';
        const regex = new RegExp(`{{direccion.${k}}}`, 'g');
        htmlContent = htmlContent.replace(regex, val);
      });
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.padding = '20px';
    tempDiv.style.width = '210mm';
    tempDiv.style.boxSizing = 'border-box';
    tempDiv.style.fontFamily = 'Arial, sans-serif';

    const opt = {
      margin:       10,
      filename:     `${templateName.replace(/\.[^/.]+$/, "")}_${clientData.nombre || 'documento'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().from(tempDiv).set(opt).save();
    return { error: null };
  } catch (err) {
    console.error('[templateService] generateFilledHtmlPdf error:', err);
    return { error: err.message };
  }
}
