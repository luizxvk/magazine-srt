import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { useTierColors } from '../hooks/useTierColors';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LuxuriousBackground from '../components/LuxuriousBackground';
import FeedbackFormCard from '../components/FeedbackFormCard';

export default function FeedbackPage() {
    const navigate = useNavigate();
    const { user, accentColor } = useAuth();
    const { isStdTier } = useCommunity();
    const { getAccentColor } = useTierColors();

    const isMGT = user?.membershipType ? isStdTier(user.membershipType) : false;
    const defaultColor = getAccentColor(isMGT);
    const color = accentColor || defaultColor;

    return (
        <div className="min-h-screen">
            <LuxuriousBackground />
            <Header />

            <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 pb-24">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-xl hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: `${color}15`, color }}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <MessageSquare className="w-7 h-7" style={{ color }} />
                            Feedback
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            Sua opinião nos ajuda a melhorar! • Ganhe 50 Zions
                        </p>
                    </div>
                </div>

                {/* Use the correct FeedbackFormCard component */}
                <FeedbackFormCard onClose={() => navigate('/feed')} />
            </main>

            <Footer />
        </div>
    );
}
