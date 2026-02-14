import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, AlertTriangle, XCircle, Activity, RefreshCw, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface ShieldService {
  status: 'operational' | 'warning' | 'error';
  label: string;
  pending?: number;
}

interface ShieldData {
  status: string;
  services: Record<string, ShieldService>;
  stats: {
    totalLogs: number;
    blocked: number;
    flagged: number;
    last24h: number;
    pendingReports: number;
  };
  lastCheck: string;
  uptime: number;
}

export default function RovexShieldCard() {
  const { theme } = useAuth();
  const [data, setData] = useState<ShieldData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Refresh every 1 min
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/statforge/shield/status');
      setData(res.data);
    } catch (error) {
      console.error('[RovexShield] Error fetching status:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />;
      case 'error': return <XCircle className="w-3.5 h-3.5 text-red-400" />;
      default: return <Activity className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const cardBg = theme === 'light'
    ? 'bg-white/80 border-gray-200/60'
    : 'bg-white/[0.03] border-white/[0.08]';

  const serviceRowBg = theme === 'light'
    ? 'bg-gray-50/80'
    : 'bg-white/[0.03]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${cardBg} border backdrop-blur-2xl rounded-2xl p-6`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/10">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className={`font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              RovexShield
            </h3>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${data?.status === 'online' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className={`text-xs ${data?.status === 'online' ? 'text-green-400' : 'text-red-400'}`}>
                {data?.status === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={fetchStatus}
          disabled={refreshing}
          className={`p-2 rounded-lg ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/5'} transition-colors`}
        >
          <RefreshCw className={`w-4 h-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-10 ${serviceRowBg} rounded-xl animate-pulse`} />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Services Status */}
          <div className="space-y-2 mb-5">
            {Object.entries(data.services).map(([key, service]) => (
              <div key={key} className={`flex items-center justify-between px-3.5 py-2.5 ${serviceRowBg} rounded-xl`}>
                <span className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                  {service.label}
                </span>
                <div className="flex items-center gap-2">
                  {service.pending !== undefined && service.pending > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 font-medium">
                      {service.pending} pendentes
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(service.status)}
                    <span className={`text-xs font-medium capitalize ${getStatusColor(service.status)}`}>
                      {service.status === 'operational' ? 'Operacional' : service.status === 'warning' ? 'Alerta' : 'Erro'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className={`p-2.5 ${serviceRowBg} rounded-xl text-center`}>
              <p className="text-xs text-gray-400">Bloqueados</p>
              <p className={`text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                {data.stats.blocked}
              </p>
            </div>
            <div className={`p-2.5 ${serviceRowBg} rounded-xl text-center`}>
              <p className="text-xs text-gray-400">Flagged</p>
              <p className={`text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                {data.stats.flagged}
              </p>
            </div>
            <div className={`p-2.5 ${serviceRowBg} rounded-xl text-center`}>
              <p className="text-xs text-gray-400">24h</p>
              <p className={`text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                {data.stats.last24h}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Última verificação: {new Date(data.lastCheck).toLocaleTimeString('pt-BR')}</span>
            </div>
            <span className="text-xs text-green-400 font-medium">
              Uptime: {data.uptime}%
            </span>
          </div>
        </>
      ) : (
        <div className="text-center py-6">
          <Shield className="w-10 h-10 text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Erro ao carregar status</p>
        </div>
      )}
    </motion.div>
  );
}
