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
    vec2 mouse=uMouse-0.5;
    float dist=length(uv-mouse)*2.;

    float n=noise(uv*3.+uTime*0.3);
    float t=(sin(dist*TAU-uTime+n*TAU)+1.)*0.5;
    float distFade=smoothstep(1.5,0.,dist);

    vec3 col=lerp(lerp(uColor1,uColor2,t),uColor3,1.-distFade);
    col+=0.04*noise(uv*800.);

    gl_FragColor=vec4(col,1.);
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
    color1 = [0.5, 0.3, 0.9],
    color2 = [0.9, 0.4, 0.6],
    color3 = [0.1, 0.1, 0.2],
    speed = 1,
    mouseReactive = true
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
                uColor3: { value: color3 }
            }
        });

        const mesh = new Mesh(gl, { geometry, program });

        const resize = () => {
            const w = parent.clientWidth;
            const h = parent.clientHeight;
            renderer.setSize(w, h);
            program.uniforms.uResolution.value.set(w, h);
        };

        const onMouse = (e: MouseEvent) => {
            if (!mouseReactive) return;
            const rect = canvas.getBoundingClientRect();
            mouse.set(
                (e.clientX - rect.left) / rect.width,
                1 - (e.clientY - rect.top) / rect.height
            );
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', onMouse);
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
            window.removeEventListener('mousemove', onMouse);
        };
    }, [color1, color2, color3, speed, mouseReactive]);

    return <canvas ref={ref} className="w-full h-full block" />;
}
