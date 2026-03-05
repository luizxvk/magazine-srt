import React from 'react';
import { motion } from 'framer-motion';
import { Home, Phone, Users, Share2 } from 'lucide-react';

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'calls', icon: Phone, label: 'Chamadas' },
  { id: 'groups', icon: Users, label: 'Grupos' },
  { id: 'social', icon: Share2, label: 'Social' },
];

interface ConnectSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  accentColor: string;
  logoUrl?: string;
}

export const ConnectSidebar: React.FC<ConnectSidebarProps> = ({
  activeTab,
  onTabChange,
  accentColor,
  logoUrl,
}) => {
  return (
    <div className="hidden md:flex flex-col items-center w-16 h-full bg-black/40 backdrop-blur-sm border-r border-white/10 py-4">
      {/* Logo */}
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-6 overflow-hidden">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
        ) : (
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}80)` }}
          >
            R
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col items-center gap-2 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 group ${
                isActive 
                  ? 'bg-white/10 text-white' 
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 w-1 h-6 rounded-r-full"
                  style={{ backgroundColor: accentColor }}
                />
              )}
              
              <Icon className="w-5 h-5" />
              
              {/* Tooltip */}
              <div className="absolute left-full ml-3 px-2 py-1 bg-black/90 rounded-md text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {item.label}
              </div>
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
};

export default ConnectSidebar;
