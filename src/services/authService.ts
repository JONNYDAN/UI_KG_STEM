import api from './api';

export const loginAPI = async (data: { username: string; password: string }) => {
    try {
        const response = await api.post('/auth/login', data);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

export const registerAPI = async (data: {
    username: string;
    password: string;
    name?: string;
    role?: string;
    group?: string[];
}) => {
    try {
        const response = await api.post('/auth/register', data);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

export const getProfile = async (token: string) => {
    try {
        const response = await api.get('/auth/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

export const verifyToken = async (token: string) => {
    try {
        const response = await api.get('/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error;
    }
};
