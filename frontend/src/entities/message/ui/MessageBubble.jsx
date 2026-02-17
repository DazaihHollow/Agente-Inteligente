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
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Bot className="h-6 w-6 text-indigo-600" />
                </div>
            )}

            <div className={clsx(
                "relative px-4 py-2 rounded-lg text-sm shadow",
                isUser ? "bg-indigo-600 text-white" : "bg-white border border-gray-100"
            )}>
                <p className="whitespace-pre-wrap">{message.text}</p>

                {/* Sources section for agent messages */}
                {!isUser && message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
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
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-500" />
                </div>
            )}
        </div>
    );
};
