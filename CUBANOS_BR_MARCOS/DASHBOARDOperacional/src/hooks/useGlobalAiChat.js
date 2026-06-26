import { useState } from 'react';

export const useGlobalAiChat = () => {
    const [isAiChatOpen, setIsAiChatOpen] = useState(false);
    const [aiChatMessages, setAiChatMessages] = useState([]);
    const [aiChatInput, setAiChatInput] = useState('');

    const toggleAiChat = () => {
        setIsAiChatOpen(!isAiChatOpen);
    };

    const closeAiChat = () => {
        setIsAiChatOpen(false);
    };

    const openAiChat = () => {
        setIsAiChatOpen(true);
    };

    return {
        isAiChatOpen,
        setIsAiChatOpen,
        aiChatMessages,
        setAiChatMessages,
        aiChatInput,
        setAiChatInput,
        toggleAiChat,
        closeAiChat,
        openAiChat
    };
};