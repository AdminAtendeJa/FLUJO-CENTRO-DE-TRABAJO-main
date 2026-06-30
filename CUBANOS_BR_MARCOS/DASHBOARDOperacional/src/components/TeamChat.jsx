import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { getChatMensajes, enviarMensajeChat } from '../services/equipoService';
import { useSession } from '../hooks/useSession';
import { Send, Users } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

export default function TeamChat() {
  const { session } = useSession();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();

    // Suscribirse a nuevos mensajes en tiempo real
    const channel = supabase
      .channel('public:chat_equipo')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_equipo' },
        (payload) => {
          // Obtener el perfil del usuario para el nuevo mensaje
          // ya que el realtime insert no trae los JOINs
          fetchUserAndAppend(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const data = await getChatMensajes();
      setMessages(data);
    } catch (error) {
      console.error('Error cargando chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAndAppend = async (newMessageRow) => {
    // Evitar duplicados si lo acabamos de enviar nosotros y ya lo agregamos
    setMessages(prev => {
      if (prev.find(m => m.id === newMessageRow.id)) return prev;
      return [...prev, newMessageRow]; // Temporary append
    });

    const { data: profile } = await supabase
      .from('perfiles')
      .select('id, nombre, email, rol')
      .eq('id', newMessageRow.usuario_id)
      .single();

    if (profile) {
      setMessages(prev => 
        prev.map(m => m.id === newMessageRow.id ? { ...m, usuario: profile } : m)
      );
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const textToSend = newMessage;
    setNewMessage(''); // optimista

    try {
      const sentMessage = await enviarMensajeChat(textToSend);
      setMessages(prev => [...prev, sentMessage]);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      // Revertir en caso de error?
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><LoadingSpinner /></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg-canvas)' }}>
      <div style={{ padding: '1.5rem', background: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Users size={24} color="var(--color-primary)" />
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>Chat del Equipo</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>Comunicación general de todo el equipo operativo</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg, index) => {
          const isMe = msg.usuario_id === session?.user?.id;
          const showHeader = index === 0 || messages[index - 1].usuario_id !== msg.usuario_id;
          
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              {showHeader && (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', marginLeft: isMe ? 0 : '0.5rem', marginRight: isMe ? '0.5rem' : 0 }}>
                  {msg.usuario?.nombre || 'Usuario'}
                </span>
              )}
              <div style={{
                background: isMe ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                color: isMe ? 'white' : 'var(--color-text-primary)',
                padding: '0.75rem 1rem',
                borderRadius: '1rem',
                borderBottomRightRadius: isMe ? '0.25rem' : '1rem',
                borderBottomLeftRadius: isMe ? '1rem' : '0.25rem',
                maxWidth: '70%',
                boxShadow: 'var(--shadow-sm)',
                border: isMe ? 'none' : '1px solid var(--color-border)'
              }}>
                <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: '1.4' }}>{msg.mensaje}</p>
                <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: '0.25rem', textAlign: isMe ? 'right' : 'left' }}>
                  {new Date(msg.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '1.5rem', background: 'var(--color-bg-surface)', borderTop: '1px solid var(--color-border)' }}>
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.75rem', maxWidth: '800px', margin: '0 auto' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje al equipo..."
            style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', outline: 'none' }}
          />
          <button type="submit" className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)', width: '48px', height: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} disabled={!newMessage.trim()}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
