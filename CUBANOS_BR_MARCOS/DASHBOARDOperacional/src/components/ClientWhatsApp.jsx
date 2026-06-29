import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MessageCircle, Send, CheckCircle2, ArrowLeft, Search, User } from 'lucide-react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

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
        .neq('remitente', 'nota_interna')
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
        .neq('remitente', 'nota_interna')
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || '';
      if (!webhookUrl || webhookUrl.includes('your_n8n') || webhookUrl.includes('TU_URL')) {
        toast.error('Falta configurar la URL de n8n en el archivo .env');
        setSending(false);
        return;
      }

      const response = await fetch(`${webhookUrl}/webhook/enviar-whatsapp-evolution`, {
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

  const openChat = (id, phone, name) => {
    setActiveChatId(id);
    setActiveChatPhone(phone);
    setActiveChatName(name || 'Cliente');
    setView('chat');
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0, overflow: 'hidden' }}>
      
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

          <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#e5ddd5', backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png")', backgroundSize: '400px', backgroundRepeat: 'repeat' }}>
            {loadingMessages ? (
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.8)', padding: '0.5rem', borderRadius: '12px', alignSelf: 'center', fontSize: '0.8rem' }}>
                Cargando historial...
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.8)', padding: '0.5rem 1rem', borderRadius: '12px', alignSelf: 'center', fontSize: '0.85rem' }}>
                Inicia la conversación. Los mensajes aparecerán aquí.
              </div>
            ) : (
              messages.map(msg => {
                const isIncoming = !msg.remitente || msg.remitente === 'incoming';
                return (
                  <div key={msg.id} style={{
                    alignSelf: isIncoming ? 'flex-start' : 'flex-end',
                    background: isIncoming ? '#ffffff' : '#dcf8c6',
                    color: '#303030',
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
                    <span style={{ fontSize: '0.65rem', color: 'rgba(0,0,0,0.45)', textAlign: 'right', marginTop: '4px' }}>
                      {new Date(msg.fecha_recepcion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} style={{ padding: '0.75rem', background: '#f0f2f5', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={cleanPhone ? "Escribe un mensaje..." : "Añade un teléfono para chatear"} 
              disabled={!cleanPhone || sending}
              style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '24px', border: 'none', outline: 'none', fontSize: '0.95rem' }}
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
