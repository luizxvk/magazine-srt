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
  
  const remainingOnline = Math.max(0, onlineCount - 3);

  return (
    <motion.div
      onClick={onClick}
      className={`relative rounded-[22px] overflow-hidden cursor-pointer group transition-all duration-300 font-grotesk bg-white/[0.03] border border-white/10 backdrop-blur-[12px] ${
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
      {/* Banner Image Container - with rounded corners inside */}
      <div className="relative mx-[21px] mt-[21px] rounded-[32px] overflow-hidden">
        <div className="relative aspect-[354/125] bg-gradient-to-br from-gray-800 to-gray-900">
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

          {/* Gradient overlay from bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Group Icon (bottom-left on banner) */}
          <div className="absolute bottom-3 left-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shadow-lg"
              style={{ backgroundColor: accentColor }}
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
      </div>

      {/* Info Section - Below Banner */}
      <div className="px-[21px] py-4">
        {/* Group Name */}
        <h3 className="text-[#F1F5F9] font-bold text-lg truncate mb-2" style={{ lineHeight: '1.56' }}>
          {name.toUpperCase()}
        </h3>
        
        {/* Bottom row: online count + member avatars */}
        <div className="flex items-center justify-between">
          {/* Online Count */}
          <span className="text-sm text-[#94A3B8]">
            {onlineCount} online
          </span>

          {/* Member Avatars (3 stacked with +N) */}
          <div className="flex items-center" style={{ gap: '-8px' }}>
            {onlineMembers.length > 0 ? (
              <>
                {onlineMembers.map((member, index) => (
                  <div 
                    key={member.id}
                    className="w-6 h-6 rounded-full overflow-hidden -ml-2 first:ml-0"
                    style={{ 
                      zIndex: 3 - index,
                      border: '2px solid #131022',
                      background: getProfileBorderGradient(
                        member.user.equippedProfileBorder, 
                        member.user.membershipType === 'MGT'
                      ) || '#334155'
                    }}
                  >
                    {member.user.avatarUrl ? (
                      <img 
                        src={member.user.avatarUrl} 
                        alt={member.user.displayName || member.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-[8px] font-bold text-[#F1F5F9]"
                        style={{ backgroundColor: '#334155' }}
                      >
                        {(member.user.displayName || member.user.name).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
                {remainingOnline > 0 && (
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center -ml-2 text-[8px] font-bold text-[#F1F5F9]"
                    style={{ 
                      zIndex: 0,
                      border: '2px solid #131022',
                      backgroundColor: '#64748B'
                    }}
                  >
                    +{remainingOnline}
                  </div>
                )}
              </>
            ) : (
              // Fallback if no online members
              <div className="flex items-center gap-1 text-xs text-[#94A3B8]">
                <Users className="w-4 h-4" />
                <span>{members.length}</span>
              </div>
            )}
          </div>
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
