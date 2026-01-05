import { Star, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
    user?: {
        id: string;
        name: string;
        displayName?: string;
        avatarUrl?: string;
    };
}

interface PhotoCatalogCardProps {
    photos?: CatalogPhoto[];
    onViewAll?: () => void;
}

export default function PhotoCatalogCard({ photos = [], onViewAll }: PhotoCatalogCardProps) {
    const { user, theme } = useAuth();
    const navigate = useNavigate();
    const isMGT = user?.membershipType === 'MGT';

    // Theme colors
    const themeBorder = isMGT ? 'border-emerald-500/30' : 'border-gold-500/30';
    const themeAccent = isMGT ? 'text-emerald-500' : 'text-gold-500';
    const themeGlow = isMGT
        ? 'shadow-[0_0_20px_rgba(16,185,129,0.2)]'
        : 'shadow-[0_0_20px_rgba(212,175,55,0.2)]';
    const bgColor = theme === 'light' ? 'bg-white/80' : 'bg-black/40';

    // Show up to 4 preview photos
    const previewPhotos = photos.slice(0, 4);
    const totalCount = photos.length;

    return (
        <div className={`rounded-2xl border ${themeBorder} ${bgColor} backdrop-blur-xl ${themeGlow} overflow-hidden transition-all duration-300 hover:scale-[1.01]`}>
            {/* Header */}
            <div className="p-4 flex justify-between items-center border-b border-white/10">
                <div className="flex items-center gap-2">
                    <Star className={`w-4 h-4 ${themeAccent}`} />
                    <h3 className={`font-serif text-lg ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        Seu Catálogo de Fotos
                    </h3>
                </div>
                <span className="text-xs text-gray-500">{totalCount} fotos</span>
            </div>

            {/* Photo Grid Preview (Google Photos style - respects aspect ratios) */}
            {previewPhotos.length > 0 ? (
                <div className="p-3 grid grid-cols-2 gap-2">
                    {previewPhotos.map((photo, index) => (
                        <div
                            key={photo.id}
                            className={`relative rounded-lg overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02] ${index === 0 ? 'row-span-2' : ''
                                }`}
                        >
                            <img
                                src={photo.imageUrl}
                                alt={photo.title || 'Catalog photo'}
                                className="w-full h-full object-cover"
                                style={{
                                    aspectRatio: index === 0 ? '3/4' : '4/3',
                                    minHeight: index === 0 ? '180px' : '85px'
                                }}
                            />
                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <Eye className="w-6 h-6 text-white" />
                            </div>
                            {/* Favorite badge */}
                            {photo.isFavorite && (
                                <div className="absolute top-2 right-2">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                </div>
                            )}
                            {/* Privacy badge */}
                            {!photo.isPublic && (
                                <div className="absolute top-2 left-2 bg-black/60 rounded-full p-1">
                                    <EyeOff className="w-3 h-3 text-white/80" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-8 text-center">
                    <Star className="w-12 h-12 text-gray-600 mx-auto mb-3 opacity-50" />
                    <p className="text-gray-500 text-sm mb-4">
                        Nenhuma foto no catálogo ainda
                    </p>
                    <button
                        onClick={() => navigate('/catalog')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider ${isMGT
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-gold-500 hover:bg-gold-400 text-black'
                            } transition-colors`}
                    >
                        Adicionar Primeira Foto
                    </button>
                </div>
            )}

            {/* View All Button */}
            {previewPhotos.length > 0 && (
                <button
                    onClick={onViewAll || (() => navigate('/catalog'))}
                    className={`w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold ${themeAccent} hover:bg-white/5 transition-colors border-t border-white/10`}
                >
                    Ver Catálogo Completo
                    <ChevronRight className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
