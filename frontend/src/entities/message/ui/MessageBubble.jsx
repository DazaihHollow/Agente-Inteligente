import { Bot, User } from 'lucide-react';
import clsx from 'clsx';

/**
 * Component to display a single chat message.
 * @param {Object} props
 * @param {import('../model/types').Message} props.message
 */
export const MessageBubble = ({ message }) => {
    const isUser = message.sender === 'user';

    return (
        <div className={clsx(
            "flex w-full mt-2 space-x-3 max-w-3xl",
            isUser ? "ml-auto justify-end" : ""
        )}>
            {!isUser && (
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-900/50 shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center justify-center border border-purple-500/30">
                    <Bot className="h-6 w-6 text-purple-300" />
                </div>
            )}

            <div className={clsx(
                "relative px-4 py-2 rounded-lg text-sm transition-all",
                isUser ? "bg-[#4C1D95] text-white shadow-lg shadow-purple-900/30 border border-purple-500/30" : "bg-[#1a153a] border border-purple-800/50 text-indigo-100 shadow-[0_4px_15px_rgba(0,0,0,0.1)]"
            )}>
                <p className="whitespace-pre-wrap">{message.text}</p>

                {/* Sources section for agent messages */}
                {!isUser && message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-purple-800/30 text-xs text-purple-300/60">
                        <span className="font-semibold">Fuentes:</span>
                        <ul className="list-disc list-inside mt-1">
                            {message.sources.map((source, idx) => (
                                <li key={idx}>{source}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {isUser && (
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#120e2b] border border-purple-800/30 flex items-center justify-center shadow-inner">
                    <User className="h-6 w-6 text-indigo-300" />
                </div>
            )}
        </div>
    );
};
