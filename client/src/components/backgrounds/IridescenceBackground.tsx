import { useRef, useEffect } from 'react';
import { Renderer, Program, Mesh, Triangle, Vec2 } from 'ogl';

const vertex = `
attribute vec2 position;
void main(){gl_Position=vec4(position,0.0,1.0);}
`;

const fragment = `
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uMouseReactive;

#define TAU 6.28318530718

float noise(in vec2 p) {
    const vec2 d = vec2(0., 1.);
    vec2 b = floor(p), f = smoothstep(vec2(0.), vec2(1.), fract(p));
    return mix(
        mix(fract(sin(dot(b,vec2(127.1,311.7)))*43758.5453123),
            fract(sin(dot(b+d.yx,vec2(127.1,311.7)))*43758.5453123),f.x),
        mix(fract(sin(dot(b+d.xy,vec2(127.1,311.7)))*43758.5453123),
            fract(sin(dot(b+d.yy,vec2(127.1,311.7)))*43758.5453123),f.x),f.y);
}

vec3 lerp(vec3 a,vec3 b,float t){return a+(b-a)*t;}

void main(){
    vec2 uv=(gl_FragCoord.xy-0.5*uResolution.xy)/uResolution.y;
    
    // Flowing waves without mouse reactivity
    float n1 = noise(uv * 2.0 + uTime * 0.2);
    float n2 = noise(uv * 3.0 - uTime * 0.15 + 10.0);
    float n3 = noise(uv * 1.5 + uTime * 0.1 + 20.0);
    
    // Create smooth flowing patterns
    float wave1 = sin(uv.x * 3.0 + uv.y * 2.0 + uTime * 0.3 + n1 * TAU) * 0.5 + 0.5;
    float wave2 = sin(uv.x * 2.0 - uv.y * 3.0 + uTime * 0.4 + n2 * TAU) * 0.5 + 0.5;
    float wave3 = sin(length(uv) * 4.0 - uTime * 0.2 + n3 * TAU) * 0.5 + 0.5;
    
    // Blend colors based on waves
    vec3 col = uColor1 * wave1 + uColor2 * wave2 * 0.8 + uColor3 * wave3 * 0.6;
    col = col / (wave1 + wave2 * 0.8 + wave3 * 0.6 + 0.1);
    
    // Subtle grain
    col += 0.02 * noise(uv * 800.);
    
    gl_FragColor = vec4(col, 1.);
}
`;

interface IridescenceBackgroundProps {
    color1?: [number, number, number];
    color2?: [number, number, number];
    color3?: [number, number, number];
    speed?: number;
    mouseReactive?: boolean;
}

export default function IridescenceBackground({
    color1 = [0.5, 0.6, 0.8],
    color2 = [0.9, 0.4, 0.6],
    color3 = [0.6, 0.9, 0.7],
    speed = 1,
    mouseReactive = false
}: IridescenceBackgroundProps) {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;

        const renderer = new Renderer({
            dpr: Math.min(window.devicePixelRatio, 2),
            canvas
        });

        const gl = renderer.gl;
        const geometry = new Triangle(gl);

        const mouse = new Vec2(0.5, 0.5);

        const program = new Program(gl, {
            vertex,
            fragment,
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: new Vec2() },
                uMouse: { value: mouse },
                uColor1: { value: color1 },
                uColor2: { value: color2 },
                uColor3: { value: color3 },
                uMouseReactive: { value: mouseReactive ? 1.0 : 0.0 }
            }
        });

        const mesh = new Mesh(gl, { geometry, program });

        const resize = () => {
            const w = parent.clientWidth;
            const h = parent.clientHeight;
            renderer.setSize(w, h);
            program.uniforms.uResolution.value.set(w, h);
        };

        window.addEventListener('resize', resize);
        resize();

        const start = performance.now();
        let frame = 0;

        const loop = () => {
            program.uniforms.uTime.value = ((performance.now() - start) / 1000) * speed;
            program.uniforms.uColor1.value = color1;
            program.uniforms.uColor2.value = color2;
            program.uniforms.uColor3.value = color3;
            renderer.render({ scene: mesh });
            frame = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', resize);
        };
    }, [color1, color2, color3, speed, mouseReactive]);

    return <canvas ref={ref} className="w-full h-full block" />;
}
