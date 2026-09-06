import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle, type OGLRenderingContext } from "ogl";

/**
 * Balatro — animated painterly swirl backdrop rendered on a WebGL fullscreen
 * triangle. Purely decorative: it encodes no experimental values.
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

#define PI 3.14159265359

uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uSpinRotation;
uniform float uSpinSpeed;
uniform vec2 uOffset;
uniform vec4 uColor1;
uniform vec4 uColor2;
uniform vec4 uColor3;
uniform float uContrast;
uniform float uLighting;
uniform float uSpinAmount;
uniform float uPixelFilter;
uniform float uSpinEase;
uniform bool uIsRotate;

varying vec2 vUv;

vec4 effect(vec2 screenSize, vec2 screenCoords) {
  float pixelSize = length(screenSize) / uPixelFilter;
  vec2 uv = (floor(screenCoords * (1.0 / pixelSize)) * pixelSize - 0.5 * screenSize) / length(screenSize) - uOffset;
  float uvLen = length(uv);

  float speed = (uSpinRotation * uSpinEase * 0.2);
  if (uIsRotate) {
    speed = uTime * speed;
  }
  speed += 302.2;

  float mouseInfluence = (uMouse.x * 2.0 - 1.0) * 0.35;
  float newPixelAngle = atan(uv.y, uv.x) + mouseInfluence
    + speed - uSpinEase * 20.0 * (uSpinAmount * uvLen + (1.0 - uSpinAmount));
  vec2 midPoint = vec2(0.0, 0.0);
  uv = vec2(uvLen * cos(newPixelAngle) + midPoint.x, uvLen * sin(newPixelAngle) + midPoint.y);

  uv *= 30.0;
  float baseSpeed = uTime * uSpinSpeed;
  vec2 uv2 = vec2(uv.x + uv.y);

  for (int i = 0; i < 5; i++) {
    uv2 += uv + cos(length(uv));
    uv += 0.5 * vec2(
      cos(5.1123314 + 0.353 * uv2.y + baseSpeed * 0.131121),
      sin(uv2.x - 0.113 * baseSpeed)
    );
    uv -= cos(uv.x + uv.y) - sin(uv.x * 0.711 - uv.y);
  }

  float contrastMod = (0.25 * uContrast + 0.5 * uSpinAmount + 1.2);
  float paintRes = min(2.0, max(0.0, length(uv) * 0.035 * contrastMod));
  float c1p = max(0.0, 1.0 - contrastMod * abs(1.0 - paintRes));
  float c2p = max(0.0, 1.0 - contrastMod * abs(paintRes));
  float c3p = 1.0 - min(1.0, c1p + c2p);
  float light = (uLighting - 0.2) * max(c1p * 5.0 - 4.0, 0.0)
    + uLighting * max(c2p * 5.0 - 4.0, 0.0);

  return (0.3 / uContrast) * uColor1
    + (1.0 - 0.3 / uContrast) * (uColor1 * c1p + uColor2 * c2p + vec4(c3p * uColor3.rgb, c3p * uColor1.a))
    + light;
}

void main() {
  vec2 fragCoord = vUv * uResolution.xy;
  gl_FragColor = effect(uResolution.xy, fragCoord);
}
`;

export type BalatroProps = {
  isRotate?: boolean;
  mouseInteraction?: boolean;
  pixelFilter?: number;
  spinRotation?: number;
  spinSpeed?: number;
  offset?: [number, number];
  color1?: [number, number, number, number];
  color2?: [number, number, number, number];
  color3?: [number, number, number, number];
  contrast?: number;
  lighting?: number;
  spinAmount?: number;
  spinEase?: number;
  className?: string;
};

export default function Balatro({
  isRotate = false,
  mouseInteraction = true,
  pixelFilter = 700,
  spinRotation = -2.0,
  spinSpeed = 5.0,
  offset = [0, 0],
  color1 = [0.05, 0.09, 0.11, 1],
  color2 = [0.98, 0.45, 0.09, 1],
  color3 = [0.02, 0.03, 0.04, 1],
  contrast = 3.5,
  lighting = 0.4,
  spinAmount = 0.25,
  spinEase = 1.0,
  className,
}: BalatroProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({ alpha: true, dpr: Math.min(window.devicePixelRatio, 1.5) });
    const gl: OGLRenderingContext = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    container.appendChild(gl.canvas);
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height] },
        uMouse: { value: [0.5, 0.5] },
        uSpinRotation: { value: spinRotation },
        uSpinSpeed: { value: spinSpeed },
        uOffset: { value: offset },
        uColor1: { value: color1 },
        uColor2: { value: color2 },
        uColor3: { value: color3 },
        uContrast: { value: contrast },
        uLighting: { value: lighting },
        uSpinAmount: { value: spinAmount },
        uPixelFilter: { value: pixelFilter },
        uSpinEase: { value: spinEase },
        uIsRotate: { value: isRotate },
      },
    });

    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const resize = () => {
      renderer.setSize(container.offsetWidth, container.offsetHeight);
      program.uniforms["uResolution"]!.value = [
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height,
      ];
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: PointerEvent) => {
      if (!mouseInteraction) return;
      const rect = container.getBoundingClientRect();
      program.uniforms["uMouse"]!.value = [
        (e.clientX - rect.left) / rect.width,
        1 - (e.clientY - rect.top) / rect.height,
      ];
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      program.uniforms["uTime"]!.value = t * 0.001;
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
  }, [isRotate, mouseInteraction, pixelFilter]);

  return <div ref={containerRef} className={className ?? "h-full w-full"} aria-hidden />;
}
