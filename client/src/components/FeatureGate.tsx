/**
 * FeatureGate Component
 * 
 * Wrapper que verifica se uma feature está disponível antes de renderizar.
 * Se não estiver, mostra overlay com cadeado e abre modal de upgrade ao clicar.
 */

import { type ReactNode, useState } from 'react';
import { Lock } from 'lucide-react';
import type { Feature } from '../utils/features';
import { useAuth } from '../context/AuthContext';
import { useFeature } from '../hooks/useFeature';
import UpgradeModal from './UpgradeModal';

interface FeatureGateProps {
  feature: Feature;
  children: ReactNode;
  fallback?: ReactNode; // O que mostrar quando bloqueado (opcional)
  showPreview?: boolean; // Se true, mostra preview com blur (default: true)
  inline?: boolean; // Se true, usa span ao invés de div
}

export default function FeatureGate({ 
  feature, 
  children, 
  fallback,
  showPreview = true,
  inline = false,
}: FeatureGateProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { theme } = useAuth();
  const { isAvailable, requiredPlan, currentPlan } = useFeature(feature);
  const isDarkMode = theme === 'dark';
  
  // Feature disponível - renderiza normalmente
  if (isAvailable) {
    return <>{children}</>;
  }
  
  // Se tem fallback customizado, usa ele
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Fallback padrão: área clicável que abre modal
  const Container = inline ? 'span' : 'div';
  
  return (
    <>
      <Container 
        onClick={() => setShowUpgradeModal(true)}
        className={`relative cursor-pointer group ${inline ? 'inline-block' : 'block'}`}
      >
        {/* Overlay de bloqueio */}
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/60' : 'bg-white/60'} backdrop-blur-sm rounded-lg z-10 flex items-center justify-center transition-all group-hover:bg-opacity-70`}>
          <div className="text-center p-4">
            <div className={`w-12 h-12 mx-auto mb-3 rounded-full ${isDarkMode ? 'bg-amber-500/20' : 'bg-amber-100'} flex items-center justify-center`}>
              <Lock className="w-6 h-6 text-amber-500" />
            </div>
            <p className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Disponível no plano {requiredPlan}
            </p>
            <button className="mt-2 text-xs text-amber-500 hover:text-amber-400 underline">
              Ver detalhes
            </button>
          </div>
        </div>
        
        {/* Conteúdo blur (preview) */}
        {showPreview ? (
          <div className="opacity-30 pointer-events-none blur-sm">
            {children}
          </div>
        ) : (
          <div className="opacity-0 pointer-events-none">
            {children}
          </div>
        )}
      </Container>
      
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={feature}
        currentPlan={currentPlan}
        requiredPlan={requiredPlan}
      />
    </>
  );
}
