import { useEffect, useState } from 'react';

/**
 * Flutter-style debug banner that appears in top-right corner
 * Only visible in development mode
 */
export default function DevBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Only show in development
        const isDev = import.meta.env.MODE === 'development' ||
            import.meta.env.DEV === true ||
            !import.meta.env.PROD;
        setIsVisible(isDev);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed top-0 right-0 z-[9999] overflow-hidden pointer-events-none select-none">
            <div
                className="bg-gradient-to-r from-red-600 to-red-500 text-white text-[10px] font-bold uppercase tracking-widest py-1 px-8 shadow-lg"
                style={{
                    transform: 'rotate(45deg) translateX(25%) translateY(-25%)',
                    transformOrigin: 'center',
                    width: '150px',
                    textAlign: 'center',
                    position: 'absolute',
                    top: '20px',
                    right: '-35px',
                }}
            >
                DEV
            </div>
        </div>
    );
}
