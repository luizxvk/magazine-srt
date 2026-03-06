import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileUp, 
  Phone, 
  Trophy, 
  Award, 
  MessageSquare, 
  Users, 
  Image,
  MoreHorizontal,
  TrendingUp,
  Sparkles,
  Swords,
  Gift
} from 'lucide-react';
import api from '../../services/api';

interface Activity {
  id: string;
  type: 'FILE_SHARED' | 'CALL_STARTED' | 'LEVEL_UP' | 'ACHIEVEMENT' | 'MESSAGE' | 'GROUP_JOINED' | 'BADGE_EARNED' | 'POST_CREATED' | 'PRESTIGE' | 'TOURNAMENT_POSTED' | 'REWARD_CLAIMED';
  userId: string;
  userName: string;
  userDisplayName?: string;
  userAvatarUrl?: string;
  targetName?: string;  // e.g., group name, file name, achievement name
  targetId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface ConnectRecentActivityProps {
  accentColor: string;
  onUserClick?: (userId: string) => void;
}

// Activity type icons and colors
const activityConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  FILE_SHARED: { icon: FileUp, color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.2)', label: 'compartilhou um arquivo' },
  CALL_STARTED: { icon: Phone, color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.2)', label: 'iniciou uma chamada' },
  LEVEL_UP: { icon: TrendingUp, color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.2)', label: 'subiu de nível' },
  ACHIEVEMENT: { icon: Award, color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.2)', label: 'desbloqueou uma conquista' },
  MESSAGE: { icon: MessageSquare, color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.2)', label: 'enviou uma mensagem' },
  GROUP_JOINED: { icon: Users, color: '#14b8a6', bgColor: 'rgba(20, 184, 166, 0.2)', label: 'entrou no grupo' },
  BADGE_EARNED: { icon: Trophy, color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.2)', label: 'ganhou uma badge' },
  POST_CREATED: { icon: Image, color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.2)', label: 'criou um post' },
  PRESTIGE: { icon: Sparkles, color: '#d4af37', bgColor: 'rgba(212, 175, 55, 0.2)', label: 'completou um prestígio' },
  TOURNAMENT_POSTED: { icon: Swords, color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.2)', label: 'criou um torneio' },
  REWARD_CLAIMED: { icon: Gift, color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.2)', label: 'resgatou uma recompensa' },
};

