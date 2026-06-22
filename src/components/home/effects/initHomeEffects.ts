import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

import { getHomeHeroElements } from './getHomeHeroElements';
import { initHomeHeroStageEffects } from './initHomeHeroStageEffects';
import { initHomeScrollEffects } from './initHomeScrollEffects';
import { initHeroVideoEffects } from './heroVideoEffects';
import { initMonolithBinaryVisuals } from './initMonolithBinaryVisuals';
import { createFluidRevealOverlay, type FluidOverlayInstance } from './initFluidRevealOverlay';
import { createFluidDistortion, type FluidDistortionInstance } from './initHeroVideoDistortion';

const initSmoothScrolling = () => {
  const lenis = new Lenis({
    duration: 1.08,
    smoothWheel: true,
    wheelMultiplier: 0.92,
    touchMultiplier: 1.02,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time: number) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
};

export const initHomeEffects = () => {
  gsap.registerPlugin(ScrollTrigger, SplitText);

  // Expose ScrollTrigger.refresh globally so deferred video scrub segments
  // (e.g. when R2 video metadata arrives late) can trigger a re-measure.
  (window as unknown as Record<string, unknown>)['__gsapScrollTriggerRefresh'] = () => ScrollTrigger.refresh();

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    initSmoothScrolling();
  }

  const homeHeroElements = getHomeHeroElements();
  initHeroVideoEffects({
    heroVideoShell: homeHeroElements.heroVideoShell,
    scrollVideo: homeHeroElements.scrollVideo,
    heroVideoLoading: homeHeroElements.heroVideoLoading,
  });

  initHomeHeroStageEffects({
    elements: homeHeroElements,
    prefersReducedMotion,
  });

  initMonolithBinaryVisuals(prefersReducedMotion);

  // initHomeEffects is called after loader:done. Refresh ScrollTrigger and
  // create all scroll timelines immediately — layout is stable at this point
  // since the loader has been covering the page. Unlock scroll after pin is set.
  ScrollTrigger.refresh();
  initHomeScrollEffects({
    homeHeroElements,
    prefersReducedMotion,
    splitTextAvailable: false,
  });
  document.body.style.overflow = '';

  // All panel reveals are now simple scroll-triggered animations in normal
  // document flow — no scrub-based push transitions or spacer calibration.

  // ── Fluid distortion effects (pointer-driven UV displacement) ────────────
  // Respect prefers-reduced-motion — skip heavy WebGL effects.
  const distortionInstances: FluidDistortionInstance[] = [];

  if (!prefersReducedMotion) {
    // 1. Hero video distortion (single scroll video)
    if (homeHeroElements.heroVideoShell && homeHeroElements.scrollVideo) {
      const heroDistortion = createFluidDistortion({
        mode: 'video',
        container: homeHeroElements.heroVideoShell,
        video: homeHeroElements.scrollVideo,
        dataAttr: 'data-hero-distortion',
      });
      heroDistortion.start();
      distortionInstances.push(heroDistortion);
    }

    // 2. Fourth panel video distortion (single loop video)
    const fpPanel = document.querySelector<HTMLElement>('[data-fourth-panel]');
    const fpVideoStage = fpPanel?.querySelector<HTMLElement>('.fp-video-stage');
    const fpVideo = fpVideoStage?.querySelector<HTMLVideoElement>('.fp-video');
    if (fpPanel && fpVideoStage && fpVideo) {
      const fourthDistortion = createFluidDistortion({
        mode: 'video',
        // Use panel as container for pointer events (video-stage has pointer-events:none)
        container: fpPanel,
        video: fpVideo,
        intensity: 0.0003,
        zIndex: '2',
        dataAttr: 'data-fp-distortion',
      });
      // Move the canvas into the video stage for correct visual layering
      fpVideoStage.appendChild(fourthDistortion.canvas);
      fourthDistortion.start();
      distortionInstances.push(fourthDistortion);
    }

    // 3. Monolith (tombstone) visual distortion
    // The binary streams use CSS mask-image + mix-blend-mode, but
    // captureElement replicates the compositing in 2D canvas correctly.
    // The distortion canvas also gets the same mask-image so only the
    // monolith silhouette is visible.
    // NOTE: The visual-column ancestor has pointer-events:none, so we
    // re-enable pointer events on the shell itself for accurate splat coords.
    const monolithShell = document.querySelector<HTMLElement>('[data-monolith-visual]');
    if (monolithShell) {
      monolithShell.style.pointerEvents = 'auto';
      const monolithDistortion = createFluidDistortion({
        mode: 'element',
        container: monolithShell,
        element: monolithShell,
        intensity: 0.0004,
        zIndex: '5',
        dataAttr: 'data-monolith-distortion',
        alpha: true,
      });
      // Apply the same mask-image as the inner layers
      const dc = monolithDistortion.canvas;
      dc.style.maskImage = "url('/images/home-monolith-mask.png')";
      dc.style.webkitMaskImage = "url('/images/home-monolith-mask.png')";
      dc.style.maskRepeat = 'no-repeat';
      dc.style.webkitMaskRepeat = 'no-repeat';
      dc.style.maskPosition = 'center';
      dc.style.webkitMaskPosition = 'center';
      dc.style.maskSize = 'contain';
      dc.style.webkitMaskSize = 'contain';

      monolithDistortion.start();
      distortionInstances.push(monolithDistortion);
    }
  }

  // ── Fluid reveal overlays (scroll-driven) ──────────────────────────────
  // Respect prefers-reduced-motion — skip heavy WebGL effects.
  if (!prefersReducedMotion) {
    // Delay slightly so all ScrollTriggers are settled first.
    requestAnimationFrame(() => initFluidOverlays());
  }

  // Cleanup on page unload.
  window.addEventListener('pagehide', () => {
    distortionInstances.forEach((inst) => inst.destroy());
  }, { once: true });
};

