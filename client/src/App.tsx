
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CommunityProvider } from './context/CommunityContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import ModernLogin from './pages/ModernLogin';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import RequestInvite from './pages/RequestInvite';
import FeedPage from './pages/FeedPage';
import PostPage from './pages/PostPage';
import ProfilePage from './pages/ProfilePage';
import SocialPage from './pages/SocialPage';
import NotificationsPage from './pages/NotificationsPage';
import RankingPage from './pages/RankingPage';
import RewardsPage from './pages/RewardsPage';
import HighlightsPage from './pages/HighlightsPage';
import RoadmapPage from './pages/RoadmapPage';
import SettingsPage from './pages/SettingsPage';
import VerificationPage from './pages/VerificationPage';
import AdminDashboard from './pages/AdminDashboard';
import GroupsPage from './pages/GroupsPage';
import GroupChatPage from './pages/GroupChatPage';
import MarketPage from './pages/MarketPage';
import PhotoCatalogPage from './pages/PhotoCatalogPage';
import ProductStore from './pages/ProductStore';
import ExplorePage from './pages/ExplorePage';
import ProductDetails from './pages/ProductDetails';
import FeedbackPage from './pages/FeedbackPage';
import DevToolsPage from './pages/admin/DevToolsPage';
import SuspendedPage from './pages/SuspendedPage';
import { logger } from './utils/logger';
import AchievementPopup from './components/AchievementPopup';
import Toast from './components/Toast';
import MessagePopup from './components/MessagePopup';
import DevBanner from './components/DevBanner';
import Footer from './components/Footer';
import BottomNavigation from './components/BottomNavigation';
import ZionsPurchaseModal from './components/ZionsPurchaseModal';
import OnboardingModals from './components/OnboardingModals';
import SessionExpiredModal from './components/SessionExpiredModal';
import { RadioProvider } from './context/RadioContext';
import MiniRadioPlayer from './components/MiniRadioPlayer';
import { EdgeNotificationContainer } from './components/EdgeNotification';
import VersionUpdateNotification from './components/VersionUpdateNotification';
import BetaRewardPopup from './components/BetaRewardPopup';
import BetaEndedOverlay from './components/BetaEndedOverlay';
import SupportButton from './components/SupportButton';



// Initialize Logger
logger.init();

// Wrapper component to redirect /profile/:id to /profile?id=:id
function ProfileRedirect() {
  const { id } = useParams();
  return <Navigate to={`/profile?id=${id}`} replace />;
}

function App() {
  return (
    <CommunityProvider>
      <AuthProvider>
        <RadioProvider>
        <Router>
          <Routes>
          <Route path="/" element={<ModernLogin />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/login/mgt" element={<ModernLogin />} />
          <Route path="/login/magazine" element={<ModernLogin />} />
          <Route path="/suspended" element={<SuspendedPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/request-invite" element={<RequestInvite />} />

          {/* Protected Routes */}
          <Route path="/feed" element={<PrivateRoute><FeedPage /></PrivateRoute>} />
          <Route path="/post/:id" element={<PrivateRoute><PostPage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/profile/:id" element={<PrivateRoute><ProfileRedirect /></PrivateRoute>} />
          <Route path="/social" element={<PrivateRoute><SocialPage /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
          <Route path="/ranking" element={<PrivateRoute><RankingPage /></PrivateRoute>} />
          <Route path="/explore" element={<PrivateRoute><ExplorePage /></PrivateRoute>} />
          <Route path="/rewards" element={<PrivateRoute><RewardsPage /></PrivateRoute>} />
          <Route path="/highlights" element={<PrivateRoute><HighlightsPage /></PrivateRoute>} />
          <Route path="/roadmap" element={<PrivateRoute><RoadmapPage /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
          <Route path="/verify-email" element={<PrivateRoute><VerificationPage /></PrivateRoute>} />
          {/* Grupos */}
          <Route path="/groups" element={<PrivateRoute><GroupsPage /></PrivateRoute>} />
          <Route path="/groups/:id" element={<PrivateRoute><GroupChatPage /></PrivateRoute>} />
          {/* Mercado */}
          <Route path="/market" element={<PrivateRoute><MarketPage /></PrivateRoute>} />
          {/* Loja de Produtos */}
          <Route path="/store" element={<PrivateRoute><ProductStore /></PrivateRoute>} />
          <Route path="/loja" element={<PrivateRoute><ProductStore /></PrivateRoute>} />
          <Route path="/loja/:id" element={<PrivateRoute><ProductDetails /></PrivateRoute>} />
          <Route path="/product/:id" element={<PrivateRoute><ProductDetails /></PrivateRoute>} />
          {/* Catálogo de Fotos */}
          <Route path="/catalog" element={<PrivateRoute><PhotoCatalogPage /></PrivateRoute>} />
          {/* Feedback */}
          <Route path="/feedback" element={<PrivateRoute><FeedbackPage /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/devtools" element={<AdminRoute><DevToolsPage /></AdminRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <AchievementWrapper />
        <ToastWrapper />
        <EdgeNotificationWrapper />
        <ZionsModalWrapper />
        <SessionExpiredWrapper />
        <OnboardingModals />
        <MessagePopupWrapper />
        <BottomNavigation />
        <MiniRadioPlayer />
        <Footer />
        <DevBanner />
        <VersionUpdateNotification />
        <BetaRewardWrapper />
        <BetaEndedOverlay />
        <SupportButtonWrapper />
      </Router>
    </RadioProvider>
    </AuthProvider>
    </CommunityProvider>
  );
}

function AchievementWrapper() {
  const { achievement, clearAchievement } = useAuth();

  if (!achievement) return null;

  return (
    <AchievementPopup
      title={achievement.title}
      description={achievement.description}
      onClose={clearAchievement}
    />
  );
}

function ToastWrapper() {
  const { toastData, clearToast } = useAuth();

  if (!toastData) return null;

  return (
    <Toast
      message={toastData.message}
      description={toastData.description}
      type={toastData.type}
      onClose={clearToast}
    />
  );
}

function EdgeNotificationWrapper() {
  const { edgeNotifications, closeEdgeNotification } = useAuth();

  return (
    <EdgeNotificationContainer
      notifications={edgeNotifications}
      onClose={closeEdgeNotification}
    />
  );
}

function ZionsModalWrapper() {
  const { isZionsModalOpen, closeZionsModal } = useAuth(); // @ts-ignore

  return (
    <ZionsPurchaseModal
      isOpen={isZionsModalOpen}
      onClose={closeZionsModal}
    />
  );
}

function SessionExpiredWrapper() {
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const handleSessionExpired = () => setIsExpired(true);
    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, []);

  const handleConfirm = () => {
    setIsExpired(false);
    window.location.href = '/login';
  };

  return <SessionExpiredModal isOpen={isExpired} onConfirm={handleConfirm} />;
}

function MessagePopupWrapper() {
  const { activeChatUserId } = useAuth();
  return <MessagePopup activeChatUserId={activeChatUserId} />;
}

function BetaRewardWrapper() {
  const { user } = useAuth();
  
  // Only show for logged in users
  if (!user) return null;
  
  return <BetaRewardPopup />;
}

function SupportButtonWrapper() {
  const { user } = useAuth();
  
  // Only show for logged in users
  if (!user) return null;
  
  return <SupportButton />;
}

export default App;
