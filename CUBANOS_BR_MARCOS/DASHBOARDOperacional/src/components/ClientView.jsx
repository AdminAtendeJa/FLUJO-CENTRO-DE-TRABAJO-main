/**
 * ClientView.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Vista principal de un cliente. Actúa como orquestador puro: conecta hooks
 * de lógica de negocio con componentes de presentación. Toda la lógica pesada
 * se delegó a custom hooks en /hooks/.
 *
 * Hooks extraídos:
 *   - useClientViewEdit         → edición de datos del cliente
 *   - useClientViewDocuments    → subida/eliminación/drag de documentos
 *   - useClientViewRelations    → vínculos familiares
 *   - useClientViewTramites     → gestión de trámites
 *   - useClientViewExtraction   → extracción IA y copia a relacionamientos
 *   - useHorizontalDragScroll   → scroll horizontal con arrastre de mouse
 *
 * Constantes extraídas:
 *   - clientView.constants.js   → FIXED_FIELDS_CATALOG, TRAMITE_COLORS, etc.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { analyzeDocumentImage } from '../services/aiService';
import useClientAiChat from '../hooks/useClientAiChat';

// ── Extracted hooks ──────────────────────────────────────────────────────────
import useClientViewEdit from '../hooks/useClientViewEdit';
import useClientViewDocuments from '../hooks/useClientViewDocuments';
import useClientViewRelations from '../hooks/useClientViewRelations';
import useClientViewTramites from '../hooks/useClientViewTramites';
import useClientViewExtraction from '../hooks/useClientViewExtraction';
import useHorizontalDragScroll from '../hooks/useHorizontalDragScroll';

// ── Constants ────────────────────────────────────────────────────────────────
import { FIXED_FIELDS_CATALOG, toIsoDate, toSlashDate } from './clientView.constants';

// ── Child components ─────────────────────────────────────────────────────────
import NewClientModal from './NewClientModal';
import TemplateManager from './TemplateManager';
import DocumentViewerModal from './DocumentViewerModal';
import ClientPersonalData from './ClientPersonalData';
import ClientDocuments from './ClientDocuments';
import ClientWhatsApp from './ClientWhatsApp';
import ClientRelations from './ClientRelations';
import ClientViewHeader from './ClientViewHeader';
import ClientViewTramites from './ClientViewTramites';
import ClientViewAiChat from './ClientViewAiChat';
import ClientViewRelateModal from './ClientViewRelateModal';
import ClientViewNewTramiteModal from './ClientViewNewTramiteModal';
import ClientViewEditModal from './ClientViewEditModal';
import ClientViewExtractionModal from './ClientViewExtractionModal';
import ClientKommoData from './ClientKommoData';
import ClientMediaLibrary from './ClientMediaLibrary';
import DuplicateContactsWarning from './DuplicateContactsWarning';
import useClientData from '../hooks/useClientData';
import { useQueryClient, useQuery } from '@tanstack/react-query';

export default function ClientView({ clientId, onBack, onNavigateToClient }) {
  const queryClient = useQueryClient();
  const {
    client,
    categories: categorias,
    fields: campos,
    clientData: clienteDatos,
    relations: relaciones,
    documents: documentos,
    entradas,
    duplicateContacts,
    isLoading,
    isError,
  } = useClientData(clientId);

  const { data: allClientes = [] } = useQuery({
    queryKey: ['allClientesBase'],
    queryFn: async () => {
      const { data } = await supabase.from('clientes').select('id, nombre, cpf');
      return data || [];
    }
  });

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [copiedId, setCopiedId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [showMergeModal, setShowMergeModal] = useState(false);

  const fetchClientData = async (fullReload = false) => {
    await queryClient.invalidateQueries();
  };

  // ── Compose hooks ──────────────────────────────────────────────────────────
  const extraction = useClientViewExtraction({ clientId, fetchClientData });

  const edit = useClientViewEdit({
    clientId,
    client,
    categorias,
    campos,
    clienteDatos,
    fetchClientData,
  });

  const docs = useClientViewDocuments({
    clientId,
    queryClient,
    fetchClientData,
    setExtractedData: extraction.setExtractedData,
    setIsExtractionModalOpen: extraction.setIsExtractionModalOpen,
  });

  const relations = useClientViewRelations({ clientId, queryClient });
  const tramites = useClientViewTramites({ clientId, queryClient });
  const { scrollContainerRef, scrollHandlers } = useHorizontalDragScroll();

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

  // ── Simple handlers ────────────────────────────────────────────────────────
  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

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

  const handleSendToExtension = () => {
    const fullData = { ...client };
    clienteDatos.forEach(cd => {
      const campoDef = campos.find(c => c.id === cd.campo_id);
      if (campoDef && cd.valor) {
        fullData[campoDef.nombre_campo.toLowerCase()] = cd.valor;
      }
    });

    const nameField = edit.editFormData.find(f => f.id === 'nombre');
    if (nameField) {
      if (nameField._nombres) fullData.nombres = nameField._nombres.trim();
      if (nameField._apellidos) fullData.apellidos = nameField._apellidos.trim();
    }

    window.postMessage({ type: 'CUBANOS_BR_SYNC', clientData: fullData }, '*');
    toast.success(`Datos de ${client.nombre} enviados a la extensión.`);
  };

  // ── Loading / Error / Empty guards ─────────────────────────────────────────
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

  // ── Render ─────────────────────────────────────────────────────────────────
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
        openEditModal={edit.openEditModal}
      />

      <div
        ref={scrollContainerRef}
        {...scrollHandlers}
        style={{ display: 'flex', gap: '1.5rem', flex: 1, overflowX: 'auto', overflowY: 'hidden', minHeight: 0, position: 'relative', paddingBottom: '0.5rem', cursor: 'grab' }}
      >
        {/* Columna 1: Datos del Cliente */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '0.5rem', height: '100%', minWidth: '380px', flex: 1.2, flexShrink: 0 }}>
          <ClientPersonalData
            client={client}
            categorias={categorias}
            campos={campos}
            clienteDatos={clienteDatos}
            fixedFields={FIXED_FIELDS_CATALOG}
            localSearchQuery={localSearchQuery}
            setLocalSearchQuery={setLocalSearchQuery}
            openEditModal={edit.openEditModal}
            handleCopy={handleCopy}
            copiedId={copiedId}
          />
        </div>

        {/* Columna 2: Kommo, Relacionamientos y Plantillas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '0.5rem', height: '100%', minWidth: '320px', flex: 1, flexShrink: 0 }}>
          <ClientKommoData
            clientId={clientId}
            onDocumentVerified={async (url) => {
              fetchClientData(true);
              toast.success('Documento procesado correctamente. Ejecutando IA...');
              try {
                const response = await fetch(url);
                const blob = await response.blob();
                const lowerUrl = url.toLowerCase();
                const isPdf = lowerUrl.includes('.pdf') || blob.type === 'application/pdf';
                const file = new File([blob], isPdf ? 'documento.pdf' : 'imagen.jpg', { type: isPdf ? 'application/pdf' : (blob.type || 'image/jpeg') });
                let fileOrBase64 = file;
                if (isPdf) {
                  const { convertPdfPageToImageBase64 } = await import('../services/pdfToImage');
                  fileOrBase64 = await convertPdfPageToImageBase64(file);
                }
                const aiData = await analyzeDocumentImage(fileOrBase64);
                if (aiData && Object.keys(aiData).filter(k => aiData[k]).length > 0) {
                  extraction.setExtractedData(aiData);
                  extraction.setIsExtractionModalOpen(true);
                }
              } catch (aiErr) {
                console.warn('[ClientView] AI analysis error:', aiErr.message);
              }
            }}
            setViewingDocument={docs.setViewingDocument}
          />
          <ClientRelations
            relaciones={relaciones}
            clientId={clientId}
            draggedDocument={docs.draggedDocument}
            dragOverRelId={docs.dragOverRelId}
            setDragOverRelId={docs.setDragOverRelId}
            handleCopyDocumentToClient={(doc, targetId) => extraction.handleCopyDocumentToClient(doc, targetId, docs.setDraggedDocument)}
            onNavigateToClient={onNavigateToClient}
            editingRelId={relations.editingRelId}
            setEditingRelId={relations.setEditingRelId}
            handleUpdateRelationType={relations.handleUpdateRelationType}
            handleDeleteRelation={relations.handleDeleteRelation}
            setSearchQuery={relations.setSearchQuery}
            setSelectedRelateId={relations.setSelectedRelateId}
            setIsRelateModalOpen={relations.setIsRelateModalOpen}
          />
          <TemplateManager client={client} clienteDatos={clienteDatos} />
        </div>

        {/* Columna 3: Documentos, Biblioteca y Trámites */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '0.5rem', height: '100%', minWidth: '320px', flex: 1, flexShrink: 0 }}>
          <ClientDocuments
            documentos={documentos}
            uploading={docs.uploading}
            isDragging={docs.isDragging}
            draggedDocument={docs.draggedDocument}
            handleDragOver={docs.handleDragOver}
            handleDragLeave={docs.handleDragLeave}
            handleDrop={docs.handleDrop}
            handleFileUpload={docs.handleFileUpload}
            setDraggedDocument={docs.setDraggedDocument}
            setDragOverRelId={docs.setDragOverRelId}
            setViewingDocument={docs.setViewingDocument}
            handleDeleteDocument={docs.handleDeleteDocument}
          />
          <ClientMediaLibrary />
          <ClientViewTramites
            entradas={entradas}
            onCreateTramite={() => tramites.setIsNewTramiteModalOpen(true)}
            onUpdateEstado={tramites.handleChangeTramiteState}
          />
        </div>

        {/* Columna 4: Comunicaciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '0.5rem', height: '100%', minWidth: '350px', flex: 1, flexShrink: 0 }}>
          <ClientWhatsApp clientId={clientId} telefono={client?.telefono} />
        </div>
      </div>

      {/* ── Modales ─────────────────────────────────────────────────────────── */}

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
        isOpen={relations.isRelateModalOpen}
        onClose={() => relations.setIsRelateModalOpen(false)}
        searchQuery={relations.searchQuery}
        onSearchChange={relations.setSearchQuery}
        searchResults={relations.searchResults}
        allClientes={allClientes}
        selectedId={relations.selectedRelateId}
        onSelectId={relations.setSelectedRelateId}
        selectedType={relations.selectedRelateType}
        onSelectType={relations.setSelectedRelateType}
        onOpenNewClient={() => relations.setIsNewRelateClientModalOpen(true)}
        clientId={clientId}
        onRelate={relations.handleRelateClient}
      />

      {relations.isNewRelateClientModalOpen && (
        <NewClientModal
          onClose={() => relations.setIsNewRelateClientModalOpen(false)}
          onClientCreated={(newClient) => {
            queryClient.setQueryData(['allClientesBase'], [newClient, ...allClientes]);
            relations.setSearchQuery(''); // <--- Clear the search query so it falls back to allClientes and shows the new user
            relations.setSelectedRelateId(newClient.id);
            relations.setIsNewRelateClientModalOpen(false);
          }}
        />
      )}

      <ClientViewEditModal
        isOpen={edit.isEditModalOpen}
        onClose={() => edit.setIsEditModalOpen(false)}
        categorias={categorias}
        campos={campos}
        clienteDatos={clienteDatos}
        client={client}
        editFormData={edit.editFormData}
        onEditFormDataChange={edit.setEditFormData}
        newFields={edit.newFields}
        onNewFieldsChange={edit.setNewFields}
        onSaveEdits={edit.handleSaveEdits}
        isSaving={edit.isSaving}
        searchQuery={edit.editModalSearchQuery}
        onSearchChange={edit.setEditModalSearchQuery}
        fixedFieldsCatalog={FIXED_FIELDS_CATALOG}
        handleCepSearch={edit.handleCepSearch}
        toIsoDate={toIsoDate}
        toSlashDate={toSlashDate}
      />

      <ClientViewExtractionModal
        isOpen={extraction.isExtractionModalOpen}
        extractedData={extraction.extractedData}
        cliente={extraction.extractionTargetClientData || client}
        onClose={extraction.closeExtractionModal}
        onExtractedDataChange={extraction.setExtractedData}
        onSave={extraction.handleSaveExtractedData}
        isSaving={extraction.isSaving}
      />

      <ClientViewNewTramiteModal
        isOpen={tramites.isNewTramiteModalOpen}
        onClose={() => tramites.setIsNewTramiteModalOpen(false)}
        servicio={tramites.newTramiteData.servicio}
        onServicioChange={(val) => tramites.setNewTramiteData(prev => ({ ...prev, servicio: val }))}
        operario={tramites.newTramiteData.operario}
        onOperarioChange={(val) => tramites.setNewTramiteData(prev => ({ ...prev, operario: val }))}
        onCreate={tramites.handleCreateTramite}
        isCreating={tramites.isCreatingTramite}
      />

      {docs.viewingDocument && (
        <DocumentViewerModal
          document={docs.viewingDocument}
          onClose={() => docs.setViewingDocument(null)}
        />
      )}

    </div>
  );
}
