import { useState } from 'react';
import { ChatWindow } from '../widgets/chat/ui/ChatWindow';
import './ChatWidget.css'; // We'll create this for styling

const ChatWidget = ({ adminMode = false }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="chat-widget-container">
            {isOpen && (
                <div className="chat-window-wrapper">
                    <ChatWindow userRole={adminMode ? 'admin' : 'customer'} />
                </div>
            )}
            <button className="chat-bubble-button" onClick={toggleChat}>
                {isOpen ? '✕' : (adminMode ? '🛠️' : '💬')}
            </button>
        </div>
    );
};

export { ChatWidget };
export default ChatWidget;
