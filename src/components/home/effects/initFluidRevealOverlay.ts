/**
 * Fluid Reveal Overlay — scroll-driven pure black tidal flood.
 *
 * The waterline is shaped like complex hilly terrain (not a flat line):
 *   1. Multi-octave noise (FBM) creates a static "terrain" profile along x.
 *   2. Fluid simulation adds dynamic organic distortion on top.
 *   3. uProgress (from GSAP scroll) raises/lowers the whole terrain.
 *
 * The result looks like black water flooding through irregular hills —
 * some peaks stay exposed longer, some valleys fill first.
 *
 * Bidirectional: scroll progress drives the waterline in both directions.
 */

import {
  Color,
  ShaderMaterial,
  SRGBColorSpace,
  Timer,
  Uniform,
  WebGLRenderer,
} from 'three';
import {
  FluidSimulation,
  FULLSCREEN_VERTEX,
  FullscreenPass,
} from 'three-fluid-fx';

export type FluidOverlayMode = 'close' | 'open';

export interface FluidOverlayOptions {
  container: HTMLElement;
  mode: FluidOverlayMode;
  floodColor?: string;
  densityDissipation?: number;
  velocityDissipation?: number;
  splatRadius?: number;
  splatForce?: number;
  /** How much fluid distorts the terrain (0–1). */
  fluidInfluence?: number;
  /** Terrain roughness — amplitude of the hilly profile (0–1). */
  terrainAmplitude?: number;
}

export interface FluidOverlayInstance {
  start: () => void;
  destroy: () => void;
  canvas: HTMLCanvasElement;
  setProgress: (p: number) => void;
  injectSplats: (y: number, force: number, velocity?: number) => void;
  fluid: FluidSimulation;
}

