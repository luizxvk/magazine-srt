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

// Elite theme colors (Gold/Amber)
export const ELITE_COLORS: Colors = {
    color1: '#FFFFFF',
    color2: '#D4AF37',
    color3: '#FFD700',
    color4: '#FCFCFE',
    color5: '#F9F9FD',
    color6: '#E7C96B',
    color7: '#CB8B10',
    color8: '#E99F17',
    color9: '#EF9443',
    color10: '#F4C87B',
    color11: '#FC9B0B',
    color12: '#EAD5A6',
    color13: '#DE8903',
    color14: '#F6D9B6',
    color15: '#EBD9BE',
    color16: '#CB7E0E',
    color17: '#C08F3F',
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
        <div className={`relative inline-block ${className}`}>
            {/* Glow Effect Background */}
            <div className="absolute w-[112.81%] h-[128.57%] top-[8.57%] left-1/2 -translate-x-1/2 filter blur-[19px] opacity-70">
                <span className="absolute inset-0 rounded-xl bg-[#d9d9d9] filter blur-[6.5px]" />
                <div className="relative w-full h-full overflow-hidden rounded-xl">
                    <Liquid isHovered={isHovered} colors={colors} />
                </div>
            </div>
            
            {/* Shadow Layer */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-[92.23%] h-[112.85%] rounded-xl bg-[#010128] filter blur-[7.3px]" />
            
            {/* Main Button Container */}
            <div className="relative w-full h-full overflow-hidden rounded-xl">
                <span className="absolute inset-0 rounded-xl bg-[#d9d9d9]" />
                <span className="absolute inset-0 rounded-xl bg-black" />
                <Liquid isHovered={isHovered} colors={colors} />
                
                {/* Border Glow Layers */}
                {[1, 2, 3, 4, 5].map((i) => (
                    <span
                        key={i}
                        className={`absolute inset-0 rounded-xl border-solid border-[3px] border-gradient-to-b from-transparent to-white mix-blend-overlay ${
                            i <= 2 ? 'blur-[3px]' : i === 3 ? 'blur-[5px]' : 'blur-sm'
                        }`}
                    />
                ))}
                
                {/* Inner Shadow */}
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-[70.8%] h-[42.85%] rounded-xl filter blur-[15px] bg-[#330]" />
            </div>
            
            {/* Clickable Button */}
            <button
                className="absolute inset-0 rounded-xl bg-transparent cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                disabled={disabled}
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <span className="flex items-center justify-center px-4 py-4 gap-2 rounded-xl text-white text-lg font-bold tracking-wide whitespace-nowrap hover:text-amber-300 transition-colors">
                    {children}
                </span>
            </button>
        </div>
    );
});
LiquidButton.displayName = 'LiquidButton';

export default LiquidButton;
