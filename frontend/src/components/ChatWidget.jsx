import { useState } from 'react';
import { ChatWindow } from '../widgets/chat/ui/ChatWindow';
import './ChatWidget.css'; // We'll create this for styling

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="chat-widget-container">
            {isOpen && (
                <div className="chat-window-wrapper">
                    <ChatWindow />
                </div>
            )}
            <button className="chat-bubble-button" onClick={toggleChat}>
                {isOpen ? '✕' : '💬'}
            </button>
        </div>
    );
};

export default ChatWidget;
