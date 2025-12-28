
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
import SrtLogPage from './pages/SrtLogPage';
import DevToolsPage from './pages/admin/DevToolsPage';
import AdminEditSrtLogPage from './pages/admin/AdminEditSrtLogPage';
import { logger } from './utils/logger';
import AchievementPopup from './components/AchievementPopup';
import MessagePopup from './components/MessagePopup';



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
          <Route path="/srt-log" element={<PrivateRoute><SrtLogPage /></PrivateRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/devtools" element={<AdminRoute><DevToolsPage /></AdminRoute>} />
          <Route path="/admin/edit-srt-log" element={<AdminRoute><AdminEditSrtLogPage /></AdminRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <AchievementWrapper />
        <MessagePopup />
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

export default App;