export const ConnectRecentActivity: React.FC<ConnectRecentActivityProps> = ({
  accentColor,
  onUserClick,
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await api.get('/connect/activities');
      // Transform server response to component's expected format
      const serverActivities = response.data.activities || [];
      const transformed: Activity[] = serverActivities.map((a: any) => ({
        id: a.id,
        type: a.type,
        userId: a.user?.id || '',
        userName: a.user?.name || '',
        userDisplayName: a.user?.displayName,
        userAvatarUrl: a.user?.avatarUrl,
        targetName: a.metadata?.badgeName || a.metadata?.achievementName || a.metadata?.title || a.metadata?.rewardTitle || a.metadata?.preview,
        metadata: a.metadata,
        createdAt: a.createdAt,
      }));
      setActivities(transformed.length > 0 ? transformed : getMockActivities());
    } catch (error) {
      console.error('Error fetching activities:', error);
      // Fall back to mock activities for now
      setActivities(getMockActivities());
    } finally {
      setLoading(false);
    }
  };

  const getMockActivities = (): Activity[] => [
    {
      id: '1',
      type: 'FILE_SHARED',
      userId: '1',
      userName: 'Alex Rivers',
      userAvatarUrl: undefined,
      targetName: 'Design System',
      createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      type: 'CALL_STARTED',
      userId: '2',
      userName: 'Sarah Jenkins',
      userAvatarUrl: undefined,
      targetName: 'Marketing Team',
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
  ];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  const renderActivityText = (activity: Activity) => {
    const config = activityConfig[activity.type] || activityConfig.MESSAGE;
    const displayName = activity.userDisplayName || activity.userName;
    
    switch (activity.type) {
      case 'FILE_SHARED':
        return (
          <>
            <span className="font-bold text-[#F1F5F9]">{displayName}</span>
            <span className="text-[#F1F5F9]"> compartilhou um arquivo em </span>
            <span className="text-blue-400">{activity.targetName}</span>
          </>
        );
      case 'CALL_STARTED':
        return (
          <>
            <span className="font-bold text-[#F1F5F9]">{displayName}</span>
            <span className="text-[#F1F5F9]"> iniciou uma chamada com </span>
            <span className="text-green-400">{activity.targetName}</span>
          </>
        );
      case 'LEVEL_UP':
        return (
          <>
            <span className="font-bold text-[#F1F5F9]">{displayName}</span>
            <span className="text-[#F1F5F9]"> subiu para o </span>
            <span className="text-amber-400">Nível {activity.metadata?.level || '?'}</span>
          </>
        );
      case 'ACHIEVEMENT':
        return (
          <>
            <span className="font-bold text-[#F1F5F9]">{displayName}</span>
            <span className="text-[#F1F5F9]"> desbloqueou </span>
            <span className="text-purple-400">{activity.targetName}</span>
          </>
        );
      case 'BADGE_EARNED':
        return (
          <>
            <span className="font-bold text-[#F1F5F9]">{displayName}</span>
            <span className="text-[#F1F5F9]"> ganhou a badge </span>
            <span className="text-orange-400">{activity.targetName}</span>
          </>
        );
      case 'GROUP_JOINED':
        return (
          <>
            <span className="font-bold text-[#F1F5F9]">{displayName}</span>
            <span className="text-[#F1F5F9]"> entrou no grupo </span>
            <span className="text-teal-400">{activity.targetName}</span>
          </>
        );
      case 'POST_CREATED':
        return (
          <>
            <span className="font-bold text-[#F1F5F9]">{displayName}</span>
            <span className="text-[#F1F5F9]"> criou um novo post</span>
          </>
        );
      case 'PRESTIGE':
        return (
          <>
            <span className="font-bold text-[#F1F5F9]">{displayName}</span>
            <span className="text-[#F1F5F9]"> alcançou </span>
            <span className="text-yellow-400">Prestígio {activity.metadata?.prestigeLevel || '?'}</span>
          </>
        );
      case 'TOURNAMENT_POSTED':
        return (
          <>
            <span className="font-bold text-[#F1F5F9]">{displayName}</span>
            <span className="text-[#F1F5F9]"> criou o torneio </span>
            <span className="text-red-400">{activity.metadata?.title || 'Novo Torneio'}</span>
            {(activity.metadata?.prizePool ?? 0) > 0 && (
              <span className="text-green-400"> ({activity.metadata?.prizePool} Zions)</span>
            )}
          </>
        );
      case 'REWARD_CLAIMED':
        return (
          <>
            <span className="font-bold text-[#F1F5F9]">{displayName}</span>
            <span className="text-[#F1F5F9]"> resgatou </span>
            <span className="text-green-400">{activity.metadata?.rewardTitle || 'uma recompensa exclusiva'}</span>
          </>
        );
      default:
        return (
          <>
            <span className="font-bold text-[#F1F5F9]">{displayName}</span>
            <span className="text-[#F1F5F9]"> {config.label}</span>
          </>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white/[0.03] backdrop-blur-[12px] rounded-[22px] border border-white/10 p-4 font-grotesk">
        <h3 className="text-[#F1F5F9] font-bold text-xl mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/10 rounded w-3/4" />
                <div className="h-2 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] backdrop-blur-[12px] rounded-[22px] border border-white/10 overflow-hidden font-grotesk">
      {/* Header */}
      <div className="px-4 py-3">
        <h3 className="text-[#F1F5F9] font-bold text-xl">Recent Activity</h3>
      </div>

      {/* Activities List */}
      <div className="divide-y divide-white/5">
        <AnimatePresence>
          {activities.length === 0 ? (
            <div className="p-6 text-center text-[#64748B]">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma atividade recente</p>
            </div>
          ) : (
            activities.slice(0, 5).map((activity, index) => {
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 px-4 py-4 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  onClick={() => onUserClick?.(activity.userId)}
                >
                  {/* User Avatar */}
                  <div className="relative flex-shrink-0">
                    {activity.userAvatarUrl ? (
                      <img
                        src={activity.userAvatarUrl}
                        alt={activity.userName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}80)` }}
                      >
                        {(activity.userDisplayName || activity.userName).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold leading-relaxed">
                      {renderActivityText(activity)}
                    </p>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {formatTime(activity.createdAt)}
                    </p>
                  </div>

                  {/* More Options */}
                  <button className="p-2 rounded-lg text-[#64748B] hover:text-[#F1F5F9] hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ConnectRecentActivity;
