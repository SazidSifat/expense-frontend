import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = Cookies.get('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            Cookies.remove('token');
            if (typeof window !== 'undefined') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

// Auth
export const login = (email: string, password: string) =>
    api.post('/auth/login', { email, password });

export const getMe = () => api.get('/auth/me');

export const getUsers = () => api.get('/auth/users');

export const updateProfile = (data: { name?: string; profileImage?: string }) =>
    api.put('/auth/profile', data);

// Expenses
export const getExpenses = (params?: { month?: number; year?: number; category?: string }) =>
    api.get('/expenses', { params });

export const createExpense = (data: {
    date: string;
    amount: number;
    category: string;
    reason: string;
    givers: { user: string; amount: number }[];
    takers: { user: string; amount: number }[];
}) => api.post('/expenses', data);

export const updateExpense = (id: string, data: {
    date: string;
    amount: number;
    category: string;
    reason: string;
    givers: { user: string; amount: number }[];
    takers: { user: string; amount: number }[];
}) => api.put(`/expenses/${id}`, data);

export const deleteExpense = (id: string) => api.delete(`/expenses/${id}`);

// Analytics
export const getSummary = (params?: { month?: number; year?: number }) =>
    api.get('/analytics/summary', { params });

export const getExpensesByUser = (params?: { month?: number; year?: number }) =>
    api.get('/analytics/by-user', { params });

export const getExpensesByCategory = (params?: { month?: number; year?: number }) =>
    api.get('/analytics/by-category', { params });

// Dues
export const getDues = (params?: { month?: number; year?: number }) =>
    api.get('/dues', { params });

export const getUserStats = (params?: { month?: number; year?: number }) =>
    api.get('/dues/stats', { params });

export const settleDues = (data: { fromUser: string; toUser: string; amount: number; month?: number; year?: number; note?: string }) =>
    api.post('/dues/settle', data);

export const getSettlements = (params?: { month?: number; year?: number }) =>
    api.get('/dues/settlements', { params });

export const deleteSettlement = (id: string) =>
    api.delete(`/dues/settlements/${id}`);

export const deleteSettlementHistory = () =>
    api.delete('/dues/settlements/history');

export const clearDatabase = () =>
    api.post('/dues/clear-database');

export const rolloverBalances = (data: { month: number; year: number }) =>
    api.post('/dues/rollover', data);

export const resetBalances = (params?: { month?: number; year?: number }) =>
    api.delete('/dues/reset', { params });

// Import/Export
export const importExcel = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/import/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const exportExcel = (params?: { month?: number; year?: number }) =>
    api.get('/export/excel', { params, responseType: 'blob' });

export const exportCSV = (params?: { month?: number; year?: number; type?: string }) =>
    api.get('/export/csv', { params, responseType: 'blob' });

// Logs
export const getActivityLogs = () => api.get('/logs');

export default api;
