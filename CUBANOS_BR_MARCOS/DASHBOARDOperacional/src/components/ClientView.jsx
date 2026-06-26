import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { analyzeDocumentImage, chatWithClientContext } from '../services/aiService';
import { getChatHistoryFromN8n } from '../services/crmBridgeService';
import { uploadDocument, deleteDocument } from '../services/storageService';
import { generateDocumentPDF } from '../services/pdfGenerator';
import { ArrowLeft, Copy, Check, Edit2, Plus, UploadCloud, Users, User, Search, Image as ImageIcon, FileText, Loader2, UserPlus, Trash2, Clock, Sparkles, X, Download, ShieldCheck, MessageSquare, Send } from 'lucide-react';
import NewClientModal from './NewClientModal';

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
  { id: 'nombre',               nombre_campo: 'Nombre',              requerido: true,  es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'cpf',                  nombre_campo: 'CPF',                 requerido: true,  es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'email',                nombre_campo: 'Email',               requerido: false, es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'fecha_nacimiento',     nombre_campo: 'Fecha Nacimiento',    requerido: true,  es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'estado_civil',         nombre_campo: 'Estado Civil',        requerido: false, es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'sexo',                 nombre_campo: 'Sexo',                requerido: false, es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'nacionalidad',         nombre_campo: 'Nacionalidad',        requerido: true,  es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'pais',                 nombre_campo: 'País de Origen',      requerido: false, es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'lugar_nacimiento',     nombre_campo: 'Lugar de Nacimiento', requerido: false, es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'estado_federal',       nombre_campo: 'Estado de Origen',    requerido: false, es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'ciudad',               nombre_campo: 'Ciudad de Origen',    requerido: false, es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'fecha_entrada_brasil', nombre_campo: 'Entrada a Brasil',    requerido: false, es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'lugar_entrada_brasil', nombre_campo: 'Lugar Entrada',       requerido: false, es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'direccion',            nombre_campo: 'Dirección Completa',  requerido: false, es_fijo: true, category_name: 'Informaciones Personales' },
  { id: 'rnm',                  nombre_campo: 'RNM',                 requerido: false, es_fijo: true, category_name: 'Documentos de Identidad'   },
  { id: 'numero_pasaporte',     nombre_campo: 'Pasaporte',           requerido: false, es_fijo: true, category_name: 'Documentos de Identidad'   },
  { id: 'fecha_emision_pasaporte', nombre_campo: 'Fecha Emisión Pasaporte', requerido: false, es_fijo: true, category_name: 'Documentos de Identidad' },
  { id: 'fecha_vencimiento_pasaporte', nombre_campo: 'Fecha Vencimiento Pasaporte', requerido: false, es_fijo: true, category_name: 'Documentos de Identidad' },
  { id: 'numero_refugio',       nombre_campo: 'Protocolo de Refugio', requerido: false, es_fijo: true, category_name: 'Documentos de Identidad'   },
  { id: 'fecha_vencimiento_refugio', nombre_campo: 'Fecha Vencimiento Refugio', requerido: false, es_fijo: true, category_name: 'Documentos de Identidad'   },
  { id: 'carnet_identidad',     nombre_campo: 'Carnet de Identidad', requerido: false, es_fijo: true, category_name: 'Documentos de Identidad'   },
  { id: 'nombre_madre',         nombre_campo: 'Nombre Madre',        requerido: false, es_fijo: true, category_name: 'Datos Familiares'           },
  { id: 'nombre_padre',         nombre_campo: 'Nombre Padre',        requerido: false, es_fijo: true, category_name: 'Datos Familiares'           },
];

const TRAMITE_COLORS = {
  completada: { bg: 'rgba(29,158,117,0.18)', color: '#1D9E75' },
  procesando: { bg: 'rgba(55,138,221,0.18)', color: '#378ADD' },
  cancelada:  { bg: 'rgba(216,90,48,0.18)',  color: '#D85A30' },
  pendiente:  { bg: 'rgba(186,117,23,0.18)', color: '#BA7517' },
};

