import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, User, FileText, Hash, Clock, TrendingUp, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface SearchResult {
    id: string;
    type: 'user' | 'post' | 'tag' | 'page';
    title: string;
    subtitle?: string;
    imageUrl?: string;
    icon?: string;
    path?: string;
    action?: string;
}

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Navigation pages that can be searched
const NAVIGATION_PAGES = [
    { id: 'events', title: 'Eventos', subtitle: 'Próximos eventos e atividades', keywords: ['evento', 'eventos', 'event', 'calendario', 'atividades', 'encontro', 'encontros'], icon: '🎉', path: '/feed', action: 'events' },
    { id: 'rewards', title: 'Recompensas', subtitle: 'Resgate prêmios com seus Zions', keywords: ['recompensa', 'recompensas', 'rewards', 'premio', 'premios', 'zions', 'resgatar', 'resgate'], icon: '🎁', path: '/rewards' },
    { id: 'highlights', title: 'Destaques da Semana', subtitle: 'Melhores posts da semana', keywords: ['destaque', 'destaques', 'highlights', 'melhores', 'top', 'semana', 'populares'], icon: '⭐', path: '/highlights' },
    { id: 'ranking', title: 'Ranking', subtitle: 'Classificação dos membros', keywords: ['ranking', 'rankings', 'classificação', 'top', 'lideres', 'trofeus', 'trofeu', 'placar'], icon: '🏆', path: '/ranking' },
    { id: 'profile', title: 'Meu Perfil', subtitle: 'Veja e edite seu perfil', keywords: ['perfil', 'profile', 'meu', 'conta', 'avatar', 'foto', 'editar'], icon: '👤', path: '/profile' },
    { id: 'notifications', title: 'Notificações', subtitle: 'Suas notificações', keywords: ['notificação', 'notificações', 'notifications', 'alertas', 'avisos', 'alerta'], icon: '🔔', path: '/notifications' },
    { id: 'social', title: 'Social', subtitle: 'Amigos e conexões', keywords: ['social', 'amigos', 'amigo', 'conexões', 'conexao', 'seguir', 'seguidores'], icon: '👥', path: '/social' },
    { id: 'mgt-log', title: 'MGT Log', subtitle: 'Histórico de atividades', keywords: ['mgt', 'log', 'historico', 'atividades', 'registro'], icon: '📋', path: '/mgt-log' },
    { id: 'admin', title: 'Painel Admin', subtitle: 'Administração do sistema', keywords: ['admin', 'administração', 'painel', 'dashboard', 'gerenciar'], icon: '⚙️', path: '/admin' },
    { id: 'shop', title: 'Loja de Personalização', subtitle: 'Customize seu perfil', keywords: ['loja', 'shop', 'personalização', 'customização', 'comprar', 'badge', 'fundo', 'cor', 'tema', 'theme'], icon: '🛍️', path: '/feed', action: 'shop' },
    { id: 'market', title: 'Mercado', subtitle: 'Compre e venda itens', keywords: ['mercado', 'market', 'comprar', 'vender', 'negociar', 'trading', 'marketplace', 'itens', 'customização'], icon: '🏪', path: '/market' },
    { id: 'groups', title: 'Grupos', subtitle: 'Crie e participe de grupos', keywords: ['grupo', 'grupos', 'group', 'comunidade', 'chat', 'conversa'], icon: '👥', path: '/groups' },
    { id: 'catalog', title: 'Catálogo de Fotos', subtitle: 'Galeria exclusiva de fotos', keywords: ['catalogo', 'catalog', 'fotos', 'galeria', 'imagens', 'foto'], icon: '📸', path: '/catalog' },
    { id: 'stories', title: 'Stories', subtitle: 'Visualize stories dos membros', keywords: ['stories', 'story', 'historia', 'historias', 'visualizar'], icon: '📱', path: '/feed', action: 'stories' },
    { id: 'feedback', title: 'Feedback', subtitle: 'Envie sugestões e feedback', keywords: ['feedback', 'sugestão', 'sugestao', 'sugestões', 'opnião', 'opiniao', 'bug', 'reportar', 'melhoria', 'melhorias'], icon: '💬', path: '/feedback' },
    { id: 'store', title: 'Loja de Produtos', subtitle: 'Produtos físicos exclusivos', keywords: ['loja', 'store', 'produtos', 'produto', 'merch', 'merchandise', 'camiseta', 'adesivo', 'físico', 'fisico', 'comprar'], icon: '🛒', path: '/store' },
    { id: 'radio', title: 'Rádio', subtitle: 'Ouça a rádio ao vivo', keywords: ['radio', 'rádio', 'musica', 'música', 'som', 'audio', 'ouvir', 'live', 'ao vivo'], icon: '📻', path: '/feed', action: 'radio' },
    { id: 'roadmap', title: 'Roadmap', subtitle: 'Próximas atualizações', keywords: ['roadmap', 'atualização', 'atualizacoes', 'futuro', 'novidades', 'próximo', 'proximo', 'plano', 'planejamento'], icon: '🗺️', path: '/roadmap' },
    { id: 'elite', title: 'ELITE', subtitle: 'Assinatura premium com benefícios exclusivos', keywords: ['elite', 'premium', 'assinatura', 'vip', 'beneficios', 'benefício', 'assinar', 'subscription', '2x xp', 'xp dobro', 'zions', 'exclusivo'], icon: '👑', path: '/elite' },
];

