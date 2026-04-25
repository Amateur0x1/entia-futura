import gsap from 'gsap';

import type { HomeHeroElements } from './getHomeHeroElements';
import { initHeroKnowMoreInteractionEffects } from './initHeroKnowMoreInteractionEffects';
import { initHeroToIntroScrollTransition } from './initHeroToIntroScrollTransition';
import { revealSection } from './revealSection';

interface InitHomeScrollEffectsOptions {
  homeHeroElements: HomeHeroElements;
  prefersReducedMotion: boolean;
  shapeGridCells: SVGRectElement[];
  splitTextAvailable: boolean;
}

export const initHomeScrollEffects = ({
  homeHeroElements,
  prefersReducedMotion,
  shapeGridCells,
  splitTextAvailable,
}: InitHomeScrollEffectsOptions) => {
  initHeroKnowMoreInteractionEffects({
    knowMoreButton: homeHeroElements.knowMoreButton,
    nextPanel: homeHeroElements.nextPanel,
  });

  initHeroToIntroScrollTransition({
    elements: homeHeroElements,
    prefersReducedMotion,
    shapeGridCells,
    splitTextAvailable,
  });

  gsap.utils.toArray<Element>('[data-reveal]').forEach((section, index) => {
    revealSection(section, index);
  });
};
