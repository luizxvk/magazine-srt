import { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Users, TrendingUp, Shield, MessageSquare, Image as ImageIcon, Star, Zap, Activity, GripVertical, RefreshCw, RotateCcw } from 'lucide-react';
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

interface Widget {
    id: string;
    title: string;
    value: number;
    icon: React.ReactNode;
    subtitle: string;
    color: string;
}

interface SortableWidgetProps {
    widget: Widget;
    cardBg: string;
    cardBorder: string;
    theme: string;
}

function SortableWidget({ widget, cardBg, cardBorder, theme }: SortableWidgetProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: widget.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.9 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${cardBg} ${cardBorder} border backdrop-blur-xl rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all ${isDragging ? 'scale-105 shadow-2xl ring-2 ring-gold-500/50' : 'hover:scale-[1.02]'}`}
        >
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-${widget.color}-500/10 flex-shrink-0`}>
                    {widget.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-gray-400 text-xs mb-0.5">{widget.title}</h3>
                    <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'} leading-tight`}>
                        {widget.value.toLocaleString()}
                    </p>
                    <p className="text-gray-500 text-[10px] mt-0.5">{widget.subtitle}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                    <button
                        {...attributes}
                        {...listeners}
                        className="p-1.5 rounded-lg hover:bg-white/10 cursor-grab active:cursor-grabbing transition-colors"
                        title="Arrastar para reorganizar"
                    >
                        <GripVertical className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminGridDashboard() {
    const { user, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
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
    const [refreshing, setRefreshing] = useState(false);

    const defaultOrder = ['users', 'activity', 'posts', 'online', 'messages', 'stories', 'comments'];
    const [widgetOrder, setWidgetOrder] = useState<string[]>(defaultOrder);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const savedOrder = localStorage.getItem('adminDashboardOrder');
        if (savedOrder) {
            setWidgetOrder(JSON.parse(savedOrder));
        }
    }, []);

    const fetchStats = async () => {
        try {
            setRefreshing(true);
            const response = await api.get('/admin/dashboard/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard stats', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleResetLayout = () => {
        setWidgetOrder(defaultOrder);
        localStorage.removeItem('adminDashboardOrder');
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setWidgetOrder((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over.id as string);
                const newOrder = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem('adminDashboardOrder', JSON.stringify(newOrder));
                return newOrder;
            });
        }
    };

    const widgetConfigs: Record<string, Omit<Widget, 'id'>> = {
        users: {
            title: 'Total de Usuários',
            value: stats.totalUsers,
            icon: <Users className="w-6 h-6 text-blue-400" />,
            subtitle: `+${stats.newUsersToday} hoje`,
            color: 'blue'
        },
        activity: {
            title: 'Usuários Ativos',
            value: stats.activeUsers,
            icon: <Activity className="w-6 h-6 text-green-400" />,
            subtitle: 'Últimas 24h',
            color: 'green'
        },
        posts: {
            title: 'Total de Posts',
            value: stats.totalPosts,
            icon: <ImageIcon className="w-6 h-6 text-purple-400" />,
            subtitle: 'Todos os tempos',
            color: 'purple'
        },
        online: {
            title: 'Online Agora',
            value: stats.onlineNow,
            icon: <Zap className="w-6 h-6 text-amber-400" />,
            subtitle: 'Conectados',
            color: 'amber'
        },
        messages: {
            title: 'Mensagens',
            value: stats.totalMessages,
            icon: <MessageSquare className="w-6 h-6 text-cyan-400" />,
            subtitle: 'Total enviadas',
            color: 'cyan'
        },
        stories: {
            title: 'Stories Postados',
            value: stats.totalStories,
            icon: <Star className="w-6 h-6 text-pink-400" />,
            subtitle: 'Últimas 24h',
            color: 'pink'
        },
        comments: {
            title: 'Comentários',
            value: stats.totalComments,
            icon: <Shield className="w-6 h-6 text-emerald-400" />,
            subtitle: 'Total de interações',
            color: 'emerald'
        }
    };

    const widgets: Widget[] = widgetOrder.map(id => ({
        id,
        ...widgetConfigs[id]
    }));

    const cardBg = theme === 'light' ? 'bg-white' : 'bg-black/20';
    const cardBorder = theme === 'light' ? 'border-gray-200' : 'border-gray-800';
    const accentColor = isMGT ? 'emerald' : 'gold';

    return (
        <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        Dashboard Geral
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Arraste os cards para reorganizar • Layout salvo automaticamente • Atualização a cada 30s
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchStats}
                        disabled={refreshing}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-${accentColor}-500/10 text-${accentColor}-400 hover:bg-${accentColor}-500/20 transition-colors disabled:opacity-50`}
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Atualizar
                    </button>
                    <button
                        onClick={handleResetLayout}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors`}
                    >
                        <RotateCcw className="w-4 h-4" />
                        Resetar Layout
                    </button>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {widgets.map((widget) => (
                            <SortableWidget
                                key={widget.id}
                                widget={widget}
                                cardBg={cardBg}
                                cardBorder={cardBorder}
                                theme={theme}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}
