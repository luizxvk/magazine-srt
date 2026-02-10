import type { CSSProperties, ReactNode } from 'react';
import { createElement } from 'react';
import { useAuth } from '../context/AuthContext';

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  as?: string;
  /** Fallback Tailwind class when no gradient is active (e.g. 'text-gold-400') */
  fallbackClassName?: string;
}

/**
 * Static gradient text component.
 * Uses the user's equipped accent gradient when available,
 * otherwise falls back to fallbackClassName or solid accentColor.
 */
export default function GradientText({
  children,
  className = '',
  as: tag = 'span',
  fallbackClassName,
}: GradientTextProps) {
  const { accentGradient, accentColor } = useAuth();

  if (!accentGradient) {
    // No gradient equipped — use fallback class or inline accent color
    if (fallbackClassName) {
      return createElement(tag, { className: `${fallbackClassName} ${className}` }, children);
    }
    return createElement(tag, { className, style: { color: accentColor } as CSSProperties }, children);
  }

  const gradientStyle: CSSProperties = {
    backgroundImage: accentGradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  return createElement(tag, { className, style: gradientStyle }, children);
}
