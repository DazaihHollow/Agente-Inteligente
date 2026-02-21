import { useState, useEffect, useRef } from 'react';
import { MessageBubble } from '../../../entities/message/ui/MessageBubble';
import { ChatInput } from '../../../features/chat/ui/ChatInput';
import { sendMessage } from '../../../features/chat/api/chatApi';

export const ChatWindow = ({ userRole = 'customer' }) => {
    const [messages, setMessages] = useState([
        {
            id: 'welcome',
            text: '¡Hola! Soy tu asistente de negocio. Pregúntame sobre tus datos.',
            sender: 'agent',
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (text) => {
        // 1. Add user message
        const userMsg = {
            id: Date.now().toString(),
            text,
            sender: 'user',
        };
        setMessages((prev) => [...prev, userMsg]);
        setIsLoading(true);

        try {
            // 2. Call API
            const response = await sendMessage(text, userRole);

            // 3. Add agent response
            const agentMsg = {
                id: (Date.now() + 1).toString(),
                text: response.response,
                sender: 'agent',
                sources: response.sources
            };
            setMessages((prev) => [...prev, agentMsg]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMsg = {
                id: (Date.now() + 1).toString(),
                text: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
                sender: 'agent',
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <h1 className="text-xl font-bold text-gray-800">Agente Inteligente 🤖</h1>
            </header>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}

                {isLoading && (
                    <div className="flex items-center space-x-2 text-gray-500 text-sm ml-4">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200" />
                        <span>Escribiendo...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
    );
};
