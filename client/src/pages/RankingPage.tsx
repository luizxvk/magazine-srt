import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import Header from '../components/Header';
import Ranking from '../components/Ranking';
import GradientText from '../components/GradientText';
import { useTranslation } from 'react-i18next';

export default function RankingPage() {
    const { user } = useAuth();
    const { isStdTier } = useCommunity();
    const { t } = useTranslation('gamification');
    const isMGT = user?.membershipType ? isStdTier(user.membershipType) : false;

    return (
        <div className="min-h-screen bg-off-black">
            <Header />
            
            <div className="max-w-7xl mx-auto px-4 pt-32 pb-8">
                {/* Page Title */}
                <div className="mb-8">
                    <GradientText as="h1" className="text-4xl font-serif mb-2" fallbackClassName={isMGT ? 'text-emerald-400' : 'text-gold-400'}>
                        🏆 {t('ranking.title')}
                    </GradientText>
                    <p className="text-gray-400">
                        {t('ranking.position', { position: '#' })}
                    </p>
                </div>

                {/* Ranking Component */}
                <Ranking />
            </div>
        </div>
    );
}
