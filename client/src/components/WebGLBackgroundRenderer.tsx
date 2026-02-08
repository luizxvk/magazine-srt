import { useAuth } from '../context/AuthContext';
import DarkVeilBackground from './backgrounds/DarkVeilBackground';
import IridescenceBackground from './backgrounds/IridescenceBackground';

/**
 * Renders WebGL-based backgrounds that require canvas elements.
 * These are premium animated backgrounds using OGL library.
 */
export default function WebGLBackgroundRenderer() {
    const { backgroundStyle } = useAuth();

    // Only render for WebGL backgrounds
    if (!backgroundStyle) return null;

    // Extract actual background class (remove 'class:' prefix if present)
    const bgClass = backgroundStyle.startsWith('class:') 
        ? backgroundStyle.replace('class:', '') 
        : backgroundStyle;

    const renderBackground = () => {
        switch (bgClass) {
            case 'anim-dark-veil':
                return <DarkVeilBackground speed={0.3} hueShift={0} warpAmount={0.5} resolutionScale={1} />;
            case 'anim-iridescence':
                return <IridescenceBackground 
                    speed={1} 
                    mouseReactive={false}
                    color1={[0.5, 0.6, 0.8]}  // Cyan/Blue
                    color2={[0.9, 0.4, 0.6]}  // Pink
                    color3={[0.6, 0.9, 0.7]}  // Mint
                />;
            default:
                return null;
        }
    };

    const bgComponent = renderBackground();
    if (!bgComponent) return null;

    return (
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
            {bgComponent}
        </div>
    );
}
