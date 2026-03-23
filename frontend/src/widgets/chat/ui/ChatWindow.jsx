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
        <div className={`flex flex-col h-full ${userRole === 'admin' ? "bg-transparent" : "bg-[#070514]"}`}>
            {userRole !== 'admin' && (
                <header className="bg-[#0d0a20] border-b border-purple-900/30 px-6 py-4 shadow-[0_4px_30px_rgba(139,92,246,0.05)]">
                    <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-wide">Agente Inteligente 🤖</h1>
                </header>
            )}

            <div className={`flex-1 overflow-y-auto w-full ${userRole === 'admin' ? "p-4 sm:px-8 sm:pt-8" : "p-4 sm:p-6"}`}>
                <div className={`space-y-4 ${userRole === 'admin' ? "max-w-5xl mx-auto pb-4" : ""}`}>
                    {messages.length === 1 && userRole === 'admin' && (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-center fade-in duration-500">
                            <div className="bg-[#120e2b] p-6 rounded-full shadow-[0_0_30px_rgba(139,92,246,0.15)] mb-6 border border-purple-800/30 group hover:scale-105 transition-transform duration-500">
                                <div className="text-5xl group-hover:-translate-y-1 transition-transform">🤖</div>
                            </div>
                            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-purple-400 mb-2 mt-4 max-w-lg mx-auto drop-shadow-sm">Hola, Admin</h2>
                            <h3 className="text-xl text-indigo-200/60 max-w-md mx-auto font-light">¿Qué métricas o datos vamos a explorar hoy en la matriz?</h3>
                        </div>
                    )}
                    
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))}

                    {isLoading && (
                        <div className="flex items-center space-x-2 text-purple-300 text-sm ml-4 mb-4">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                            <span className="font-medium ml-2">Sintetizando respuesta en la base de datos neuronal...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <ChatInput onSend={handleSend} disabled={isLoading} isFloating={userRole === 'admin'} />
        </div>
    );
};
