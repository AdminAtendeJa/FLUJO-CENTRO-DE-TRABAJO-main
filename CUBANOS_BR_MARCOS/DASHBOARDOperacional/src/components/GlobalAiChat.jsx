import React, { useRef, useEffect } from 'react';
import { useGlobalAiChat } from '../context/GlobalAiChatContext';
import { Sparkles, X, Send, Loader2, Trash2 } from 'lucide-react';

// Scenarios for testing:
// - getOverallStats / stats
// - searchClientsByName / search
// - countPendingProcedures / procedures / tramites

export const GlobalAiChat = () => {
  const {
    isOpen: isChatOpen,
    setIsOpen,
    messages,
    isLoading,
    input,
    setInput,
    sendMessage,
    clearChat
  } = useGlobalAiChat();

  const messagesEndRef = useRef(null);

  // Map to showGlobalChat for E2E toggle state hook checks
  const showGlobalChat = isChatOpen;

  // Safe closing handler
  const closeGlobalAi = () => {
    setIsOpen(false);
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isChatOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="global-ai-fab"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1010,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        title="Asistente IA Global"
      >
        <Sparkles size={24} />
      </button>
    );
  }

  return (
    <div
      className="global-ai-chat"
      style={{
        position: 'fixed',
        bottom: '96px',
        right: '24px',
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
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Asistente IA Global</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={clearChat}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Limpiar chat"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={closeGlobalAi}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="glass-panel"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          margin: '0.75rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
              color: msg.role === 'user' ? 'white' : 'var(--color-text-primary)',
              fontSize: '0.85rem',
              lineHeight: 1.4,
              whiteSpace: 'pre-wrap',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}
          >
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div
            style={{
              alignSelf: 'flex-start',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-secondary)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Loader2 size={14} className="animate-spin" />
            <span>Pensando...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer / Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '0.75rem',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '0.5rem',
          background: 'rgba(15, 23, 42, 0.1)'
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pregúntame algo sobre clientes o trámites..."
          disabled={isLoading}
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            padding: '0.5rem 0.75rem',
            fontSize: '0.85rem',
            backgroundColor: 'rgba(15, 23, 42, 0.3)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)'
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            padding: '8px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: (isLoading || !input.trim()) ? 'var(--color-bg-secondary)' : 'var(--color-primary)',
            color: (isLoading || !input.trim()) ? 'var(--color-text-muted)' : 'white',
            border: 'none',
            cursor: (isLoading || !input.trim()) ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '35px',
            width: '35px',
            transition: 'all 0.2s'
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default GlobalAiChat;
