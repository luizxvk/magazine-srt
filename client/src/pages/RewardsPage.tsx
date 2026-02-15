import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Rewards from '../components/Rewards';

export default function RewardsPage() {
    const { user, theme } = useAuth();
    const { t } = useTranslation('common');
    const isMGT = user?.membershipType === 'MGT';

    const themeBg = theme === 'light' ? 'bg-gray-50' : 'bg-off-black';
    const themeSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';

    return (
        <div className={`min-h-screen ${themeBg}`}>
            <Header />
            
            <div className="max-w-7xl mx-auto px-4 pt-32 pb-8">
                {/* Page Title */}
                <div className="mb-8">
                    <h1 className={`text-4xl font-serif mb-2 ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`}>
                        🎁 {t('rewards.title')}
                    </h1>
                    <p className={themeSecondary}>
                        {t('rewards.subtitle')}
                    </p>
                </div>

                {/* Rewards Component */}
                <Rewards />
            </div>
        </div>
    );
}
