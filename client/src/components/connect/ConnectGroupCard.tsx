import React from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { getProfileBorderGradient } from '../../utils/profileBorderUtils';

interface GroupMember {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    displayName?: string;
    avatarUrl?: string;
    isOnline?: boolean;
    equippedProfileBorder?: string | null;
    membershipType?: string;
  };
}

interface ConnectGroupCardProps {
  id: string;
  name: string;
  avatarUrl?: string;
  bannerUrl?: string;
  members: GroupMember[];
  onlineCount: number;
  onClick: () => void;
  accentColor: string;
  isActive?: boolean;
  isMGT?: boolean;
}

export const ConnectGroupCard: React.FC<ConnectGroupCardProps> = ({
  id: _id,
  name,
  avatarUrl,
  bannerUrl,
  members,
  onlineCount,
  onClick,
  accentColor,
  isActive,
  isMGT: _isMGT,
}) => {
  // Get up to 3 online members to show avatars
  const onlineMembers = members
    .filter(m => m.user.isOnline)
    .slice(0, 3);

  return (
    <motion.div
      onClick={onClick}
      className={`relative rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 ${
        isActive 
          ? 'ring-2 ring-offset-2 ring-offset-black/50' 
          : 'hover:ring-1 hover:ring-white/20'
      }`}
      style={{ 
        borderColor: isActive ? accentColor : undefined,
      }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Banner Image */}
      <div className="relative aspect-[16/10] bg-gradient-to-br from-gray-800 to-gray-900">
        {bannerUrl ? (
          <img 
            src={bannerUrl} 
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ 
              background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)` 
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-16 h-16 rounded-2xl object-cover opacity-60" />
            ) : (
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white/50"
                style={{ backgroundColor: `${accentColor}40` }}
              >
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Group Icon (top-right on banner) */}
        <div className="absolute top-3 right-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shadow-lg"
            style={{ backgroundColor: `${accentColor}` }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-sm">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
        <div className="flex-1 min-w-0">
          {/* Group Name */}
          <h3 className="text-white font-semibold text-sm truncate mb-1">
            {name.toUpperCase()}
          </h3>
          
          {/* Online Count */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-gray-400">
              {onlineCount} online
            </span>
          </div>
        </div>

        {/* Member Avatars (3 stacked) */}
        <div className="flex items-center -space-x-2">
          {onlineMembers.length > 0 ? (
            onlineMembers.map((member, index) => (
              <div 
                key={member.id}
                className="w-7 h-7 rounded-full border-2 border-black/50 overflow-hidden"
                style={{ 
                  zIndex: 3 - index,
                  background: getProfileBorderGradient(
                    member.user.equippedProfileBorder, 
                    member.user.membershipType === 'MGT'
                  )
                }}
              >
                <div className="w-full h-full rounded-full overflow-hidden p-0.5">
                  <div className="w-full h-full rounded-full overflow-hidden bg-black/50">
                    {member.user.avatarUrl ? (
                      <img 
                        src={member.user.avatarUrl} 
                        alt={member.user.displayName || member.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: accentColor }}
                      >
                        {(member.user.displayName || member.user.name).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Fallback if no online members
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="w-4 h-4" />
              <span>{members.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover glow effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ 
          background: `radial-gradient(circle at center, ${accentColor}15 0%, transparent 70%)` 
        }}
      />
    </motion.div>
  );
};

export default ConnectGroupCard;
