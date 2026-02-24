/**
 * Rainbow Skies Background
 * Colorful light rays sliding on gradient background
 * Used for anim-rainbow-skies
 */

import '../../styles/theme-pack-animations.css';

const RainbowSkiesBackground: React.FC = () => {
    // Create 25 rainbow rays
    const rays = Array.from({ length: 25 }, (_, i) => (
        <div key={i} className="rainbow-ray" />
    ));

    return (
        <div className="anim-rainbow-skies" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(315deg, rgba(232,121,249,1) 10%, rgba(96,165,250,1) 50%, rgba(94,234,212,1) 90%)' }}>
            <div className="rainbow-rays" style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                {rays}
            </div>
            <div className="rainbow-h" />
            <div className="rainbow-v" />
        </div>
    );
};

export default RainbowSkiesBackground;
