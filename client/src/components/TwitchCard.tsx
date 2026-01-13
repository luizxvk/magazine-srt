import { useState, useEffect } from 'react';
import { Tv, Eye, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface TwitchStream {
    userId: string;
    username: string;
    displayName: string;
    gameName: string;
    title: string;
    viewerCount: number;
    thumbnailUrl: string;
    isLive: boolean;
    streamUrl: string;
}

interface TwitchCardProps {
    usernames?: string[]; // Usernames da Twitch para monitorar
}

export default function TwitchCard({ usernames = ['gaules', 'alanzoka', 'loud_coringa'] }: TwitchCardProps) {
    const { theme } = useAuth();
    const [streams, setStreams] = useState<TwitchStream[]>([]);
    const [loading, setLoading] = useState(true);

    const textMain = theme === 'light' ? 'text-gray-900' : 'text-white';
    const textSub = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
    const bgCard = theme === 'light' ? 'bg-white' : 'bg-white/5';
    const borderColor = theme === 'light' ? 'border-gray-200' : 'border-white/10';

    useEffect(() => {
        loadStreams();
        // Atualizar a cada 60 segundos
        const interval = setInterval(loadStreams, 60000);
        return () => clearInterval(interval);
    }, [usernames]);

    const loadStreams = async () => {
        try {
            const response = await api.get('/social/twitch/streams', {
                params: { usernames: usernames.join(',') },
            });
            setStreams(response.data.streams);
        } catch (error) {
            console.error('Error loading Twitch streams:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={`${bgCard} ${borderColor} border rounded-xl p-6 flex items-center justify-center`}>
                <Loader2 className="w-6 h-6 animate-spin text-[#9146FF]" />
            </div>
        );
    }

    return (
        <div className={`${bgCard} ${borderColor} border rounded-xl p-6`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#9146FF] flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
                        </svg>
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${textMain}`}>Twitch</h3>
                        <p className={`text-sm ${textSub}`}>
                            {streams.length} streams ao vivo
                        </p>
                    </div>
                </div>
            </div>

            {streams.length === 0 ? (
                <div className={`text-center py-8 ${textSub}`}>
                    <Tv className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma stream ao vivo no momento</p>
                </div>
            ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {streams.map((stream) => (
                        <a
                            key={stream.userId}
                            href={stream.streamUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`block rounded-lg overflow-hidden ${theme === 'light' ? 'bg-gray-50' : 'bg-white/5'} hover:bg-white/10 transition-colors group`}
                        >
                            {/* Thumbnail */}
                            <div className="relative aspect-video">
                                <img
                                    src={stream.thumbnailUrl}
                                    alt={stream.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                    AO VIVO
                                </div>
                                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {stream.viewerCount.toLocaleString('pt-BR')}
                                </div>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <ExternalLink className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-3">
                                <h4 className={`font-medium ${textMain} text-sm mb-1 line-clamp-2`}>
                                    {stream.title}
                                </h4>
                                <p className={`text-xs ${textSub} mb-0.5`}>
                                    {stream.displayName}
                                </p>
                                <p className={`text-xs ${textSub}`}>
                                    {stream.gameName}
                                </p>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
