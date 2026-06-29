import React, { useState, useEffect, useRef } from 'react';
import {  Play, Upload, Trash2, Loader2, FileAudio, FileVideo , ChevronDown, ChevronUp } from 'lucide-react';
import { getMediaLibrary, uploadMedia, deleteMedia } from '../services/mediaLibraryService';

export default function ClientMediaLibrary() {
  const [activeTab, setActiveTab] = useState('audios');
  const [isSectionExpanded, setIsSectionExpanded] = useState(false);
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    const { data } = await getMediaLibrary();
    if (data) setMediaItems(data);
    setLoading(false);
  };

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let lastUploadedType = '';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const { error } = await uploadMedia(file);
      if (error) {
        alert(`Error al subir ${file.name}: ` + error);
      } else {
        lastUploadedType = file.type;
      }
    }

    await fetchMedia();
    if (lastUploadedType.startsWith('video/')) setActiveTab('videos');
    else if (lastUploadedType.startsWith('audio/')) setActiveTab('audios');
    
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id, url) => {
    if (!window.confirm('¿Seguro que quieres eliminar este archivo?')) return;
    await deleteMedia(id, url);
    await fetchMedia();
  };

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('text/plain', item.url_archivo);
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'media_library_item',
      nombre: item.nombre,
      url: item.url_archivo,
      tipo: item.tipo_contenido
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const filteredItems = mediaItems.filter(item => 
    activeTab === 'audios' ? item.tipo_contenido.startsWith('audio/') : item.tipo_contenido.startsWith('video/')
  );

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
      
      {/* Header with Upload */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--surface-base)' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          Biblioteca Global
        </span>
        <button 
          onClick={() => fileInputRef.current?.click()} 
          disabled={uploading} 
          style={{ 
            background: 'var(--color-primary)', color: 'white', border: 'none', 
            padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', 
            display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: uploading ? 'wait' : 'pointer'
          }}
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          Subir
        </button>
        <input type="file" ref={fileInputRef} onChange={handleUpload} style={{ display: 'none' }} accept="audio/*,video/*" multiple />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', background: 'var(--surface-base)' }}>
        <button 
          onClick={() => setActiveTab('audios')}
          style={{ 
            flex: 1, padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: 600, 
            color: activeTab === 'audios' ? 'white' : 'var(--color-text-muted)', 
            borderBottom: activeTab === 'audios' ? '2px solid #ff9800' : '2px solid transparent', 
            background: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
            cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          Audios pregrabados
        </button>
        <button 
          onClick={() => setActiveTab('videos')}
          style={{ 
            flex: 1, padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: 600, 
            color: activeTab === 'videos' ? 'white' : 'var(--color-text-muted)', 
            borderBottom: activeTab === 'videos' ? '2px solid #ff9800' : '2px solid transparent', 
            background: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
            cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          Videos pregrabados
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '350px', background: 'var(--color-bg-canvas)', position: 'relative' }}>
        {loading && (
          <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={24} className="animate-spin" color="var(--color-text-muted)" />
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
            No hay {activeTab} subidos a la biblioteca.
          </div>
        )}

        {!loading && filteredItems.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredItems.map((item) => (
              <div 
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.5rem 1rem', borderBottom: '1px solid var(--color-border)',
                  cursor: 'grab', transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-elevated)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                title="Arrastra este archivo al chat de WhatsApp o haz clic derecho para copiar la ruta"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                  <div style={{ 
                    width: '24px', height: '24px', borderRadius: '50%', 
                    background: activeTab === 'audios' ? '#ff9800' : '#e91e63', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    flexShrink: 0, color: 'white' 
                  }}>
                    {activeTab === 'audios' ? <Play size={12} fill="white" /> : <FileVideo size={12} />}
                  </div>
                  
                  {activeTab === 'audios' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.nombre}
                      </span>
                      <audio 
                        controls 
                        src={item.url_archivo} 
                        style={{ height: '28px', maxWidth: '100%' }} 
                        onPlay={(e) => {
                          const audios = document.getElementsByTagName('audio');
                          for (let i = 0; i < audios.length; i++) {
                            if (audios[i] !== e.target) {
                              audios[i].pause();
                              audios[i].currentTime = 0;
                            }
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <a 
                      href={item.url_archivo} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {item.nombre}
                    </a>
                  )}
                </div>

                <button 
                  onClick={() => handleDelete(item.id, item.url_archivo)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '4px', opacity: 0.7 }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                  onMouseOut={(e) => e.currentTarget.style.opacity = 0.7}
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
}
