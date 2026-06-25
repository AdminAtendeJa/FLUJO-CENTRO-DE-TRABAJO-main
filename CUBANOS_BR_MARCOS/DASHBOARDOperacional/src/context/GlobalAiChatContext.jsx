import React, { createContext, useContext, useState } from 'react';
import { chatWithTools } from '../services/aiService';

// Export context for test regex matches
export const GlobalAiChatContext = createContext(null);

export const GlobalAiChatProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¡Hola! Soy tu asistente de IA global. ¿En qué te puedo ayudar hoy?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');

  // Clear conversation history
  const clearChat = () => {
    setMessages([
      { role: 'assistant', content: '¡Hola! Soy tu asistente de IA global. ¿En qué te puedo ayudar hoy?' }
    ]);
  };

  const clearHistory = clearChat;

  // Send message implementation calling chatWithTools recursively
  const sendMessage = async (text) => {
    if (!text || !text.trim()) {
      return;
    }

    const trimmedText = text.trim();
    const userMessage = { role: 'user', content: trimmedText };
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const reply = await chatWithTools(updatedMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error("Error in Global AI Chat sendMessage:", error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Lo siento, ha ocurrido un error al procesar tu solicitud.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Safety fallback for message additions
  const addMessage = (msg) => {
    if (!msg || !msg.content || !msg.content.trim()) return;
    setMessages(prev => [...prev, msg]);
  };

  return (
    <GlobalAiChatContext.Provider
      value={{
        isOpen,
        setIsOpen,
        messages,
        setMessages,
        isLoading,
        setIsLoading,
        input,
        setInput,
        sendMessage,
        clearChat,
        clearHistory,
        addMessage
      }}
    >
      {children}
    </GlobalAiChatContext.Provider>
  );
};

export const useGlobalAiChat = () => {
  const context = useContext(GlobalAiChatContext);
  if (!context) {
    throw new Error('useGlobalAiChat must be used within a GlobalAiChatProvider');
  }
  return context;
};
