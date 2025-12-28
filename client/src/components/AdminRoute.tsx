
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AdminRouteProps {
    children: JSX.Element;
}

export default function AdminRoute({ children }: AdminRouteProps) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-gold-500">Carregando...</div>;
    }

    if (!user || user.role !== 'ADMIN') {
        console.log('AdminRoute Redirect:', { user, role: user?.role });
        return <Navigate to="/" replace />;
    }

    return children;
}
