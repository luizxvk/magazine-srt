import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Ranking from '../components/Ranking';

export default function RankingPage() {
    const { user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

    return (
        <div className="min-h-screen bg-off-black">
            <Header />
            
            <div className="max-w-7xl mx-auto px-4 pt-32 pb-8">
                {/* Page Title */}
                <div className="mb-8">
                    <h1 className={`text-4xl font-serif mb-2 ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`}>
                        🏆 Ranking
                    </h1>
                    <p className="text-gray-400">
                        Classificação dos membros mais ativos e engajados
                    </p>
                </div>

                {/* Ranking Component */}
                <Ranking />
            </div>
        </div>
    );
}
