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

  const fourthPanel = document.querySelector<HTMLElement>('[data-fourth-panel]');
  initThirdPanelNebulaBackground({
    panel: fourthPanel,
    prefersReducedMotion,
  });

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

  // Panels 4–6 transitions are now managed by initAllPanelTransitions
  // (scrub-based push timelines, matching the 2→3 pattern) — no extra
  // ScrollTrigger.create loops needed here.
};
