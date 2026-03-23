import { SendHorizontal } from 'lucide-react';
import { useState } from 'react';

/**
 * Component for typing and sending chat messages.
 * @param {Object} props
 * @param {function(string): void} props.onSend
 * @param {boolean} props.disabled
 */
export const ChatInput = ({ onSend, disabled, isFloating = false }) => {
    const [text, setText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim() && !disabled) {
            onSend(text);
            setText('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className={isFloating ? "p-6 pb-10 bg-transparent" : "border-t border-purple-900/30 p-4 bg-[#0d0a20]"}>
            <div className={`relative flex items-center ${isFloating ? "max-w-4xl mx-auto bg-[#120e2b] rounded-full shadow-[0_4px_30px_rgba(139,92,246,0.15)] border border-purple-800/50 text-white" : "w-full"}`}>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Escribe tu pregunta sobre el negocio..."
                    disabled={disabled}
                    className={`w-full py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 transition-all ${
                        isFloating ? "bg-transparent rounded-full border-none placeholder-purple-900/50 text-white" : "bg-[#120e2b] border border-purple-800/30 rounded-full focus:border-transparent text-white placeholder-purple-900/50"
                    }`}
                />
                <button
                    type="submit"
                    disabled={!text.trim() || disabled}
                    className="absolute right-3 p-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-900/50 border border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                    <SendHorizontal size={20} />
                </button>
            </div>
        </form>
    );
};
