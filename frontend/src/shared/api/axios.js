import axios from 'axios';

// Create an axios instance with a base URL
export const api = axios.create({
    baseURL: 'http://localhost:8000', // Our FastAPI backend URL
    headers: {
        'Content-Type': 'application/json',
    },
});
