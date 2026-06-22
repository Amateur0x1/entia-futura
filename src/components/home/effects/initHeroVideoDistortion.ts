/**
 * Fluid Distortion — general-purpose fluid-driven UV displacement.
 *
 * Supports three source modes:
 *   1. "dual-video"  — Hero: crossfades between scroll + loop video textures.
 *   2. "video"       — Single video element (e.g. fourth panel loop video).
 *   3. "element"     — Captures a DOM element via canvas drawImage + CSS rendering.
 *
 * The effect: mouse/touch movement drives a GPU fluid simulation, whose
 * velocity field offsets UV sampling in a fullscreen post-processing pass,
 * creating organic liquid-like warping.
 */

import {
  CanvasTexture,
  Color,
  LinearFilter,
  ShaderMaterial,
  SRGBColorSpace,
  Timer,
  Uniform,
  VideoTexture,
  WebGLRenderer,
} from 'three';
import {
  attachPointerSplats,
  FluidSimulation,
  FULLSCREEN_VERTEX,
  FullscreenPass,
} from 'three-fluid-fx';

// ── Common instance interface ──────────────────────────────────────────────
export interface FluidDistortionInstance {
  start: () => void;
  destroy: () => void;
  canvas: HTMLCanvasElement;
}

// ── Option types ───────────────────────────────────────────────────────────
interface FluidDistortionBaseOptions {
  /** Container to append the distortion canvas into. */
  container: HTMLElement;
  /** Element to listen for pointer events on (defaults to container). */
  pointerTarget?: HTMLElement;
  /** Distortion intensity multiplier (default 0.00025). */
  intensity?: number;
  /** CSS z-index for the distortion canvas (default '2'). */
  zIndex?: string;
  /** Data attribute marker on the canvas (default 'data-fluid-distortion'). */
  dataAttr?: string;
  /** Use alpha transparency (default false). */
  alpha?: boolean;
}

export interface DualVideoDistortionOptions extends FluidDistortionBaseOptions {
  mode: 'dual-video';
  scrollVideo: HTMLVideoElement;
  loopVideo: HTMLVideoElement;
}

export interface SingleVideoDistortionOptions extends FluidDistortionBaseOptions {
  mode: 'video';
  video: HTMLVideoElement;
}

export interface ElementDistortionOptions extends FluidDistortionBaseOptions {
  mode: 'element';
  /** The DOM element to capture and distort. */
  element: HTMLElement;
}

export type FluidDistortionOptions =
  | DualVideoDistortionOptions
  | SingleVideoDistortionOptions
  | ElementDistortionOptions;