// ── Fluid overlay configuration ───────────────────────────────────────────
// Pure black tidal flood.  No glow, no colour — just black.
// Coverage = scroll progress (deterministic, bidirectional) + fluid distortion.
const FLUID_CONFIG = {
  floodColor: '#05070b',
  densityDissipation: 0.97,
  velocityDissipation: 0.92,
  splatRadius: 0.025,
  splatForce: 8,
  fluidInfluence: 0,       // disabled — fluid splats must not warp the waterline
  terrainAmplitude: 0.35,  // vertical ridge relief — bold but no islands
} as const;

// ── Scroll velocity tracker ───────────────────────────────────────────────
function createVelocityTracker() {
  let prevProgress = 0;
  let prevTime = 0;
  let smoothVelocity = 0;

  return {
    update(progress: number): { velocity: number; delta: number } {
      const now = performance.now();
      const dt = Math.max(now - prevTime, 1);
      const delta = progress - prevProgress;

      const rawVel = Math.abs(delta) / (dt / 16.67);
      smoothVelocity += (rawVel - smoothVelocity) * 0.3;
      const normVel = Math.min(1, smoothVelocity / 0.025);

      prevProgress = progress;
      prevTime = now;

      return { velocity: normVel, delta };
    },
  };
}

// ── Fluid overlay initialisation + scroll driving ─────────────────────────
const initFluidOverlays = () => {
  const instances: FluidOverlayInstance[] = [];

  // ── Hero "close" overlay ──────────────────────────────────────────────
  // Black tide rises within the hero's pinned scroll range.
  //
  // The overlay is `position: fixed; z-index: 25` — BELOW the overview
  // panel (z-index: 30).  As the user scrolls past the hero, the overview
  // panel naturally slides over the fully-black overlay.  No fade-out or
  // opacity manipulation is needed.
  //
  // The ScrollTrigger drives flood progress 0→1 during the last 50% of
  // the hero pin.  Once the hero unpins (onLeave) the overlay is hidden
  // to free GPU resources; it reappears when scrolling back (onEnterBack).
  const heroContainer = document.querySelector<HTMLElement>('[data-fluid-overlay="close"]');
  const heroRoot = document.querySelector<HTMLElement>('[data-hero-transition-root]');

  if (heroContainer && heroRoot) {
    const heroOverlay = createFluidRevealOverlay({
      container: heroContainer,
      mode: 'close',
      ...FLUID_CONFIG,
    });
    heroOverlay.start();
    instances.push(heroOverlay);

    const pinSpacer = heroRoot.closest('.pin-spacer') as HTMLElement | null;
    const triggerEl = pinSpacer || heroRoot;
    const heroVel = createVelocityTracker();

    ScrollTrigger.create({
      trigger: triggerEl,
      start: () => {
        const spacerH = triggerEl.offsetHeight;
        // Start the tide at 50% through the hero pin-spacer.
        return `top+=${Math.round(spacerH * 0.50)} top`;
      },
      // End at the pin-spacer bottom (hero unpin point).
      end: 'bottom top',
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const progress = self.progress;
        const { velocity, delta } = heroVel.update(progress);

        heroOverlay.setProgress(progress);

        if (progress > 0 && progress < 1 && Math.abs(delta) > 0.001) {
          const splatY = progress;
          const baseForceMag = 8 + velocity * 27;
          const force = delta > 0 ? baseForceMag : -baseForceMag;
          heroOverlay.injectSplats(splatY, force, velocity);
        }
      },
      onLeave: () => {
        heroContainer.style.visibility = 'hidden';
      },
      onEnterBack: () => {
        heroContainer.style.visibility = '';
      },
    });
  }

  // ── Fourth panel "open" overlay ───────────────────────────────────────
  // Starts as opaque black veil.  setProgress() drives the reveal.
  // Scrolling back → progress drops → veil returns.
  const fourthContainer = document.querySelector<HTMLElement>('[data-fluid-overlay="open"]');
  const fourthPanel = document.querySelector<HTMLElement>('[data-fourth-panel]');

  if (fourthContainer && fourthPanel) {
    const fourthOverlay = createFluidRevealOverlay({
      container: fourthContainer,
      mode: 'open',
      ...FLUID_CONFIG,
    });
    fourthOverlay.start();
    instances.push(fourthOverlay);

    const fourthVel = createVelocityTracker();

    ScrollTrigger.create({
      trigger: fourthPanel,
      start: 'top 90%',
      end: 'top 10%',
      scrub: true,
      onUpdate: (self) => {
        const progress = self.progress;
        const { velocity, delta } = fourthVel.update(progress);

        // ALWAYS update waterline — drives bidirectional coverage.
        fourthOverlay.setProgress(progress);

        // Inject organic splats only during active scrolling.
        if (Math.abs(delta) > 0.001) {
          const splatY = progress;
          const baseForceMag = 8 + velocity * 27;
          const force = delta > 0 ? baseForceMag : -baseForceMag;
          fourthOverlay.injectSplats(splatY, force, velocity);
        }
      },
    });
  }

  // Cleanup on page unload.
  window.addEventListener('pagehide', () => {
    instances.forEach((inst) => inst.destroy());
  }, { once: true });
};
