import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

interface AdBannerProps {
    slot: string;
    format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
    className?: string;
}

// Google AdSense Publisher ID - substitua pelo seu ID real
const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-XXXXXXXXXXXXXXXX';

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

/**
 * Componente de anúncio Google AdSense
 * 
 * Para usar:
 * 1. Adicione seu ID do AdSense em VITE_ADSENSE_CLIENT_ID no .env
 * 2. Adicione o script do AdSense no index.html
 * 3. Use este componente passando o slot do anúncio
 * 
 * Exemplo:
 * <AdBanner slot="1234567890" format="rectangle" />
 */
export default function AdBanner({ slot, format = 'auto', className = '' }: AdBannerProps) {
    const { user } = useAuth();
    const adRef = useRef<HTMLDivElement>(null);
    const initialized = useRef(false);
    const isMGT = user?.membershipType === 'MGT';

    useEffect(() => {
        // Evita inicializar múltiplas vezes
        if (initialized.current) return;
        
        // Verifica se AdSense está disponível
        if (typeof window !== 'undefined' && window.adsbygoogle) {
            try {
                window.adsbygoogle.push({});
                initialized.current = true;
            } catch (error) {
                console.error('AdSense error:', error);
            }
        }
    }, []);

    // Não mostra ads para usuários Elite (benefício de assinante)
    if (user?.isElite) {
        return null;
    }

    return (
        <div 
            ref={adRef}
            className={`ad-container relative overflow-hidden rounded-xl ${className}`}
        >
            {/* Badge discreto de anúncio */}
            <div className={`absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                isMGT ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gold-500/20 text-gold-400'
            }`}>
                Anúncio
            </div>
            
            {/* Container do AdSense */}
            <ins
                className="adsbygoogle block"
                style={{ display: 'block' }}
                data-ad-client={ADSENSE_CLIENT_ID}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive="true"
            />
        </div>
    );
}

/**
 * Componente de anúncio para o Carousel (estilo visual integrado)
 * Usa o mesmo tamanho dos slides do carousel
 */
export function CarouselAdSlide({ slot }: { slot: string }) {
    const { user } = useAuth();
    const adRef = useRef<HTMLDivElement>(null);
    const initialized = useRef(false);
    const isMGT = user?.membershipType === 'MGT';

    useEffect(() => {
        if (initialized.current) return;
        if (typeof window !== 'undefined' && window.adsbygoogle) {
            try {
                window.adsbygoogle.push({});
                initialized.current = true;
            } catch (error) {
                console.error('AdSense error:', error);
            }
        }
    }, []);

    // Não mostra ads para Elite
    if (user?.isElite) {
        return null;
    }

    return (
        <div className="shrink-0 w-full h-full relative bg-gradient-to-br from-black via-neutral-900 to-black flex items-center justify-center">
            {/* Overlay gradiente para combinar com o carousel */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            
            {/* Badge de Patrocinado */}
            <div className={`absolute top-4 left-4 z-20 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${
                isMGT ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-gold-500/20 border-gold-500/30 text-gold-300'
            }`}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Patrocinado
            </div>

            {/* Container do AdSense centralizado */}
            <div ref={adRef} className="relative z-10 w-full max-w-2xl mx-auto px-8">
                <ins
                    className="adsbygoogle block"
                    style={{ display: 'block', width: '100%', height: '250px' }}
                    data-ad-client={ADSENSE_CLIENT_ID}
                    data-ad-slot={slot}
                    data-ad-format="rectangle"
                />
            </div>

            {/* Texto informativo opcional */}
            <div className="absolute bottom-6 left-0 right-0 text-center z-20">
                <p className={`text-xs ${isMGT ? 'text-emerald-400/60' : 'text-gold-400/60'}`}>
                    Assine o Elite para remover anúncios
                </p>
            </div>
        </div>
    );
}
