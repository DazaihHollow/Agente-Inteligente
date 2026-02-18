import React from 'react';
import ReactDOM from 'react-dom/client';
import ChatWidget from './components/ChatWidget';
import './index.css'; // Import global styles (Tailwind)

// Function to initialize the widget
const initWidget = () => {
    // Create a div for the widget if it doesn't exist
    const widgetId = 'agente-inteligente-widget-container';
    let widgetContainer = document.getElementById(widgetId);

    if (!widgetContainer) {
        widgetContainer = document.createElement('div');
        widgetContainer.id = widgetId;
        document.body.appendChild(widgetContainer);
    }

    // Mount the React component
    const root = ReactDOM.createRoot(widgetContainer);
    root.render(
        <React.StrictMode>
            <ChatWidget />
        </React.StrictMode>
    );
};

// Auto-initialize when the script loads
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initWidget();
} else {
    window.addEventListener('DOMContentLoaded', initWidget);
}

// Expose init function globally just in case
window.initAgenteWidget = initWidget;
