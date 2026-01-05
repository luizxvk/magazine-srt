import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import DailyLoginModal from '../components/DailyLoginModal';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    points: number;
    trophies: number;
    zions: number;
    level: number;
    membershipType?: 'MAGAZINE' | 'MGT';
    avatarUrl?: string;
    displayName?: string;
    bio?: string;
}

export interface DailyLoginStatus {
    claimed: boolean;
    streak: number;
    nextReward: number;
    rewards: number[];
}

interface AuthContextType {
    user: User | null;
    login: (token: string, user: User, membershipContext?: 'MAGAZINE' | 'MGT') => void;
    updateUser: (user: User) => void;
    updateUserZions: (amount: number) => void;
    loginAsVisitor: (membershipType?: 'MAGAZINE' | 'MGT') => void;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
    isVisitor: boolean;
    showAchievement: (title: string, description: string) => void;
    clearAchievement: () => void;
    achievement: { title: string; description: string } | null;
    dailyLoginStatus: DailyLoginStatus | null;
    openDailyLoginModal: () => void;
    // Zions Modal
    isZionsModalOpen: boolean;
    openZionsModal: () => void;
    closeZionsModal: () => void;
    theme: 'dark' | 'light';
    toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [achievement, setAchievement] = useState<{ title: string; description: string } | null>(null);
    const [dailyLoginStatus, setDailyLoginStatus] = useState<DailyLoginStatus | null>(null);
    const [isDailyLoginModalOpen, setIsDailyLoginModalOpen] = useState(false);
    const [isZionsModalOpen, setIsZionsModalOpen] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (!token) return 'dark'; // Force dark if not logged in

            const saved = localStorage.getItem('theme');
            return (saved === 'light' || saved === 'dark') ? saved : 'dark';
        }
        return 'dark';
    });

    useEffect(() => {
        // Apply theme class to html element
        const root = window.document.documentElement;
        root.classList.remove('dark', 'light');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // 1. Load User
                    const userRes = await api.get('/users/me');
                    let userData = userRes.data;

                    // Override membership type if session context exists
                    const sessionMembership = localStorage.getItem('sessionMembershipType');
                    if (sessionMembership === 'MGT' || sessionMembership === 'MAGAZINE') {
                        userData.membershipType = sessionMembership;
                    }

                    setUser(userData);


                    // 2. Check Daily Login Status
                    try {
                        const statusRes = await api.get('/gamification/daily-login/status', {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        setDailyLoginStatus(statusRes.data);

                        // Auto-open modal if not claimed
                        if (!statusRes.data.claimed) {
                            setTimeout(() => setIsDailyLoginModalOpen(true), 1500);
                        }
                    } catch (loginError) {
                        console.error('Daily login status check failed', loginError);
                        // Set fallback status to stop loading animation
                        setDailyLoginStatus({
                            claimed: true,
                            streak: 0,
                            nextReward: 0,
                            rewards: []
                        });
                    }
                } catch (error) {
                    console.error('Failed to load user', error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };

        loadUser();
    }, []); // Removed theme dependency to avoid infinite loop, logic handled inside

    const toggleTheme = () => {
        if (user?.membershipType === 'MGT') {
            setTheme(prev => prev === 'dark' ? 'light' : 'dark');
        }
    };

    const showAchievement = (title: string, description: string) => {
        setAchievement({ title, description });
    };

    const clearAchievement = () => {
        setAchievement(null);
    };

    const login = (token: string, userData: User, membershipContext?: 'MAGAZINE' | 'MGT') => {
        localStorage.setItem('token', token);

        if (membershipContext) {
            localStorage.setItem('sessionMembershipType', membershipContext);
            userData.membershipType = membershipContext;
        }

        setUser(userData);
    };

    const updateUser = (userData: User) => {
        setUser(userData);
    };

    const updateUserZions = (amount: number) => {
        if (user) {
            setUser({ ...user, zions: (user.zions || 0) + amount });
        }
    };

    const loginAsVisitor = (membershipType: 'MAGAZINE' | 'MGT' = 'MAGAZINE') => {
        setUser({
            id: 'visitor',
            name: 'Visitante',
            email: '',
            role: 'VISITOR',
            points: 0,
            trophies: 0,
            zions: 0,
            level: 0,
            membershipType: membershipType,
            displayName: 'Visitante',
            bio: 'Explorando o Clube Magazine'
        });
        setTheme('dark');
        // Mock Daily Login for Visitor
        setDailyLoginStatus({
            claimed: false,
            streak: 1,
            nextReward: 100,
            rewards: [100, 200, 300, 400, 500, 1000, 2000]
        });
        setTimeout(() => setIsDailyLoginModalOpen(true), 1500);
    };

    const logout = () => {
        // Only save membership type if NOT a visitor
        if (user?.membershipType && user.role !== 'VISITOR') {
            localStorage.setItem('lastMembershipType', user.membershipType);
        } else {
            // If visitor, clear it or set to default to avoid "mixed" screen
            localStorage.removeItem('lastMembershipType');
        }

        localStorage.removeItem('token');
        localStorage.removeItem('sessionMembershipType');
        setUser(null);

        // Force Dark Mode immediately and persist it
        setTheme('dark');
        localStorage.setItem('theme', 'dark');
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');

        window.location.href = '/login';
    };

    const handleClaimDailyLogin = async () => {
        try {
            const response = await api.post('/gamification/daily-login');
            if (response.data.awarded > 0) {
                // Update user zions
                if (user) {
                    setUser({ ...user, zions: (user.zions || 0) + response.data.awarded });
                }
                // Update status
                setDailyLoginStatus(prev => prev ? { ...prev, claimed: true } : null);

                // Show achievement removed as per user request
                // showAchievement('Bônus Diário Resgatado!', `+${response.data.awarded} Zions`);

                // Close modal after delay
                setTimeout(() => setIsDailyLoginModalOpen(false), 2000);
            }
        } catch (error) {
            console.error('Failed to claim daily login', error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            updateUser,
            updateUserZions,
            loginAsVisitor,
            logout,
            isAuthenticated: !!user,
            loading,
            isVisitor: user?.role === 'VISITOR',
            showAchievement,
            clearAchievement,
            achievement,
            dailyLoginStatus,
            openDailyLoginModal: () => setIsDailyLoginModalOpen(true),
            isZionsModalOpen,
            openZionsModal: () => setIsZionsModalOpen(true),
            closeZionsModal: () => setIsZionsModalOpen(false),
            theme,
            toggleTheme
        }}>
            {children}
            <DailyLoginModal
                isOpen={isDailyLoginModalOpen}
                onClose={() => setIsDailyLoginModalOpen(false)}
                status={dailyLoginStatus}
                onClaim={handleClaimDailyLogin}
            />
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
