import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MessageCircle, Send, CheckCircle2, ArrowLeft, Search, User, X, File, Loader2, Paperclip, Smile } from 'lucide-react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';

export default function ClientWhatsApp({ clientId, telefono }) {
  const [view, setView] = useState('chat'); // 'chat' | 'list'
  const [activeChatId, setActiveChatId] = useState(clientId);
  const [activeChatPhone, setActiveChatPhone] = useState(telefono);
  const [activeChatName, setActiveChatName] = useState('Cliente Actual');
  
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);

  // Drag & Drop Media states
  const [isDragOverChat, setIsDragOverChat] = useState(false);
  const [mediaToSend, setMediaToSend] = useState(null);

  // List view states
  const [recentChats, setRecentChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Reset to default client when main dashboard navigates
  useEffect(() => {
    setActiveChatId(clientId);
    setActiveChatPhone(telefono);
    setActiveChatName('Cliente Actual');
    setView('chat');
  }, [clientId, telefono]);

  const cleanPhone = useMemo(() => {
    if (!activeChatPhone) return '';
    return activeChatPhone.replace(/\D/g, '');
  }, [activeChatPhone]);

  // Fetch messages for active chat
  const fetchMessages = async () => {
    if (!activeChatId) return;
    try {
      const { data, error } = await supabase
        .from('notas_kommo')
        .select('*')
        .eq('cliente_id', activeChatId)
        .order('fecha_recepcion', { ascending: true });

      if (error) throw error;
      
      const filtered = (data || []).filter(n => 
        !n.texto?.includes('mensagem de mídia') && 
        !n.texto?.includes('mensagem de media')
      );
      
      setMessages(filtered);
    } catch (err) {
      console.error('Error fetching whatsapp messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (view === 'chat' && activeChatId) {
      setLoadingMessages(true);
      fetchMessages();

      const channel = supabase
        .channel(`whatsapp_${activeChatId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notas_kommo', filter: `cliente_id=eq.${activeChatId}` }, () => {
          fetchMessages();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeChatId, view]);

  useEffect(() => {
    if (messagesEndRef.current && view === 'chat') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, view]);

  // Fetch recent chats list
  const fetchRecentChats = async () => {
    setLoadingList(true);
    try {
      const { data, error } = await supabase
        .from('notas_kommo')
        .select(`
          cliente_id,
          texto,
          fecha_recepcion,
          remitente,
          clientes ( nombre, telefono )
        `)
        .order('fecha_recepcion', { ascending: false })
        .limit(200);

      if (error) throw error;

      // Group by cliente_id to get only the latest message
      const grouped = [];
      const seen = new Set();
      
      for (const msg of data) {
        if (!seen.has(msg.cliente_id) && msg.clientes) {
          seen.add(msg.cliente_id);
          grouped.push(msg);
        }
      }

      setRecentChats(grouped);
    } catch (err) {
      console.error('Error fetching recent chats:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (view === 'list' && !searchQuery) {
      fetchRecentChats();
    }
  }, [view, searchQuery]);

  // Search contacts
  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const searchContacts = async () => {
        setLoadingList(true);
        try {
          const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .ilike('nombre', `%${searchQuery}%`)
            .limit(20);

          if (error) throw error;
          
          // Extraemos el teléfono de datos_extra si existe
          const parsedData = (data || []).map(c => ({
            id: c.id,
            nombre: c.nombre,
            telefono: c.telefono || (c.datos_extra ? c.datos_extra.telefono : null)
          }));
          
          setSearchResults(parsedData);
        } catch (err) {
          console.error('Search error:', err);
        } finally {
          setLoadingList(false);
        }
      };
      
      // Debounce search
      const timer = setTimeout(() => {
        searchContacts();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const onEmojiClick = (emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setMediaToSend({
        url: event.target.result,
        nombre: file.name,
        tipo: file.type || 'document'
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    setShowEmojiPicker(false);
    try {
      let webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || '';
      if (!webhookUrl || webhookUrl.includes('your_n8n') || webhookUrl.includes('TU_URL')) {
        toast.error('Falta configurar la URL de n8n en el archivo .env');
        setSending(false);
        return;
      }
      // Sanitize URL to remove trailing paths just in case
      webhookUrl = webhookUrl.replace(/\/webhook(\/enviar-whatsapp)?\/?$/, '');

      const response = await fetch(`${webhookUrl}/webhook/enviar-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: activeChatId,
          texto: newMessage.trim(),
          telefono: cleanPhone
        })
      });

      if (!response.ok) throw new Error('Error al conectar con n8n');
      
      setNewMessage('');
      toast.success('Mensaje enviado a n8n');
    } catch (err) {
      console.error('Error enviando mensaje:', err);
      toast.error('Error al guardar mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleSendMedia = async () => {
    if (!mediaToSend || sending) return;
    setSending(true);
    try {
      let webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || '';
      if (!webhookUrl || webhookUrl.includes('your_n8n') || webhookUrl.includes('TU_URL')) {
        toast.error('Falta configurar la URL de n8n en el archivo .env');
        setSending(false);
        return;
      }
      // Sanitize URL to remove trailing paths just in case
      webhookUrl = webhookUrl.replace(/\/webhook(\/enviar-whatsapp)?\/?$/, '');

      const response = await fetch(`${webhookUrl}/webhook/enviar-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: activeChatId,
          telefono: cleanPhone,
          url_archivo: mediaToSend.url,
          tipo_archivo: mediaToSend.tipo,
          nombre_archivo: mediaToSend.nombre
        })
      });

      if (!response.ok) throw new Error('Error al conectar con n8n');
      
      toast.success(`Archivo enviado: ${mediaToSend.nombre}`);
      setMediaToSend(null);
    } catch (err) {
      console.error('Error enviando archivo:', err);
      toast.error('Error al enviar archivo');
    } finally {
      setSending(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverChat(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverChat(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverChat(false);

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      
      if (data.type === 'media_library_item' || data.type === 'document_copy') {
        setMediaToSend({
          url: data.url,
          nombre: data.nombre,
          tipo: data.tipo || 'document' // Fallback si no tiene tipo
        });
      }
    } catch (err) {
      console.error('Error parsing drop data:', err);
    }
  };

  const openChat = (id, phone, name) => {
    setActiveChatId(id);
    setActiveChatPhone(phone);
    setActiveChatName(name || 'Cliente');
    setView('chat');
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0, overflow: 'hidden' }}>
      
      {/* TABS HEADER */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', background: 'var(--surface-base)' }}>
        <div style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-info)', borderBottom: '2px solid var(--color-info)', cursor: 'pointer' }}>
          WhatsApp
        </div>
        <div style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)', cursor: 'pointer' }}>
          Enviar Email
        </div>
        <div style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)', cursor: 'pointer' }}>
          Formularios
        </div>
      </div>

      {/* -------------------- VIEW: CHAT LIST -------------------- */}
      {view === 'list' && (
        <>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-canvas)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageCircle size={18} /> Bandeja de Entrada
            </h3>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Buscar por nombre o teléfono..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.2rem', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', fontSize: '0.85rem' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-bg-canvas)' }}>
            {loadingList ? (
              <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5, fontSize: '0.85rem' }}>Cargando contactos...</div>
            ) : searchQuery.length > 2 ? (
              // Search Results
              searchResults.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5, fontSize: '0.85rem' }}>No se encontraron clientes.</div>
              ) : (
                searchResults.map(c => (
                  <div key={c.id} onClick={() => openChat(c.id, c.telefono, c.nombre)} style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', gap: '1rem', alignItems: 'center', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--color-bg-elevated)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={20} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{c.nombre}</h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{c.telefono || 'Sin teléfono'}</p>
                    </div>
                  </div>
                ))
              )
            ) : (
              // Recent Chats List
              recentChats.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5, fontSize: '0.85rem' }}>No hay conversaciones recientes.</div>
              ) : (
                recentChats.map(c => (
                  <div key={c.cliente_id} onClick={() => openChat(c.cliente_id, c.clientes?.telefono, c.clientes?.nombre)} style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', gap: '1rem', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--color-bg-elevated)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={24} />
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.clientes?.nombre || 'Desconocido'}
                        </h4>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                          {new Date(c.fecha_recepcion).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.remitente === 'outgoing' ? 'Tú: ' : ''}{c.texto}
                      </p>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </>
      )}

      {/* -------------------- VIEW: ACTIVE CHAT -------------------- */}
      {view === 'chat' && (
        <>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--color-bg-canvas)' }}>
            <button onClick={() => setView('list')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
              <ArrowLeft size={20} />
            </button>
            <div style={{ background: '#25D366', color: 'white', padding: '0.4rem', borderRadius: '50%' }}>
              <MessageCircle size={18} />
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeChatId === clientId ? 'Cliente Actual' : activeChatName}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {cleanPhone ? `+${cleanPhone}` : 'Sin teléfono'}
                {cleanPhone && <CheckCircle2 size={12} color="#25D366" />}
              </span>
            </div>
          </div>

          <div 
            style={{ 
              flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', 
              background: 'var(--color-bg-primary)', backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png")', backgroundSize: '400px', backgroundRepeat: 'repeat', opacity: 0.9,
              position: 'relative'
            }}
            onClick={() => setShowEmojiPicker(false)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Overlay de Drag & Drop */}
            {isDragOverChat && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(37, 211, 102, 0.9)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: 'white' }}>
                <File size={48} />
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Suelta el archivo para enviarlo</h3>
              </div>
            )}

            {/* Modal de confirmación de envío multimedia */}
            {mediaToSend && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                <div style={{ background: 'var(--color-bg-canvas)', borderRadius: '12px', width: '100%', maxWidth: '300px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                  <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-primary)' }}>Confirmar Envío</h3>
                    <button onClick={() => setMediaToSend(null)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                      <X size={18} />
                    </button>
                  </div>
                  <div style={{ padding: '1.25rem', textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                      <File size={24} color="var(--color-info)" />
                    </div>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)', wordBreak: 'break-word' }}>
                      ¿Deseas enviar el archivo <strong>{mediaToSend.nombre}</strong> a este chat?
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Destino: +{cleanPhone}
                    </p>
                  </div>
                  <div style={{ display: 'flex', borderTop: '1px solid var(--color-border)' }}>
                    <button onClick={() => setMediaToSend(null)} disabled={sending} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: 'none', borderRight: '1px solid var(--color-border)', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                      Cancelar
                    </button>
                    <button onClick={handleSendMedia} disabled={sending} style={{ flex: 1, padding: '0.75rem', background: '#25D366', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Enviar
                    </button>
                  </div>
                </div>
              </div>
            )}
            {loadingMessages ? (
              <div style={{ textAlign: 'center', background: 'var(--color-bg-canvas)', border: '1px solid var(--color-border)', padding: '0.5rem', borderRadius: '12px', alignSelf: 'center', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Cargando historial...
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', background: 'var(--color-bg-canvas)', border: '1px solid var(--color-border)', padding: '0.5rem 1rem', borderRadius: '12px', alignSelf: 'center', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Inicia la conversación. Los mensajes aparecerán aquí.
              </div>
            ) : (
              messages.map(msg => {
                const isIncoming = !msg.remitente || msg.remitente === 'incoming';
                return (
                  <div key={msg.id} style={{
                    alignSelf: isIncoming ? 'flex-start' : 'flex-end',
                    background: isIncoming ? 'var(--color-bg-elevated)' : 'var(--color-primary)',
                    color: isIncoming ? 'var(--color-text-primary)' : '#ffffff',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    borderTopLeftRadius: isIncoming ? '0' : '8px',
                    borderTopRightRadius: !isIncoming ? '0' : '8px',
                    maxWidth: '85%',
                    boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <span style={{ fontSize: '0.9rem', lineHeight: '1.3', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {msg.texto}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: isIncoming ? 'var(--color-text-muted)' : 'rgba(255,255,255,0.7)', textAlign: 'right', marginTop: '4px' }}>
                      {new Date(msg.fecha_recepcion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {showEmojiPicker && (
            <div style={{ position: 'absolute', bottom: '70px', left: '10px', zIndex: 50 }}>
              <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} />
            </div>
          )}
          <form onSubmit={handleSendMessage} style={{ padding: '0.75rem', background: 'var(--surface-base)', display: 'flex', gap: '0.5rem', alignItems: 'center', borderTop: '1px solid var(--color-border)' }}>
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={!cleanPhone || sending}
              style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', padding: '0.4rem' }}
            >
              <Smile size={24} />
            </button>

            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!cleanPhone || sending}
              style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', padding: '0.4rem' }}
            >
              <Paperclip size={24} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileSelect} 
            />

            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={cleanPhone ? "Escribe un mensaje..." : "Añade un teléfono para chatear"} 
              disabled={!cleanPhone || sending}
              style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '24px', border: '1px solid var(--color-border)', background: 'var(--color-bg-canvas)', color: 'var(--color-text-primary)', outline: 'none', fontSize: '0.95rem' }}
            />
            <button 
              type="submit"
              disabled={!cleanPhone || sending || !newMessage.trim()} 
              style={{ background: newMessage.trim() ? '#25D366' : 'transparent', color: newMessage.trim() ? 'white' : '#8e9092', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: newMessage.trim() ? 'pointer' : 'default', transition: 'all 0.2s' }}
            >
              {sending ? <span style={{ fontSize: '0.6rem' }}>...</span> : <Send size={20} style={{ marginLeft: newMessage.trim() ? '2px' : '0' }} />}
            </button>
          </form>
        </>
      )}

    </div>
  );
}
