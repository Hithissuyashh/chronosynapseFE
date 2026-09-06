import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle, type OGLRenderingContext } from "ogl";

/**
 * Dither — retro ordered-dither wave field (Bayer 8×8 + colour quantisation).
 * Purely decorative backdrop; it reads nothing from the experiment API.
 */

const vertex = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform vec3 uWaveColor;
uniform float uWaveAmplitude;
uniform float uWaveFrequency;
uniform float uWaveSpeed;
uniform float uColorNum;
uniform float uMouseRadius;
uniform float uPixelSize;

varying vec2 vUv;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865, 0.366025403, -0.577350269, 0.024390243);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 1.0;
  for (int i = 0; i < 4; i++) {
    value += amp * snoise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return value;
}

float bayer(vec2 p) {
  // 8x8 ordered dither matrix, evaluated procedurally.
  float x = mod(p.x, 8.0);
  float y = mod(p.y, 8.0);
  float sum = 0.0;
  float scale = 1.0;
  for (int i = 0; i < 3; i++) {
    float xb = mod(floor(x / pow(2.0, float(2 - i))), 2.0);
    float yb = mod(floor(y / pow(2.0, float(2 - i))), 2.0);
    sum += scale * mod(3.0 * xb + 2.0 * yb, 4.0) / 4.0;
    scale *= 0.25;
  }
  return sum;
}

void main() {
  vec2 pixel = floor(vUv * uResolution / uPixelSize);
  vec2 uv = pixel * uPixelSize / uResolution;
  vec2 p = (uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);

  float t = uTime * uWaveSpeed;
  float f = fbm(p * uWaveFrequency + vec2(t, -t * 0.6)) * uWaveAmplitude;

  if (uMouseRadius > 0.0) {
    float d = distance(uv, uMouse);
    f += smoothstep(uMouseRadius, 0.0, d) * 0.35;
  }

  float lum = clamp(0.5 + f, 0.0, 1.0);
  float levels = max(2.0, uColorNum);
  lum = floor(lum * levels + bayer(pixel)) / levels;
  lum = clamp(lum, 0.0, 1.0);

  vec3 color = uWaveColor * lum;
  gl_FragColor = vec4(color, lum * 0.95);
}
`;

export type DitherProps = {
  waveColor?: [number, number, number];
  disableAnimation?: boolean;
  enableMouseInteraction?: boolean;
  mouseRadius?: number;
  colorNum?: number;
  waveAmplitude?: number;
  waveFrequency?: number;
  waveSpeed?: number;
  pixelSize?: number;
  className?: string;
};

export default function Dither({
  waveColor = [0.976, 0.451, 0.086],
  disableAnimation = false,
  enableMouseInteraction = true,
  mouseRadius = 0,
  colorNum = 4,
  waveAmplitude = 0.3,
  waveFrequency = 3,
  waveSpeed = 0.05,
  pixelSize = 2,
  className,
}: DitherProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({ alpha: true, dpr: 1 });
    const gl: OGLRenderingContext = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";
    container.appendChild(gl.canvas);

    const program = new Program(gl, {
      vertex,
      fragment,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [1, 1] },
        uMouse: { value: [0.5, 0.5] },
        uWaveColor: { value: waveColor },
        uWaveAmplitude: { value: waveAmplitude },
        uWaveFrequency: { value: waveFrequency },
        uWaveSpeed: { value: waveSpeed },
        uColorNum: { value: colorNum },
        uMouseRadius: { value: mouseRadius },
        uPixelSize: { value: pixelSize },
      },
    });

    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const resize = () => {
      renderer.setSize(container.offsetWidth, container.offsetHeight);
      program.uniforms["uResolution"]!.value = [gl.canvas.width, gl.canvas.height];
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: PointerEvent) => {
      if (!enableMouseInteraction) return;
      const rect = container.getBoundingClientRect();
      program.uniforms["uMouse"]!.value = [
        (e.clientX - rect.left) / rect.width,
        1 - (e.clientY - rect.top) / rect.height,
      ];
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (!disableAnimation && !reduced) program.uniforms["uTime"]!.value = t * 0.001;
      renderer.render({ scene: mesh });
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      if (gl.canvas.parentNode === container) container.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disableAnimation, enableMouseInteraction, mouseRadius, colorNum, waveAmplitude, waveFrequency, waveSpeed]);

  return <div ref={containerRef} className={className ?? "h-full w-full"} aria-hidden />;
}
