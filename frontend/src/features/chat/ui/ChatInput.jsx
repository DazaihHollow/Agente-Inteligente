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
        <form onSubmit={handleSubmit} className={isFloating ? "p-6 pb-10 bg-transparent" : "border-t border-gray-200 p-4 bg-white"}>
            <div className={`relative flex items-center ${isFloating ? "max-w-4xl mx-auto bg-white rounded-full shadow-lg border border-gray-100" : "w-full"}`}>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Escribe tu pregunta sobre el negocio..."
                    disabled={disabled}
                    className={`w-full py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all ${
                        isFloating ? "bg-transparent rounded-full border-none" : "bg-gray-50 border border-gray-200 rounded-full focus:border-transparent"
                    }`}
                />
                <button
                    type="submit"
                    disabled={!text.trim() || disabled}
                    className="absolute right-3 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
                >
                    <SendHorizontal size={20} />
                </button>
            </div>
        </form>
    );
};
