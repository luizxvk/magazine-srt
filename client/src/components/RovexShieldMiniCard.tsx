import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Shield, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface ShieldData {
  status: string;
  uptime: number;
  services: Record<string, { status: string }>;
}

export default function RovexShieldMiniCard() {
  const { user, theme, accentColor } = useAuth();
  const [data, setData] = useState<ShieldData | null>(null);
  const [loading, setLoading] = useState(true);
  const isMGT = user?.membershipType === 'MGT';
  const themeBorder = isMGT ? 'border-emerald-500/30' : 'border-gold-500/30';
  const themeGlow = isMGT
    ? 'shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]'
    : 'shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:shadow-[0_0_25px_rgba(212,175,55,0.25)]';

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/statforge/shield/status');
        setData(res.data);
      } catch (error) {
        console.debug('[RovexShield] Status fetch failed');
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 120000); // Refresh every 2 min
    return () => clearInterval(interval);
  }, []);

  const isOnline = data?.status === 'online';
  const servicesCount = data?.services ? Object.keys(data.services).length : 0;
  const operationalCount = data?.services 
    ? Object.values(data.services).filter(s => s.status === 'operational').length 
    : 0;

  const cardBg = theme === 'light' 
    ? 'bg-white/90' 
    : 'bg-[#1c1c1e]/90';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl ${cardBg} ${themeBorder} ${themeGlow} p-4 transition-all duration-300`}
    >
      {/* Subtle gradient overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${accentColor || '#3b82f6'}, transparent 70%)`
        }}
      />

      <div className="relative flex items-center gap-3">
        {/* Shield Icon with status indicator */}
        <div className="relative">
          <div 
            className={`p-2.5 rounded-xl ${
              isOnline 
                ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20' 
                : 'bg-gradient-to-br from-red-500/20 to-orange-500/20'
            }`}
          >
            <Shield className={`w-5 h-5 ${isOnline ? 'text-blue-400' : 'text-red-400'}`} />
          </div>
          {/* Live indicator */}
          <div 
            className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${
              theme === 'light' ? 'border-white' : 'border-[#1c1c1e]'
            } ${
              isOnline 
                ? 'bg-green-400 animate-pulse shadow-[0_0_6px_rgba(74,222,128,0.6)]' 
                : 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]'
            }`}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              RovexShield
            </h4>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              isOnline 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          
          {loading ? (
            <div className="flex items-center gap-1.5 mt-1">
              <Activity className="w-3 h-3 text-gray-400 animate-pulse" />
              <span className="text-xs text-gray-400">Verificando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  {operationalCount}/{servicesCount} serviços
                </span>
              </div>
              {data?.uptime && (
                <div className="flex items-center gap-1">
                  <span className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                    {data.uptime.toFixed(1)}% uptime
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Icon */}
        {!loading && (
          <div className={`p-1.5 rounded-lg ${
            isOnline 
              ? theme === 'light' ? 'bg-green-100' : 'bg-green-500/10' 
              : theme === 'light' ? 'bg-red-100' : 'bg-red-500/10'
          }`}>
            {isOnline ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            )}
          </div>
        )}
      </div>

      {/* Marketing tagline */}
      <p className={`text-[10px] mt-2 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
        Segurança e infraestrutura sob controle. Hospedagem otimizada pela Rovex.
      </p>
    </motion.div>
  );
}
