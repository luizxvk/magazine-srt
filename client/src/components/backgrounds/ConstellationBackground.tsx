import { memo } from 'react';
import './backgrounds.css';

const ConstellationBackground = memo(() => {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden">
            <div className="constellation-container">
                <div id="stars" />
                <div id="stars2" />
                <div id="stars3" />
            </div>
        </div>
    );
});

ConstellationBackground.displayName = 'ConstellationBackground';

export default ConstellationBackground;
