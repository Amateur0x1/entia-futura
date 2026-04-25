import gsap from 'gsap';

import type { HomeHeroElements } from './getHomeHeroElements';
import { initHeroKnowMoreInteractionEffects } from './initHeroKnowMoreInteractionEffects';
import { initHeroToIntroScrollTransition } from './initHeroToIntroScrollTransition';
import { revealSection } from './revealSection';

interface InitHomeScrollEffectsOptions {
  homeHeroElements: HomeHeroElements;
}

export const initHomeScrollEffects = ({
  homeHeroElements,
}: InitHomeScrollEffectsOptions) => {
  initHeroKnowMoreInteractionEffects({
    knowMoreButton: homeHeroElements.knowMoreButton,
    nextPanel: homeHeroElements.nextPanel,
  });

  initHeroToIntroScrollTransition({
    elements: homeHeroElements,
  });

  gsap.utils.toArray<Element>('[data-reveal]').forEach((section, index) => {
    revealSection(section, index);
  });
};
