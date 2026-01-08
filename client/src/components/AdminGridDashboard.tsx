import { useState, useEffect } from 'react';
import { Responsive, useContainerWidth } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Users, TrendingUp, Shield, MessageSquare, Image as ImageIcon, Star, Zap, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    totalPosts: number;
    totalComments: number;
    totalStories: number;
    totalMessages: number;
    onlineNow: number;
    newUsersToday: number;
}

export default function AdminGridDashboard() {
    const { theme } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        activeUsers: 0,
        totalPosts: 0,
        totalComments: 0,
        totalStories: 0,
        totalMessages: 0,
        onlineNow: 0,
        newUsersToday: 0
    });

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/admin/dashboard/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard stats', error);
        }
    };

    const defaultLayouts = {
        lg: [
            { i: 'users', x: 0, y: 0, w: 3, h: 2 },
            { i: 'activity', x: 3, y: 0, w: 3, h: 2 },
            { i: 'posts', x: 6, y: 0, w: 3, h: 2 },
            { i: 'online', x: 9, y: 0, w: 3, h: 2 },
            { i: 'messages', x: 0, y: 2, w: 4, h: 2 },
            { i: 'stories', x: 4, y: 2, w: 4, h: 2 },
            { i: 'comments', x: 8, y: 2, w: 4, h: 2 }
        ]
    };

    const [layouts, setLayouts] = useState(defaultLayouts);

    const handleLayoutChange = (_: Layout[], allLayouts: any) => {
        setLayouts(allLayouts);
        localStorage.setItem('adminDashboardLayouts', JSON.stringify(allLayouts));
    };

    useEffect(() => {
        const savedLayouts = localStorage.getItem('adminDashboardLayouts');
        if (savedLayouts) {
            setLayouts(JSON.parse(savedLayouts));
        }
    }, []);

    const widgets = [
        {
            i: 'users',
            title: 'Total de Usuários',
            value: stats.totalUsers,
            icon: <Users className="w-6 h-6 text-blue-400" />,
            subtitle: `+${stats.newUsersToday} hoje`,
            color: 'blue'
        },
        {
            i: 'activity',
            title: 'Usuários Ativos',
            value: stats.activeUsers,
            icon: <Activity className="w-6 h-6 text-green-400" />,
            subtitle: 'Últimas 24h',
            color: 'green'
        },
        {
            i: 'posts',
            title: 'Total de Posts',
            value: stats.totalPosts,
            icon: <ImageIcon className="w-6 h-6 text-purple-400" />,
            subtitle: 'Todos os tempos',
            color: 'purple'
        },
        {
            i: 'online',
            title: 'Online Agora',
            value: stats.onlineNow,
            icon: <Zap className="w-6 h-6 text-amber-400" />,
            subtitle: 'Conectados',
            color: 'amber'
        },
        {
            i: 'messages',
            title: 'Mensagens',
            value: stats.totalMessages,
            icon: <MessageSquare className="w-6 h-6 text-cyan-400" />,
            subtitle: 'Total enviadas',
            color: 'cyan'
        },
        {
            i: 'stories',
            title: 'Stories Postados',
            value: stats.totalStories,
            icon: <Star className="w-6 h-6 text-pink-400" />,
            subtitle: 'Últimas 24h',
            color: 'pink'
        },
        {
            i: 'comments',
            title: 'Comentários',
            value: stats.totalComments,
            icon: <Shield className="w-6 h-6 text-emerald-400" />,
            subtitle: 'Total de interações',
            color: 'emerald'
        }
    ];

    const cardBg = theme === 'light' ? 'bg-white' : 'bg-black/20';
    const cardBorder = theme === 'light' ? 'border-gray-200' : 'border-gray-800';

    return (
        <div className="mb-8">
            <div className="mb-6">
                <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    Dashboard Geral
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                    Arraste os cards para reorganizar • Redimensione conforme necessário • Layout salvo automaticamente
                </p>
            </div>

            <Responsive
                className="layout"
                layouts={layouts}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={80}
                onLayoutChange={handleLayoutChange}
                isDraggable={true}
                isResizable={true}
                draggableHandle=".drag-handle"
            >
                {widgets.map((widget) => (
                    <div key={widget.i} className={`${cardBg} ${cardBorder} border backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all`}>
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4 drag-handle cursor-move">
                                <div className={`p-3 rounded-xl bg-${widget.color}-500/10`}>
                                    {widget.icon}
                                </div>
                                <TrendingUp className="w-4 h-4 text-green-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-gray-400 text-sm mb-2">{widget.title}</h3>
                                <p className={`text-3xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                    {widget.value.toLocaleString()}
                                </p>
                            </div>
                            <p className="text-gray-500 text-xs mt-2">{widget.subtitle}</p>
                        </div>
                    </div>
                ))}
            </Responsive>
        </div>
    );
}
