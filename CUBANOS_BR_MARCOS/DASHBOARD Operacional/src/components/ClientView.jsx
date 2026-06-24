import { useState, useEffect } from 'react';
import { categorias, campos, clienteDatos, clientes, relaciones, documentos } from '../mockData';
import { ArrowLeft, ArrowRight, Copy, Check, Edit2, Plus, UploadCloud, Users, Image as ImageIcon, FileText } from 'lucide-react';

export default function ClientView({ clientId, onBack }) {
  const [client, setClient] = useState(null);
  const [activeTab, setActiveTab] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRelateModalOpen, setIsRelateModalOpen] = useState(false);
  
  // Edit State
  const [editFormData, setEditFormData] = useState([]);
  const [newFields, setNewFields] = useState([]);

  useEffect(() => {
    const c = clientes.find(c => c.id === clientId);
    setClient(c);
  }, [clientId]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openEditModal = () => {
    // Populate form with current data
    const currentData = clienteDatos[clientId] || [];
    const formData = currentData.map(cd => {
      // Find campo to get name
      let campoName = 'Campo Custom';
      for (const catId in campos) {
        const found = campos[catId].find(c => c.id === cd.campo_id);
        if (found) campoName = found.nombre_campo;
      }
      return { ...cd, nombre_campo: campoName };
    });
    setEditFormData(formData);
    setNewFields([]);
    setIsEditModalOpen(true);
  };

  const handleAddCustomField = () => {
    setNewFields([...newFields, { id: Date.now(), nombre_campo: '', valor: '' }]);
  };

  if (!client) return null;

  const currentCategoryFields = campos[activeTab] || [];
  const clientDataForTab = (clienteDatos[clientId] || []).filter(cd => 
    currentCategoryFields.some(cf => cf.id === cd.campo_id)
  );
  
  const clientRelations = relaciones.filter(r => r.cliente_id === clientId || r.cliente_relacionado_id === clientId);
  const clientDocs = documentos[clientId] || [];

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
      
      <button onClick={onBack} className="btn btn-ghost" style={{ marginBottom: '1.5rem', paddingLeft: 0 }}>
        <ArrowLeft size={18} />
        Volver a Trámites
      </button>

      {/* Header Section */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 600, color: 'white' }}>
            {client.nombre.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>{client.nombre}</h1>
            <div style={{ display: 'flex', gap: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              <span>CPF: {client.cpf}</span>
              <span>•</span>
              <span>Registrado: {new Date(client.creado_en).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={openEditModal}>
            <Edit2 size={16} /> Editar Datos
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        
        {/* Left Column: Dynamic Forms */}
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem' }}>
            {categorias.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                style={{
                  padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', fontSize: '0.875rem', fontWeight: 500,
                  whiteSpace: 'nowrap', transition: 'all 0.2s', border: '1px solid', cursor: 'pointer',
                  background: activeTab === cat.id ? `${cat.color}22` : 'transparent',
                  color: activeTab === cat.id ? cat.color : 'var(--color-text-secondary)',
                  borderColor: activeTab === cat.id ? `${cat.color}55` : 'var(--color-border)'
                }}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          {/* Fields for active tab */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', color: categorias.find(c => c.id === activeTab)?.color }}>
              {categorias.find(c => c.id === activeTab)?.nombre}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {currentCategoryFields.map(campo => {
                const dato = clientDataForTab.find(cd => cd.campo_id === campo.id);
                return (
                  <div key={campo.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                        {campo.nombre_campo} {campo.requerido && <span style={{color: 'var(--color-danger)'}}>*</span>}
                      </label>
                      <div style={{ fontSize: '1rem', color: dato?.valor ? 'var(--color-text-primary)' : 'var(--color-text-muted)', fontWeight: dato?.valor ? 500 : 400 }}>
                        {dato?.valor || 'No especificado'}
                      </div>
                    </div>
                    {dato?.valor && (
                      <button 
                        onClick={() => handleCopy(dato.valor, campo.id)}
                        className="btn btn-ghost" 
                        style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)' }}
                        title="Copiar rápido"
                      >
                        {copiedId === campo.id ? <Check size={18} color="var(--color-success)" /> : <Copy size={18} />}
                      </button>
                    )}
                  </div>
                );
              })}
              
              {currentCategoryFields.length === 0 && (
                <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                  No hay campos definidos para esta categoría.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Relationships & Docs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Relationships */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} color="var(--color-primary)" /> Relacionamientos
              </h3>
              <button className="btn btn-ghost" style={{ padding: '0.25rem' }} onClick={() => setIsRelateModalOpen(true)}>
                <Plus size={18} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {clientRelations.length > 0 ? clientRelations.map(rel => {
                const relId = rel.cliente_id === clientId ? rel.cliente_relacionado_id : rel.cliente_id;
                const relatedClient = clientes.find(c => c.id === relId);
                return (
                  <div key={rel.id} className="glass-panel-elevated" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{relatedClient?.nombre}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{rel.tipo_relacion}</div>
                    </div>
                    <ArrowRight size={14} color="var(--color-text-muted)" />
                  </div>
                )
              }) : (
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>No hay familiares o amigos vinculados.</div>
              )}
            </div>
          </div>

          {/* Documents Gallery */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <FileText size={18} color="var(--color-primary)" /> Documentos
            </h3>
            
            <div 
              style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '1.25rem' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
            >
              <UploadCloud size={24} color="var(--color-text-muted)" style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Subir Documento</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Arrastra o haz clic</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {clientDocs.map(doc => (
                <div key={doc.id} className="glass-panel-elevated" style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-md)', aspectRatio: '1' }}>
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                    {doc.tipo_documento === 'FOTO' ? <ImageIcon size={32} color="var(--color-text-muted)" /> : <FileText size={32} color="var(--color-text-muted)" />}
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.5rem', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', fontSize: '0.65rem' }}>
                    <div style={{ color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{doc.nombre_archivo}</div>
                    <div style={{ color: doc.estado === 'verificado' ? 'var(--color-success)' : 'var(--color-warning)', marginTop: '2px', textTransform: 'capitalize' }}>
                      • {doc.estado}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Editar Datos del Cliente</h2>
              <button className="btn btn-ghost" style={{ padding: '0.5rem' }} onClick={() => setIsEditModalOpen(false)}>✕</button>
            </div>
            
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Existing Fields */}
              {editFormData.map((field, idx) => (
                <div key={`exist-${idx}`}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                    {field.nombre_campo}
                  </label>
                  <input type="text" defaultValue={field.valor} />
                </div>
              ))}
              
              {/* New Custom Fields */}
              {newFields.length > 0 && <hr style={{ borderColor: 'var(--color-border)', margin: '1rem 0' }} />}
              {newFields.map((field, idx) => (
                <div key={field.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Nombre del Dato</label>
                    <input type="text" placeholder="Ej: Talla de camisa" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Valor</label>
                    <input type="text" placeholder="Ej: L" />
                  </div>
                  <button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => setNewFields(newFields.filter(f => f.id !== field.id))}>✕</button>
                </div>
              ))}
              
              <button className="btn btn-secondary" style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }} onClick={handleAddCustomField}>
                <Plus size={16} /> Añadir Más Datos
              </button>
            </div>
            
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-ghost" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => setIsEditModalOpen(false)}>Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* Relate Modal (Placeholder) */}
      {isRelateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Vincular Familiar / Amigo</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Buscar Cliente</label>
              <select>
                <option value="">Seleccione un cliente...</option>
                {clientes.filter(c => c.id !== clientId).map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} ({c.cpf})</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Tipo de Relación</label>
              <select>
                <option value="familiar">Familiar</option>
                <option value="conyuge">Cónyuge</option>
                <option value="amigo">Amigo</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-ghost" onClick={() => setIsRelateModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => setIsRelateModalOpen(false)}>Vincular</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
