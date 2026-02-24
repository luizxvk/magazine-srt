/**
 * Infinite Triangles Background
 * Hexagonal grid with infinite triangles in accent color
 * Used for anim-infinite-triangles
 */

import '../../styles/theme-pack-animations.css';

const InfiniteTrianglesBackground: React.FC = () => {
    // Create 120 triangle shapes (reduced for performance in preview)
    const shapes = Array.from({ length: 120 }, (_, i) => (
        <div key={i} className="triangle-shape">
            <svg viewBox="0 0 100 115" preserveAspectRatio="xMidYMin slice">
                <polygon className="tri-accent" points="50 57.5, 50 57.5, 50 57.5">
                    <animate
                        attributeName="points"
                        repeatCount="indefinite"
                        dur="4s"
                        begin="0s"
                        from="50 57.5, 50 57.5, 50 57.5"
                        to="50 -75, 175 126, -75 126"
                    />
                </polygon>
                <polygon className="tri-secondary" points="50 57.5, 50 57.5, 50 57.5">
                    <animate
                        attributeName="points"
                        repeatCount="indefinite"
                        dur="4s"
                        begin="1s"
                        from="50 57.5, 50 57.5, 50 57.5"
                        to="50 -75, 175 126, -75 126"
                    />
                </polygon>
                <polygon className="tri-tertiary" points="50 57.5, 50 57.5, 50 57.5">
                    <animate
                        attributeName="points"
                        repeatCount="indefinite"
                        dur="4s"
                        begin="2s"
                        from="50 57.5, 50 57.5, 50 57.5"
                        to="50 -75, 175 126, -75 126"
                    />
                </polygon>
                <polygon className="tri-quaternary" points="50 57.5, 50 57.5, 50 57.5">
                    <animate
                        attributeName="points"
                        repeatCount="indefinite"
                        dur="4s"
                        begin="3s"
                        from="50 57.5, 50 57.5, 50 57.5"
                        to="50 -75, 175 126, -75 126"
                    />
                </polygon>
            </svg>
        </div>
    ));

    return (
        <div className="anim-infinite-triangles" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, var(--accent-color, #d4af37) 0%, rgba(212,175,55,0.3) 50%, #000 100%)' }}>
            <div className="triangles-overlay" />
            <div className="triangles-container" style={{ position: 'absolute', inset: 0 }}>
                {shapes}
            </div>
        </div>
    );
};

export default InfiniteTrianglesBackground;
