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
        <div className={`flex flex-col h-full ${userRole === 'admin' ? "bg-transparent" : "bg-gray-50"}`}>
            {userRole !== 'admin' && (
                <header className="bg-white border-b border-gray-200 px-6 py-4">
                    <h1 className="text-xl font-bold text-gray-800">Agente Inteligente 🤖</h1>
                </header>
            )}

            <div className={`flex-1 overflow-y-auto w-full ${userRole === 'admin' ? "p-4 sm:px-8 sm:pt-8" : "p-4 sm:p-6"}`}>
                <div className={`space-y-4 ${userRole === 'admin' ? "max-w-5xl mx-auto pb-4" : ""}`}>
                    {messages.length === 1 && userRole === 'admin' && (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-center fade-in duration-500">
                            <div className="bg-white p-4 rounded-full shadow-sm mb-6 border border-gray-100">
                                <div className="text-4xl">🤖</div>
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-900 mb-2 mt-4 max-w-lg mx-auto">Hola, Admin</h2>
                            <h3 className="text-xl text-gray-500 max-w-md mx-auto">¿Qué métricas o datos vamos a consultar hoy?</h3>
                        </div>
                    )}
                    
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))}

                    {isLoading && (
                        <div className="flex items-center space-x-2 text-gray-500 text-sm ml-4">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100" />
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200" />
                            <span>Consultando base de datos...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <ChatInput onSend={handleSend} disabled={isLoading} isFloating={userRole === 'admin'} />
        </div>
    );
};
