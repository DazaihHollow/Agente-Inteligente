import { api } from '../../../shared/api/axios';

/**
 * Sends a message to the chat backend.
 * @param {string} text - The message content.
 * @returns {Promise<Object>} The response from the agent.
 */
export const sendMessage = async (text) => {
    const response = await api.post('/chat', { message: text });
    return response.data;
};
