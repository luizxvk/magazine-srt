/**
 * UpgradeModal Component
 * 
 * Modal que aparece quando usuário tenta acessar feature bloqueada.
 * Mostra informações sobre o plano necessário e CTA para upgrade.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, ArrowRight, Lock, Crown } from 'lucide-react';
import { Feature, FEATURE_INFO, PLAN_DETAILS, Plan, formatPrice } from '../utils/features';
import { useAuth } from '../context/AuthContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: Feature;
  currentPlan?: string;
  requiredPlan?: string;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  feature,
  currentPlan = Plan.FREE,
  requiredPlan = Plan.STARTER,
}: UpgradeModalProps) {
  const { theme } = useAuth();
  const isDarkMode = theme === 'dark';
  
  const featureInfo = FEATURE_INFO[feature];
  const planDetails = PLAN_DETAILS[requiredPlan as Plan];
  const currentPlanDetails = PLAN_DETAILS[currentPlan as Plan];

  // Cores baseadas no tema
  const bgModal = isDarkMode 
    ? 'bg-gradient-to-b from-gray-900 to-gray-950' 
    : 'bg-gradient-to-b from-white to-gray-50';
  const borderColor = isDarkMode ? 'border-white/10' : 'border-gray-200';
  const textMain = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-white/60' : 'text-gray-500';
  const cardBg = isDarkMode ? 'bg-white/5' : 'bg-gray-100';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[9999] px-4"
          >
            <div className={`${bgModal} border ${borderColor} rounded-2xl shadow-2xl overflow-hidden`}>
              {/* Header com gradiente */}
              <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 p-6 relative">
                <button
                  onClick={onClose}
                  className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
                >
                  <X size={20} className={textMuted} />
                </button>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${textMain}`}>
                      Recurso Premium
                    </h3>
                    <p className={`text-sm ${textMuted}`}>
                      Disponível a partir do plano {planDetails?.name}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Conteúdo */}
              <div className="p-6 space-y-4">
                {/* Feature bloqueada */}
                <div className={`${cardBg} rounded-xl p-4 border ${borderColor}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Lock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className={`font-semibold ${textMain}`}>
                        {featureInfo?.name || feature}
                      </h4>
                      <p className={`text-sm ${textMuted} mt-1`}>
                        {featureInfo?.description || 'Esta funcionalidade não está disponível no seu plano atual.'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Seu plano atual */}
                {currentPlanDetails && (
                  <div className={`${cardBg} rounded-xl p-3 border ${borderColor}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: currentPlanDetails.color }}
                        />
                        <span className={`text-sm ${textMuted}`}>Seu plano atual:</span>
                        <span className={`text-sm font-medium ${textMain}`}>{currentPlanDetails.name}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Plano sugerido */}
                <div 
                  className="rounded-xl p-4 border-2"
                  style={{ 
                    background: `linear-gradient(135deg, ${planDetails?.color}15, ${planDetails?.color}05)`,
                    borderColor: `${planDetails?.color}40`
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" style={{ color: planDetails?.color }} />
                        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: planDetails?.color }}>
                          Plano Recomendado
                        </span>
                      </div>
                      <h4 className={`text-xl font-bold ${textMain} mt-1`}>
                        {planDetails?.name}
                      </h4>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${textMain}`}>
                        {formatPrice(planDetails?.priceMonthly || 0)}
                      </p>
                      <p className={`text-xs ${textMuted}`}>/mês</p>
                    </div>
                  </div>
                  
                  {/* Features do plano */}
                  <div className="space-y-2 mt-4">
                    {planDetails?.features.slice(0, 4).map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check size={14} className="text-green-400 flex-shrink-0" />
                        <span className={isDarkMode ? 'text-white/80' : 'text-gray-700'}>{feat}</span>
                      </div>
                    ))}
                    {(planDetails?.features.length || 0) > 4 && (
                      <p className={`text-xs ${textMuted} pl-5`}>
                        + {planDetails!.features.length - 4} mais recursos
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Aviso para usuário comum */}
                <div className={`${isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'} border rounded-lg p-3`}>
                  <p className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    💡 <strong>Dica:</strong> Entre em contato com o administrador da sua 
                    comunidade para solicitar o upgrade do plano.
                  </p>
                </div>
              </div>
              
              {/* Footer */}
              <div className="p-6 pt-0 flex gap-3">
                <button
                  onClick={onClose}
                  className={`flex-1 px-4 py-3 rounded-xl border ${borderColor} ${textMuted} ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'} transition-colors text-sm font-medium`}
                >
                  Agora não
                </button>
                <button
                  onClick={() => {
                    // TODO: Redirecionar para página de planos ou contato
                    window.open('/upgrade', '_blank');
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/20"
                >
                  Ver planos
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
