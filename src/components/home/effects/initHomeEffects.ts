import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { getHomeHeroElements } from './getHomeHeroElements';
import { initHomeHeroStageEffects } from './initHomeHeroStageEffects';
import { initHomeScrollEffects } from './initHomeScrollEffects';
import { initHeroVideoEffects } from './heroVideoEffects';
import { initMonolithBinaryVisuals } from './initMonolithBinaryVisuals';
import { initThirdPanelNebulaBackground } from './initThirdPanelNebulaBackground';

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
  gsap.registerPlugin(ScrollTrigger);

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
    loopVideo: homeHeroElements.loopVideo,
    heroVideoLoading: homeHeroElements.heroVideoLoading,
  });

  initHomeHeroStageEffects({
    elements: homeHeroElements,
    prefersReducedMotion,
  });

  initMonolithBinaryVisuals(prefersReducedMotion);
  initThirdPanelNebulaBackground({
    panel: homeHeroElements.secondPanel,
    prefersReducedMotion,
  });

  const thirdPanel = document.querySelector<HTMLElement>('[data-third-panel]');
  initThirdPanelNebulaBackground({
    panel: thirdPanel,
    prefersReducedMotion,
  });

  // initHomeEffects is called after loader:done, so window.load has already fired.
  // We must refresh ScrollTrigger BEFORE creating scroll timelines so that all
  // layout measurements (heights, pin distances) are correct from the start.
  // The loader fade-out takes 0.72s + 320ms = ~1040ms total; wait until it's
  // fully gone before measuring and creating timelines.
  setTimeout(() => {
    ScrollTrigger.refresh();
    initHomeScrollEffects({
      homeHeroElements,
      prefersReducedMotion,
      splitTextAvailable: false,
    });
  }, 1100);
};
