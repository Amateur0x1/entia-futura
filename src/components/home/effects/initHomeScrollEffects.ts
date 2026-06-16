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
  const overviewScrollSpacer = document.querySelector<HTMLElement>('[data-landing-scroll-spacer-overview]');

  const thirdPanel = document.querySelector<HTMLElement>('[data-third-panel]');
  const scrollSpacer = document.querySelector<HTMLElement>('[data-landing-scroll-spacer]');

  const fourthPanel = document.querySelector<HTMLElement>('[data-fourth-panel]');
  const fourthScrollSpacer = document.querySelector<HTMLElement>('[data-landing-scroll-spacer-4]');

  if (thirdPanel && scrollSpacer) {
    initAllPanelTransitions({
      elements: homeHeroElements,
      overviewScrollSpacer,
      thirdPanel,
      scrollSpacer,
      fourthPanel,
      fourthScrollSpacer,
      prefersReducedMotion,
      splitTextAvailable,
    });
  }

  gsap.utils.toArray<Element>('[data-reveal]').forEach((section, index) => {
    revealSection(section, index);
  });
};
