import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient'; // Solo para: upload / delete de documentos y consultas directas
import toast from 'react-hot-toast';
import { handleError } from '../utils/errorHandler';
import { analyzeDocumentImage } from '../services/aiService';
import useClientAiChat from '../hooks/useClientAiChat';
import { uploadDocument, deleteDocument } from '../services/storageService';
import {
  insertRelacion, updateRelacionTipo, deleteRelacion,
  updateCliente, searchClientes
} from '../services/clientesService';
import { createEntrada, updateEntradaEstado } from '../services/tramitesService';
import { ArrowLeft, Copy, Check, Edit2, Plus, UploadCloud, Users, User, Search, Image as ImageIcon, FileText, Loader2, UserPlus, Trash2, Clock, Sparkles, X, Download, ShieldCheck, MessageSquare, Send, AlertTriangle } from 'lucide-react';
import NewClientModal from './NewClientModal';
import TemplateManager from './TemplateManager';
import DocumentViewerModal from './DocumentViewerModal';
import ClientPersonalData from './ClientPersonalData';
import ClientDocuments from './ClientDocuments';
import ClientRelations from './ClientRelations';
import PDFGenerator from './PDFGenerator';
import ClientViewHeader from './ClientViewHeader';
import ClientViewTramites from './ClientViewTramites';
import ClientViewAiChat from './ClientViewAiChat';
import ClientViewRelateModal from './ClientViewRelateModal';
import ClientViewNewTramiteModal from './ClientViewNewTramiteModal';
import ClientViewEditModal from './ClientViewEditModal';
import ClientViewExtractionModal from './ClientViewExtractionModal';
import { findDuplicateContacts } from '../utils/contactUtils';
import DuplicateContactsWarning from './DuplicateContactsWarning';
import useClientData from '../hooks/useClientData';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import useDebounce from '../hooks/useDebounce';
import VirtualizedList from './VirtualizedList';
import { Badge } from './ui/Badge';
import { Avatar } from './ui/Avatar';
import { EmptyState } from './ui/EmptyState';
import { SkeletonCard } from './ui/SkeletonCard';

// Helper for native date inputs (YYYY-MM-DD <-> DD/MM/YYYY)
function toIsoDate(val) {
  if (!val) return '';
  if (val.match(/^\d{4}-\d{2}-\d{2}$/)) return val;
  const parts = val.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return val;
}
function toSlashDate(val) {
  if (!val) return '';
  const parts = val.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return val;
}

const ESTADO_CIVIL_OPTIONS = [
  "Casado(a)",
  "Divorciado(a)",
  "Outro",
  "Separado(a) Judicialmente",
  "Solteiro(a)",
  "União Estável",
  "Viúvo(a)"
];

const SEXO_OPTIONS = [
  "Masculino",
  "Feminino"
];

// Campos fijos de la tabla clientes — fuera del componente para no recrearlos en cada render
const FIXED_FIELDS_CATALOG = [
  { id: 'nombre', nombre_campo: 'Nombre', requerido: true, es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'cpf', nombre_campo: 'CPF', requerido: true, es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'email', nombre_campo: 'Email', requerido: false, es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'fecha_nacimiento', nombre_campo: 'Fecha Nacimiento', requerido: true, es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'estado_civil', nombre_campo: 'Estado Civil', requerido: false, es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'sexo', nombre_campo: 'Sexo', requerido: false, es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'nacionalidad', nombre_campo: 'Nacionalidad', requerido: true, es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'pais', nombre_campo: 'País de Origen', requerido: false, es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'lugar_nacimiento', nombre_campo: 'Lugar de Nacimiento', requerido: false, es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'estado_federal', nombre_campo: 'Estado de Origen', requerido: false, es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'ciudad', nombre_campo: 'Ciudad de Origen', requerido: false, es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'fecha_entrada_brasil', nombre_campo: 'Entrada a Brasil', requerido: false, es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'lugar_entrada_brasil', nombre_campo: 'Lugar Entrada', requerido: false, es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'direccion', nombre_campo: 'Dirección Completa', requerido: false, es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'rnm', nombre_campo: 'RNM', requerido: false, es_fijo: true, category_name: 'Documentos de Identidad' },
  { id: 'numero_pasaporte', nombre_campo: 'Pasaporte', requerido: false, es_fijo: true, category_name: 'Documentos de Identidad' },
  { id: 'fecha_emision_pasaporte', nombre_campo: 'Fecha Emisión Pasaporte', requerido: false, es_fijo: true, category_name: 'Documentos de Identidad' },
  { id: 'fecha_vencimiento_pasaporte', nombre_campo: 'Fecha Vencimiento Pasaporte', requerido: false, es_fijo: true, category_name: 'Documentos de Identidad' },
  { id: 'numero_refugio', nombre_campo: 'Protocolo de Refugio', requerido: false, es_fijo: true, category_name: 'Documentos de Identidad' },
  { id: 'fecha_vencimiento_refugio', nombre_campo: 'Fecha Vencimiento Refugio', requerido: false, es_fijo: true, category_name: 'Documentos de Identidad' },
  { id: 'carnet_identidad', nombre_campo: 'Carnet de Identidad', requerido: false, es_fijo: true, category_name: 'Documentos de Identidad' },
  { id: 'nombre_madre', nombre_campo: 'Nombre Madre', requerido: false, es_fijo: true, category_name: 'Datos Familiares' },
  { id: 'nombre_padre', nombre_campo: 'Nombre Padre', requerido: false, es_fijo: true, category_name: 'Datos Familiares' },
];

