import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import LuxuriousBackground from '../components/LuxuriousBackground';
import { useAuth } from '../context/AuthContext';

export default function PostDeletedPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isSRT = user?.membershipType === 'SRT';

    const themeText = isSRT ? 'text-red-400' : 'text-gold-400';
    const themeButton = isSRT ? 'bg-red-600 hover:bg-red-500' : 'bg-gold-500 hover:bg-gold-400';

    return (
        <div className="min-h-screen text-white font-sans selection:bg-gold-500/30 relative">
            <LuxuriousBackground />
            <Header />

            <main className="pt-48 pb-20 px-4 max-w-2xl mx-auto relative z-10 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-md max-w-md w-full animate-fade-in">
                    <div className={`w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6`}>
                        <AlertCircle className={`w-8 h-8 ${themeText}`} />
                    </div>

                    <h1 className="text-2xl font-serif font-bold mb-4">Postagem Indisponível</h1>
                    <p className="text-gray-400 mb-8">
                        Essa postagem foi excluída ou removida pelo administrador.
                    </p>

                    <button
                        onClick={() => navigate('/feed')}
                        className={`px-6 py-3 rounded-lg font-bold text-black uppercase tracking-wider transition-all transform hover:scale-105 ${themeButton}`}
                    >
                        Voltar para o Feed
                    </button>
                </div>
            </main>
        </div>
    );
}
