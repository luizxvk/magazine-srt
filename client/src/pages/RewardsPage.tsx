import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Rewards from '../components/Rewards';

export default function RewardsPage() {
    const { user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

    return (
        <div className="min-h-screen bg-off-black">
            <Header />
            
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Page Title */}
                <div className="mb-8">
                    <h1 className={`text-4xl font-serif mb-2 ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`}>
                        🎁 Recompensas
                    </h1>
                    <p className="text-gray-400">
                        Resgate prêmios exclusivos com seus Troféus
                    </p>
                </div>

                {/* Rewards Component */}
                <Rewards />
            </div>
        </div>
    );
}
