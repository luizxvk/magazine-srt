import { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { 
    GripVertical, Eye, EyeOff, Radio, Gift, Crown, Shield, 
    ShoppingBag, BarChart3, Package, Users, MessageSquare, Megaphone, Save, RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import Loader from './Loader';

interface FeedCard {
    id: string;
    visible: boolean;
    order: number;
}

interface FeedCardsConfig {
    cards: FeedCard[];
}

// Default cards configuration
const DEFAULT_CARDS: FeedCard[] = [
    { id: 'tools', visible: true, order: 0 },
    { id: 'freeGames', visible: true, order: 1 },
    { id: 'elite', visible: true, order: 2 },
    { id: 'shield', visible: true, order: 3 },
    { id: 'market', visible: true, order: 4 },
    { id: 'statforge', visible: true, order: 5 },
    { id: 'inventory', visible: true, order: 6 },
    { id: 'groups', visible: true, order: 7 },
    { id: 'feedback', visible: true, order: 8 },
    { id: 'announcements', visible: true, order: 9 },
];

// Card metadata (icons, labels)
const CARD_META: Record<string, { icon: any; labelKey: string }> = {
    tools: { icon: Radio, labelKey: 'common:feedCards.cards.tools' },
    freeGames: { icon: Gift, labelKey: 'common:feedCards.cards.freeGames' },
    elite: { icon: Crown, labelKey: 'common:feedCards.cards.elite' },
    shield: { icon: Shield, labelKey: 'common:feedCards.cards.shield' },
    market: { icon: ShoppingBag, labelKey: 'common:feedCards.cards.market' },
    statforge: { icon: BarChart3, labelKey: 'common:feedCards.cards.statforge' },
    inventory: { icon: Package, labelKey: 'common:feedCards.cards.inventory' },
    groups: { icon: Users, labelKey: 'common:feedCards.cards.groups' },
    feedback: { icon: MessageSquare, labelKey: 'common:feedCards.cards.feedback' },
    announcements: { icon: Megaphone, labelKey: 'common:feedCards.cards.announcements' },
};

interface FeedCardsCustomizerProps {
    onClose?: () => void;
}

export default function FeedCardsCustomizer({ onClose }: FeedCardsCustomizerProps) {
    const { user, theme, accentColor, updateUser } = useAuth();
    const { t } = useTranslation();
    const isMGT = user?.membershipType === 'MGT';
    
    const [cards, setCards] = useState<FeedCard[]>(DEFAULT_CARDS);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Load user's saved config
    useEffect(() => {
        if (user?.feedCardsConfig) {
            const config = user.feedCardsConfig as unknown as FeedCardsConfig;
            if (config.cards && Array.isArray(config.cards)) {
                // Merge saved config with default to handle new cards
                const savedMap = new Map(config.cards.map(c => [c.id, c]));
                const merged = DEFAULT_CARDS.map((defaultCard, index) => {
                    const saved = savedMap.get(defaultCard.id);
                    return saved ? { ...saved, order: saved.order ?? index } : defaultCard;
                });
                // Sort by order
                merged.sort((a, b) => a.order - b.order);
                setCards(merged);
            }
        }
    }, [user?.feedCardsConfig]);

    const handleReorder = (newOrder: FeedCard[]) => {
        const reordered = newOrder.map((card, index) => ({ ...card, order: index }));
        setCards(reordered);
        setHasChanges(true);
    };

    const toggleVisibility = (cardId: string) => {
        setCards(prev => prev.map(c => 
            c.id === cardId ? { ...c, visible: !c.visible } : c
        ));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const config = { cards };
            await api.put('/users/preferences', {
                feedCardsConfig: config
            });
            updateUser({ feedCardsConfig: config });
            setHasChanges(false);
            onClose?.();
        } catch (error) {
            console.error('Error saving feed cards config:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setCards(DEFAULT_CARDS.map((c, i) => ({ ...c, order: i })));
        setHasChanges(true);
    };

    const cardBg = theme === 'light'
        ? 'bg-white border-gray-200'
        : 'bg-white/[0.03] border-white/[0.08]';

    const itemBg = theme === 'light'
        ? 'bg-gray-50 hover:bg-gray-100'
        : 'bg-white/[0.02] hover:bg-white/[0.05]';

    return (
        <div className={`rounded-2xl border p-6 ${cardBg}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className={`text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        {t('common:feedCards.customize')}
                    </h3>
                    <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                        {t('common:feedCards.description')}
                    </p>
                </div>
            </div>

            {/* Drag hint */}
            <p className={`text-xs mb-4 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>
                <GripVertical className="w-3 h-3 inline mr-1" />
                {t('common:feedCards.dragToReorder')}
            </p>

            {/* Cards List */}
            <Reorder.Group
                axis="y"
                values={cards}
                onReorder={handleReorder}
                className="space-y-2"
            >
                {cards.map((card) => {
                    const meta = CARD_META[card.id];
                    if (!meta) return null;
                    const Icon = meta.icon;

                    return (
                        <Reorder.Item
                            key={card.id}
                            value={card}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${itemBg} ${
                                theme === 'light' ? 'border-gray-200' : 'border-white/[0.05]'
                            } ${!card.visible ? 'opacity-50' : ''}`}
                        >
                            {/* Drag handle */}
                            <GripVertical className={`w-4 h-4 flex-shrink-0 ${
                                theme === 'light' ? 'text-gray-400' : 'text-gray-500'
                            }`} />

                            {/* Icon */}
                            <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${accentColor}20` }}
                            >
                                <Icon 
                                    className="w-4 h-4" 
                                    style={{ color: accentColor }}
                                />
                            </div>

                            {/* Label */}
                            <span className={`flex-1 font-medium text-sm ${
                                theme === 'light' ? 'text-gray-700' : 'text-white'
                            }`}>
                                {t(meta.labelKey)}
                            </span>

                            {/* Visibility toggle */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleVisibility(card.id);
                                }}
                                className={`p-2 rounded-lg transition-colors ${
                                    card.visible 
                                        ? (theme === 'light' ? 'bg-green-100 text-green-600' : 'bg-green-500/20 text-green-400')
                                        : (theme === 'light' ? 'bg-gray-100 text-gray-400' : 'bg-white/5 text-gray-500')
                                }`}
                                title={card.visible ? t('common:feedCards.visible') : t('common:feedCards.hidden')}
                            >
                                {card.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </motion.button>
                        </Reorder.Item>
                    );
                })}
            </Reorder.Group>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
                <button
                    onClick={handleReset}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium transition-colors ${
                        theme === 'light'
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            : 'bg-white/5 hover:bg-white/10 text-gray-300'
                    }`}
                >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                </button>
                <button
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        isMGT
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110'
                            : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:brightness-110'
                    }`}
                    style={accentColor && !isMGT ? { background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` } : undefined}
                >
                    {saving ? <Loader size="sm" /> : <Save className="w-4 h-4" />}
                    {t('common:actions.save')}
                </button>
            </div>
        </div>
    );
}

// Export default config and utility for FeedPage
export { DEFAULT_CARDS };

export function getOrderedVisibleCards(config: FeedCardsConfig | null | undefined): string[] {
    if (!config?.cards || !Array.isArray(config.cards)) {
        return DEFAULT_CARDS.filter(c => c.visible).map(c => c.id);
    }
    
    // Merge with defaults to handle new cards
    const savedMap = new Map(config.cards.map(c => [c.id, c]));
    const merged = DEFAULT_CARDS.map((defaultCard, index) => {
        const saved = savedMap.get(defaultCard.id);
        return saved ? { ...saved, order: saved.order ?? index } : defaultCard;
    });
    
    return merged
        .filter(c => c.visible)
        .sort((a, b) => a.order - b.order)
        .map(c => c.id);
}
