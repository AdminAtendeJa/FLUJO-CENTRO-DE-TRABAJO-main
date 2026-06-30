/**
 * useClientViewExtraction.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Encapsula la lógica de extracción IA de documentos: estado del modal,
 * datos extraídos, guardado en tabla `clientes`, y la copia de documentos
 * a clientes relacionados (que dispara análisis IA sobre el documento copiado).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { analyzeDocumentImage } from '../services/aiService';
import { normalizeDateToDDMMYYYY } from '../utils/dateFormatter';

/** Mapeo de claves IA → columnas de la tabla `clientes` */
const AI_FIELD_MAP = {
  'NOMBRE_COMPLETO': 'nombre',
  'CPF': 'cpf',
  'RNM': 'rnm',
  'CARNET_IDENTIDAD': 'carnet_identidad',
  'FECHA_NACIMIENTO': 'fecha_nacimiento',
  'LUGAR_NACIMIENTO': 'lugar_nacimiento',
  'NACIONALIDAD': 'nacionalidad',
  'NUMERO_DOCUMENTO': 'numero_pasaporte',
  'NUMERO_REFUGIO': 'numero_refugio',
  'FECHA_EMISION_PASAPORTE': 'fecha_emision_pasaporte',
  'FECHA_VENCIMIENTO_PASAPORTE': 'fecha_vencimiento_pasaporte',
  'FECHA_VENCIMIENTO_REFUGIO': 'fecha_vencimiento_refugio',
  'SEXO': 'sexo',
  'NOMBRE_MADRE': 'nombre_madre',
  'NOMBRE_PADRE': 'nombre_padre',
};

/** Claves de la IA que contienen fechas (para normalizar a DD/MM/YYYY) */
const AI_DATE_KEYS = new Set([
  'FECHA_NACIMIENTO',
  'FECHA_EMISION_PASAPORTE',
  'FECHA_VENCIMIENTO_PASAPORTE',
  'FECHA_VENCIMIENTO_REFUGIO',
]);

export default function useClientViewExtraction({ clientId, fetchClientData }) {
  // Extraction modal state
  const [extractedData, setExtractedData] = useState(null);
  const [isExtractionModalOpen, setIsExtractionModalOpen] = useState(false);
  const [extractionTargetClientId, setExtractionTargetClientId] = useState(null);
  const [extractionTargetClientData, setExtractionTargetClientData] = useState(null);
  const [uploadedDocRecord, setUploadedDocRecord] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // ── Save extracted data to `clientes` table ────────────────────────────────
  const handleSaveExtractedData = async () => {
    setIsSaving(true);
    try {
      const updates = {};

      for (const [key, value] of Object.entries(extractedData)) {
        if (!value) continue;
        const upperKey = key.toUpperCase();

        const mappedCol = AI_FIELD_MAP[upperKey];
        if (mappedCol) {
          // Normalize dates to DD/MM/YYYY, uppercase everything else
          if (AI_DATE_KEYS.has(upperKey)) {
            updates[mappedCol] = normalizeDateToDDMMYYYY(value) || String(value).toUpperCase();
          } else {
            updates[mappedCol] = String(value).toUpperCase();
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        const targetId = extractionTargetClientId || clientId;
        await supabase.from('clientes').update(updates).eq('id', targetId);
      }

      await fetchClientData();
      setIsExtractionModalOpen(false);
      setExtractionTargetClientId(null);
      setExtractionTargetClientData(null);
    } catch (err) {
      console.error('[useClientViewExtraction] Error saving extracted data:', err);
      alert('Error guardando los datos extraídos.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Copy document to a related client + run AI analysis ────────────────────
  const handleCopyDocumentToClient = useCallback(async (doc, targetClientId, setDraggedDocument) => {
    if (!doc || !targetClientId || targetClientId === clientId) return;

    try {
      // Fetch the source document to get its URL
      const { data: sourceDoc } = await supabase
        .from('documentos_operacionales')
        .select('*')
        .eq('id', doc.id)
        .single();

      if (!sourceDoc) {
        alert('Error: Documento no encontrado en la base de datos.');
        return;
      }

      // Insert the document record for the target client (same file reference)
      const { data: newDoc, error } = await supabase
        .from('documentos_operacionales')
        .insert({
          id_cliente: targetClientId,
          nombre_archivo: sourceDoc.nombre_archivo,
          url_archivo: sourceDoc.url_archivo,
          tipo_contenido: sourceDoc.tipo_contenido,
          tipo_documento: sourceDoc.tipo_documento,
          subido_por: sourceDoc.subido_por || 'user/admin',
          estado: 'pendiente'
        })
        .select()
        .single();

      if (error) {
        alert(`Error al copiar el documento: ${error.message}`);
        return;
      }

      alert('Documento copiado al cliente relacionado exitosamente.');
      if (setDraggedDocument) setDraggedDocument(null);

      // If the document is an image or PDF, run AI analysis targeting the related client
      if (sourceDoc.tipo_contenido.startsWith('image/') || sourceDoc.tipo_contenido === 'application/pdf') {
        const toastId = toast.loading('Analizando documento para el cliente relacionado...');
        try {
          const { data: targetClient } = await supabase.from('clientes').select('*').eq('id', targetClientId).single();

          const response = await fetch(sourceDoc.url_archivo);
          const blob = await response.blob();
          const isPdf = sourceDoc.tipo_contenido === 'application/pdf';
          const file = new File([blob], isPdf ? 'documento.pdf' : 'imagen.jpg', { type: sourceDoc.tipo_contenido });

          let fileOrBase64 = file;
          if (isPdf) {
            const { convertPdfPageToImageBase64 } = await import('../services/pdfToImage');
            fileOrBase64 = await convertPdfPageToImageBase64(file);
          }

          const aiData = await analyzeDocumentImage(fileOrBase64);
          if (aiData && Object.keys(aiData).filter(k => aiData[k]).length > 0) {
            toast.dismiss(toastId);
            setExtractedData(aiData);
            setExtractionTargetClientId(targetClientId);
            setExtractionTargetClientData(targetClient);
            setUploadedDocRecord(newDoc);
            setIsExtractionModalOpen(true);
          } else {
            toast.error('La IA no encontró datos extraíbles.', { id: toastId });
          }
        } catch (aiErr) {
          console.warn('[useClientViewExtraction] AI copy analysis error:', aiErr.message);
          toast.error('Error durante el análisis de IA.', { id: toastId });
        }
      }

    } catch (err) {
      console.error('[useClientViewExtraction] Error copying document:', err);
      alert('Error al copiar el documento. Verifica la consola.');
    }
  }, [clientId]);

  // ── Close / reset extraction modal ─────────────────────────────────────────
  const closeExtractionModal = useCallback(() => {
    setIsExtractionModalOpen(false);
    setExtractionTargetClientId(null);
    setExtractionTargetClientData(null);
  }, []);

  return {
    // State
    extractedData,
    setExtractedData,
    isExtractionModalOpen,
    setIsExtractionModalOpen,
    extractionTargetClientId,
    extractionTargetClientData,
    uploadedDocRecord,
    setUploadedDocRecord,
    isSaving,
    // Handlers
    handleSaveExtractedData,
    handleCopyDocumentToClient,
    closeExtractionModal,
  };
}
