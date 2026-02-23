/**
 * LockedMenuItem Component
 * 
 * Item de menu que mostra cadeado quando feature não está disponível.
 * Ao clicar em item bloqueado, abre modal de upgrade.
 */

import { type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import type { Feature } from '../utils/features';
import { useFeature } from '../hooks/useFeature';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from './UpgradeModal';

interface LockedMenuItemProps {
  feature: Feature;
  icon: ReactNode;
  label: string;
  href: string;
  className?: string;
  activeClassName?: string;
  isActive?: boolean;
}

export default function LockedMenuItem({ 
  feature, 
  icon, 
  label, 
  href,
  className = '',
  activeClassName = '',
  isActive = false,
}: LockedMenuItemProps) {
  const [showModal, setShowModal] = useState(false);
  const { isAvailable, requiredPlan, currentPlan } = useFeature(feature);
  const { theme } = useAuth();
  const isDarkMode = theme === 'dark';
  
  // Estilos base
  const baseClasses = `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${className}`;
  const hoverClasses = isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100';
  const lockedClasses = 'opacity-50 cursor-pointer';
  const activeClasses = isActive ? activeClassName : '';
  
  // Se feature está disponível, renderiza link normal
  if (isAvailable) {
    return (
      <Link 
        to={href} 
        className={`${baseClasses} ${hoverClasses} ${activeClasses}`}
      >
        {icon}
        <span>{label}</span>
      </Link>
    );
  }
  
  // Feature bloqueada - mostra com cadeado
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`${baseClasses} ${hoverClasses} ${lockedClasses} w-full text-left`}
      >
        {icon}
        <span className="flex-1">{label}</span>
        <Lock size={12} className="text-amber-500 ml-auto" />
      </button>
      
      <UpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        feature={feature}
        currentPlan={currentPlan}
        requiredPlan={requiredPlan}
      />
    </>
  );
}

/**
 * Versão simplificada para usar em listas de navegação
 */
interface SimpleLockedItemProps {
  feature: Feature;
  children: ReactNode;
  href: string;
  className?: string;
}

export function SimpleLockedItem({ feature, children, href, className = '' }: SimpleLockedItemProps) {
  const [showModal, setShowModal] = useState(false);
  const { isAvailable, requiredPlan, currentPlan } = useFeature(feature);
  
  if (isAvailable) {
    return (
      <Link to={href} className={className}>
        {children}
      </Link>
    );
  }
  
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`${className} relative opacity-60 cursor-pointer`}
      >
        {children}
        <div className="absolute -top-1 -right-1">
          <Lock size={10} className="text-amber-500" />
        </div>
      </button>
      
      <UpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        feature={feature}
        currentPlan={currentPlan}
        requiredPlan={requiredPlan}
      />
    </>
  );
}

/**
 * Badge "PRO" para indicar feature premium
 */
interface PlanBadgeProps {
  plan: string;
  size?: 'sm' | 'md';
}

export function PlanBadge({ plan, size = 'sm' }: PlanBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-[8px] px-1 py-0.5' : 'text-[10px] px-1.5 py-0.5';
  
  const colorClasses = {
    STARTER: 'bg-tier-std-500/20 text-tier-std-400 border-tier-std-500/30',
    GROWTH: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    ENTERPRISE: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  }[plan] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  
  return (
    <span className={`${sizeClasses} ${colorClasses} border rounded-full font-bold uppercase tracking-wider`}>
      {plan}
    </span>
  );
}
