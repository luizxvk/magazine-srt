import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface AdminBadge {
    id: string;
    text: string;
    color: string;
}

interface BadgeDisplayProps {
    userId: string;
    className?: string;
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ userId, className = '' }) => {
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

    if (loading || badges.length === 0) return null;

    return (
        <>
            {badges.map((badge) => (
                <span
                    key={badge.id}
                    className={`px-2 py-0.5 text-xs font-bold text-white rounded ${className}`}
                    style={{ backgroundColor: badge.color }}
                >
                    {badge.text}
                </span>
            ))}
        </>
    );
};

export default BadgeDisplay;
