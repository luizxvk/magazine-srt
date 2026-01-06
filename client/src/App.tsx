
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import ModernLogin from './pages/ModernLogin';
import Register from './pages/Register';
import RequestInvite from './pages/RequestInvite';
import FeedPage from './pages/FeedPage';
import PostPage from './pages/PostPage';
import ProfilePage from './pages/ProfilePage';
import SocialPage from './pages/SocialPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminDashboard from './pages/AdminDashboard';
import MgtLogPage from './pages/MgtLogPage';
import PhotoCatalogPage from './pages/PhotoCatalogPage';
import HighlightsPage from './pages/HighlightsPage';
import DevToolsPage from './pages/admin/DevToolsPage';
import AdminEditMgtLogPage from './pages/admin/AdminEditMgtLogPage';
import { logger } from './utils/logger';
import AchievementPopup from './components/AchievementPopup';
import MessagePopup from './components/MessagePopup';
import DevBanner from './components/DevBanner';
import ZionsPurchaseModal from './components/ZionsPurchaseModal';
import WhatsNewModal from './components/WhatsNewModal';
import SessionExpiredModal from './components/SessionExpiredModal';



// Initialize Logger
logger.init();

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ModernLogin />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/request-invite" element={<RequestInvite />} />

          {/* Protected Routes */}
          <Route path="/feed" element={<PrivateRoute><FeedPage /></PrivateRoute>} />
          <Route path="/post/:id" element={<PrivateRoute><PostPage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/social" element={<PrivateRoute><SocialPage /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
          <Route path="/mgt-log" element={<PrivateRoute><MgtLogPage /></PrivateRoute>} />

          <Route path="/catalog" element={<PrivateRoute><PhotoCatalogPage /></PrivateRoute>} />
          <Route path="/highlights" element={<PrivateRoute><HighlightsPage /></PrivateRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/devtools" element={<AdminRoute><DevToolsPage /></AdminRoute>} />
          <Route path="/admin/edit-mgt-log" element={<AdminRoute><AdminEditMgtLogPage /></AdminRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <AchievementWrapper />
        <ZionsModalWrapper />
        <SessionExpiredWrapper />
        <WhatsNewModal />
        <MessagePopup />
        <DevBanner />
      </Router>
    </AuthProvider>
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

export default App;
