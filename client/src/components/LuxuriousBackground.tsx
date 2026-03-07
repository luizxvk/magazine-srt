import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function LuxuriousBackground() {
    const { user, theme, backgroundStyle } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const isLight = theme === 'light';

    // Don't render if user has a custom background equipped
    if (backgroundStyle) {
        return null;
    }

    // Theme Colors
    const orb1Color = isLight
        ? (isMGT ? 'bg-tier-std-500/10' : 'bg-gold-500/10')
        : (isMGT ? 'bg-tier-std-600/20' : 'bg-gold-500/20');

    const orb2Color = isLight
        ? (isMGT ? 'bg-tier-std-600/5' : 'bg-gold-600/5')
        : (isMGT ? 'bg-tier-std-800/10' : 'bg-gold-600/10');

    const orb3Color = isLight
        ? (isMGT ? 'bg-tier-std-400/5' : 'bg-gold-400/5')
        : (isMGT ? 'bg-tier-std-500/10' : 'bg-gold-400/10');

    const particleColor = isLight
        ? (isMGT ? 'bg-tier-std-600' : 'bg-gold-600')
        : (isMGT ? 'bg-tier-std-400' : 'bg-gold-300');

    const bgGradient = isLight
        ? 'bg-[radial-gradient(circle_at_50%_50%,_#ffffff_0%,_#f3f4f6_100%)]'
        : 'bg-[#08081B]'; // Figma design background color

    return (
        <div className={`fixed inset-0 z-[-1] overflow-hidden transition-colors duration-500`}>
            {/* Deep Ambient Gradient Base */}
            <div className={`absolute inset-0 ${bgGradient} transition-all duration-500`} />

            {/* Floating Orbs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: isLight ? [0.5, 0.7, 0.5] : [0.3, 0.5, 0.3],
                    x: [0, 100, 0],
                    y: [0, -50, 0],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className={`absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] ${orb1Color} rounded-full blur-[120px] transition-colors duration-1000`}
            />

            <motion.div
                animate={{
                    scale: [1, 1.5, 1],
                    opacity: isLight ? [0.4, 0.6, 0.4] : [0.2, 0.4, 0.2],
                    x: [0, -100, 0],
                    y: [0, 100, 0],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
                className={`absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] ${orb2Color} rounded-full blur-[150px] transition-colors duration-1000`}
            />

            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: isLight ? [0.3, 0.5, 0.3] : [0.1, 0.3, 0.1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 5
                }}
                className={`absolute top-[40%] left-[30%] w-[30vw] h-[30vw] ${orb3Color} rounded-full blur-[100px] transition-colors duration-1000`}
            />

            {/* Subtle Noise Overlay for Texture */}
            <div className={`absolute inset-0 ${isLight ? 'opacity-[0.05]' : 'opacity-[0.03]'} mix-blend-overlay pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E')]`} />

            {/* Luxury Pattern Overlay */}
            <div className={`absolute inset-0 ${isLight ? 'opacity-[0.03] invert' : 'opacity-[0.05]'} pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay`} />

            {/* Twinkling Particles */}
            <div className="absolute inset-0">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className={`absolute w-1 h-1 ${particleColor} rounded-full transition-colors duration-1000`}
                        initial={{
                            x: Math.random() * window.innerWidth,
                            y: Math.random() * window.innerHeight,
                            opacity: Math.random() * 0.5 + 0.2,
                            scale: Math.random() * 0.5 + 0.5,
                        }}
                        animate={{
                            y: [null, Math.random() * -100],
                            opacity: [null, 0, null],
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 5
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
