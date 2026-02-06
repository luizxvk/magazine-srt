import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import buildInfo from '../buildInfo.json';

const CURRENT_BUILD_TIME = buildInfo.buildTime;
const CHECK_INTERVAL = 60000; // Check every 60 seconds
// Use absolute URL to ensure it works in Capacitor (which loads from Vercel)
const BUILD_INFO_URL = import.meta.env.PROD 
    ? 'https://magazine-frontend.vercel.app/buildInfo.json'
    : '/buildInfo.json';

export default function VersionUpdateNotification() {
    const { theme, user } = useAuth();
    const [hasNewVersion, setHasNewVersion] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    const checkForUpdates = useCallback(async () => {
        // Only check if user is logged in
        if (!user) return;
        
        try {
            // Fetch the latest buildInfo.json with cache busting
            const response = await fetch(`${BUILD_INFO_URL}?t=${Date.now()}`, {
                cache: 'no-store'
            });
            
            if (response.ok) {
                const latestBuildInfo = await response.json();
                
                // Compare build times - if different, there's a new version
                if (latestBuildInfo.buildTime && latestBuildInfo.buildTime !== CURRENT_BUILD_TIME) {
                    setHasNewVersion(true);
                }
            }
        } catch (error) {
            // Silently fail - network errors shouldn't affect UX
            console.debug('Version check failed:', error);
        }
    }, [user]);

    useEffect(() => {
        // Only start checking if user is logged in
        if (!user) return;
        
        // Initial check after 10 seconds
        const initialTimer = setTimeout(checkForUpdates, 10000);
        
        // Periodic checks
        const interval = setInterval(checkForUpdates, CHECK_INTERVAL);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, [checkForUpdates, user]);

    const handleUpdate = () => {
        // Force reload without cache
        window.location.reload();
    };

    const handleDismiss = () => {
        setDismissed(true);
        // Re-show after 5 minutes if still not updated
        setTimeout(() => setDismissed(false), 5 * 60 * 1000);
    };

    if (!user || !hasNewVersion || dismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -100, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -100, scale: 0.9 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-[calc(100%-2rem)]"
            >
                <div className={`relative overflow-hidden rounded-2xl ${
                    theme === 'light' 
                        ? 'bg-white border border-gray-200 shadow-xl' 
                        : 'bg-zinc-900 border border-white/10 shadow-2xl'
                }`}>
                    {/* Gradient accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500" />
                    
                    <div className="p-4">
                        <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className="shrink-0 p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30">
                                <Sparkles className="w-5 h-5 text-emerald-400" />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h3 className={`font-semibold text-sm ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                    Nova versão disponível! 🚀
                                </h3>
                                <p className={`text-xs mt-0.5 ${theme === 'light' ? 'text-gray-500' : 'text-white/60'}`}>
                                    Uma atualização da Rovex está pronta para você.
                                </p>
                                
                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-3">
                                    <button
                                        onClick={handleUpdate}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-medium transition-all hover:scale-105 shadow-lg shadow-emerald-500/25"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        Atualizar Agora
                                    </button>
                                    <button
                                        onClick={handleDismiss}
                                        className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                                            theme === 'light' 
                                                ? 'text-gray-500 hover:bg-gray-100' 
                                                : 'text-white/50 hover:bg-white/5'
                                        }`}
                                    >
                                        Depois
                                    </button>
                                </div>
                            </div>
                            
                            {/* Close */}
                            <button
                                onClick={handleDismiss}
                                className={`shrink-0 p-1.5 rounded-lg transition-colors ${
                                    theme === 'light' 
                                        ? 'text-gray-400 hover:bg-gray-100' 
                                        : 'text-white/30 hover:bg-white/5'
                                }`}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
