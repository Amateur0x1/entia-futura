import type { HomeHeroElements } from './getHomeHeroElements';
import { initAllPanelTransitions } from './initAllPanelTransitions';
import { revealSection } from './revealSection';
import gsap from 'gsap';

interface InitHomeScrollEffectsOptions {
  homeHeroElements: HomeHeroElements;
  prefersReducedMotion: boolean;
  splitTextAvailable: boolean;
}

export const initHomeScrollEffects = ({
  homeHeroElements,
  prefersReducedMotion,
  splitTextAvailable,
}: InitHomeScrollEffectsOptions) => {
  const thirdPanel = document.querySelector<HTMLElement>('[data-third-panel]');
  const fourthPanel = document.querySelector<HTMLElement>('[data-fourth-panel]');

  if (thirdPanel) {
    initAllPanelTransitions({
      elements: homeHeroElements,
      thirdPanel,
      fourthPanel,
      prefersReducedMotion,
      splitTextAvailable,
    });
  }

  gsap.utils.toArray<Element>('[data-reveal]').forEach((section, index) => {
    revealSection(section, index);
  });
};
