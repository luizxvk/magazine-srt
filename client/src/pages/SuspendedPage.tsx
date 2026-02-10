import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Mail, RefreshCw } from 'lucide-react';
import api from '../services/api';

interface SuspensionInfo {
  reason: string;
  suspendedAt: string;
  resumesAt: string | null;
  message: string;
}

export default function SuspendedPage() {
  const [info, setInfo] = useState<SuspensionInfo | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Try to get suspension info from URL params or localStorage
    const params = new URLSearchParams(window.location.search);
    const reason = params.get('reason') || localStorage.getItem('suspensionReason') || 'unknown';
    const message = params.get('message') || localStorage.getItem('suspensionMessage') || 
      'Esta comunidade está temporariamente suspensa.';
    
    setInfo({
      reason,
      suspendedAt: localStorage.getItem('suspensionSince') || new Date().toISOString(),
      resumesAt: localStorage.getItem('suspensionUntil') || null,
      message,
    });
  }, []);

  const checkStatus = async () => {
    setChecking(true);
    try {
      // Try to access the API - if not suspended anymore, it will work
      await api.get('/users/me');
      // If we get here, suspension was lifted
      localStorage.removeItem('suspensionReason');
      localStorage.removeItem('suspensionMessage');
      localStorage.removeItem('suspensionSince');
      localStorage.removeItem('suspensionUntil');
      window.location.href = '/';
    } catch (error: any) {
      if (error.response?.data?.code !== 'COMMUNITY_SUSPENDED') {
        // Not suspended anymore
        window.location.href = '/';
      }
    } finally {
      setChecking(false);
    }
  };

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'payment_failed':
        return '💳';
      case 'tos_violation':
        return '⚠️';
      case 'quota_exceeded':
        return '📊';
      default:
        return '🔒';
    }
  };

  const getReasonTitle = (reason: string) => {
    switch (reason) {
      case 'payment_failed':
        return 'Problema de Pagamento';
      case 'tos_violation':
        return 'Violação dos Termos';
      case 'quota_exceeded':
        return 'Limite Excedido';
      default:
        return 'Comunidade Suspensa';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center"
        >
          <span className="text-4xl">{info ? getReasonIcon(info.reason) : '🔒'}</span>
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          {info ? getReasonTitle(info.reason) : 'Comunidade Suspensa'}
        </h1>

        {/* Warning Icon */}
        <div className="flex justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
        </div>

        {/* Message */}
        <p className="text-gray-300 text-center mb-6">
          {info?.message || 'Esta comunidade está temporariamente suspensa.'}
        </p>

        {/* Resume Date */}
        {info?.resumesAt && (
          <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400 text-center">
              Previsão de retorno:
            </p>
            <p className="text-lg font-semibold text-white text-center">
              {new Date(info.resumesAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={checkStatus}
            disabled={checking}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${checking ? 'animate-pulse' : ''}`} />
            {checking ? 'Verificando...' : 'Verificar Status'}
          </button>

          <a
            href="mailto:suporte@rovex.app"
            className="w-full py-3 px-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Mail className="w-5 h-5" />
            Contatar Suporte
          </a>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-6">
          Se você é o administrador desta comunidade, verifique seu email ou acesse o painel Rovex.
        </p>
      </motion.div>
    </div>
  );
}
