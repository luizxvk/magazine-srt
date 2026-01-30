import { useAuth } from '../context/AuthContext';

// Custom icon URLs from icons8
export const HEADER_ICONS = {
    feed: 'https://img.icons8.com/?size=100&id=lBuqhXfGV2RT&format=png&color=000000',
    groups: 'https://img.icons8.com/?size=100&id=3734&format=png&color=000000',
    social: 'https://img.icons8.com/?size=100&id=69&format=png&color=000000',
    roadmap: 'https://img.icons8.com/?size=100&id=105288&format=png&color=000000',
    notifications: 'https://img.icons8.com/?size=100&id=nJRLlq8KqcX5&format=png&color=000000',
    coins: 'https://img.icons8.com/?size=100&id=69433&format=png&color=000000',
    whatsnew: 'https://img.icons8.com/?size=100&id=12023&format=png&color=000000',
    logout: 'https://img.icons8.com/?size=100&id=2445&format=png&color=000000',
    // Additional menu icons
    star: 'https://img.icons8.com/?size=100&id=19417&format=png&color=000000',
    shoppingbag: 'https://img.icons8.com/?size=100&id=1511&format=png&color=000000',
    trophy: 'https://img.icons8.com/?size=100&id=vdxdCFjjKVF6&format=png&color=000000',
    ticket: 'https://img.icons8.com/?size=100&id=91508&format=png&color=000000',
    settings: 'https://img.icons8.com/?size=100&id=2969&format=png&color=000000',
    search: 'https://img.icons8.com/?size=100&id=7695&format=png&color=000000',
};

interface AccentIconProps {
    icon: keyof typeof HEADER_ICONS | string;
    size?: number;
    className?: string;
    color?: string; // Override color
}

/**
 * AccentIcon - Renders an icon from icons8 with dynamic accent color
 * Uses CSS mask-image technique to colorize the PNG icon
 */
export default function AccentIcon({ icon, size = 20, className = '', color }: AccentIconProps) {
    const { user, theme, accentColor } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    
    // Determine the color to use
    const iconColor = color || accentColor || (isMGT ? '#10b981' : '#d4af37');
    
    // Handle light theme - use dark color for visibility
    const finalColor = theme === 'light' ? '#1a1a1a' : iconColor;
    
    // Get icon URL
    const iconUrl = HEADER_ICONS[icon as keyof typeof HEADER_ICONS] || icon;
    
    return (
        <div
            className={`inline-block ${className}`}
            style={{
                width: size,
                height: size,
                backgroundColor: finalColor,
                WebkitMaskImage: `url(${iconUrl})`,
                maskImage: `url(${iconUrl})`,
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
                transition: 'background-color 0.3s ease',
            }}
            aria-hidden="true"
        />
    );
}
