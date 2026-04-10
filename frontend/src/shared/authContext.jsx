import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('epsilon_token');
        if (token) {
            setupAxiosInterceptor(token);
            fetchUserProfile();
        } else {
            setLoading(false);
        }
    }, []);

    const setupAxiosInterceptor = (token) => {
        axios.interceptors.request.use(
            config => {
                if(token && !config.headers.Authorization) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            error => Promise.reject(error)
        );
        
        axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    if (error.response.config.url.includes('/auth/login')) {
                        return Promise.reject(error);
                    }
                    if (error.response.status === 401) {
                        logout();
                    }
                }
                return Promise.reject(error);
            }
        );
    };

    const fetchUserProfile = async () => {
        try {
            const res = await axios.get('http://localhost:8000/auth/me');
            setUser(res.data);
        } catch (error) {
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const formData = new URLSearchParams();
        formData.append('username', email); // OAuth2 expects username
        formData.append('password', password);

        const res = await axios.post('http://localhost:8000/auth/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        const token = res.data.access_token;
        localStorage.setItem('epsilon_token', token);
        setupAxiosInterceptor(token);
        await fetchUserProfile();
        navigate('/admin');
    };

    const logout = () => {
        localStorage.removeItem('epsilon_token');
        setUser(null);
        delete axios.defaults.headers.common["Authorization"];
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
