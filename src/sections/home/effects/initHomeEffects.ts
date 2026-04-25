import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

import { getHomeHeroTransitionElements } from './getHomeCalibrationElements';
import { initHeroTransitionSectionEffects } from './initCalibrationSectionEffects';
import { initHeroVideoEffects } from './heroVideoEffects';
import { initMonolithBinaryVisuals } from './initMonolithBinaryVisuals';
import { initResearchTrackEffects } from './initResearchTrackEffects';
import { initTransformSectionEffects } from './initTransformSectionEffects';
import { revealSection } from './revealSection';
import { setupShapeOverlayGrid } from './shapeOverlayGrid';

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

  const splitTextAvailable = typeof SplitText !== 'undefined' && typeof SplitText.create === 'function';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    initSmoothScrolling();
  }

  const heroTransitionElements = getHomeHeroTransitionElements();
  const shapeGridCells = setupShapeOverlayGrid(heroTransitionElements.shapeOverlay);

  initHeroTransitionSectionEffects({
    elements: heroTransitionElements,
    prefersReducedMotion,
    splitTextAvailable,
    shapeGridCells,
  });

  initHeroVideoEffects({
    heroVideoShell: heroTransitionElements.heroVideoShell,
    scrollVideo: heroTransitionElements.scrollVideo,
    loopVideo: heroTransitionElements.loopVideo,
    heroVideoLoading: heroTransitionElements.heroVideoLoading,
  });

  initTransformSectionEffects();
  initMonolithBinaryVisuals(prefersReducedMotion);
  initResearchTrackEffects(prefersReducedMotion, heroTransitionElements.shapeOverlay, shapeGridCells);

  gsap.utils.toArray<Element>('[data-reveal]').forEach((section, index) => {
    revealSection(section, index);
  });

  window.addEventListener(
    'load',
    () => {
      ScrollTrigger.refresh();
    },
    { once: true },
  );
};
