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
                    color={[1, 1, 1]}  // Cor branca padrão (iridescente puro)
                    speed={1.0}
                    amplitude={0.1}
                    mouseReact={true}
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
