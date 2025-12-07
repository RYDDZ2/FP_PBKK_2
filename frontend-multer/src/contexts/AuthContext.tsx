// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
    username: string;
    email?: string; 
}

// FIX: Mendefinisikan AuthContextType yang BENAR
export interface AuthContextType {
    accessToken: string | null;
    user: User | null;
    isAuthReady: boolean; // State untuk kesiapan auth
    login: (token: string, userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false); 

    useEffect(() => {
        // Logika untuk memuat token awal (dapat dibiarkan kosong atau diisi dengan logika LocalStorage)
        const loadInitialAuth = () => {
            setIsAuthReady(true);
        };
        loadInitialAuth();
    }, []);

    const login = (token: string, userData: User) => {
        setAccessToken(token);
        setUser(userData);
        // Simpan token ke LocalStorage/Cookie di sini
    };

    const logout = () => {
        setAccessToken(null);
        setUser(null);
        // Hapus token dari LocalStorage/Cookie di sini
    };
    
    const value: AuthContextType = {
        accessToken,
        user,
        isAuthReady,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};