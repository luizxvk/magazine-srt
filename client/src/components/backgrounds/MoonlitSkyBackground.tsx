/**
 * Moonlit Sky Background
 * Night sky with moon, stars, and clouds
 * Used for anim-moonlit-sky
 */

import '../../styles/theme-pack-animations.css';

const MoonlitSkyBackground: React.FC = () => {
    return (
        <div className="anim-moonlit-sky" style={{ position: 'absolute', inset: 0, background: '#000011' }}>
            <div className="moonlit-container" style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                <img 
                    src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/1231630/moon2.png" 
                    alt="Moon"
                    className="moonlit-moon"
                    style={{ position: 'absolute', right: '5%', top: '5%', height: '40%', maxHeight: '200px', zIndex: 4, opacity: 0.9 }}
                />
                <div className="moonlit-stars" style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'black url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/1231630/stars.png) repeat' }} />
                <div className="moonlit-twinkling" style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'transparent url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/1231630/twinkling.png) repeat', backgroundSize: '1000px 1000px', animation: 'moonlit-move-background 70s linear infinite' }} />
                <div className="moonlit-clouds" style={{ position: 'absolute', inset: 0, zIndex: 3, background: 'transparent url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/1231630/clouds_repeat.png) repeat', backgroundSize: '1000px 1000px', animation: 'moonlit-move-background 150s linear infinite' }} />
            </div>
        </div>
    );
};

export default MoonlitSkyBackground;
