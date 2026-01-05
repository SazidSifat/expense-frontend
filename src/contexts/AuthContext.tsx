'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { getMe, updateProfile as updateProfileApi } from '@/lib/api';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
    profileImage?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (data: Partial<User>) => void;
    updateProfileImage: (imageUrl: string) => Promise<void>;
    isLoading: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const savedToken = Cookies.get('token');
            if (savedToken) {
                try {
                    const response = await getMe();
                    setUser(response.data.data);
                    setToken(savedToken);
                } catch {
                    Cookies.remove('token');
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = (newToken: string, userData: User) => {
        Cookies.set('token', newToken, { expires: 7 });
        setToken(newToken);
        setUser(userData);
    };

    const logout = () => {
        Cookies.remove('token');
        setToken(null);
        setUser(null);
    };

    const updateUser = (data: Partial<User>) => {
        if (user) {
            setUser({ ...user, ...data });
        }
    };

    const updateProfileImage = async (imageUrl: string) => {
        try {
            const response = await updateProfileApi({ profileImage: imageUrl });
            if (response.data.success) {
                setUser(response.data.data);
            }
        } catch (error) {
            console.error('Failed to update profile image:', error);
            throw error;
        }
    };

    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, updateProfileImage, isLoading, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
