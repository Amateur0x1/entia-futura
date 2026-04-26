import type { HomeHeroElements } from './getHomeHeroElements';
import { initHeroKnowMoreInteractionEffects } from './initHeroKnowMoreInteractionEffects';
import { initAllPanelTransitions } from './initAllPanelTransitions';
import { revealSection } from './revealSection';
import gsap from 'gsap';

interface InitHomeScrollEffectsOptions {
  homeHeroElements: HomeHeroElements;
  prefersReducedMotion: boolean;
  shapeGridCells: SVGRectElement[];
  splitTextAvailable: boolean;
}

export const initHomeScrollEffects = ({
  homeHeroElements,
  prefersReducedMotion,
  splitTextAvailable,
}: InitHomeScrollEffectsOptions) => {
  initHeroKnowMoreInteractionEffects({
    knowMoreButton: homeHeroElements.knowMoreButton,
    nextPanel: homeHeroElements.nextPanel,
    heroTransitionRoot: homeHeroElements.heroTransitionRoot,
  });

  const thirdPanel = document.querySelector<HTMLElement>('[data-third-panel]');
  const scrollSpacer = document.querySelector<HTMLElement>('[data-landing-scroll-spacer]');

  if (thirdPanel && scrollSpacer) {
    initAllPanelTransitions({
      elements: homeHeroElements,
      thirdPanel,
      scrollSpacer,
      prefersReducedMotion,
      splitTextAvailable,
    });
  }

  gsap.utils.toArray<Element>('[data-reveal]').forEach((section, index) => {
    revealSection(section, index);
  });
};
