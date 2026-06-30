import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { getChatMensajes, enviarMensajeChat, getPerfiles, uploadTeamMedia } from '../services/equipoService';
import { useSession } from '../hooks/useSession';
import { Send, Users, X, MessageSquare, Paperclip, Mic, Square, File, Download, Image as ImageIcon } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import NotificationToast from './NotificationToast';

export default function TeamChat({ isFullView = false }) {
  const { session } = useSession();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [perfiles, setPerfiles] = useState([]);
  const [mentionState, setMentionState] = useState({ active: false, query: '', startIndex: -1 });
  
  // Media state
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const shouldSendAudioRef = useRef(false);

  // Floating widget state
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);
  
  // Dragging state
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('teamChatPosition');
    return saved ? JSON.parse(saved) : { x: 24, y: 24 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialPosX: 0, initialPosY: 0, isDragging: false });

  useEffect(() => {
    localStorage.setItem('teamChatPosition', JSON.stringify(position));
  }, [position]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Refs for realtime callback
  const isOpenRef = useRef(isOpen);
  const perfilesRef = useRef(perfiles);
  const sessionRef = useRef(session);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    perfilesRef.current = perfiles;
  }, [perfiles]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    loadMessages();
    getPerfiles().then(data => {
      setPerfiles([...data, { id: 'todos', nombre: 'Todos' }]);
    }).catch(console.error);

    // Suscribirse a nuevos mensajes en tiempo real
    const channel = supabase
      .channel('public:chat_equipo')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_equipo' },
        (payload) => {
          fetchUserAndAppend(payload.new);

          const currentSession = sessionRef.current;
          const isOwnMessage = payload.new.usuario_id === currentSession?.user?.id;

          if (!isOpenRef.current && !isOwnMessage) {
            setHasUnread(true);
          }

          // Check mention
          const myProfile = perfilesRef.current.find(p => p.id === currentSession?.user?.id);
          const isMentioned = payload.new.mensaje.includes('@Todos') || (myProfile && payload.new.mensaje.includes(`@${myProfile.nombre}`));
          
          if (isMentioned && !isOwnMessage) {
            setToastNotification({ type: 'info', message: `¡Te han mencionado en el chat del equipo!` });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

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
    setMessages(prev => {
      if (prev.find(m => m.id === newMessageRow.id)) return prev;
      return [...prev, newMessageRow];
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

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursor);
    const lastAtMatch = textBeforeCursor.match(/@([a-zA-ZáéíóúÁÉÍÓÚñÑ]*)$/);
    
    if (lastAtMatch) {
      setMentionState({
        active: true,
        query: lastAtMatch[1],
        startIndex: lastAtMatch.index
      });
    } else {
      setMentionState(prev => prev.active ? { ...prev, active: false } : prev);
    }
  };

  const insertMention = (nombre) => {
    const beforeAt = newMessage.slice(0, mentionState.startIndex);
    const afterAt = newMessage.slice(mentionState.startIndex + mentionState.query.length + 1);
    const newText = `${beforeAt}@${nombre} ${afterAt}`;
    setNewMessage(newText);
    setMentionState({ active: false, query: '', startIndex: -1 });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (mentionState.active) {
      const filtered = perfiles.filter(p => p.nombre.toLowerCase().includes(mentionState.query.toLowerCase()));
      if (e.key === 'Enter' && filtered.length > 0) {
        e.preventDefault();
        insertMention(filtered[0].nombre);
      } else if (e.key === 'Escape') {
        setMentionState({ active: false, query: '', startIndex: -1 });
      }
    }
  };

  const renderMessageText = (text, isMe) => {
    if (!text) return null;

    let mediaUrl, mediaType, mediaName, messageText = text;
    const match = text.match(/^__MEDIA__\|(.*?)\|(.*?)\|(.*?)\|(.*)$/s);
    if (match) {
      mediaUrl = match[1];
      mediaType = match[2];
      mediaName = match[3];
      messageText = match[4];
    }

    const renderTextContent = (t) => {
      if (!t) return null;
      if (perfiles.length === 0) return <span style={{ whiteSpace: 'pre-wrap' }}>{t}</span>;
      
      const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const names = perfiles.map(p => escapeRegExp(`@${p.nombre}`)).join('|');
      if (!names) return <span style={{ whiteSpace: 'pre-wrap' }}>{t}</span>;

      const regex = new RegExp(`(${names})`, 'g');
      const parts = t.split(regex);

      return (
        <span style={{ whiteSpace: 'pre-wrap' }}>
          {parts.map((part, i) => {
            if (perfiles.some(p => `@${p.nombre}` === part)) {
              return (
                <span 
                  key={i} 
                  style={{ 
                    fontWeight: 'bold', 
                    color: isMe ? 'white' : 'var(--color-primary)',
                    textDecoration: isMe ? 'underline' : 'none'
                  }}
                >
                  {part}
                </span>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </span>
      );
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {mediaUrl && (
          <div style={{ background: isMe ? 'rgba(255,255,255,0.1)' : 'var(--color-bg-canvas)', padding: '0.5rem', borderRadius: '0.5rem' }}>
            {mediaType.startsWith('image/') ? (
              <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
                <img src={mediaUrl} alt={mediaName} style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', objectFit: 'contain' }} />
              </a>
            ) : mediaType.startsWith('audio/') || mediaName.endsWith('.webm') ? (
              <audio controls src={mediaUrl} style={{ width: '100%', height: '40px' }} />
            ) : (
              <a href={mediaUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isMe ? 'white' : 'var(--color-primary)', textDecoration: 'none' }}>
                <File size={24} />
                <span style={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{mediaName}</span>
                <Download size={16} style={{ marginLeft: 'auto' }} />
              </a>
            )}
          </div>
        )}
        {messageText && (
          <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: '1.4' }}>
            {renderTextContent(messageText)}
          </p>
        )}
      </div>
    );
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        if (shouldSendAudioRef.current) {
          shouldSendAudioRef.current = false;
          handleSendMessage(null, audioFile);
        } else {
          setSelectedFile(audioFile);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone', err);
      setToastNotification({ type: 'error', message: 'No se pudo acceder al micrófono.' });
    }
  };

  const stopRecording = (sendImmediately = false) => {
    if (mediaRecorderRef.current && isRecording) {
      shouldSendAudioRef.current = sendImmediately;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setToastNotification({ type: 'error', message: 'El archivo es muy grande (máximo 10MB).' });
        return;
      }
      setSelectedFile(file);
    }
    e.target.value = '';
  };

  const handleSendMessage = async (e, directFile = null) => {
    if (e) e.preventDefault();
    
    const fileToSend = directFile || selectedFile;
    if (!newMessage.trim() && !fileToSend) return;

    let textToSend = newMessage;
    setNewMessage('');
    if (!directFile) setSelectedFile(null);
    setIsUploading(true);

    try {
      if (fileToSend) {
        const media = await uploadTeamMedia(fileToSend);
        textToSend = `__MEDIA__|${media.url}|${media.type}|${media.name}|${textToSend}`;
      }

      const sentMessage = await enviarMensajeChat(textToSend);
      setMessages(prev => [...prev, sentMessage]);
      scrollToBottom();
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      setToastNotification({ type: 'error', message: 'Error al enviar mensaje.' });
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return null; // Ocultamos el spinner inicial si está cerrado
  }

  const handlePointerDown = (e) => {
    if (e.button !== 0) return; // Only left mouse button or touch
    
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: position.x,
      initialPosY: position.y,
      isDragging: false
    };

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const onPointerMove = (eMove) => {
      const dx = eMove.clientX - dragRef.current.startX;
      const dy = eMove.clientY - dragRef.current.startY;

      if (!dragRef.current.isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        dragRef.current.isDragging = true;
        setIsDragging(true);
      }

      if (dragRef.current.isDragging) {
        const newX = dragRef.current.initialPosX + dx;
        const newY = dragRef.current.initialPosY - dy; 
        
        const maxX = window.innerWidth - 56;
        const maxY = window.innerHeight - 56;
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };

    const onPointerUp = (eUp) => {
      target.releasePointerCapture(eUp.pointerId);
      target.removeEventListener('pointermove', onPointerMove);
      target.removeEventListener('pointerup', onPointerUp);
      
      setTimeout(() => {
        setIsDragging(false);
        dragRef.current.isDragging = false;
      }, 0);
    };

    target.addEventListener('pointermove', onPointerMove);
    target.addEventListener('pointerup', onPointerUp);
  };

  const handleBubbleClick = () => {
    if (!isDragging) {
      setIsOpen(true);
    }
  };

  // Si no está abierto, mostramos la bolita flotante, PERO SOLO si no estamos en isFullView
  if (!isFullView && !isOpen) {
    return (
      <>
        {toastNotification && (
           <NotificationToast 
               notification={toastNotification} 
               onClose={() => setToastNotification(null)} 
           />
        )}
        <button
          onPointerDown={handlePointerDown}
          onClick={handleBubbleClick}
          title="Chat del Equipo"
          style={{
            position: 'fixed',
            bottom: `${position.y}px`,
            left: `${position.x}px`,
            zIndex: 1010,
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            cursor: isDragging ? 'grabbing' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            touchAction: 'none'
          }}
        >
          <MessageSquare size={24} />
          {hasUnread && (
            <div style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '14px',
              height: '14px',
              backgroundColor: '#ef4444', // color rojo para notificar
              borderRadius: '50%',
              border: '2px solid white'
            }} />
          )}
        </button>
      </>
    );
  }

  // Si está abierto o es isFullView, mostramos la pantalla
  return (
    <>
      {toastNotification && !isFullView && (
           <NotificationToast 
               notification={toastNotification} 
               onClose={() => setToastNotification(null)} 
           />
      )}
      <div style={isFullView ? {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: 'var(--color-bg-canvas)'
      } : {
        position: 'fixed',
        bottom: `${Math.min(position.y + 70, window.innerHeight - 620)}px`,
        left: `${Math.min(position.x, window.innerWidth - 400)}px`,
        zIndex: 1010,
        width: '380px',
        height: '600px',
        maxHeight: 'calc(100vh - 140px)',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg-elevated)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--color-border-hover)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-glass)',
        overflow: 'hidden',
        animation: 'fadeIn 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{ padding: '1rem', background: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={20} color="var(--color-primary)" />
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>Chat del Equipo</h2>
              {isFullView && <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>Comunicación general de todo el equipo operativo</p>}
            </div>
          </div>
          {!isFullView && (
            <button 
              onClick={() => setIsOpen(false)} 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer', 
                color: 'var(--color-text-secondary)',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px'
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--color-bg-canvas)' }}>
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
                  maxWidth: '85%',
                  boxShadow: 'var(--shadow-sm)',
                  border: isMe ? 'none' : '1px solid var(--color-border)'
                }}>
                  {renderMessageText(msg.mensaje, isMe)}
                  <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: '0.25rem', textAlign: isMe ? 'right' : 'left' }}>
                    {new Date(msg.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div style={{ padding: '1rem', background: 'var(--color-bg-surface)', borderTop: '1px solid var(--color-border)' }}>
          {selectedFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'var(--color-bg-elevated)', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
              {selectedFile.type.startsWith('image/') ? <ImageIcon size={18} /> : selectedFile.type.startsWith('audio/') ? <Mic size={18} /> : <File size={18} />}
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedFile.type.startsWith('audio/') ? `Audio grabado` : selectedFile.name}
              </span>
              <button type="button" onClick={() => setSelectedFile(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}>
                <X size={16} />
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.75rem', position: 'relative', alignItems: 'center' }}>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
            
            <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-ghost" style={{ padding: '0.5rem', borderRadius: '50%', flexShrink: 0, color: 'var(--color-text-secondary)' }} disabled={isRecording || isUploading}>
              <Paperclip size={20} />
            </button>

            {isRecording ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
                <span style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: 500, flex: 1 }}>Grabando... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                
                <button type="button" onClick={() => stopRecording(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', padding: '0.25rem' }} title="Detener y previsualizar">
                  <Square size={18} fill="#ef4444" />
                </button>
                
                <button type="button" onClick={() => stopRecording(true)} style={{ background: 'var(--color-primary)', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', width: '32px', height: '32px', marginLeft: '0.25rem' }} title="Enviar ahora">
                  <Send size={16} />
                </button>
              </div>
            ) : (
              <>
                {mentionState.active && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '0',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.5rem',
                    boxShadow: 'var(--shadow-lg)',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    width: '100%',
                    zIndex: 10,
                    marginBottom: '0.5rem'
                  }}>
                    {perfiles
                      .filter(p => p.nombre.toLowerCase().includes(mentionState.query.toLowerCase()))
                      .map((p, idx) => (
                        <div
                          key={p.id}
                          onClick={() => insertMention(p.nombre)}
                          style={{
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--color-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: idx === 0 ? 'var(--color-bg-surface)' : 'transparent'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-surface)'}
                          onMouseLeave={(e) => {
                            if (idx !== 0) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            {p.nombre.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{p.nombre}</span>
                        </div>
                      ))}
                  </div>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={selectedFile ? "Añadir comentario..." : "Mensaje... (@ para mencionar)"}
                  style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', outline: 'none', fontSize: '0.875rem' }}
                  disabled={isUploading}
                />
                
                {(!newMessage.trim() && !selectedFile) ? (
                  <button type="button" onClick={startRecording} className="btn btn-ghost" style={{ padding: '0.5rem', borderRadius: '50%', flexShrink: 0, color: 'var(--color-text-secondary)' }} disabled={isUploading}>
                    <Mic size={20} />
                  </button>
                ) : (
                  <button type="submit" className="btn btn-primary" style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} disabled={isUploading}>
                    {isUploading ? <LoadingSpinner size="sm" color="white" /> : <Send size={18} />}
                  </button>
                )}
              </>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