// ── Factory ────────────────────────────────────────────────────────────────
export function createFluidDistortion(options: FluidDistortionOptions): FluidDistortionInstance {
  const {
    container,
    intensity = 0.00025,
    zIndex = '2',
    dataAttr = 'data-fluid-distortion',
    alpha = false,
  } = options;

  // ── WebGL renderer ──────────────────────────────────────────────────
  const renderer = new WebGLRenderer({ antialias: false, alpha });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  if (!alpha) {
    renderer.setClearColor(new Color('#07080b'), 1);
  }

  const canvas = renderer.domElement;
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = zIndex;
  canvas.style.pointerEvents = 'none';
  canvas.setAttribute(dataAttr, '');
  container.appendChild(canvas);

  // ── Texture source setup ────────────────────────────────────────────
  let scrollTex: VideoTexture | null = null;
  let loopTex: VideoTexture | null = null;
  let singleVideoTex: VideoTexture | null = null;
  let elementCaptureTex: CanvasTexture | null = null;
  let captureCanvas: HTMLCanvasElement | null = null;
  let captureCtx: CanvasRenderingContext2D | null = null;

  if (options.mode === 'dual-video') {
    scrollTex = new VideoTexture(options.scrollVideo);
    scrollTex.minFilter = LinearFilter;
    scrollTex.magFilter = LinearFilter;
    scrollTex.colorSpace = SRGBColorSpace;

    loopTex = new VideoTexture(options.loopVideo);
    loopTex.minFilter = LinearFilter;
    loopTex.magFilter = LinearFilter;
    loopTex.colorSpace = SRGBColorSpace;
  } else if (options.mode === 'video') {
    singleVideoTex = new VideoTexture(options.video);
    singleVideoTex.minFilter = LinearFilter;
    singleVideoTex.magFilter = LinearFilter;
    singleVideoTex.colorSpace = SRGBColorSpace;
  } else if (options.mode === 'element') {
    // For DOM element capture, we'll use html2canvas-like approach via
    // an offscreen canvas that the element is drawn onto each frame.
    captureCanvas = document.createElement('canvas');
    captureCtx = captureCanvas.getContext('2d', { willReadFrequently: false });
    elementCaptureTex = new CanvasTexture(captureCanvas);
    elementCaptureTex.minFilter = LinearFilter;
    elementCaptureTex.magFilter = LinearFilter;
  }

  // ── Fluid simulation ───────────────────────────────────────────────
  const fluid = new FluidSimulation(renderer, {
    splatRadius: 0.0012,
    splatForce: 5,
    densityDissipation: 0.965,
    velocityDissipation: 0.96,
    enableVorticity: true,
    curlStrength: 18,
    reflectWalls: false,
  });

  const pointerEl = options.pointerTarget || container;
  const detachSplats = attachPointerSplats(pointerEl, fluid);

  // ── Composite shader ───────────────────────────────────────────────
  const initialTexture = scrollTex || singleVideoTex || elementCaptureTex;

  const composite = new ShaderMaterial({
    vertexShader: FULLSCREEN_VERTEX,
    transparent: alpha,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vUv;

      uniform sampler2D tSource;
      uniform sampler2D tFluid;
      uniform float uIntensity;

      void main() {
        vec2 vel = texture2D(tFluid, vUv).rg;
        vec2 uv = clamp(vUv - vel * uIntensity, 0.0, 1.0);
        gl_FragColor = texture2D(tSource, uv);
      }
    `,
    uniforms: {
      tSource: new Uniform(initialTexture),
      tFluid: new Uniform(fluid.densityTexture),
      uIntensity: new Uniform(intensity),
    },
  });

  const pass = new FullscreenPass(composite);

  // ── Resize handling ────────────────────────────────────────────────
  const resize = () => {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    fluid.resize(w, h);

    // Resize capture canvas for element mode
    if (captureCanvas && options.mode === 'element') {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      captureCanvas.width = Math.floor(w * dpr);
      captureCanvas.height = Math.floor(h * dpr);
    }
  };

  const ro = new ResizeObserver(resize);

  // ── Get active texture per frame ──────────────────────────────────
  const getActiveTexture = () => {
    if (options.mode === 'dual-video' && scrollTex && loopTex) {
      const loopOpacity = parseFloat(getComputedStyle(options.loopVideo).opacity || '0');
      return loopOpacity > 0.5 ? loopTex : scrollTex;
    }
    if (options.mode === 'video' && singleVideoTex) {
      return singleVideoTex;
    }
    if (options.mode === 'element' && elementCaptureTex && captureCanvas && captureCtx) {
      // Capture the element's rendered pixels via drawImage on its child canvases
      // or via a simpler approach: we'll use the element's own canvases.
      captureElement(options.element, captureCanvas, captureCtx);
      elementCaptureTex.needsUpdate = true;
      return elementCaptureTex;
    }
    return initialTexture;
  };

  // ── Animation loop ────────────────────────────────────────────────
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

      const activeTex = getActiveTexture();
      composite.uniforms.tSource.value = activeTex;
      composite.uniforms.tFluid.value = fluid.densityTexture;

      pass.render(renderer, null);
    });
  };

  const destroy = () => {
    started = false;
    renderer.setAnimationLoop(null);
    window.removeEventListener('resize', resize);
    ro.disconnect();
    detachSplats();
    pass.dispose();
    composite.dispose();
    scrollTex?.dispose();
    loopTex?.dispose();
    singleVideoTex?.dispose();
    elementCaptureTex?.dispose();
    fluid.dispose();
    renderer.dispose();
    canvas.remove();
  };

  return { start, destroy, canvas };
}

// ── Element capture helper ─────────────────────────────────────────────────
// Replicates the monolith visual layers onto a 2D canvas:
//   1. White gradient base
//   2. Binary stream canvases with clip-path + blend-mode simulation
function captureElement(
  element: HTMLElement,
  target: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
) {
  const w = target.width;
  const h = target.height;
  ctx.clearRect(0, 0, w, h);

  // 1. White gradient base (matches .landing-second-panel__visual-base)
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.99)');
  grad.addColorStop(0.58, 'rgba(255, 255, 255, 0.95)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0.89)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 2. Composite binary stream canvases
  const binaryContainers = element.querySelectorAll<HTMLElement>('[data-binary-streams]');
  const parentRect = element.getBoundingClientRect();
  const scaleX = w / parentRect.width;
  const scaleY = h / parentRect.height;

  binaryContainers.forEach((container) => {
    const canvas = container.querySelector<HTMLCanvasElement>('canvas');
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;

    const childRect = container.getBoundingClientRect();
    const dx = (childRect.left - parentRect.left) * scaleX;
    const dy = (childRect.top - parentRect.top) * scaleY;
    const dw = childRect.width * scaleX;
    const dh = childRect.height * scaleY;

    // Determine blend mode and clip-path from CSS classes
    const isHuman = container.classList.contains('landing-second-panel__visual-binary--human');
    const isMonolith = container.classList.contains('landing-second-panel__visual-binary--monolith');

    ctx.save();

    // Simulate clip-path: inset(top right bottom left)
    if (isMonolith) {
      // clip-path: inset(0 0 0 34%) → show right 66%
      ctx.beginPath();
      ctx.rect(dx + dw * 0.34, dy, dw * 0.66, dh);
      ctx.clip();
    } else if (isHuman) {
      // clip-path: inset(0 56% 0 0) → show left 44%
      ctx.beginPath();
      ctx.rect(dx, dy, dw * 0.44, dh);
      ctx.clip();
    }

    // Set blend mode
    if (isHuman) {
      ctx.globalAlpha = 0.74;
      ctx.globalCompositeOperation = 'screen';
    } else {
      ctx.globalAlpha = 0.9;
      ctx.globalCompositeOperation = 'multiply';
    }

    try {
      ctx.drawImage(canvas, dx, dy, dw, dh);
    } catch {
      // Skip silently
    }

    ctx.restore();
  });
}

// ── Legacy export for backwards compatibility ──────────────────────────────
export type HeroVideoDistortionOptions = DualVideoDistortionOptions;
export type HeroVideoDistortionInstance = FluidDistortionInstance;

export function createHeroVideoDistortion(
  opts: Omit<DualVideoDistortionOptions, 'mode'>,
): FluidDistortionInstance {
  return createFluidDistortion({
    ...opts,
    mode: 'dual-video',
    dataAttr: 'data-hero-distortion',
  });
}
