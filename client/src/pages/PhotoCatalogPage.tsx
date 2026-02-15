import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import LuxuriousBackground from '../components/LuxuriousBackground';
import api from '../services/api';
import { Camera, Filter, Globe, Star, Trash2, User, Grid, LayoutList, LayoutGrid, Image, ChevronDown, X } from 'lucide-react';
import PhotoUploadModal from '../components/PhotoUploadModal';
import ConfirmModal from '../components/ConfirmModal';
import GradientText from '../components/GradientText';

interface CatalogPhoto {
    id: string;
    imageUrl: string;
    title?: string;
    category?: string;
    carValue?: string;
    eventType?: string;
    carBrand?: string;
    isPublic: boolean;
    isFavorite: boolean;
    createdAt: string;
    orientation?: 'landscape' | 'portrait' | 'square';
    user?: {
        id: string;
        name: string;
        displayName?: string;
        avatarUrl?: string;
    };
}

// Photo Card Component with dynamic aspect ratio
function PhotoCard({ 
    photo, 
    onToggleFavorite, 
    onDelete, 
    showActions = false,
    userId,
    onClick
}: { 
    photo: CatalogPhoto; 
    onToggleFavorite: (id: string, e: React.MouseEvent) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    showActions?: boolean;
    userId?: string;
    onClick?: () => void;
}) {
    const [orientation, setOrientation] = useState<'landscape' | 'portrait' | 'square'>(photo.orientation || 'square');
    const [loaded, setLoaded] = useState(false);

    const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        const ratio = img.naturalWidth / img.naturalHeight;
        if (ratio > 1.2) {
            setOrientation('landscape');
        } else if (ratio < 0.8) {
            setOrientation('portrait');
        } else {
            setOrientation('square');
        }
        setLoaded(true);
    }, []);

    // Determine grid span based on orientation
    const getGridClasses = () => {
        switch (orientation) {
            case 'landscape':
                return 'col-span-2 row-span-1';
            case 'portrait':
                return 'col-span-1 row-span-1'; // Changed from row-span-2 to prevent overlapping
            default:
                return 'col-span-1 row-span-1';
        }
    };

    // Determine aspect ratio style
    const getAspectStyle = () => {
        switch (orientation) {
            case 'landscape':
                return { aspectRatio: '16/9' };
            case 'portrait':
                return { aspectRatio: '3/4' };
            default:
                return { aspectRatio: '1/1' };
        }
    };

    return (
        <div className={`${getGridClasses()} p-1`}>
        <div
            onClick={onClick}
            className={`relative group rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 h-full ${!loaded ? 'animate-pulse bg-white/5' : ''} ring-2 ring-transparent hover:ring-white/20`}
            style={getAspectStyle()}
        >
            {/* Image */}
            <img
                src={photo.imageUrl}
                alt={photo.title || 'Foto do catálogo'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onLoad={handleImageLoad}
                style={{ opacity: loaded ? 1 : 0 }}
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                <div className="flex justify-between items-start">
                    <div className="flex gap-2">
                        {photo.isFavorite && (
                            <span className="p-1.5 bg-yellow-500/20 text-yellow-500 rounded-full backdrop-blur-sm">
                                <Star className="w-3 h-3 fill-current" />
                            </span>
                        )}
                        {photo.isPublic && (
                            <span className="p-1.5 bg-white/20 text-white rounded-full backdrop-blur-sm">
                                <Globe className="w-3 h-3" />
                            </span>
                        )}
                    </div>

                    {showActions && (
                        <div className="flex gap-2">
                            <button
                                onClick={(e) => onToggleFavorite(photo.id, e)}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors"
                            >
                                <Star className={`w-4 h-4 ${photo.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                            </button>
                            {photo.user?.id === userId && (
                                <button
                                    onClick={(e) => onDelete(photo.id, e)}
                                    className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-full text-red-400 backdrop-blur-sm transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    {photo.title && (
                        <h3 className="text-white font-bold text-sm line-clamp-1">{photo.title}</h3>
                    )}
                    {photo.user && (
                        <div className="flex items-center gap-2 mt-1.5 mb-1">
                            {photo.user.avatarUrl ? (
                                <img 
                                    src={photo.user.avatarUrl} 
                                    alt={photo.user.displayName || photo.user.name}
                                    className="w-5 h-5 rounded-full object-cover border border-white/30"
                                />
                            ) : (
                                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                    <User className="w-3 h-3 text-white/70" />
                                </div>
                            )}
                            <span className="text-xs text-white/80 font-medium">
                                {photo.user.displayName || photo.user.name}
                            </span>
                        </div>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">
                        {photo.category && (
                            <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-white/90">
                                {photo.category}
                            </span>
                        )}
                        {photo.carBrand && (
                            <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-white/90">
                                {photo.carBrand}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
}

// Grid View Card - Equal sized squares
function GridPhotoCard({ 
    photo, 
    onToggleFavorite, 
    onDelete, 
    showActions = false,
    userId,
    onClick
}: { 
    photo: CatalogPhoto; 
    onToggleFavorite: (id: string, e: React.MouseEvent) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    showActions?: boolean;
    userId?: string;
    onClick?: () => void;
}) {
    return (
        <div className="p-1">
        <div onClick={onClick} className="relative group rounded-xl overflow-hidden cursor-pointer transition-all duration-300 aspect-square ring-2 ring-transparent hover:ring-white/20">
            <img
                src={photo.imageUrl}
                alt={photo.title || 'Foto do catálogo'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                {photo.title && (
                    <h3 className="text-white font-bold text-sm line-clamp-1">{photo.title}</h3>
                )}
                {showActions && (
                    <div className="absolute top-2 right-2 flex gap-1">
                        <button
                            onClick={(e) => onToggleFavorite(photo.id, e)}
                            className="p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-sm transition-colors"
                        >
                            <Star className={`w-3 h-3 ${photo.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </button>
                        {photo.user?.id === userId && (
                            <button
                                onClick={(e) => onDelete(photo.id, e)}
                                className="p-1.5 bg-red-500/40 hover:bg-red-500/60 rounded-full text-white backdrop-blur-sm transition-colors"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
        </div>
    );
}

// List View Card - Horizontal layout with details
function ListPhotoCard({ 
    photo, 
    onToggleFavorite, 
    onDelete, 
    showActions = false,
    userId,
    isMGT,
    onClick
}: { 
    photo: CatalogPhoto; 
    onToggleFavorite: (id: string, e: React.MouseEvent) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    showActions?: boolean;
    userId?: string;
    isMGT?: boolean;
    onClick?: () => void;
}) {
    const themeBorder = isMGT ? 'border-emerald-500/30' : 'border-gold-500/30';
    
    return (
        <div onClick={onClick} className={`flex gap-4 p-4 rounded-2xl bg-white/5 border ${themeBorder} backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer group`}>
            <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 rounded-xl overflow-hidden">
                <img
                    src={photo.imageUrl}
                    alt={photo.title || 'Foto do catálogo'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
            </div>
            <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                    <h3 className="text-white font-bold text-lg line-clamp-1 mb-1">
                        {photo.title || 'Sem título'}
                    </h3>
                    {photo.user && (
                        <div className="flex items-center gap-2 mb-2">
                            {photo.user.avatarUrl ? (
                                <img 
                                    src={photo.user.avatarUrl} 
                                    alt={photo.user.displayName || photo.user.name}
                                    className="w-6 h-6 rounded-full object-cover border border-white/30"
                                />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                    <User className="w-4 h-4 text-white/70" />
                                </div>
                            )}
                            <span className="text-sm text-gray-400">
                                {photo.user.displayName || photo.user.name}
                            </span>
                        </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                        {photo.category && (
                            <span className="text-xs uppercase tracking-wider bg-white/10 px-2 py-1 rounded-full text-gray-300">
                                {photo.category}
                            </span>
                        )}
                        {photo.carBrand && (
                            <span className="text-xs uppercase tracking-wider bg-white/10 px-2 py-1 rounded-full text-gray-300">
                                {photo.carBrand}
                            </span>
                        )}
                        {photo.isFavorite && (
                            <span className="text-xs bg-yellow-500/20 px-2 py-1 rounded-full text-yellow-400 flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current" /> Favorito
                            </span>
                        )}
                        {photo.isPublic && (
                            <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-300 flex items-center gap-1">
                                <Globe className="w-3 h-3" /> Público
                            </span>
                        )}
                    </div>
                </div>
                {showActions && (
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={(e) => onToggleFavorite(photo.id, e)}
                            className={`p-2 rounded-lg transition-colors ${photo.isFavorite ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                            <Star className={`w-4 h-4 ${photo.isFavorite ? 'fill-current' : ''}`} />
                        </button>
                        {photo.user?.id === userId && (
                            <button
                                onClick={(e) => onDelete(photo.id, e)}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PhotoCatalogPage() {
    const { user, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

    // Theme setup
    const themeColors = isMGT ? 'text-emerald-500' : 'text-gold-500';


    const [activeTab] = useState<'my' | 'explore'>('my');
    const [photos, setPhotos] = useState<CatalogPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'masonry' | 'grid' | 'list'>('masonry');
    
    // Delete confirmation modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);
    
    // Expanded photo state (Google Photos style)
    const [expandedPhoto, setExpandedPhoto] = useState<CatalogPhoto | null>(null);

    // Filters
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [onlyFavorites, setOnlyFavorites] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Dynamic Filter Options
    const [filterOptions, setFilterOptions] = useState({
        categories: [] as string[],
        carBrands: [] as string[]
    });

    const fetchFilters = async () => {
        try {
            const response = await api.get('/catalog/filters');
            setFilterOptions(response.data);
        } catch (error) {
            console.error('Failed to fetch filters', error);
        }
    };

    const fetchPhotos = async () => {
        try {
            setLoading(true);
            const endpoint = activeTab === 'my' ? '/catalog' : '/catalog/public';
            const params: any = {};

            if (activeTab === 'explore') {
                params.limit = 50;
            }
            if (selectedCategory) params.category = selectedCategory;
            if (selectedBrand) params.carBrand = selectedBrand;
            if (activeTab === 'my' && onlyFavorites) params.isFavorite = 'true';

            const response = await api.get(endpoint, { params });
            setPhotos(response.data);
        } catch (error) {
            console.error('Failed to fetch photos', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPhotos();
        fetchFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, selectedCategory, selectedBrand, onlyFavorites]);

    const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.post(`/catalog/${id}/favorite`);
            setPhotos(prev => prev.map(p =>
                p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
            ));
        } catch (error) {
            console.error('Failed to toggle favorite', error);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setPhotoToDelete(id);
        setDeleteModalOpen(true);
    };
    
    const confirmDelete = async () => {
        if (!photoToDelete) return;
        
        try {
            await api.delete(`/catalog/${photoToDelete}`);
            setPhotos(prev => prev.filter(p => p.id !== photoToDelete));
        } catch (error) {
            console.error('Failed to delete photo', error);
        } finally {
            setPhotoToDelete(null);
        }
    };

    return (
        <div className="min-h-screen text-white font-sans selection:bg-gold-500/30">
            <LuxuriousBackground />
            <Header />

            <div className="pt-32 sm:pt-36 md:pt-40 pb-20 px-3 sm:px-4 md:px-6 max-w-7xl mx-auto">
                <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 backdrop-blur-xl">
                <PhotoUploadModal
                    isOpen={isUploadOpen}
                    onClose={() => setIsUploadOpen(false)}
                    onSuccess={fetchPhotos}
                />

                {/* Header Section */}
                <div className="flex flex-col gap-6 mb-8 mt-4 md:mt-0">
                    {/* Title - Padronizado como Social */}
                    <div className={`flex items-center gap-4 p-4 rounded-xl ${
                        theme === 'light' 
                            ? (isMGT ? 'bg-emerald-100' : 'bg-amber-100') 
                            : (isMGT ? 'bg-emerald-950/30' : 'bg-gold-950/30')
                    } border ${isMGT ? 'border-emerald-500/20' : 'border-gold-500/20'}`}>
                        <div className={`p-3 rounded-xl ${isMGT ? 'bg-emerald-500/20' : 'bg-gold-500/20'}`}>
                            <Image className={`w-6 h-6 ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`} />
                        </div>
                        <div>
                            <h2 className={`text-xl font-bold`}>
                                <GradientText fallbackClassName={theme === 'light' ? 'text-gray-900' : 'text-white'}>Catálogo de Fotos</GradientText>
                            </h2>
                            <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                Explore e compartilhe momentos exclusivos.
                            </p>
                        </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex flex-wrap gap-3 items-center justify-between">
                        <div className="flex gap-3 items-center">
                            {/* View Mode Toggle */}
                            <div className={`flex rounded-lg p-1 ${isMGT ? 'bg-emerald-500/10' : 'bg-gold-500/10'}`}>
                                <button
                                    onClick={() => setViewMode('masonry')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'masonry' 
                                        ? (isMGT ? 'bg-emerald-500 text-white' : 'bg-gold-500 text-black') 
                                        : (isMGT ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-gold-400 hover:bg-gold-500/20')}`}
                                    title="Visualização Masonry"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'grid' 
                                        ? (isMGT ? 'bg-emerald-500 text-white' : 'bg-gold-500 text-black') 
                                        : (isMGT ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-gold-400 hover:bg-gold-500/20')}`}
                                    title="Visualização em Grade"
                                >
                                    <Grid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'list' 
                                        ? (isMGT ? 'bg-emerald-500 text-white' : 'bg-gold-500 text-black') 
                                        : (isMGT ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-gold-400 hover:bg-gold-500/20')}`}
                                    title="Visualização em Lista"
                                >
                                    <LayoutList className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Filter Button */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center gap-2 p-2 px-3 rounded-lg transition-colors ${
                                        showFilters || selectedCategory || selectedBrand || onlyFavorites
                                            ? (isMGT ? 'bg-emerald-500 text-white' : 'bg-gold-500 text-black')
                                            : (isMGT ? 'bg-gray-800 text-emerald-500 hover:bg-gray-700' : 'bg-gray-800 text-gold-500 hover:bg-gray-700')
                                    }`}
                                >
                                    <Filter className="w-4 h-4" />
                                    <span className="text-sm hidden sm:inline">Filtros</span>
                                    {(selectedCategory || selectedBrand || onlyFavorites) && (
                                        <span className={`w-2 h-2 rounded-full ${isMGT ? 'bg-white' : 'bg-black'}`} />
                                    )}
                                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Filter Dropdown */}
                                {showFilters && (
                                    <div className={`absolute top-full left-0 mt-2 w-72 p-4 rounded-xl shadow-2xl z-50 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900 border-white/10'} border backdrop-blur-xl`}>
                                        <div className="space-y-4">
                                            {/* Category Filter */}
                                            <div>
                                                <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                                    Categoria
                                                </label>
                                                <select
                                                    value={selectedCategory}
                                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                                    className={`w-full mt-1 p-2 rounded-lg ${theme === 'light' ? 'bg-gray-100 text-gray-900' : 'bg-white/10 text-white'} border-none outline-none`}
                                                >
                                                    <option value="">Todas</option>
                                                    {filterOptions.categories.map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Brand Filter */}
                                            <div>
                                                <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                                    Marca
                                                </label>
                                                <select
                                                    value={selectedBrand}
                                                    onChange={(e) => setSelectedBrand(e.target.value)}
                                                    className={`w-full mt-1 p-2 rounded-lg ${theme === 'light' ? 'bg-gray-100 text-gray-900' : 'bg-white/10 text-white'} border-none outline-none`}
                                                >
                                                    <option value="">Todas</option>
                                                    {filterOptions.carBrands.map(brand => (
                                                        <option key={brand} value={brand}>{brand}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Favorites Toggle */}
                                            <div className="flex items-center justify-between">
                                                <label className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                                                    Apenas Favoritos
                                                </label>
                                                <button
                                                    onClick={() => setOnlyFavorites(!onlyFavorites)}
                                                    className={`w-12 h-6 rounded-full transition-colors ${onlyFavorites ? (isMGT ? 'bg-emerald-500' : 'bg-gold-500') : 'bg-gray-600'}`}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${onlyFavorites ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                                </button>
                                            </div>

                                            {/* Clear Filters */}
                                            {(selectedCategory || selectedBrand || onlyFavorites) && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedCategory('');
                                                        setSelectedBrand('');
                                                        setOnlyFavorites(false);
                                                    }}
                                                    className="w-full p-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Limpar Filtros
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Add Photo Button */}
                        <button
                            onClick={() => setIsUploadOpen(true)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider text-white transition-all ${isMGT ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-gold-500 hover:bg-gold-400'}`}
                        >
                            <Camera className="w-4 h-4" />
                            <span className="hidden sm:inline">Adicionar Foto</span>
                        </button>
                    </div>

                    {/* Active Filters Pills */}
                    {(selectedCategory || selectedBrand || onlyFavorites) && (
                        <div className="flex flex-wrap gap-2">
                            {selectedCategory && (
                                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${isMGT ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gold-500/20 text-gold-400'}`}>
                                    {selectedCategory}
                                    <button onClick={() => setSelectedCategory('')}><X className="w-3 h-3" /></button>
                                </span>
                            )}
                            {selectedBrand && (
                                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${isMGT ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gold-500/20 text-gold-400'}`}>
                                    {selectedBrand}
                                    <button onClick={() => setSelectedBrand('')}><X className="w-3 h-3" /></button>
                                </span>
                            )}
                            {onlyFavorites && (
                                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-yellow-500/20 text-yellow-400`}>
                                    <Star className="w-3 h-3 fill-current" /> Favoritos
                                    <button onClick={() => setOnlyFavorites(false)}><X className="w-3 h-3" /></button>
                                </span>
                            )}
                        </div>
                    )}
                </div>
                {/* (Lines 151-207 omitted for brevity, keeping original logic) */}
                {/* Gallery Grid - Responsive with Dynamic Aspect Ratios */}
                <div className={`
                    ${viewMode === 'masonry' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 auto-rows-[180px]' : ''}
                    ${viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3' : ''}
                    ${viewMode === 'list' ? 'flex flex-col gap-4 max-w-3xl mx-auto' : ''}
                `}>
                    {photos.map((photo) => (
                        viewMode === 'list' ? (
                            <ListPhotoCard
                                key={photo.id}
                                photo={photo}
                                onToggleFavorite={handleToggleFavorite}
                                onDelete={handleDelete}
                                showActions={activeTab === 'my'}
                                userId={user?.id}
                                isMGT={isMGT}
                                onClick={() => setExpandedPhoto(photo)}
                            />
                        ) : viewMode === 'grid' ? (
                            <GridPhotoCard
                                key={photo.id}
                                photo={photo}
                                onToggleFavorite={handleToggleFavorite}
                                onDelete={handleDelete}
                                showActions={activeTab === 'my'}
                                userId={user?.id}
                                onClick={() => setExpandedPhoto(photo)}
                            />
                        ) : (
                            <PhotoCard
                                key={photo.id}
                                photo={photo}
                                onToggleFavorite={handleToggleFavorite}
                                onDelete={handleDelete}
                                showActions={activeTab === 'my'}
                                userId={user?.id}
                                onClick={() => setExpandedPhoto(photo)}
                            />
                        )
                    ))}
                </div>

                {/* Empty State */}
                {!loading && photos.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className={`p-6 rounded-full bg-white/5 border border-white/10 mb-4 ${themeColors}`}>
                            <Camera className="w-12 h-12 opacity-50" />
                        </div>
                        <h3 className={`text-xl font-serif mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            {activeTab === 'my' ? 'Seu catálogo está vazio' : 'Nenhuma foto encontrada'}
                        </h3>
                        <p className="text-gray-500 max-w-sm mb-6">
                            {activeTab === 'my'
                                ? 'Comece a adicionar suas melhores fotos para criar sua coleção exclusiva.'
                                : 'Seja o primeiro a compartilhar uma foto nesta categoria.'}
                        </p>
                        {activeTab === 'my' && (
                            <button
                                onClick={() => setIsUploadOpen(true)}
                                className={`px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-widest text-white ${isMGT ? 'bg-emerald-600' : 'bg-gold-500'}`}
                            >
                                Adicionar Foto
                            </button>
                        )}
                    </div>
                )}
                
                {/* Delete Confirmation Modal */}
                <ConfirmModal
                    isOpen={deleteModalOpen}
                    onClose={() => {
                        setDeleteModalOpen(false);
                        setPhotoToDelete(null);
                    }}
                    onConfirm={confirmDelete}
                    title="Excluir foto"
                    message="Tem certeza que deseja excluir esta foto? Esta ação não pode ser desfeita."
                    confirmText="Excluir"
                    cancelText="Cancelar"
                    isDestructive={true}
                />
                </div>

                {/* Expanded Photo Modal - Google Photos Style */}
                {expandedPhoto && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        onClick={() => setExpandedPhoto(null)}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/95 backdrop-blur-sm animate-fade-in" />
                        
                        {/* Close Button */}
                        <button
                            onClick={() => setExpandedPhoto(null)}
                            className="absolute top-4 right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Photo Info - Top Left */}
                        <div className="absolute top-4 left-4 z-10">
                            {expandedPhoto.title && (
                                <h2 className="text-white font-bold text-xl mb-2">{expandedPhoto.title}</h2>
                            )}
                            {expandedPhoto.user && (
                                <div className="flex items-center gap-2">
                                    {expandedPhoto.user.avatarUrl ? (
                                        <img 
                                            src={expandedPhoto.user.avatarUrl} 
                                            alt={expandedPhoto.user.displayName || expandedPhoto.user.name}
                                            className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                            <User className="w-4 h-4 text-white/70" />
                                        </div>
                                    )}
                                    <span className="text-white/80 font-medium">
                                        {expandedPhoto.user.displayName || expandedPhoto.user.name}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Tags - Bottom Left */}
                        <div className="absolute bottom-4 left-4 z-10 flex flex-wrap gap-2">
                            {expandedPhoto.category && (
                                <span className={`text-xs uppercase tracking-wider px-3 py-1 rounded-full ${isMGT ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gold-500/20 text-gold-400'}`}>
                                    {expandedPhoto.category}
                                </span>
                            )}
                            {expandedPhoto.carBrand && (
                                <span className={`text-xs uppercase tracking-wider px-3 py-1 rounded-full ${isMGT ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gold-500/20 text-gold-400'}`}>
                                    {expandedPhoto.carBrand}
                                </span>
                            )}
                        </div>

                        {/* Actions - Bottom Right */}
                        <div className="absolute bottom-4 right-4 z-10 flex gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleFavorite(expandedPhoto.id, e);
                                    setExpandedPhoto(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
                                }}
                                className={`p-3 rounded-full transition-colors ${
                                    expandedPhoto.isFavorite 
                                        ? 'bg-yellow-500/20 text-yellow-400' 
                                        : 'bg-white/10 hover:bg-white/20 text-white'
                                }`}
                            >
                                <Star className={`w-5 h-5 ${expandedPhoto.isFavorite ? 'fill-current' : ''}`} />
                            </button>
                        </div>

                        {/* Main Image Container */}
                        <div 
                            className="relative max-w-[90vw] max-h-[85vh] animate-scale-in"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={expandedPhoto.imageUrl}
                                alt={expandedPhoto.title || 'Foto expandida'}
                                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
