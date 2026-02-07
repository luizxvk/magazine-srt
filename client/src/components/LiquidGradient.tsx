import React, { memo } from 'react';

/**
 * LiquidGradient - Animated liquid gradient effect component
 * Adapted from kokonutui.com
 */

export interface Colors {
    color1: string;
    color2: string;
    color3: string;
    color4: string;
    color5: string;
    color6: string;
    color7: string;
    color8: string;
    color9: string;
    color10: string;
    color11: string;
    color12: string;
    color13: string;
    color14: string;
    color15: string;
    color16: string;
    color17: string;
}

// Elite theme colors (Blue/Purple - matching kokonutui style)
export const ELITE_COLORS: Colors = {
    color1: '#FFFFFF',
    color2: '#1E10C5',
    color3: '#9089E2',
    color4: '#FCFCFE',
    color5: '#F9F9FD',
    color6: '#B2B8E7',
    color7: '#0E2DCB',
    color8: '#0017E9',
    color9: '#4743EF',
    color10: '#7D7BF4',
    color11: '#0B06FC',
    color12: '#C5C1EA',
    color13: '#1403DE',
    color14: '#B6BAF6',
    color15: '#C1BEEB',
    color16: '#290ECB',
    color17: '#3F4CC0',
};

// MGT theme colors (Emerald/Red)
export const MGT_COLORS: Colors = {
    color1: '#FFFFFF',
    color2: '#10B981',
    color3: '#EF4444',
    color4: '#FCFCFE',
    color5: '#F9F9FD',
    color6: '#6EE7B7',
    color7: '#059669',
    color8: '#DC2626',
    color9: '#34D399',
    color10: '#F87171',
    color11: '#047857',
    color12: '#A7F3D0',
    color13: '#B91C1C',
    color14: '#FECACA',
    color15: '#D1FAE5',
    color16: '#065F46',
    color17: '#991B1B',
};

interface LiquidProps {
    isHovered: boolean;
    colors: Colors;
}

export const Liquid = memo(({ isHovered, colors }: LiquidProps) => {
    const style = {
        '--liquid-color-1': colors.color1,
        '--liquid-color-2': colors.color2,
        '--liquid-color-3': colors.color3,
        '--liquid-color-4': colors.color4,
        '--liquid-color-5': colors.color5,
        '--liquid-color-6': colors.color6,
        '--liquid-color-7': colors.color7,
        '--liquid-color-8': colors.color8,
        '--liquid-color-9': colors.color9,
        '--liquid-color-10': colors.color10,
        '--liquid-color-11': colors.color11,
        '--liquid-color-12': colors.color12,
        '--liquid-color-13': colors.color13,
        '--liquid-color-14': colors.color14,
        '--liquid-color-15': colors.color15,
        '--liquid-color-16': colors.color16,
        '--liquid-color-17': colors.color17,
    } as React.CSSProperties;

    return (
        <span 
            className={`liquid-gradient absolute inset-0 ${isHovered ? 'liquid-active' : ''}`}
            style={style}
        >
            <span className="liquid-layer liquid-layer-1" />
            <span className="liquid-layer liquid-layer-2" />
            <span className="liquid-layer liquid-layer-3" />
            <span className="liquid-layer liquid-layer-4" />
            <span className="liquid-layer liquid-layer-5" />
        </span>
    );
});
Liquid.displayName = 'Liquid';

interface LiquidButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    isMGT?: boolean;
}

export const LiquidButton = memo(({ children, onClick, disabled, className = '', isMGT = false }: LiquidButtonProps) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const colors = isMGT ? MGT_COLORS : ELITE_COLORS;

    return (
        <div 
            className={`relative inline-block group rounded-lg ${className}`}
            style={{ minWidth: '12rem', minHeight: '3.5em' }}
        >
            {/* Outer glow effect */}
            <div 
                className="absolute -inset-1 rounded-xl opacity-75 blur-lg transition-opacity duration-300 group-hover:opacity-100"
                style={{
                    background: `linear-gradient(90deg, ${colors.color2}, ${colors.color8}, ${colors.color11})`,
                }}
            />
            
            {/* Main Button Container with liquid effect */}
            <div className="relative w-full h-full overflow-hidden rounded-lg border-2 border-white/20">
                {/* Dark base */}
                <div className="absolute inset-0 bg-black/90" />
                
                {/* Liquid gradient effect */}
                <Liquid isHovered={isHovered} colors={colors} />
                
                {/* Shine overlay */}
                <div 
                    className="absolute inset-0 opacity-30"
                    style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)',
                    }}
                />
            </div>
            
            {/* Clickable Button */}
            <button
                className="absolute inset-0 rounded-lg bg-transparent cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 z-10"
                type="button"
                disabled={disabled}
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <span className="flex items-center justify-center px-6 py-4 gap-2 rounded-lg text-white text-xl font-semibold tracking-wide whitespace-nowrap group-hover:text-yellow-400 transition-colors drop-shadow-lg">
                    {children}
                </span>
            </button>
        </div>
    );
});
LiquidButton.displayName = 'LiquidButton';

export default LiquidButton;
