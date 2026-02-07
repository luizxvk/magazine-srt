import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface AdminBadge {
    id: string;
    text: string;
    color: string;
    textColor: string;
}

interface BadgeDisplayProps {
    userId: string;
    className?: string;
    isElite?: boolean;
    eliteUntil?: string | null;
    size?: 'sm' | 'md';
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ userId, className = '', isElite, eliteUntil, size = 'md' }) => {
    const [badges, setBadges] = useState<AdminBadge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBadges();
    }, [userId]);

    const fetchBadges = async () => {
        try {
            const response = await api.get(`/admin/badges/user/${userId}`);
            setBadges(response.data);
        } catch (error) {
            console.error('Error fetching user badges:', error);
        } finally {
            setLoading(false);
        }
    };

    // Check if user is Elite and has valid subscription
    const isActiveElite = isElite && eliteUntil && new Date(eliteUntil) > new Date();

    const sizeClasses = size === 'sm' 
        ? 'px-1.5 py-0.5 text-[8px]' 
        : 'px-2 py-0.5 text-[10px]';

    if (loading) return null;

    // Show both Elite badge AND admin badges (Elite always comes first)
    return (
        <>
            {isActiveElite && (
                <span
                    className={`elite-badge-shine ${sizeClasses} font-bold uppercase tracking-widest rounded ${className}`}
                    style={{ 
                        background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 50%, #6366f1 100%)',
                        color: '#FFFFFF'
                    }}
                >
                    Elite
                </span>
            )}
            {badges.map((badge) => (
                <span
                    key={badge.id}
                    className={`${sizeClasses} font-bold rounded ${className}`}
                    style={{ backgroundColor: badge.color, color: badge.textColor || '#FFFFFF' }}
                >
                    {badge.text}
                </span>
            ))}
        </>
    );
};

export default BadgeDisplay;