const TRAMITE_COLORS = {
  completada: { bg: 'rgba(29,158,117,0.18)', color: '#1D9E75' },
  procesando: { bg: 'rgba(55,138,221,0.18)', color: '#378ADD' },
  cancelada: { bg: 'rgba(216,90,48,0.18)', color: '#D85A30' },
  pendiente: { bg: 'rgba(186,117,23,0.18)', color: '#BA7517' },
};

export default function ClientView({ clientId, onBack, onNavigateToClient }) {
  const queryClient = useQueryClient();
  const { client, categories: categorias, fields: campos, clientData: clienteDatos, relations: relaciones, documents: documentos, entradas, duplicateContacts, isLoading, isError } = useClientData(clientId);

  const { data: allClientes = [] } = useQuery({
    queryKey: ['allClientesBase'],
    queryFn: async () => {
      const { data } = await supabase.from('clientes').select('id, nombre, cpf');
      return data || [];
    }
  });

  const [activeTab, setActiveTab] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRelateModalOpen, setIsRelateModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit State
  const [editFormData, setEditFormData] = useState([]);
  const [newFields, setNewFields] = useState([]);
  const [editModalSearchQuery, setEditModalSearchQuery] = useState('');

  // Upload State
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Drag document state (for dragging thumbnails to related clients)
  const [draggedDocument, setDraggedDocument] = useState(null);
  const [dragOverRelId, setDragOverRelId] = useState(null);

  // Relate State
  const [selectedRelateId, setSelectedRelateId] = useState('');
  const [selectedRelateType, setSelectedRelateType] = useState('familiar');
  const [isNewRelateClientModalOpen, setIsNewRelateClientModalOpen] = useState(false);
  const [editingRelId, setEditingRelId] = useState(null);


  // Search state para relacionar cliente existente
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  // Agente 2: Uso de searchClientes del service en vez de supabase directamente
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const data = await searchClientes(searchQuery);
          setSearchResults(data);
        } catch (err) {
          console.error('[ClientView] search error:', err);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // AI Extraction State
  const [extractedData, setExtractedData] = useState(null);
  const [isExtractionModalOpen, setIsExtractionModalOpen] = useState(false);

  const {
    isAiChatOpen,
    setIsAiChatOpen,
    aiChatMessages,
    aiChatInput,
    setAiChatInput,
    isAiChatLoading,
    crmContext,
    handleSendAiMessage,
  } = useClientAiChat(client, clienteDatos, entradas);

  const [editingCategoryId, setEditingCategoryId] = useState(null);

  // New Tramite State
  const [isNewTramiteModalOpen, setIsNewTramiteModalOpen] = useState(false);
  const [newTramiteData, setNewTramiteData] = useState({ servicio: '', operario: '' });
  const [isCreatingTramite, setIsCreatingTramite] = useState(false);

  // Document Viewer State (doble click)
  const [viewingDocument, setViewingDocument] = useState(null);
  const [showMergeModal, setShowMergeModal] = useState(false);

  const fetchClientData = async (fullReload = false) => {
    await queryClient.invalidateQueries();
  };

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const fixedFields = FIXED_FIELDS_CATALOG;

  const handleCepSearch = async (cepValue) => {
    if (!cepValue) return;
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setEditFormData(prev => prev.map(f => {
            if (f.id === 'direccion') {
              return {
                ...f,
                _endereco: f._endereco || data.logradouro,
                _bairro: f._bairro || data.bairro,
                _cidade: f._cidade || data.localidade,
                _estado: f._estado || data.uf
              };
            }
            return f;
          }));
        }
      } catch (err) {
        console.error('Error fetching CEP:', err);
      }
    }
  };

  const openEditModal = (categoriaId) => {
    // Si esta en el generador de trámites, abrimos la categoria de Identidad por defecto para editar los datos más comunes
    let targetTabs = [];
    let activeCategoriasNombres = [];

    if (categoriaId === 'ALL_PERSONAL') {
      const personalCats = categorias.filter(c => ["Informaciones Personales", "Datos Familiares", "Documentos de Identidad"].includes(c.nombre));
      targetTabs = personalCats.map(c => c.id);
      activeCategoriasNombres = personalCats.map(c => c.nombre);
    } else {
      const targetTab = categoriaId || (categorias.length > 0 ? categorias[0].id : null);
      targetTabs = [targetTab];
      const activeCategoria = categorias.find(c => c.id === targetTab);
      activeCategoriasNombres = [activeCategoria?.nombre || ''];
    }

    const activeFixedFields = fixedFields.filter(f => activeCategoriasNombres.includes(f.category_name));
    const dynamicFieldsForTab = campos.filter(c => targetTabs.includes(c.categoria_id));

    // 1. Populate Fixed Fields (incluso si están vacíos para que el usuario los llene)
    const formData = [];
    activeFixedFields.forEach(f => {
      let extraArgs = {};
      if (f.id === 'nombre') {
        const fullName = (client[f.id] || '').trim().toUpperCase();
        const parts = fullName.split(' ');

        // Extraer nombres de los padres para adivinar los apellidos
        const padreName = (client.nombre_padre || '').trim().toUpperCase().split(' ');
        const madreName = (client.nombre_madre || '').trim().toUpperCase().split(' ');

        let splitIndex = 1; // Por defecto (como estaba antes)

        if (parts.length > 2) {
          // Asumimos por defecto convención hispana: últimos 2 son apellidos
          splitIndex = parts.length - 2;

          // Intentar confirmar con apellidos de los padres
          const padreApe1 = padreName.length > 1 ? padreName[padreName.length - 2] : null;
          const madreApe1 = madreName.length > 1 ? madreName[madreName.length - 2] : null;

          if (padreApe1 && madreApe1) {
            // Buscar si los dos últimos del cliente coinciden con el 1ro del padre y 1ro de la madre
            const childApe1 = parts[parts.length - 2];
            const childApe2 = parts[parts.length - 1];

            if (childApe1 === padreApe1 && childApe2 === madreApe1) {
              splitIndex = parts.length - 2;
            } else {
              // Quizás solo coincida uno de los apellidos, buscar dónde empieza
              const padreIdx = parts.indexOf(padreApe1);
              if (padreIdx > 0) {
                splitIndex = padreIdx;
              }
            }
          }
        }

        extraArgs._nombres = parts.slice(0, splitIndex).join(' ') || '';
        extraArgs._apellidos = parts.slice(splitIndex).join(' ') || '';
      }
      if (f.id === 'direccion') {
        let dirData = {};
        try {
          if (typeof client.direccion === 'string' && client.direccion.startsWith('{')) {
            dirData = JSON.parse(client.direccion);
          } else if (typeof client.direccion === 'object' && client.direccion !== null) {
            dirData = client.direccion;
          } else if (client.direccion) {
            dirData._endereco = client.direccion;
          }
        } catch (e) { }
        extraArgs._cep = dirData.cep || '';
        extraArgs._endereco = dirData.endereco || dirData._endereco || '';
        extraArgs._numero = dirData.numero || '';
        extraArgs._complemento = dirData.complemento || '';
        extraArgs._bairro = dirData.bairro || '';
        extraArgs._cidade = dirData.cidade || '';
        extraArgs._estado = dirData.estado || '';
        extraArgs._ponto_referencia = dirData.ponto_referencia || '';
      }
      formData.push({
        id: f.id,
        campo_id: f.id,
        nombre_campo: f.nombre_campo,
        valor: client[f.id] || '',
        es_fijo: true,
        ...extraArgs
      });
    });

    // 2. Populate Dynamic Fields (incluso si están vacíos)
    dynamicFieldsForTab.forEach(campo => {
      const existingData = clienteDatos.find(cd => cd.campo_id === campo.id);
      formData.push({
        id: existingData?.id || null,
        campo_id: campo.id,
        nombre_campo: campo.nombre_campo,
        valor: existingData?.valor || '',
        es_fijo: false
      });
    });

    // 3. Append orphaned dynamic fields just in case
    clienteDatos.forEach(cd => {
      const isAlreadyIncluded = formData.find(f => f.campo_id === cd.campo_id);
      if (!isAlreadyIncluded && cd.valor) {
        const campoDef = campos.find(c => c.id === cd.campo_id);
        if (!campoDef || targetTabs.includes(campoDef.categoria_id)) {
          formData.push({
            id: cd.id,
            campo_id: cd.campo_id,
            nombre_campo: campoDef ? campoDef.nombre_campo : 'Dato Personalizado',
            valor: cd.valor,
            es_fijo: false
          });
        }
      }
    });

    setEditFormData(formData);
    setNewFields([]);
    setEditingCategoryId(categoriaId === 'ALL_PERSONAL' ? 'ALL_PERSONAL' : targetTabs[0]);
    setIsEditModalOpen(true);
  };

  const handleDeleteFieldData = async (dataId, es_fijo) => {
    if (es_fijo) {
      if (!window.confirm('¿Borrar este dato base del cliente?')) return;
      try {
        await supabase.from('clientes').update({ [dataId]: null }).eq('id', clientId);
        setEditFormData(editFormData.map(f => f.id === dataId ? { ...f, valor: '' } : f));
        await fetchClientData();
      } catch (err) { handleError(err, 'Error borrando dato base'); }
      return;
    }
    if (!window.confirm('¿Eliminar este dato del cliente?')) return;
    try {
      await supabase.from('cliente_datos_operacionales').delete().eq('id', dataId);
      setEditFormData(editFormData.filter(f => f.id !== dataId));
      await fetchClientData();
    } catch (err) {
      console.error(err);
      handleError(err, 'Error eliminando el dato');
    }
  };

  const handleAddCustomField = () => {
    setNewFields([...newFields, { id: Date.now(), campo_id: '', valor: '', customName: '' }]);
  };

  const handleSaveEdits = async () => {
    setIsSaving(true);
    try {
      const fixedUpdates = {};

      for (const field of editFormData) {
        if (field.es_fijo) {
          let upperValue = field.valor?.toUpperCase() || null;
          if (field.id === 'nombre') {
            upperValue = `${(field._nombres || '').trim()} ${(field._apellidos || '').trim()}`.trim().toUpperCase();
            upperValue = upperValue || null;
          }
          if (field.id === 'direccion') {
            const dirObj = {
              cep: field._cep || '',
              endereco: field._endereco || '',
              numero: field._numero || '',
              complemento: field._complemento || '',
              bairro: field._bairro || '',
              cidade: field._cidade || '',
              estado: field._estado || '',
              ponto_referencia: field._ponto_referencia || ''
            };
            upperValue = JSON.stringify(dirObj);
          }
          if (client[field.id] !== upperValue && (client[field.id] || upperValue)) {
            fixedUpdates[field.id] = upperValue;
          }
        } else {
          // Dynamic fields
          const original = clienteDatos.find(cd => cd.id === field.id);
          const upperValue = field.valor?.toUpperCase() || '';

          if (field.id) {
            if (original && original.valor !== upperValue) {
              await supabase.from('cliente_datos_operacionales').update({ valor: upperValue }).eq('id', field.id);
            }
          } else if (upperValue) {
            await supabase.from('cliente_datos_operacionales').insert({
              id_cliente: clientId,
              campo_id: field.campo_id,
              valor: upperValue
            });
          }
        }
      }

      // Process newFields (Custom EAV fields added via dropdown)
      for (const nf of newFields) {
        if (!nf.campo_id || !nf.valor) continue;
        const upperVal = nf.valor.toUpperCase();

        // If it's a fixed field added from dropdown
        const isFixed = fixedFields.find(f => f.id === nf.campo_id);
        if (isFixed) {
          fixedUpdates[nf.campo_id] = upperVal;
          continue;
        }

        // If it's a completely new custom field
        let targetCampoId = nf.campo_id;
        if (nf.campo_id === 'custom' && nf.customName) {
          // Crear el campo operacional en caso de ser 'custom'
          const targetCategoriaIdForCustom = editingCategoryId === 'ALL_PERSONAL'
            ? categorias.find(c => c.nombre === 'Informaciones Personales')?.id || categorias[0]?.id
            : editingCategoryId;

          const { data: newCampo, error: errC } = await supabase.from('campos_datos_operacionales').insert({
            categoria_id: targetCategoriaIdForCustom,
            nombre_campo: nf.customName.toUpperCase(),
            tipo_campo: 'texto'
          }).select().single();

          if (newCampo) {
            targetCampoId = newCampo.id;
          } else {
            continue;
          }
        } else if (nf.campo_id === 'custom') {
          continue; // Missing name
        }

        await supabase.from('cliente_datos_operacionales').insert({
          id_cliente: clientId,
          campo_id: targetCampoId,
          valor: upperVal
        });
      }

      if (Object.keys(fixedUpdates).length > 0) {
        const { error: fErr } = await supabase.from('clientes').update(fixedUpdates).eq('id', clientId);
        if (fErr) throw fErr;
      }

      await fetchClientData();
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Error saving edits:', err);
      alert('Error al guardar. Verifica la consola.');
    } finally {
      setIsSaving(false);
    }
  };

  // Eliminar documento — delegado al storageService
  const handleDeleteDocument = useCallback(async (doc) => {
    if (!window.confirm(`Eliminar "${doc.nombre_archivo}"?`)) return;
    const { error } = await deleteDocument(doc);
    if (error) { alert(`Error eliminando documento: ${error}`); return; }
    await fetchClientData(false);
  }, [fetchClientData]);

  // Copiar documento a otro cliente (arrastrar miniatura a relacionamiento)
  const handleCopyDocumentToClient = useCallback(async (doc, targetClientId) => {
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
          estado: 'pendiente'
        })
        .select()
        .single();

      if (error) {
        alert(`Error al copiar el documento: ${error.message}`);
        return;
      }

      alert('Documento copiado al cliente relacionado exitosamente.');
      setDraggedDocument(null);
    } catch (err) {
      console.error('Error copying document:', err);
      alert('Error al copiar el documento. Verifica la consola.');
    }
  }, [clientId]);

  // Subir documento — delegado al storageService
  const handleFileUpload = useCallback(async (e) => {
    e.preventDefault();
    let file;
    if (e.dataTransfer && e.dataTransfer.files) {
      file = e.dataTransfer.files[0];
    } else if (e.target && e.target.files) {
      file = e.target.files[0];
    }
    if (!file) return;
    setUploading(true);
    try {
      const { data: docRecord, error } = await uploadDocument(file, clientId);
      if (error) { alert(`Error: ${error}`); return; }

      await fetchClientData(false);

      // Si es imagen o PDF, lanzar análisis IA
      if ((file.type.startsWith('image/') || file.type === 'application/pdf') && docRecord) {
        try {
          let fileOrBase64 = file;
          if (file.type === 'application/pdf') {
            const { convertPdfPageToImageBase64 } = await import('../services/pdfToImage');
            fileOrBase64 = await convertPdfPageToImageBase64(file);
          }
          const aiData = await analyzeDocumentImage(fileOrBase64);
          if (aiData && Object.keys(aiData).filter(k => aiData[k]).length > 0) {
            setExtractedData(aiData);
            setIsExtractionModalOpen(true);
          } else {
            console.warn('[ClientView] IA no encontró datos en el documento.');
          }
        } catch (aiErr) {
          console.warn('[ClientView] AI analysis error:', aiErr.message);
          // Mostrar error visible solo si es un problema de configuración
          if (aiErr.message.includes('API Key')) {
            alert('Aviso: Análisis IA no disponible. Verifica VITE_OPENROUTER_API_KEY en el .env');
          }
        }
      }
    } finally {
      setUploading(false);
      if (e.target && e.target.type === 'file') {
        e.target.value = '';
      }
    }
  }, [clientId, fetchClientData]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e);
  }, [handleFileUpload]);

  const handleSaveExtractedData = async () => {
    setIsSaving(true);
    try {
      const updates = {};
      const fieldMap = {
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
        'NOMBRE_PADRE': 'nombre_padre'
      };

      // 1. Map known fixed fields
      for (const [key, value] of Object.entries(extractedData)) {
        if (!value) continue;
        const upperKey = key.toUpperCase();
        const upperVal = String(value).toUpperCase();

        const mappedCol = fieldMap[upperKey];
        if (mappedCol) {
          updates[mappedCol] = upperVal;
        }
      }

      // 2. Save fixed fields to `clientes` table
      if (Object.keys(updates).length > 0) {
        await supabase.from('clientes').update(updates).eq('id', clientId);
      }

      await fetchClientData();
      setIsExtractionModalOpen(false);
    } catch (err) {
      console.error('Error saving extracted data:', err);
      alert('Error guardando los datos extraídos.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRelateClient = useCallback(async () => {
    if (!selectedRelateId || !selectedRelateType) return;
    const toastId = toast.loading('Vinculando cliente...');
    try {
      await insertRelacion({
        cliente_id: clientId,
        cliente_relacionado_id: Number(selectedRelateId),
        tipo_relacion: selectedRelateType,
      });
      queryClient.invalidateQueries({ queryKey: ['relations', clientId] });
      setIsRelateModalOpen(false);
      setSelectedRelateId('');
      setSelectedRelateType('familiar');
      toast.success('Cliente vinculado correctamente', { id: toastId });
    } catch (err) {
      console.error('[ClientView] handleRelateClient:', err);
      toast.error('Error al vincular cliente', { id: toastId });
    }
  }, [clientId, selectedRelateId, selectedRelateType, queryClient]);

  const handleUpdateRelationType = useCallback(async (relId, newType) => {
    try {
      await updateRelacionTipo(relId, newType);
      queryClient.invalidateQueries({ queryKey: ['relations', clientId] });
      setEditingRelId(null);
    } catch (err) {
      console.error('[ClientView] handleUpdateRelationType:', err);
      toast.error('Error al actualizar la relación');
    }
  }, [clientId, queryClient]);

  const handleDeleteRelation = useCallback(async (relationId) => {
    if (!window.confirm('Eliminar este vínculo familiar?')) return;
    const toastId = toast.loading('Eliminando vínculo...');
    try {
      await deleteRelacion(relationId);
      queryClient.invalidateQueries({ queryKey: ['relations', clientId] });
      toast.success('Vínculo eliminado', { id: toastId });
    } catch (err) {
      console.error('[ClientView] handleDeleteRelation:', err);
      toast.error('Error eliminando la relación', { id: toastId });
    }
  }, [clientId, queryClient]);

  // Agente 3: useCallback para evitar re-renders en ClientDocuments
  const handleToggleDocumentStatus = useCallback(async (doc) => {
    const newEstado = doc.estado === 'verificado' ? 'pendiente' : 'verificado';
    try {
      await supabase.from('documentos_operacionales').update({ estado: newEstado }).eq('id', doc.id);
      queryClient.invalidateQueries({ queryKey: ['documents', clientId] });
    } catch (err) {
      handleError(err, 'Error actualizando estado del documento');
    }
  }, [clientId, queryClient]);


  const handleDeleteClient = useCallback(async () => {
    if (!window.confirm('Eliminar este cliente y TODOS sus datos? Esta acción no puede deshacerse.')) return;
    setIsDeleting(true);
    const toastId = toast.loading('Eliminando cliente...');
    try {
      await supabase.from('relaciones_clientes').delete().or(`cliente_id.eq.${clientId},cliente_relacionado_id.eq.${clientId}`);
      await supabase.from('documentos_operacionales').delete().eq('id_cliente', clientId);
      await supabase.from('cliente_datos_operacionales').delete().eq('id_cliente', clientId);
      const { error } = await supabase.from('clientes').delete().eq('id', clientId);
      if (error) throw error;
      toast.success('Cliente eliminado', { id: toastId });
      onBack();
    } catch (err) {
      console.error('[ClientView] deleteClient:', err);
      toast.error('Error al eliminar. Puede tener trámites vinculados.', { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  }, [clientId, onBack]);

  const handleChangeTramiteState = useCallback(async (entradaId, newState) => {
    try {
      await updateEntradaEstado(entradaId, newState);
      queryClient.invalidateQueries({ queryKey: ['entradas', clientId] });
      toast.success('Estado del trámite actualizado');
    } catch (err) {
      console.error('[ClientView] handleChangeTramiteState:', err);
      toast.error('Error al actualizar el estado del trámite.');
    }
  }, [clientId, queryClient]);

  const handleCreateTramite = useCallback(async () => {
    if (!newTramiteData.servicio.trim()) {
      toast.error('Por favor ingresa el nombre del servicio/trámite.');
      return;
    }
    setIsCreatingTramite(true);
    const toastId = toast.loading('Creando trámite...');
    try {
      await createEntrada({
        id_cliente: clientId,
        servicio: newTramiteData.servicio,
        operario: newTramiteData.operario,
      });
      queryClient.invalidateQueries({ queryKey: ['entradas', clientId] });
      setIsNewTramiteModalOpen(false);
      setNewTramiteData({ servicio: '', operario: '' });
      toast.success('Trámite creado', { id: toastId });
    } catch (err) {
      console.error('[ClientView] handleCreateTramite:', err);
      toast.error('Error al crear el trámite.', { id: toastId });
    } finally {
      setIsCreatingTramite(false);
    }
  }, [clientId, newTramiteData, queryClient]);

  const handleSendToExtension = () => {
    const fullData = { ...client };
    clienteDatos.forEach(cd => {
      const campoDef = campos.find(c => c.id === cd.campo_id);
      if (campoDef && cd.valor) {
        fullData[campoDef.nombre_campo.toLowerCase()] = cd.valor;
      }
    });

    // Extraer los nombres y apellidos exactamente como están divididos en la interfaz
    const nameField = editFormData.find(f => f.id === 'nombre');
    if (nameField) {
      if (nameField._nombres) fullData.nombres = nameField._nombres.trim();
      if (nameField._apellidos) fullData.apellidos = nameField._apellidos.trim();
    }

    window.postMessage({ type: 'CUBANOS_BR_SYNC', clientData: fullData }, '*');
    toast.success(`Datos de ${client.nombre} enviados a la extensión.`);
  };

  // Agente 4: Skeleton de carga en vez de texto plano
  if (isLoading) {
    return (
      <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header skeleton */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-bg-elevated)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ height: 24, width: '40%', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-elevated)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ height: 16, width: '60%', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-elevated)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        </div>
        {/* Content skeletons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ height: 64, borderRadius: 'var(--radius-md)', background: 'var(--color-bg-elevated)', animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite` }} />
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[1, 2].map(i => (
              <div key={i} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[1, 2, 3].map(j => (
                  <div key={j} style={{ height: 44, borderRadius: 'var(--radius-md)', background: 'var(--color-bg-elevated)', animation: `pulse 1.5s ease-in-out ${j * 0.1}s infinite` }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: 'var(--section-gap, 16px)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '480px', padding: '1.5rem', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 0.5rem', color: 'var(--color-text-primary)' }}>No se pudieron cargar los datos del cliente</h2>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Intenta volver a cargar la vista o seleccionar otro cliente.</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div style={{ padding: 'var(--section-gap, 16px)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '480px', padding: '1.5rem', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 0.5rem', color: 'var(--color-text-primary)' }}>No hay datos disponibles</h2>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Selecciona otro cliente para ver su información.</p>
        </div>
      </div>
    );
  }

  const normalizeEditSearchText = (value = '') =>
    String(value || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const editModalQuery = normalizeEditSearchText(editModalSearchQuery);
  const filteredEditFormData = editFormData.filter(field => {
    if (!editModalQuery) return true;

    const fieldName = normalizeEditSearchText(field.nombre_campo);
    let fieldValue = '';

    if (field.id === 'nombre') {
      fieldValue = normalizeEditSearchText(`${field._nombres || ''} ${field._apellidos || ''}`);
    } else if (field.id === 'direccion') {
      fieldValue = normalizeEditSearchText(`${field._endereco || ''} ${field._numero || ''} ${field._bairro || ''} ${field._cidade || ''}`);
    } else {
      fieldValue = normalizeEditSearchText(field.valor);
    }

    return fieldName.includes(editModalQuery) || fieldValue.includes(editModalQuery);
  });

  const filteredNewFields = newFields.filter(field => {
    if (!editModalQuery) return true;

    const campoRef = campos.find(c => c.id === field.campo_id) || FIXED_FIELDS_CATALOG.find(f => f.id === field.campo_id);
    const fieldName = normalizeEditSearchText(field.customName || campoRef?.nombre_campo || '');
    const fieldValue = normalizeEditSearchText(field.valor);

    return fieldName.includes(editModalQuery) || fieldValue.includes(editModalQuery);
  });

  const hasEditModalResults = filteredEditFormData.length > 0 || filteredNewFields.length > 0;



  return (
    <div style={{ padding: 'var(--section-gap, 16px)', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="animate-fade-in">
      <ClientViewHeader
        client={client}
        duplicateContacts={duplicateContacts}
        setShowMergeModal={setShowMergeModal}
        handleDeleteClient={handleDeleteClient}
        isDeleting={isDeleting}
        isAiChatOpen={isAiChatOpen}
        setIsAiChatOpen={setIsAiChatOpen}
        handleSendToExtension={handleSendToExtension}
        openEditModal={openEditModal}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1.5rem', flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative' }}>
        {/* Columna Izquierda: Datos Personales y Trámites */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
          <ClientPersonalData
            client={client}
            categorias={categorias}
            campos={campos}
            clienteDatos={clienteDatos}
            fixedFields={FIXED_FIELDS_CATALOG}
            localSearchQuery={localSearchQuery}
            setLocalSearchQuery={setLocalSearchQuery}
            openEditModal={openEditModal}
            handleCopy={handleCopy}
            copiedId={copiedId}
          />

          <TemplateManager client={client} clienteDatos={clienteDatos} />
        </div>

        {/* Columna Derecha: Sidebar (Relaciones, Docs, Historial) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '0.5rem', height: '100%' }}>
          {/* Moviendo la sección de Relacionamientos arriba en el sidebar */}
          <ClientRelations
            relaciones={relaciones}
            clientId={clientId}
            draggedDocument={draggedDocument}
            dragOverRelId={dragOverRelId}
            setDragOverRelId={setDragOverRelId}
            handleCopyDocumentToClient={handleCopyDocumentToClient}
            onNavigateToClient={onNavigateToClient}
            editingRelId={editingRelId}
            setEditingRelId={setEditingRelId}
            handleUpdateRelationType={handleUpdateRelationType}
            handleDeleteRelation={handleDeleteRelation}
            setSearchQuery={setSearchQuery}
            setSelectedRelateId={setSelectedRelateId}
            setIsRelateModalOpen={setIsRelateModalOpen}
          />

          <ClientDocuments
            documentos={documentos}
            uploading={uploading}
            isDragging={isDragging}
            draggedDocument={draggedDocument}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
            handleFileUpload={handleFileUpload}
            setDraggedDocument={setDraggedDocument}
            setDragOverRelId={setDragOverRelId}
            setViewingDocument={setViewingDocument}
            handleDeleteDocument={handleDeleteDocument}
          />

          <ClientViewTramites
            entradas={entradas}
            onCreateTramite={() => setIsNewTramiteModalOpen(true)}
            onUpdateEstado={handleChangeTramiteState}
          />
        </div>
      </div>

      {/* Alerta de contactos duplicados */}
      <DuplicateContactsWarning 
        clientId={clientId} 
        duplicateContacts={duplicateContacts} 
        onMergeCompleteCallback={() => fetchClientData(true)} 
        externalShowModal={showMergeModal} 
        setExternalShowModal={setShowMergeModal} 
        onNavigateToClient={onNavigateToClient}
      />

      <ClientViewAiChat
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        messages={aiChatMessages}
        input={aiChatInput}
        onInputChange={setAiChatInput}
        onSend={handleSendAiMessage}
        isLoading={isAiChatLoading}
        crmContext={crmContext}
      />

      <ClientViewRelateModal
        isOpen={isRelateModalOpen}
        onClose={() => setIsRelateModalOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResults={searchResults}
        allClientes={allClientes}
        selectedId={selectedRelateId}
        onSelectId={setSelectedRelateId}
        selectedType={selectedRelateType}
        onSelectType={setSelectedRelateType}
        onOpenNewClient={() => setIsNewRelateClientModalOpen(true)}
        clientId={clientId}
        onRelate={handleRelateClient}
      />

      {isNewRelateClientModalOpen && (
        <NewClientModal
          onClose={() => setIsNewRelateClientModalOpen(false)}
          onClientCreated={(newClient) => {
            setAllClientes([...allClientes, newClient]);
            setSelectedRelateId(newClient.id);
            setIsNewRelateClientModalOpen(false);
          }}
        />
      )}

      <ClientViewEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        categorias={categorias}
        campos={campos}
        clienteDatos={clienteDatos}
        client={client}
        editFormData={editFormData}
        onEditFormDataChange={setEditFormData}
        newFields={newFields}
        onNewFieldsChange={setNewFields}
        onSaveEdits={handleSaveEdits}
        isSaving={isSaving}
        searchQuery={editModalSearchQuery}
        onSearchChange={setEditModalSearchQuery}
        fixedFieldsCatalog={FIXED_FIELDS_CATALOG}
        handleCepSearch={handleCepSearch}
        toIsoDate={toIsoDate}
        toSlashDate={toSlashDate}
      />

      <ClientViewExtractionModal
        isOpen={isExtractionModalOpen}
        extractedData={extractedData}
        cliente={client}
        onClose={() => setIsExtractionModalOpen(false)}
        onExtractedDataChange={setExtractedData}
        onSave={handleSaveExtractedData}
        isSaving={isSaving}
      />

      <ClientViewNewTramiteModal
        isOpen={isNewTramiteModalOpen}
        onClose={() => setIsNewTramiteModalOpen(false)}
        servicio={newTramiteData.servicio}
        onServicioChange={(val) => setNewTramiteData(prev => ({ ...prev, servicio: val }))}
        operario={newTramiteData.operario}
        onOperarioChange={(val) => setNewTramiteData(prev => ({ ...prev, operario: val }))}
        onCreate={handleCreateTramite}
        isCreating={isCreatingTramite}
      />

      {viewingDocument && (
        <DocumentViewerModal
          document={viewingDocument}
          onClose={() => setViewingDocument(null)}
        />
      )}


    </div>
  );
}

