import React from 'react';
import { motion } from 'framer-motion';
import { Home, Phone, Users, Share2, Settings } from 'lucide-react';

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'home', icon: Home, label: 'HOME' },
  { id: 'calls', icon: Phone, label: 'CALLS' },
  { id: 'groups', icon: Users, label: 'GRUPOS' },
  { id: 'social', icon: Share2, label: 'SOCIAL' },
];

interface ConnectSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  accentColor: string;
  logoUrl?: string;
  onSettingsClick?: () => void;
}

export const ConnectSidebar: React.FC<ConnectSidebarProps> = ({
  activeTab,
  onTabChange,
  accentColor,
  logoUrl,
  onSettingsClick,
}) => {
  return (
    <div className="hidden md:flex flex-col items-center py-4 px-2 h-full">
      {/* Glassmorphic Card Container */}
      <div className="w-[72px] flex flex-col items-center gap-8 py-8 bg-white/[0.03] border border-white/10 backdrop-blur-[12px] rounded-[22px] font-grotesk">
        {/* Logo */}
        <div className="w-[72px] h-[72px] flex items-center justify-center">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
          ) : (
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ 
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}80)`,
                boxShadow: `0 0 20px ${accentColor}40`
              }}
            >
              <span className="text-white font-bold text-lg">R</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-col items-center gap-8 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="flex flex-col items-center gap-1 group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Icon */}
                <div
                  className={`w-6 h-6 flex items-center justify-center transition-colors ${
                    isActive ? '' : 'opacity-60 group-hover:opacity-100'
                  }`}
                  style={{ color: isActive ? accentColor : '#94A3B8' }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                
                {/* Label */}
                <span 
                  className={`text-[10px] font-medium tracking-[0.1em] transition-colors ${
                    isActive ? '' : 'opacity-60 group-hover:opacity-100'
                  }`}
                  style={{ color: isActive ? accentColor : '#94A3B8' }}
                >
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </nav>

        {/* Settings at bottom */}
        <div className="mt-auto">
          <motion.button
            onClick={onSettingsClick}
            className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings className="w-5 h-5 text-[#94A3B8]" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ConnectSidebar;
