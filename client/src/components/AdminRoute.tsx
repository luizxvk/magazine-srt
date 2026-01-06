
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ModernLoader from './ModernLoader';
import type { ReactNode } from 'react';

interface AdminRouteProps {
    children: ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
    const { user, loading } = useAuth();

    if (loading) {
        return <ModernLoader fullScreen />;
    }

    if (!user || user.role !== 'ADMIN') {
        console.log('AdminRoute Redirect:', { user, role: user?.role });
        return <Navigate to="/" replace />;
    }

    return children;
}