export default function ClientView({ clientId, onBack, onNavigateToClient }) {
  const [client, setClient] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [campos, setCampos] = useState([]);
  const [clienteDatos, setClienteDatos] = useState([]);
  const [relaciones, setRelaciones] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [entradas, setEntradas] = useState([]);
  const [allClientes, setAllClientes] = useState([]); // For the relate modal dropdown
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRelateModalOpen, setIsRelateModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit State
  const [editFormData, setEditFormData] = useState([]);
  const [newFields, setNewFields] = useState([]);

  // Upload State
  const [uploading, setUploading] = useState(false);
  
  // Relate State
  const [selectedRelateId, setSelectedRelateId] = useState('');
  const [selectedRelateType, setSelectedRelateType] = useState('familiar');
  const [isNewRelateClientModalOpen, setIsNewRelateClientModalOpen] = useState(false);
  const [editingRelId, setEditingRelId] = useState(null);
  
  // PDF Missing Data state
  const [missingFieldsData, setMissingFieldsData] = useState(null); // { tipoDocumento, missingFields: [{id, label, valor}] }

  // Search state para relacionar cliente existente
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  // AI Extraction State
  const [extractedData, setExtractedData] = useState(null);
  const [isExtractionModalOpen, setIsExtractionModalOpen] = useState(false);

  // AI Chat RAG State
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState([]);
  const [aiChatInput, setAiChatInput] = useState('');
  const [isAiChatLoading, setIsAiChatLoading] = useState(false);
  const [crmContext, setCrmContext] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const fetchClientData = useCallback(async (fullReload = false) => {
    if (fullReload) setLoading(true);
    try {
      // 1. Cliente
      const { data: clientData, error: clientErr } = await supabase.from('clientes').select('*').eq('id', clientId).single();
      if (clientErr) throw clientErr;
      setClient(clientData);

      // 2. Categorias y campos — solo en carga inicial para no resetear el tab activo
      if (fullReload) {
        const [{ data: catsData }, { data: fieldsData }, { data: allC }] = await Promise.all([
          supabase.from('categorias_datos_operacionales').select('*').order('orden'),
          supabase.from('campos_datos_operacionales').select('*').order('orden'),
          supabase.from('clientes').select('id, nombre, cpf'),
        ]);
        setCategorias(catsData || []);
        setCampos(fieldsData || []);
        setAllClientes(allC || []);
        // Solo fija el tab si aun no tiene ninguno
        if (catsData && catsData.length > 0) setActiveTab(prev => prev ?? catsData[0].id);
      }

      // 3. Datos en paralelo
      const [{ data: cDatos }, { data: rels }, { data: docs }, { data: entrs }] = await Promise.all([
        supabase.from('cliente_datos_operacionales').select('*').eq('id_cliente', clientId),
        supabase.from('relaciones_clientes')
          .select('*, cliente_principal:cliente_id(id,nombre,cpf), cliente_secundario:cliente_relacionado_id(id,nombre,cpf)')
          .or(`cliente_id.eq.${clientId},cliente_relacionado_id.eq.${clientId}`),
        supabase.from('documentos_operacionales').select('*').eq('id_cliente', clientId).order('creado_en', { ascending: false }),
        supabase.from('entradas').select('*').eq('id_cliente', clientId).order('creado_en', { ascending: false }),
      ]);
      setClienteDatos(cDatos || []);
      setRelaciones(rels || []);
      setDocumentos(docs || []);
      setEntradas(entrs || []);

    } catch (err) {
      console.error('Error fetching client data:', err);
    } finally {
      if (fullReload) setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { fetchClientData(true); }, [clientId]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
        } catch(e) {}
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
      } catch (err) { console.error(err); alert('Error borrando dato base'); }
      return;
    }
    if (!window.confirm('¿Eliminar este dato del cliente?')) return;
    try {
      await supabase.from('cliente_datos_operacionales').delete().eq('id', dataId);
      setEditFormData(editFormData.filter(f => f.id !== dataId));
      await fetchClientData();
    } catch (err) {
      console.error(err);
      alert('Error eliminando el dato');
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

  // Subir documento — delegado al storageService
  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
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
      e.target.value = '';
    }
  }, [clientId, fetchClientData]);

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
        if (mappedCol && (!client[mappedCol] || client[mappedCol] === '')) {
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

  const handleRelateClient = async () => {
    if (!selectedRelateId || !selectedRelateType) return;
    try {
      await supabase.from('relaciones_clientes').insert({
        cliente_id: clientId,
        cliente_relacionado_id: Number(selectedRelateId),
        tipo_relacion: selectedRelateType,
      });
      await fetchClientData(false);
      setIsRelateModalOpen(false);
      setSelectedRelateId('');
      setSelectedRelateType('familiar');
    } catch (err) {
      console.error('Error relating client:', err);
      alert('Error al vincular cliente.');
    }
  };

  const handleUpdateRelationType = async (relId, newType) => {
    try {
      const { error } = await supabase
        .from('relaciones_clientes')
        .update({ tipo_relacion: newType })
        .eq('id', relId);
      if (error) throw error;
      setRelaciones(prev => prev.map(r => r.id === relId ? { ...r, tipo_relacion: newType } : r));
      setEditingRelId(null);
    } catch (err) {
      console.error("Error updating relation:", err);
      alert("Error al actualizar la relación");
    }
  };

  const handleDeleteRelation = async (relationId) => {
    if (!window.confirm('Eliminar este vinculo familiar?')) return;
    try {
      await supabase.from('relaciones_clientes').delete().eq('id', relationId);
      await fetchClientData(false);
    } catch (err) {
      console.error(err);
      alert('Error eliminando la relacion');
    }
  };

  // Cambiar estado del documento: pendiente <-> verificado (sin recargar todo)
  const handleToggleDocumentStatus = useCallback(async (doc) => {
    const newEstado = doc.estado === 'verificado' ? 'pendiente' : 'verificado';
    try {
      await supabase.from('documentos_operacionales').update({ estado: newEstado }).eq('id', doc.id);
      setDocumentos(prev => prev.map(d => d.id === doc.id ? { ...d, estado: newEstado } : d));
    } catch (err) {
      console.error(err);
      alert('Error actualizando estado del documento.');
    }
  }, []);
  // ================= PDF GENERATOR LOGIC =================
  const REQUIRED_FIELDS_PER_DOC = {
    'HIPOSSUFICIENCIA': ['nombre', 'nacionalidad', 'estado_civil', 'fecha_nacimiento', 'nombre_madre', 'nombre_padre'],
    'ANTECEDENTES': ['nombre', 'nacionalidad', 'estado_civil', 'fecha_nacimiento', 'nombre_madre', 'nombre_padre'],
    'PROCURACAO_RETIRAR_DOCS': ['nombre', 'cpf', 'rnm', 'nacionalidad', 'estado_civil', 'profesion', 'direccion'],
    'PROCURACAO_MENORES': ['nombre', 'cpf', 'rnm', 'estado_civil', 'profesion', 'direccion'],
    'DECLARACAO_RESIDENCIA_CHAMANTE': ['nombre', 'nacionalidad', 'estado_civil', 'fecha_nacimiento', 'nombre_madre', 'nombre_padre'],
    'DECLARACAO_ENTRADA_BRASIL': ['nombre', 'fecha_entrada_brasil', 'lugar_entrada_brasil'],
    'DECLARACAO_ELETRONICA': ['nombre', 'cpf', 'numero_pasaporte', 'email', 'telefono', 'direccion', 'fecha_nacimiento', 'nombre_madre', 'nombre_padre'],
    'DECLARACAO_SEI': ['nombre', 'cpf', 'email', 'telefono', 'direccion'],
    'DECLARACAO_CONJUNTA': ['nombre', 'nacionalidad', 'fecha_nacimiento'],
    'DECLARACAO_CONDICAO_FISCAL': ['nombre', 'nacionalidad', 'fecha_nacimiento', 'nombre_madre', 'nombre_padre', 'direccion'],
    'DECLARACAO_GERAL_MIGRANTE': ['nombre', 'cpf', 'numero_pasaporte', 'nacionalidad', 'fecha_nacimiento', 'nombre_madre', 'nombre_padre', 'telefono', 'email', 'direccion'],
    'DECLARACAO_MAIS_MEDICOS': ['nombre', 'nacionalidad', 'estado_civil', 'fecha_nacimiento', 'nombre_madre', 'nombre_padre'],
    'DATOS_PODER': ['nombre', 'nacionalidad', 'fecha_nacimiento', 'cpf', 'numero_pasaporte', 'estado_civil', 'profesion', 'nombre_madre', 'nombre_padre', 'direccion'],
    'SERVICIO_CONSULAR': ['nombre', 'numero_pasaporte', 'cpf', 'sexo', 'estado_civil', 'nombre_madre', 'nombre_padre', 'direccion', 'email', 'telefono', 'profesion'],
    'INSCRIPCION_CONSULAR': ['nombre', 'fecha_nacimiento', 'cpf', 'numero_pasaporte', 'rnm', 'estado_civil', 'profesion', 'nombre_madre', 'nombre_padre', 'direccion', 'telefono', 'email', 'sexo']
  };

  const handleGeneratePDF = async (tipoDocumento) => {
    const required = REQUIRED_FIELDS_PER_DOC[tipoDocumento] || [];
    const missing = required.filter(f => !client[f] || String(client[f]).trim() === '');

    if (missing.length > 0) {
      setMissingFieldsData({
        tipoDocumento,
        missingFields: missing.map(mf => {
          const fieldDef = FIXED_FIELDS_CATALOG.find(f => f.id === mf);
          return { id: mf, label: fieldDef?.nombre_campo || mf, valor: '' };
        })
      });
      return;
    }

    try {
      await generateDocumentPDF(tipoDocumento, client, clienteDatos, null); // Pasaremos el familiar en el futuro si aplica
    } catch (err) {
      console.error(err);
      alert('Error generando el documento PDF. Revisa la consola.');
    }
  };

  const handleSaveMissingDataAndGenerate = async () => {
    if (!missingFieldsData) return;
    setIsSaving(true);
    try {
      const updates = {};
      for (const field of missingFieldsData.missingFields) {
        if (field.valor) {
          updates[field.id] = field.valor.toUpperCase();
        }
      }
      
      if (Object.keys(updates).length > 0) {
        await supabase.from('clientes').update(updates).eq('id', client.id);
        const { data: updatedClient } = await supabase.from('clientes').select('*').eq('id', client.id).single();
        setClient(updatedClient);
        
        // Generate PDF immediately with updated client
        await generateDocumentPDF(missingFieldsData.tipoDocumento, updatedClient, clienteDatos, null);
      }
      setMissingFieldsData(null);
    } catch (err) {
      console.error(err);
      alert('Error guardando los datos faltantes.');
    } finally {
      setIsSaving(false);
    }
  };

  // ================= AI CHAT LOGIC =================
  useEffect(() => {
    if (isAiChatOpen && client) {
      const loadHistory = async () => {
        try {
          const { data } = await supabase.from('ai_chats').select('*').eq('cliente_id', client.id).order('creado_en', { ascending: true });
          if (data && data.length > 0) {
            setAiChatMessages(data.map(d => ({ role: d.role, content: d.content })));
          } else {
            setAiChatMessages([{ role: 'assistant', content: `¡Hola! Soy tu asistente IA. Tengo acceso a la base de datos y al CRM para ${client.nombre}. ¿En qué te ayudo?` }]);
          }
          
          // Cargar historial CRM de n8n
          const n8nData = await getChatHistoryFromN8n(client.id_kommo || client.id_crm);
          setCrmContext(n8nData);
        } catch (err) {
          console.error(err);
        }
      };
      loadHistory();
    }
  }, [isAiChatOpen, client]);

  const handleSendAiMessage = async () => {
    if (!aiChatInput.trim()) return;
    const userMsg = aiChatInput.trim();
    setAiChatInput('');
    setIsAiChatLoading(true);

    const newMessages = [...aiChatMessages, { role: 'user', content: userMsg }];
    setAiChatMessages(newMessages);

    // Guardar en la DB sin bloquear (fuego y olvido)
    supabase.from('ai_chats').insert({ cliente_id: client.id, role: 'user', content: userMsg }).then();

    try {
      // Auto-refresh CRM context if the user asks for messages or history
      let currentCrmContext = crmContext;
      const lowerMsg = userMsg.toLowerCase();
      if (lowerMsg.includes('mensaje') || lowerMsg.includes('historial') || lowerMsg.includes('kommo') || lowerMsg.includes('actualiza') || lowerMsg.includes('nuevo')) {
        currentCrmContext = await getChatHistoryFromN8n(client.id_kommo || client.id_crm);
        setCrmContext(currentCrmContext);
      }

      const supabaseCtx = {
        cliente: client,
        datos: clienteDatos,
        tramites: entradas
      };
      
      const response = await chatWithClientContext(userMsg, aiChatMessages, supabaseCtx, currentCrmContext);
      
      setAiChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
      supabase.from('ai_chats').insert({ cliente_id: client.id, role: 'assistant', content: response }).then();
    } catch (err) {
      console.error(err);
      setAiChatMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, ocurrió un error contactando a la IA.' }]);
    } finally {
      setIsAiChatLoading(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!window.confirm('Eliminar este cliente y TODOS sus datos? Esta accion no puede deshacerse.')) return;
    setIsDeleting(true);
    try {
      await supabase.from('relaciones_clientes').delete().or(`cliente_id.eq.${clientId},cliente_relacionado_id.eq.${clientId}`);
      await supabase.from('documentos_operacionales').delete().eq('id_cliente', clientId);
      await supabase.from('cliente_datos_operacionales').delete().eq('id_cliente', clientId);
      const { error } = await supabase.from('clientes').delete().eq('id', clientId);
      if (error) throw error;
      onBack();
    } catch (err) {
      console.error('Error deleting client:', err);
      alert('Error al eliminar el cliente. Puede tener tramites vinculados.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChangeTramiteState = async (entradaId, newState) => {
    try {
      const { error } = await supabase.from('entradas').update({ estado_tramite: newState }).eq('id', entradaId);
      if (error) throw error;
      setEntradas(prev => prev.map(e => e.id === entradaId ? { ...e, estado_tramite: newState } : e));
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error al actualizar el estado del tramite.');
    }
  };

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
    
    // Optional: show a small alert or toast
    alert('Datos de ' + client.nombre + ' enviados a la extensión. ¡Abre SISMIGRA y verás el botón de autocompletar!');
  };

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Cargando datos del cliente...</div>;
  }

  if (!client) return null;

  const renderUnifiedPersonalData = () => {
    const targetNames = ['Informaciones Personales', 'Datos Familiares', 'Documentos de Identidad'];
    const targetCats = categorias.filter(c => targetNames.includes(c.nombre));
    if (targetCats.length === 0) return null;

    return (
      <section id="personal-data" className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} color="var(--color-primary)" /> Datos del Cliente
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
              <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Buscar dato (ej. Madre, Pasaporte)..." 
                className="form-input" 
                value={localSearchQuery} 
                onChange={e => setLocalSearchQuery(e.target.value)} 
                style={{ paddingLeft: '2.2rem', width: '100%', fontSize: '0.875rem' }} 
              />
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => openEditModal('ALL_PERSONAL')} style={{ flexShrink: 0 }}>
              <Edit2 size={14} style={{ marginRight: '4px' }} /> Editar Datos
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {targetNames.map(catName => {
             const cat = categorias.find(c => c.nombre === catName);
             if (!cat) return null;
             const catFixedFields = fixedFields.filter(f => f.category_name === catName);
             const catDynamicFields = campos.filter(c => c.categoria_id === cat.id);
             const sectionFields = [...catFixedFields, ...catDynamicFields];
             
             // Extract data
             const sectionData = [];
             sectionFields.forEach(campo => {
               if (campo.es_fijo) {
                 if (client[campo.id]) sectionData.push({ campo_id: campo.id, valor: client[campo.id] });
               } else {
                 const cd = clienteDatos.find(d => d.campo_id === campo.id);
                 if (cd && cd.valor) sectionData.push(cd);
               }
             });

             const query = localSearchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

             // If it's Informaciones Personales, we might want to exclude "direccion" since we render it as its own section later
             const visibleFields = sectionData.filter(d => {
               if (d.campo_id === 'direccion') return false;
               if (!d.valor) return false;
               
               if (query) {
                 const campoDef = sectionFields.find(c => c.id === d.campo_id);
                 if (!campoDef) return false;
                 const fieldName = campoDef.nombre_campo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                 const fieldVal = String(d.valor).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                 if (!fieldName.includes(query) && !fieldVal.includes(query)) return false;
               }
               return true;
             });

             if (visibleFields.length === 0) return null;

             const titleMap = {
               'Informaciones Personales': 'Datos Personales',
               'Datos Familiares': 'Padres y Familiares',
               'Documentos de Identidad': 'Documentos'
             };

             return (
               <React.Fragment key={catName}>
                 <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>
                   <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                     {titleMap[catName] || catName}
                   </h3>
                 </div>
                 {visibleFields.map(dato => {
                   const campo = sectionFields.find(c => c.id === dato.campo_id);
                   
                   if (campo.id === 'nombre') {
                     const fullName = (dato.valor || '').trim().toUpperCase();
                     const parts = fullName.split(' ');
                     
                     const padreName = (client.nombre_padre || '').trim().toUpperCase().split(' ');
                     const madreName = (client.nombre_madre || '').trim().toUpperCase().split(' ');
                     
                     let splitIndex = 1;
                     
                     if (parts.length > 2) {
                         splitIndex = parts.length - 2; 
                         const padreApe1 = padreName.length > 1 ? padreName[padreName.length - 2] : null;
                         const madreApe1 = madreName.length > 1 ? madreName[madreName.length - 2] : null;
                         
                         if (padreApe1 && madreApe1) {
                             const childApe1 = parts[parts.length - 2];
                             const childApe2 = parts[parts.length - 1];
                             
                             if (childApe1 === padreApe1 && childApe2 === madreApe1) {
                                 splitIndex = parts.length - 2;
                             } else {
                                 const padreIdx = parts.indexOf(padreApe1);
                                 if (padreIdx > 0) splitIndex = padreIdx;
                             }
                         }
                     }
                     
                     const n_nombres = parts.slice(0, splitIndex).join(' ') || '';
                     const n_apellidos = parts.slice(splitIndex).join(' ') || '';

                     return (
                       <React.Fragment key={campo.id}>
                         <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '1rem' }}>
                           <div style={{ flex: 1, overflow: 'hidden' }}>
                             <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>Nombres</label>
                             <div style={{ fontSize: '1rem', color: 'var(--color-text-primary)', fontWeight: 500, wordBreak: 'break-word' }}>{n_nombres}</div>
                           </div>
                           <button onClick={() => handleCopy(n_nombres || '', 'nombres')} className="btn btn-ghost" style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)', marginLeft: '0.5rem', background: 'var(--color-bg-primary)' }} title="Copiar rápido">
                             {copiedId === 'nombres' ? <Check size={16} color="var(--color-success)" /> : <Copy size={16} />}
                           </button>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                           <div style={{ flex: 1, overflow: 'hidden' }}>
                             <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>Apellidos</label>
                             <div style={{ fontSize: '1rem', color: 'var(--color-text-primary)', fontWeight: 500, wordBreak: 'break-word' }}>{n_apellidos}</div>
                           </div>
                           <button onClick={() => handleCopy(n_apellidos || '', 'apellidos')} className="btn btn-ghost" style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)', marginLeft: '0.5rem', background: 'var(--color-bg-primary)' }} title="Copiar rápido">
                             {copiedId === 'apellidos' ? <Check size={16} color="var(--color-success)" /> : <Copy size={16} />}
                           </button>
                         </div>
                       </React.Fragment>
                     );
                   }

                   return (
                     <div key={campo.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                       <div style={{ flex: 1, overflow: 'hidden' }}>
                         <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                           {campo.nombre_campo}
                         </label>
                         <div style={{ fontSize: '1rem', color: 'var(--color-text-primary)', fontWeight: 500, wordBreak: 'break-word' }}>
                           {dato.valor}
                         </div>
                       </div>
                       <button onClick={() => handleCopy(dato.valor, campo.id)} className="btn btn-ghost" style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)', marginLeft: '0.5rem', background: 'var(--color-bg-primary)' }} title="Copiar rápido">
                         {copiedId === campo.id ? <Check size={16} color="var(--color-success)" /> : <Copy size={16} />}
                       </button>
                     </div>
                   );
                 })}
               </React.Fragment>
             );
          })}

          {/* Dirección Section */}
          {(() => {
             const dirDato = client['direccion'] || clienteDatos.find(cd => cd.campo_id === 'direccion')?.valor;
             if (!dirDato) return null;
             
             let dirObj = {};
             try {
               if (typeof dirDato === 'string' && dirDato.startsWith('{')) dirObj = JSON.parse(dirDato);
               else if (typeof dirDato === 'object' && dirDato !== null) dirObj = dirDato;
               else dirObj.endereco = dirDato;
             } catch(e) {
               dirObj.endereco = dirDato;
             }
             
             const subFields = [
               { id: 'cep', label: 'CEP', val: dirObj.cep },
               { id: 'endereco', label: 'Endereço', val: dirObj.endereco },
               { id: 'numero', label: 'Número', val: dirObj.numero },
               { id: 'complemento', label: 'Complemento', val: dirObj.complemento },
               { id: 'bairro', label: 'Bairro', val: dirObj.bairro },
               { id: 'cidade', label: 'Cidade (Residência)', val: dirObj.cidade },
               { id: 'estado', label: 'Estado (Residência)', val: dirObj.estado },
               { id: 'ponto_referencia', label: 'Ponto de Referência', val: dirObj.ponto_referencia }
             ].filter(sf => {
               if (!sf.val) return false;
               const query = localSearchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
               if (query) {
                 const fieldName = sf.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                 const fieldVal = String(sf.val).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                 if (!fieldName.includes(query) && !fieldVal.includes(query)) return false;
               }
               return true;
             });

             if (subFields.length === 0) return null;

             const rua = dirObj.endereco;
             const num = dirObj.numero;
             const comp = dirObj.complemento;
             const bairro = dirObj.bairro;
             const cid = dirObj.cidade;
             const uf = dirObj.estado;
             const cep = dirObj.cep;
             const ref = dirObj.ponto_referencia;
             
             let line1 = [rua, num].filter(Boolean).join(', ');
             if (comp) line1 += ` - ${comp}`;
             let line2 = [bairro, cid, uf].filter(Boolean).join(' - ');
             let addressFull = [line1, line2, cep ? `CEP: ${cep}` : '', ref ? `Ref: ${ref}` : ''].filter(Boolean).join(' | ');

             return (
               <React.Fragment>
                 <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>
                   <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                     Dirección Completa
                   </h3>
                 </div>
                 {subFields.map(sf => (
                   <div key={`dir-${sf.id}`} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                     <div style={{ flex: 1, overflow: 'hidden' }}>
                       <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                         {sf.label}
                       </label>
                       <div style={{ fontSize: '1rem', color: 'var(--color-text-primary)', fontWeight: 500, wordBreak: 'break-word' }}>
                         {sf.val}
                       </div>
                     </div>
                     <button onClick={() => handleCopy(sf.val, sf.id)} className="btn btn-ghost" style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)', marginLeft: '0.5rem', background: 'var(--color-bg-primary)' }} title="Copiar rápido">
                       {copiedId === sf.id ? <Check size={16} color="var(--color-success)" /> : <Copy size={16} />}
                     </button>
                   </div>
                 ))}
                 
                 <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                   <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                        Dirección Concatenada
                      </label>
                      <div style={{ fontSize: '1rem', color: 'var(--color-text-primary)', fontWeight: 500, wordBreak: 'break-word', lineHeight: '1.5' }}>
                        {line1 && <div>{line1}</div>}
                        {line2 && <div>{line2}</div>}
                        {(cep || ref) && <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{cep ? `CEP: ${cep}` : ''} {ref ? `(Ref: ${ref})` : ''}</div>}
                        {(!line1 && !line2 && !cep && !ref && dirObj.endereco) && <div>{dirObj.endereco}</div>}
                      </div>
                   </div>
                   <button onClick={() => handleCopy(addressFull || dirObj.endereco, 'direccion')} className="btn btn-ghost" style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)', marginLeft: '0.5rem', background: 'var(--color-bg-primary)' }} title="Copiar dirección completa">
                     {copiedId === 'direccion' ? <Check size={16} color="var(--color-success)" /> : <Copy size={16} />}
                   </button>
                 </div>
               </React.Fragment>
             )
          })()}
        </div>
      </section>
    );
  };


  return (
    <div style={{ padding: '2.5rem', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 600, color: 'white' }}>
            {client.nombre?.split(' ').map(n => n[0]).join('').substring(0,2)}
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>{client.nombre}</h1>
            <div style={{ display: 'flex', gap: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem', flexWrap: 'wrap' }}>
              <span><strong>CPF:</strong> {client.cpf || 'No registrado'}</span>
              <span>•</span>
              <span><strong>Email:</strong> {client.email || 'N/A'}</span>
              <span>•</span>
              <span><strong>Tel:</strong> {client.telefono || 'N/A'}</span>
              <span>•</span>
              <span><strong>Origen:</strong> {client.ciudad || 'N/A'}, {client.estado_federal || client.estado || 'N/A'}, {client.pais || 'N/A'}</span>
              <span>•</span>
              <span>Registrado: {new Date(client.creado_en).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-ghost" onClick={handleDeleteClient} disabled={isDeleting} style={{ color: 'var(--color-danger)' }}>
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} 
            <span style={{ marginLeft: '4px' }}>Eliminar</span>
          </button>
          <button className="btn btn-secondary" onClick={() => setIsAiChatOpen(!isAiChatOpen)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} />
            {isAiChatOpen ? 'Cerrar Chat' : 'Asistente IA'}
          </button>
          <button className="btn btn-secondary" onClick={handleSendToExtension} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(23,198,113,0.1)', color: 'var(--color-success)', borderColor: 'rgba(23,198,113,0.2)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
            Enviar a Extensión
          </button>
          <button className="btn btn-secondary" onClick={() => openEditModal('ALL_PERSONAL')}><Edit2 size={16} /> Editar Datos</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative' }}>
        {/* Columna Izquierda: Datos Personales y Trámites */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
          {renderUnifiedPersonalData()}

          <section id="tramites-builder" className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} /> Generador de Trámites y Declaraciones
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              Genera rápidamente los documentos legales requeridos usando los datos del cliente.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => handleGeneratePDF('HIPOSSUFICIENCIA')} style={{ justifyContent: 'flex-start', padding: '1rem', height: 'auto', border: '1px solid var(--color-border)', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Hipossuficiência Econômica</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'normal' }}>Declaración de incapacidad de pagar tasas.</span>
                </div>
              </button>
              <button className="btn btn-secondary" onClick={() => handleGeneratePDF('ANTECEDENTES')} style={{ justifyContent: 'flex-start', padding: '1rem', height: 'auto', border: '1px solid var(--color-border)', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Antecedentes Criminais</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'normal' }}>Ausencia de antecedentes en Brasil y exterior.</span>
                </div>
              </button>
              <button className="btn btn-secondary" onClick={() => handleGeneratePDF('PROCURACAO_RETIRAR_DOCS')} style={{ justifyContent: 'flex-start', padding: '1rem', height: 'auto', border: '1px solid var(--color-border)', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Procuração p/ Retirar Docs</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'normal' }}>Poder para retirar RNM u otros documentos.</span>
                </div>
              </button>
              <button className="btn btn-secondary" onClick={() => handleGeneratePDF('PROCURACAO_MENORES')} style={{ justifyContent: 'flex-start', padding: '1rem', height: 'auto', border: '1px solid var(--color-border)', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Procuração p/ Menores</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'normal' }}>Poder para retirar documentos de menores de edad.</span>
                </div>
              </button>
              <button className="btn btn-secondary" onClick={() => handleGeneratePDF('DECLARACAO_RESIDENCIA_CHAMANTE')} style={{ justifyContent: 'flex-start', padding: '1rem', height: 'auto', border: '1px solid var(--color-border)', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Residência do Chamante</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'normal' }}>Declaración de que el familiar llamante reside en Brasil.</span>
                </div>
              </button>
              <button className="btn btn-secondary" onClick={() => handleGeneratePDF('DECLARACAO_ENTRADA_BRASIL')} style={{ justifyContent: 'flex-start', padding: '1rem', height: 'auto', border: '1px solid var(--color-border)', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Entrada ao Brasil</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'normal' }}>Declaración de frontera de entrada al país.</span>
                </div>
              </button>
              <button className="btn btn-secondary" onClick={() => handleGeneratePDF('DECLARACAO_ELETRONICA')} style={{ justifyContent: 'flex-start', padding: '1rem', height: 'auto', border: '1px solid var(--color-border)', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Declaração Eletrônica</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'normal' }}>Declaración de medios de contacto electrónicos.</span>
                </div>
              </button>
              <button className="btn btn-secondary" onClick={() => handleGeneratePDF('DECLARACAO_SEI')} style={{ justifyContent: 'flex-start', padding: '1rem', height: 'auto', border: '1px solid var(--color-border)', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Usuário Externo SEI</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'normal' }}>Cadastro Ministério da Justiça e Segurança Pública.</span>
                </div>
              </button>
              <button className="btn btn-secondary" onClick={() => handleGeneratePDF('DECLARACAO_CONJUNTA')} style={{ justifyContent: 'flex-start', padding: '1rem', height: 'auto', border: '1px solid var(--color-border)', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Declaração Conjunta</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'normal' }}>Para Casados ou União Estável.</span>
                </div>
              </button>
              <button className="btn btn-secondary" onClick={() => handleGeneratePDF('DECLARACAO_CONDICAO_FISCAL')} style={{ justifyContent: 'flex-start', padding: '1rem', height: 'auto', border: '1px solid var(--color-border)', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Condição Fiscal (CPF)</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'normal' }}>Declaración de la Receita Federal.</span>
                </div>
              </button>
              <button className="btn btn-secondary" onClick={() => handleGeneratePDF('DECLARACAO_GERAL_MIGRANTE')} style={{ justifyContent: 'flex-start', padding: '1rem', height: 'auto', border: '1px solid var(--color-border)', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Geral do Migrante</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'normal' }}>Polícia Federal (Antecedentes, Taxas, etc).</span>
                </div>
              </button>
              <button className="btn btn-secondary" onClick={() => handleGeneratePDF('DECLARACAO_MAIS_MEDICOS')} style={{ justifyContent: 'flex-start', padding: '1rem', height: 'auto', border: '1px solid var(--color-border)', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Programa Mais Médicos</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'normal' }}>Declaración de integración al programa.</span>
                </div>
              </button>
              <button className="btn btn-secondary" onClick={() => handleGeneratePDF('DATOS_PODER')} style={{ justifyContent: 'flex-start', padding: '1rem', height: 'auto', border: '1px solid var(--color-border)', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Solicitar Poder</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'normal' }}>Datos para solicitar poder consular.</span>
                </div>
              </button>
              <button className="btn btn-secondary" onClick={() => handleGeneratePDF('SERVICIO_CONSULAR')} style={{ justifyContent: 'flex-start', padding: '1rem', height: 'auto', border: '1px solid var(--color-border)', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Servicio Consular</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'normal' }}>Planilla simplificada para pasaportes, prórrogas.</span>
                </div>
              </button>
              <button className="btn btn-secondary" onClick={() => handleGeneratePDF('INSCRIPCION_CONSULAR')} style={{ justifyContent: 'flex-start', padding: '1rem', height: 'auto', border: '1px solid var(--color-border)', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Inscripción Consular</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'normal' }}>Solicitud de inscripción en el consulado de Cuba.</span>
                </div>
              </button>
            </div>
          </section>
        </div>

        {/* Columna Derecha: Sidebar (Relaciones, Docs, Historial) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '0.5rem', height: '100%' }}>
          {/* Moviendo la sección de Relacionamientos arriba en el sidebar */}
          <section id="relacionamientos-clientes" className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Users size={18} color="var(--color-primary)" /> Relacionamientos
              </h2>
              <button className="btn btn-ghost" style={{ padding: '0.25rem' }} onClick={() => setIsRelateModalOpen(true)}><Plus size={18} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {relaciones.map(rel => {
                const isPrincipal = rel.cliente_id === clientId;
                const related = isPrincipal ? rel.cliente_secundario : rel.cliente_principal;
                if (!related) return null;
                return (
                  <div key={rel.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.75rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <button
                      onClick={() => onNavigateToClient?.(related.id)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', background: 'none', border: 'none', cursor: onNavigateToClient ? 'pointer' : 'default', padding: 0, flex: 1, textAlign: 'left' }}
                      title={onNavigateToClient ? `Ver perfil de ${related.nombre}` : ''}
                    >
                      <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {related.nombre}
                        {onNavigateToClient && <span style={{ fontSize: '0.65rem', color: 'var(--color-primary)', opacity: 0.8 }}>→</span>}
                      </div>
                      
                      {editingRelId === rel.id ? (
                        <select 
                          autoFocus
                          onBlur={() => setEditingRelId(null)}
                          onChange={(e) => handleUpdateRelationType(rel.id, e.target.value)}
                          defaultValue={rel.tipo_relacion}
                          onClick={(e) => e.stopPropagation()}
                          style={{ fontSize: '0.68rem', color: 'var(--color-text-primary)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-primary)', borderRadius: '4px', marginTop: '4px', padding: '2px', cursor: 'pointer' }}
                        >
                          <option value="conyuge">Cónyuge</option>
                          <option value="hijo/hija">Hijo / Hija</option>
                          <option value="padre/madre">Padre / Madre</option>
                          <option value="hermano/hermana">Hermano / Hermana</option>
                          <option value="familiar">Otro Familiar</option>
                          <option value="amigo">Amigo</option>
                          <option value="otro">Otro</option>
                        </select>
                      ) : (
                        <div 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingRelId(rel.id); }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                          style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '4px', cursor: 'pointer', transition: 'color 0.2s', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', display: 'inline-block' }}
                          title="Clic para cambiar relación"
                        >
                          {rel.tipo_relacion}
                        </div>
                      )}

                    </button>
                    <button className="btn btn-ghost" onClick={() => handleDeleteRelation(rel.id)} style={{ color: 'var(--color-danger)', padding: '0.3rem', flexShrink: 0 }} title="Eliminar vinculo">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
              {relaciones.length === 0 && <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>No hay familiares o amigos vinculados.</div>}
            </div>
          </section>

          <section id="documentos-subidos" className="glass-panel" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <FileText size={18} color="var(--color-primary)" /> Documentos Subidos
            </h2>
            
            <label 
              style={{ display: 'block', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '1.25rem' }}
            >
              <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
              {uploading ? (
                 <Loader2 className="animate-spin" size={24} color="var(--color-primary)" style={{ margin: '0 auto 0.5rem' }} />
              ) : (
                <UploadCloud size={24} color="var(--color-text-muted)" style={{ margin: '0 auto 0.5rem' }} />
              )}
              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{uploading ? 'Subiendo...' : 'Subir Documento'}</div>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.65rem' }}>
              {documentos.map(doc => (
                <div key={doc.id} style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-md)', aspectRatio: '1', background: 'var(--color-bg-secondary)', border: `1px solid ${doc.estado === 'verificado' ? 'var(--color-success)' : 'var(--color-border)'}`, transition: 'border-color 0.2s' }}>
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {doc.url_archivo ? (
                      doc.tipo_contenido?.startsWith('image/') ?
                        <img src={doc.url_archivo} alt={doc.nombre_archivo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)' }}>
                          <FileText size={28} />
                          <span style={{ fontSize: '0.6rem', textAlign: 'center', padding: '0 4px' }}>{doc.nombre_archivo}</span>
                        </div>
                    ) : <ImageIcon size={26} color="var(--color-text-muted)" />}
                  </div>

                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.3rem 0.4rem', background: 'rgba(10,20,35,0.9)', backdropFilter: 'blur(4px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <div style={{ color: 'white', fontSize: '0.58rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 85 }}>{doc.nombre_archivo}</div>
                      <button
                        onClick={() => handleToggleDocumentStatus(doc)}
                        title={doc.estado === 'verificado' ? 'Marcar como Pendiente' : 'Marcar como Verificado'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }}
                      >
                        <span style={{ fontSize: '0.52rem', fontWeight: 700, color: doc.estado === 'verificado' ? 'var(--color-success)' : 'var(--color-warning)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          {doc.estado === 'verificado' ? '✓ Verificado' : '● Pendiente'}
                        </span>
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                      <a
                        href={doc.url_archivo}
                        download={doc.nombre_archivo}
                        target="_blank"
                        rel="noreferrer"
                        title="Descargar"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.2rem', borderRadius: '4px', color: 'var(--color-primary)', background: 'rgba(99,102,241,0.15)', textDecoration: 'none' }}
                      >
                        <Download size={11} />
                      </a>
                      <button className="btn btn-ghost" onClick={() => handleDeleteDocument(doc)} style={{ color: 'var(--color-danger)', padding: '0.2rem', borderRadius: '4px', background: 'rgba(216,90,48,0.15)' }} title="Eliminar">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {documentos.length === 0 && <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', gridColumn: '1/-1' }}>Sin documentos subidos.</div>}
            </div>
          </section>

          <section id="historial-tramites" className="glass-panel" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Clock size={18} color="var(--color-primary)" /> Historial de Trámites
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {entradas.map(entrada => (
                <div key={entrada.id} className="glass-panel-elevated" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{entrada.servicio}</div>
                    <select 
                      value={entrada.estado_tramite || 'pendiente'} 
                      onChange={(e) => handleChangeTramiteState(entrada.id, e.target.value)}
                      style={{
                        padding: '0.15rem 0.35rem', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '0.65rem', fontWeight: 600, outline: 'none', cursor: 'pointer',
                        background: entrada.estado_tramite === 'completada' ? 'rgba(29, 158, 117, 0.2)' : entrada.estado_tramite === 'procesando' ? 'rgba(55, 138, 221, 0.2)' : entrada.estado_tramite === 'cancelada' ? 'rgba(216, 90, 48, 0.2)' : 'rgba(186, 117, 23, 0.2)',
                        color: entrada.estado_tramite === 'completada' ? '#1D9E75' : entrada.estado_tramite === 'procesando' ? '#378ADD' : entrada.estado_tramite === 'cancelada' ? '#D85A30' : '#BA7517'
                      }}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="procesando">Procesando</option>
                      <option value="completada">Completada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{new Date(entrada.creado_en).toLocaleDateString()} • {entrada.operario || 'Sin asignar'}</div>
                </div>
              ))}
              {entradas.length === 0 && <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>No hay trámites registrados.</div>}
            </div>
          </section>
        </div>

        {isAiChatOpen && (
          <div 
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '400px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--color-bg-base)',
              borderLeft: '1px solid var(--color-border)',
              boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.45)',
              zIndex: 100,
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                <Sparkles size={20} />
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Asistente IA</h2>
              </div>
              <button className="btn btn-ghost" style={{ padding: '0.5rem' }} onClick={() => setIsAiChatOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {aiChatMessages.map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                    {msg.role === 'user' ? 'Tú' : 'IA'}
                  </div>
                  <div style={{
                    background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-bg-elevated)',
                    color: msg.role === 'user' ? 'white' : 'var(--color-text-primary)',
                    padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', borderBottomRightRadius: msg.role === 'user' ? 0 : 'var(--radius-lg)', borderBottomLeftRadius: msg.role === 'assistant' ? 0 : 'var(--radius-lg)',
                    fontSize: '0.875rem', lineHeight: 1.5, whiteSpace: 'pre-wrap'
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isAiChatLoading && (
                <div style={{ alignSelf: 'flex-start', background: 'var(--color-bg-elevated)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', borderBottomLeftRadius: 0, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Loader2 size={16} className="animate-spin" color="var(--color-primary)" />
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Pensando...</span>
                </div>
              )}
            </div>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-base)' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <textarea
                  value={aiChatInput}
                  onChange={e => setAiChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendAiMessage(); } }}
                  placeholder="Pregunta algo sobre el cliente..."
                  style={{ flex: 1, resize: 'none', height: '42px', minHeight: '42px', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)' }}
                  disabled={isAiChatLoading}
                />
                <button className="btn btn-primary" onClick={handleSendAiMessage} disabled={isAiChatLoading || !aiChatInput.trim()} style={{ width: '42px', height: '42px', padding: 0, borderRadius: '50%', flexShrink: 0 }}>
                  <Send size={18} />
                </button>
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
                La IA tiene contexto de la BD y CRM. {crmContext ? '✅ CRM Listo' : '⏳ Cargando CRM...'}
              </div>
            </div>
          </div>
        )}
      </div>

      {isRelateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Vincular Familiar / Amigo</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Buscar Cliente</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select style={{flex:1, padding:'0.5rem', background:'var(--color-bg-elevated)', color:'var(--color-text-primary)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-md)'}} value={selectedRelateId} onChange={(e) => setSelectedRelateId(e.target.value)}>
                  <option value="">Seleccione un cliente...</option>
                  {allClientes.filter(c => c.id !== clientId).map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.cpf || 'Sin CPF'})</option>
                  ))}
                </select>
                <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => setIsNewRelateClientModalOpen(true)} title="Crear Nuevo Cliente">
                  <UserPlus size={18} />
                </button>
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Tipo de Relación</label>
              <select style={{width:'100%', padding:'0.5rem', background:'var(--color-bg-elevated)', color:'white', border:'1px solid var(--color-border)', borderRadius:'var(--radius-md)'}} value={selectedRelateType} onChange={(e) => setSelectedRelateType(e.target.value)}>
                <option value="conyuge">Cónyuge</option>
                <option value="hijo/hija">Hijo / Hija</option>
                <option value="padre/madre">Padre / Madre</option>
                <option value="hermano/hermana">Hermano / Hermana</option>
                <option value="familiar">Otro Familiar</option>
                <option value="amigo">Amigo</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-ghost" onClick={() => setIsRelateModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleRelateClient}>Vincular</button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            
            <datalist id="existing-fields-list">
              {categorias.flatMap(c => c.campos_datos_operacionales || []).map(f => (
                <option key={f.id} value={f.nombre_campo} />
              ))}
            </datalist>

            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Editar Datos del Cliente</h2>
              <button className="btn btn-ghost" style={{ padding: '0.5rem' }} onClick={() => setIsEditModalOpen(false)}>✕</button>
            </div>
            
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', alignItems: 'start', width: '100%' }}>
              {editFormData.map((field, idx) => {
                if (field.id === 'nombre') {
                  return (
                    <div key={`exist-${field.campo_id}-${idx}`} style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem', alignItems: 'flex-end', width: '100%' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Nombre(s) <span style={{ color: 'var(--color-primary)', marginLeft: 6, fontSize: '0.62rem' }}>BASE</span>
                        </label>
                        <input className="form-input" type="text" value={field._nombres || ''} onChange={(e) => {
                          const arr = [...editFormData];
                          arr[idx] = { ...arr[idx], _nombres: e.target.value };
                          setEditFormData(arr);
                        }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Apellidos <span style={{ color: 'var(--color-primary)', marginLeft: 6, fontSize: '0.62rem' }}>BASE</span>
                        </label>
                        <input className="form-input" type="text" value={field._apellidos || ''} onChange={(e) => {
                          const arr = [...editFormData];
                          arr[idx] = { ...arr[idx], _apellidos: e.target.value };
                          setEditFormData(arr);
                        }} />
                      </div>
                    </div>
                  );
                }
                if (field.id === 'direccion') {
                  return (
                    <div key={`exist-${field.campo_id}-${idx}`} style={{ gridColumn: '1 / -1', width: '100%', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem', background: 'var(--color-bg-secondary)' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--color-text-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Dirección Completa <span style={{ color: 'var(--color-primary)', marginLeft: 6, fontSize: '0.62rem' }}>BASE</span>
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>CEP</label>
                          <input className="form-input" placeholder="00000-000" type="text" value={field._cep || ''} onChange={e => {
                            let val = e.target.value.replace(/\D/g, '');
                            if (val.length > 5) val = val.substring(0, 5) + '-' + val.substring(5, 8);
                            const arr = [...editFormData];
                            arr[idx] = { ...arr[idx], _cep: val };
                            setEditFormData(arr);
                          }} onBlur={e => handleCepSearch(e.target.value)} style={{ width: '100%' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>Endereço</label>
                          <input className="form-input" type="text" value={field._endereco || ''} onChange={e => { const arr = [...editFormData]; arr[idx] = { ...arr[idx], _endereco: e.target.value }; setEditFormData(arr); }} style={{ width: '100%' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>Número</label>
                          <input className="form-input" type="text" value={field._numero || ''} onChange={e => { const arr = [...editFormData]; arr[idx] = { ...arr[idx], _numero: e.target.value }; setEditFormData(arr); }} style={{ width: '100%' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>Complemento</label>
                          <input className="form-input" type="text" value={field._complemento || ''} onChange={e => { const arr = [...editFormData]; arr[idx] = { ...arr[idx], _complemento: e.target.value }; setEditFormData(arr); }} style={{ width: '100%' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>Bairro</label>
                          <input className="form-input" type="text" value={field._bairro || ''} onChange={e => { const arr = [...editFormData]; arr[idx] = { ...arr[idx], _bairro: e.target.value }; setEditFormData(arr); }} style={{ width: '100%' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>Cidade</label>
                          <input className="form-input" type="text" value={field._cidade || ''} onChange={e => { const arr = [...editFormData]; arr[idx] = { ...arr[idx], _cidade: e.target.value }; setEditFormData(arr); }} style={{ width: '100%' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>Estado</label>
                          <input className="form-input" type="text" value={field._estado || ''} onChange={e => { const arr = [...editFormData]; arr[idx] = { ...arr[idx], _estado: e.target.value }; setEditFormData(arr); }} style={{ width: '100%' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>Ponto de Referência</label>
                          <input className="form-input" type="text" value={field._ponto_referencia || ''} onChange={e => { const arr = [...editFormData]; arr[idx] = { ...arr[idx], _ponto_referencia: e.target.value }; setEditFormData(arr); }} style={{ width: '100%' }} />
                        </div>
                      </div>
                    </div>
                  );
                }
                const isDate = field.nombre_campo?.toLowerCase().includes('fecha') || String(field.campo_id).toLowerCase().includes('fecha');
                return (
                  <div key={`exist-${field.campo_id}-${idx}`} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {field.nombre_campo}{field.es_fijo && <span style={{ color: 'var(--color-primary)', marginLeft: 6, fontSize: '0.62rem' }}>BASE</span>}
                      </label>
                      {field.id === 'estado_civil' ? (
                        <select className="form-input" value={field.valor || ''} onChange={(e) => {
                          const arr = [...editFormData];
                          arr[idx] = { ...arr[idx], valor: e.target.value };
                          setEditFormData(arr);
                        }}>
                          <option value="">Selecione</option>
                          {ESTADO_CIVIL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : field.id === 'sexo' ? (
                        <select className="form-input" value={field.valor || ''} onChange={(e) => {
                          const arr = [...editFormData];
                          arr[idx] = { ...arr[idx], valor: e.target.value };
                          setEditFormData(arr);
                        }}>
                          <option value="">Selecione</option>
                          {SEXO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input className="form-input" type={isDate ? "date" : "text"} value={isDate ? toIsoDate(field.valor) : (field.valor || '')} onChange={(e) => {
                          const arr = [...editFormData];
                          arr[idx] = { ...arr[idx], valor: isDate ? toSlashDate(e.target.value) : e.target.value };
                          setEditFormData(arr);
                        }} />
                      )}
                    </div>
                    {field.es_fijo && field.id === 'nombre' ? null : (
                      <button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDeleteFieldData(field.id, field.es_fijo)} title="Borrar dato">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                );
              })}
              </div>
              
              {newFields.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', alignItems: 'start', width: '100%', marginTop: '1rem' }}>
                {newFields.map((field, idx) => {
                  const usedIds = [...editFormData.map(f => f.campo_id), ...newFields.filter((_, i) => i !== idx).map(f => f.campo_id)];
                let activeCategoriasNombres = [];
                let activeCategoriasIds = [];
                if (editingCategoryId === 'ALL_PERSONAL') {
                  const cats = categorias.filter(c => ["Informaciones Personales", "Datos Familiares", "Documentos de Identidad"].includes(c.nombre));
                  activeCategoriasNombres = cats.map(c => c.nombre);
                  activeCategoriasIds = cats.map(c => c.id);
                } else {
                  const editingCategory = categorias.find(c => c.id === editingCategoryId);
                  if (editingCategory) {
                    activeCategoriasNombres = [editingCategory.nombre];
                    activeCategoriasIds = [editingCategory.id];
                  }
                }
                const avFixed   = FIXED_FIELDS_CATALOG.filter(f => activeCategoriasNombres.includes(f.category_name) && !client?.[f.id] && !usedIds.includes(f.id));
                const avDynamic = campos.filter(c => activeCategoriasIds.includes(c.categoria_id) && !usedIds.includes(c.id));
                return (
                  <div key={field.id} style={{ background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', padding: '0.875rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <div style={{ flex: '1 1 160px' }}>
                        <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>Campo</label>
                        <select className="form-input" value={field.campo_id} onChange={(e) => {
                          const arr = [...newFields];
                          arr[idx] = { ...arr[idx], campo_id: e.target.value, customName: '' };
                          setNewFields(arr);
                        }}>
                          <option value="">-- Seleccionar --</option>
                          {avFixed.length > 0 && <optgroup label="Campos Base">{avFixed.map(f => <option key={f.id} value={f.id}>{f.nombre_campo}</option>)}</optgroup>}
                          {avDynamic.length > 0 && <optgroup label="Campos Operacionales">{avDynamic.map(c => <option key={c.id} value={c.id}>{c.nombre_campo}</option>)}</optgroup>}
                          <optgroup label="Nuevo"><option value="custom">+ Crear Campo Personalizado</option></optgroup>
                        </select>
                      </div>
                      {field.campo_id === 'custom' && (
                        <div style={{ flex: '1 1 140px' }}>
                          <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>Nombre del Campo</label>
                          <input className="form-input" type="text" placeholder="Ej: Talla Camisa" value={field.customName || ''} onChange={e => { const arr = [...newFields]; arr[idx] = { ...arr[idx], customName: e.target.value }; setNewFields(arr); }} />
                        </div>
                      )}
                      <div style={{ flex: '1 1 140px' }}>
                        <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>Valor</label>
                        {(() => {
                           const campoRef = campos.find(c => c.id === field.campo_id) || FIXED_FIELDS_CATALOG.find(f => f.id === field.campo_id);
                           const nombreParaCheck = field.campo_id === 'custom' ? field.customName : (campoRef?.nombre_campo || '');
                           const isDate = nombreParaCheck?.toLowerCase().includes('fecha') || String(field.campo_id).toLowerCase().includes('fecha');
                           if (field.campo_id === 'estado_civil') {
                             return (
                               <select className="form-input" value={field.valor || ''} disabled={!field.campo_id} onChange={e => { const arr = [...newFields]; arr[idx] = { ...arr[idx], valor: e.target.value }; setNewFields(arr); }}>
                                 <option value="">Selecione</option>
                                 {ESTADO_CIVIL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                               </select>
                             );
                           }
                           if (field.campo_id === 'sexo') {
                             return (
                               <select className="form-input" value={field.valor || ''} disabled={!field.campo_id} onChange={e => { const arr = [...newFields]; arr[idx] = { ...arr[idx], valor: e.target.value }; setNewFields(arr); }}>
                                 <option value="">Selecione</option>
                                 {SEXO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                               </select>
                             );
                           }
                           return (
                             <input className="form-input" type={isDate ? "date" : "text"} value={isDate ? toIsoDate(field.valor) : (field.valor || '')} disabled={!field.campo_id} placeholder="Valor" onChange={e => { const arr = [...newFields]; arr[idx] = { ...arr[idx], valor: isDate ? toSlashDate(e.target.value) : e.target.value }; setNewFields(arr); }} />
                           );
                        })()}
                      </div>
                      <button className="btn btn-ghost" style={{ color: 'var(--color-danger)', padding: '0.4rem' }} onClick={() => setNewFields(newFields.filter((_, i) => i !== idx))}><X size={16} /></button>
                    </div>
                  </div>
                );
              })}
              </div>
              )}
              <button className="btn btn-secondary" style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }} onClick={handleAddCustomField}>
                <Plus size={16} /> Añadir Más Datos
              </button>
            </div>
            
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-ghost" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveEdits} disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {missingFieldsData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} /> Datos Faltantes
              </h2>
              <button className="btn btn-ghost" style={{ padding: '0.5rem' }} onClick={() => setMissingFieldsData(null)}>✕</button>
            </div>
            
            <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '60vh', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                Para generar este documento, necesitamos que completes los siguientes datos obligatorios:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto' }}>
                {missingFieldsData.missingFields.map((f, idx) => {
                  const isDate = f.label?.toLowerCase().includes('fecha') || String(f.id).toLowerCase().includes('fecha');
                  return (
                    <div key={idx}>
                      <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                        {f.label}
                      </label>
                      {f.id === 'estado_civil' ? (
                        <select className="form-input" value={f.valor || ''} onChange={(e) => {
                          const arr = [...missingFieldsData.missingFields];
                          arr[idx] = { ...arr[idx], valor: e.target.value };
                          setMissingFieldsData({ ...missingFieldsData, missingFields: arr });
                        }}>
                          <option value="">Selecione</option>
                          {ESTADO_CIVIL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : f.id === 'sexo' ? (
                        <select className="form-input" value={f.valor || ''} onChange={(e) => {
                          const arr = [...missingFieldsData.missingFields];
                          arr[idx] = { ...arr[idx], valor: e.target.value };
                          setMissingFieldsData({ ...missingFieldsData, missingFields: arr });
                        }}>
                          <option value="">Selecione</option>
                          {SEXO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input className="form-input" type={isDate ? "date" : "text"} value={isDate ? toIsoDate(f.valor) : (f.valor || '')} onChange={(e) => {
                          const arr = [...missingFieldsData.missingFields];
                          arr[idx] = { ...arr[idx], valor: isDate ? toSlashDate(e.target.value) : e.target.value };
                          setMissingFieldsData({ ...missingFieldsData, missingFields: arr });
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-ghost" onClick={() => setMissingFieldsData(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveMissingDataAndGenerate} disabled={isSaving}>
                {isSaving ? 'Guardando y Generando...' : 'Guardar y Continuar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isExtractionModalOpen && extractedData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
              <Sparkles size={18} /> IA Detectó Datos del Documento
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
              Se extrajeron los siguientes datos del documento. ¿Deseas guardarlos en la categoría actual?
            </p>
            {extractedData.ILEGIBLE && (
              <div style={{ background: 'rgba(216,90,48,0.1)', color: '#D85A30', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>⚠️ Aviso:</span> La parte superior del documento estaba borrosa, por lo que la IA extrajo los datos del código inferior (MRZ). Verifica que sean correctos.
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', maxHeight: '300px', overflowY: 'auto' }}>
              {Object.entries(extractedData).map(([k, v]) => (
                v && k !== 'ILEGIBLE' && (
                  <div key={k} style={{ background: 'var(--color-bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>{k}</div>
                    <input
                      className="form-input"
                      type="text"
                      value={v || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, [k]: e.target.value })}
                      style={{ fontSize: '0.875rem', fontWeight: 500, width: '100%' }}
                    />
                  </div>
                )
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-ghost" onClick={() => setIsExtractionModalOpen(false)}>Descartar</button>
              <button className="btn btn-primary" onClick={handleSaveExtractedData} disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar Datos'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