// Fuzzy match function - checks if query matches any part of keywords
const fuzzyMatch = (query: string, keywords: string[]): boolean => {
    const q = query.toLowerCase().trim();
    if (q.length < 2) return false;

    return keywords.some(keyword => {
        // Check if keyword contains query or query contains keyword
        return keyword.includes(q) || q.includes(keyword) ||
            // Check for partial match (at least 70% of characters match)
            (q.length >= 3 && keyword.startsWith(q.substring(0, Math.ceil(q.length * 0.7))));
    });
};

const SUGGESTIONS = [
    { label: 'Eventos', icon: '🎉' },
    { label: 'Recompensas', icon: '🎁' },
    { label: 'Destaques', icon: '⭐' },
    { label: 'Amigos', icon: '👥' },
    { label: 'Rankings', icon: '🏆' },
];

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const { user, theme } = useAuth();
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'users' | 'posts'>('all');

    const isMGT = user?.membershipType === 'MGT';
    const themeColor = isMGT ? 'emerald' : 'gold';

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            // Load recent searches from localStorage
            const recent = localStorage.getItem('recentSearches');
            if (recent) setRecentSearches(JSON.parse(recent));
        }
    }, [isOpen]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            if (query.trim().length >= 2) {
                performSearch();
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(debounce);
    }, [query]);

    const performSearch = async () => {
        setLoading(true);
        try {
            const formattedResults: SearchResult[] = [];
            const searchLower = query.toLowerCase().trim();

            // First, search navigation pages locally using fuzzy matching
            const matchingPages = NAVIGATION_PAGES.filter(page =>
                fuzzyMatch(searchLower, page.keywords) ||
                page.title.toLowerCase().includes(searchLower) ||
                searchLower.includes(page.title.toLowerCase().substring(0, Math.min(searchLower.length, page.title.length)))
            );

            matchingPages.forEach(page => {
                // Skip admin page for non-admins
                if (page.id === 'admin' && user?.role !== 'ADMIN') return;

                formattedResults.push({
                    id: page.id,
                    type: 'page',
                    title: page.title,
                    subtitle: page.subtitle,
                    icon: page.icon,
                    path: page.path,
                    action: page.action
                });
            });

            // Then search users and posts from API
            const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
            const { users, posts } = response.data;

            // Filter by active tab
            if (activeTab === 'all' || activeTab === 'users') {
                users?.forEach((u: any) => {
                    // Use nickname for @ if displayName is set, otherwise use name
                    const atName = u.displayName ? u.displayName : u.name;
                    formattedResults.push({
                        id: u.id,
                        type: 'user',
                        title: u.displayName || u.name,
                        subtitle: `@${atName} • Nível ${u.level || 1}`,
                        imageUrl: u.avatarUrl
                    });
                });
            }

            if (activeTab === 'all' || activeTab === 'posts') {
                posts?.forEach((p: any) => {
                    const authorName = p.user?.displayName || p.user?.name || 'Usuário';
                    formattedResults.push({
                        id: p.id,
                        type: 'post',
                        title: p.caption?.substring(0, 50) || 'Post',
                        subtitle: `por ${authorName}`,
                        imageUrl: p.imageUrl || p.user?.avatarUrl
                    });
                });
            }

            setResults(formattedResults);
        } catch (error) {
            console.error('Search failed', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleResultClick = (result: SearchResult) => {
        // Prevent default and stop propagation to avoid logout

        // Save to recent searches
        const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));

        // Close modal first
        onClose();

        // Use setTimeout to ensure modal is closed before navigation
        setTimeout(() => {
            switch (result.type) {
                case 'user':
                    // Navigate to user profile using navigate instead of window.location
                    navigate(`/profile?id=${result.id}`);
                    break;
                case 'post':
                    navigate(`/post/${result.id}`);
                    break;
                case 'page':
                    if (result.path) {
                        // Trigger action if specified (for modals/drawers that open on feed page)
                        if (result.action) {
                            setTimeout(() => {
                                const actionName = result.action!;
                                const event = new CustomEvent(
                                    actionName === 'shop' ? 'openShop' :
                                    actionName === 'radio' ? 'openRadio' :
                                    actionName === 'events' ? 'openEvents' :
                                    actionName === 'stories' ? 'openStories' :
                                    actionName
                                );
                                window.dispatchEvent(event);
                            }, 100);
                        }
                        navigate(result.path);
                    }
                    break;
                default:
                    break;
            }
        }, 50);
    };

    const handleSuggestionClick = (suggestion: string) => {
        setQuery(suggestion);
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem('recentSearches');
    };

    const getResultIcon = (type: string, icon?: string) => {
        if (icon) return <span className="text-lg">{icon}</span>;
        switch (type) {
            case 'user': return <User className="w-4 h-4" />;
            case 'post': return <FileText className="w-4 h-4" />;
            case 'tag': return <Hash className="w-4 h-4" />;
            case 'page': return <Navigation className="w-4 h-4" />;
            default: return <Search className="w-4 h-4" />;
        }
    };

    const getResultTypeLabel = (type: string) => {
        switch (type) {
            case 'user': return 'Usuário';
            case 'post': return 'Post';
            case 'page': return 'Página';
            default: return type;
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`w-full max-w-2xl mx-auto mt-20 rounded-2xl overflow-hidden border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-neutral-900 border-white/10'}`}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Search Input */}
                    <div className={`flex items-center gap-3 p-4 border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
                        <Search className={`w-5 h-5 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar usuários, posts, tags..."
                            className={`flex-1 bg-transparent text-lg focus:outline-none ${theme === 'light' ? 'text-gray-900 placeholder-gray-400' : 'text-white placeholder-gray-500'}`}
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="p-1 hover:bg-white/10 rounded-full">
                                <X className={`w-4 h-4 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                            </button>
                        )}
                        <button onClick={onClose} className={`px-3 py-1 text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                            Cancelar
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className={`flex border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
                        {(['all', 'users', 'posts'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === tab
                                        ? `text-${themeColor}-400 border-b-2 border-${themeColor}-400`
                                        : theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                                    }`}
                            >
                                {tab === 'all' ? 'Todos' : tab === 'users' ? 'Usuários' : 'Posts'}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="max-h-[60vh] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className={`w-8 h-8 border-2 border-${themeColor}-500 border-t-transparent rounded-full animate-spin`} />
                            </div>
                        ) : query.length < 2 ? (
                            <div className="p-4">
                                {/* Quick Suggestions */}
                                <div className="mb-6">
                                    <h3 className={`text-xs font-medium uppercase tracking-wider mb-3 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                                        <TrendingUp className="w-3 h-3 inline mr-1" />
                                        Sugestões
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {SUGGESTIONS.map(s => (
                                            <button
                                                key={s.label}
                                                onClick={() => handleSuggestionClick(s.label)}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-colors ${theme === 'light'
                                                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                        : 'bg-white/5 hover:bg-white/10 text-white'
                                                    }`}
                                            >
                                                <span>{s.icon}</span>
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Recent Searches */}
                                {recentSearches.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className={`text-xs font-medium uppercase tracking-wider ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                                                <Clock className="w-3 h-3 inline mr-1" />
                                                Buscas recentes
                                            </h3>
                                            <button
                                                onClick={clearRecentSearches}
                                                className={`text-xs ${theme === 'light' ? 'text-gray-400 hover:text-gray-600' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                Limpar
                                            </button>
                                        </div>
                                        <div className="space-y-1">
                                            {recentSearches.map((search, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setQuery(search)}
                                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/5'
                                                        }`}
                                                >
                                                    <Clock className={`w-4 h-4 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                                                    <span className={theme === 'light' ? 'text-gray-700' : 'text-white'}>{search}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : results.length === 0 ? (
                            <div className={`text-center py-12 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>Nenhum resultado para "{query}"</p>
                            </div>
                        ) : (
                            <div className="p-2">
                                {results.map(result => (
                                    <button
                                        key={`${result.type}-${result.id}`}
                                        onClick={() => handleResultClick(result)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/5'
                                            }`}
                                    >
                                        {result.imageUrl ? (
                                            <img src={result.imageUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-gray-200' : 'bg-white/10'}`}>
                                                {getResultIcon(result.type, result.icon)}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-medium truncate ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                                {result.title}
                                            </p>
                                            {result.subtitle && (
                                                <p className={`text-sm truncate ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {result.subtitle}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${result.type === 'page'
                                                ? (isMGT ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gold-500/20 text-gold-400')
                                                : (theme === 'light' ? 'bg-gray-100 text-gray-500' : 'bg-white/5 text-gray-400')
                                            }`}>
                                            {getResultTypeLabel(result.type)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