export function createFluidRevealOverlay(options: FluidOverlayOptions): FluidOverlayInstance {
  const {
    container,
    mode,
    floodColor = '#05070b',
    densityDissipation = 0.97,
    velocityDissipation = 0.92,
    splatRadius = 0.018,
    splatForce = 6,
    fluidInfluence = 0.25,
    terrainAmplitude = 0.5,
  } = options;

  const renderer = new WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(new Color(0x000000), 0);

  const canvas = renderer.domElement;
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '10';
  canvas.setAttribute('data-fluid-overlay', mode);
  container.appendChild(canvas);

  const fluid = new FluidSimulation(renderer, {
    splatRadius,
    splatForce,
    densityDissipation,
    velocityDissipation,
    enableVorticity: true,
    curlStrength: 20,
    reflectWalls: false,
  });

  // Random seed per instance so each overlay has a unique terrain profile.
  const terrainSeed = Math.random() * 100;

  const composite = new ShaderMaterial({
    vertexShader: FULLSCREEN_VERTEX,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vUv;

      uniform sampler2D tFluid;
      uniform vec3 uFloodColor;
      uniform float uProgress;
      uniform float uFluidInfluence;
      uniform float uTerrainAmp;
      uniform float uSeed;
      uniform int uMode;

      // ── Hash-based noise (no texture needed) ─────────────────────
      float hash(float n) {
        return fract(sin(n) * 43758.5453123);
      }

      // Smooth 1D value noise
      float noise(float x) {
        float i = floor(x);
        float f = fract(x);
        float u = f * f * (3.0 - 2.0 * f); // smoothstep
        return mix(hash(i), hash(i + 1.0), u);
      }

      // FBM — 2 octaves for broad, smooth terrain
      float fbm(float x) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        for (int i = 0; i < 2; i++) {
          value += amplitude * noise(x * frequency);
          frequency *= 2.17;
          amplitude *= 0.48;
        }
        return value;
      }

      void main() {
        vec4 fl = texture2D(tFluid, vUv);

        // ── Terrain profile ────────────────────────────────────────
        // Vertical ridges — noise along X only, constant along Y.
        // This creates north-south "mountain ranges" so the waterline
        // carves wide vertical bands, not isolated peaks.
        float terrain = fbm(vUv.x * 4.0 + uSeed);
        terrain = terrain / 0.74; // normalise roughly to 0..1

        // ── Water level ────────────────────────────────────────────
        // Extra margin so progress=0 is fully invisible and progress=1
        // is fully covered, even with large terrain amplitude.
        float margin = uTerrainAmp + 0.1;
        float baseLevel = -margin + uProgress * (1.0 + 2.0 * margin);

        // Terrain creates peaks that resist flooding.
        float terrainDisp = terrain * uTerrainAmp;

        // Gentle fluid warp — scaled down to avoid jagged tendrils.
        float fluidWarp = (fl.r + fl.g) * 0.5 * uFluidInfluence * 0.4 * smoothstep(0.0, 0.1, uProgress);

        // Wide soft edge — smooth gradient instead of hard cut
        float edgeWidth = 0.06;

        float coverage;

        // Water level rises from below screen to above screen as progress grows.
        float waterLevel = baseLevel - terrainDisp + fluidWarp;

        if (uMode == 1) {
          // OPEN: black veil covers ABOVE the waterline, clear BELOW.
          // progress=0 → waterLevel far below screen → veil covers everything.
          // progress=1 → waterLevel far above screen → veil gone.
          // The veil is always contiguous: screen top → waterline edge.
          // No islands possible because veil connects to the top boundary.
          coverage = smoothstep(waterLevel - edgeWidth, waterLevel + edgeWidth, vUv.y);
          gl_FragColor = vec4(uFloodColor, coverage);
        } else {
          // CLOSE: black tide covers BELOW the waterline, clear ABOVE.
          // progress=0 → waterLevel far below → no coverage.
          // progress=1 → waterLevel far above → fully covered.
          // Always contiguous: waterline edge → screen bottom.
          coverage = smoothstep(waterLevel + edgeWidth, waterLevel - edgeWidth, vUv.y);
          gl_FragColor = vec4(uFloodColor, coverage);
        }
      }
    `,
    uniforms: {
      tFluid: new Uniform(fluid.densityTexture),
      uFloodColor: new Uniform(new Color(floodColor)),
      uProgress: new Uniform(0),
      uFluidInfluence: new Uniform(fluidInfluence),
      uTerrainAmp: new Uniform(terrainAmplitude),
      uSeed: new Uniform(terrainSeed),
      uMode: new Uniform(mode === 'open' ? 1 : 0),
    },
  });

  const pass = new FullscreenPass(composite);

  const setProgress = (p: number) => {
    composite.uniforms.uProgress.value = Math.max(0, Math.min(1, p));
  };

  const resize = () => {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    fluid.resize(w, h);
  };

  const ro = new ResizeObserver(resize);

  const injectSplats = (y: number, force: number, velocity = 0.5) => {
    const vel = Math.max(0, Math.min(1, velocity));
    const count = Math.round(2 + vel * 12);
    const yScatter = 0.05 + vel * 0.10;
    const xPadding = 0.03;

    for (let i = 0; i < count; i++) {
      const x = xPadding + Math.random() * (1 - 2 * xPadding);
      const yPos = Math.min(1, Math.max(0, y + (Math.random() - 0.5) * yScatter));
      const lateralDrift = (Math.random() - 0.5) * Math.abs(force) * 0.5;
      const forceVar = 0.3 + Math.random() * 1.4;
      const dy = force * forceVar;
      fluid.addSplat(x, yPos, lateralDrift, dy);
    }

    if (vel > 0.25) {
      const foamCount = Math.round(vel * 5);
      const foamAhead = force > 0 ? 0.06 : -0.06;
      for (let i = 0; i < foamCount; i++) {
        const fx = Math.random();
        const fy = Math.min(1, Math.max(0, y + foamAhead + (Math.random() - 0.5) * 0.05));
        const fdx = (Math.random() - 0.5) * Math.abs(force) * 0.3;
        const fdy = force * (0.15 + Math.random() * 0.35);
        fluid.addSplat(fx, fy, fdx, fdy);
      }
    }
  };

  const clock = new Timer();
  let started = false;

  const start = () => {
    if (started) return;
    started = true;
    resize();
    ro.observe(container);
    window.addEventListener('resize', resize);

    renderer.setAnimationLoop(() => {
      clock.update();
      const dt = Math.min(Math.max(clock.getDelta(), 1e-6), 1 / 60);
      fluid.step(dt);
      composite.uniforms.tFluid.value = fluid.densityTexture;
      pass.render(renderer, null);
    });
  };

  const destroy = () => {
    started = false;
    renderer.setAnimationLoop(null);
    window.removeEventListener('resize', resize);
    ro.disconnect();
    pass.dispose();
    composite.dispose();
    fluid.dispose();
    renderer.dispose();
    canvas.remove();
  };

  return { start, destroy, canvas, setProgress, injectSplats, fluid };
}
