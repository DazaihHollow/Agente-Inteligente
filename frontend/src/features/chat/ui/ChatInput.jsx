import { SendHorizontal } from 'lucide-react';
import { useState } from 'react';

/**
 * Component for typing and sending chat messages.
 * @param {Object} props
 * @param {function(string): void} props.onSend
 * @param {boolean} props.disabled
 */
export const ChatInput = ({ onSend, disabled }) => {
    const [text, setText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim() && !disabled) {
            onSend(text);
            setText('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 bg-white">
            <div className="relative flex items-center max-w-3xl mx-auto">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Escribe tu pregunta sobre el negocio..."
                    disabled={disabled}
                    className="w-full py-3 pl-4 pr-12 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={!text.trim() || disabled}
                    className="absolute right-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <SendHorizontal size={20} />
                </button>
            </div>
        </form>
    );
};
