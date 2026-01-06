import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ModernLoader from './ModernLoader';

export default function PrivateRoute({ children }: { children: React.ReactElement }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <ModernLoader text="Carregando..." fullScreen />;
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
}
