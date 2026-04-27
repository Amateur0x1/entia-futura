import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
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
  gsap.registerPlugin(ScrollTrigger, SplitText);

  const splitTextAvailable = typeof SplitText !== 'undefined' && typeof SplitText.create === 'function';
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

  initHomeScrollEffects({
    homeHeroElements,
    prefersReducedMotion,
    splitTextAvailable,
  });

  window.addEventListener(
    'load',
    () => {
      ScrollTrigger.refresh();
    },
    { once: true },
  );
};
