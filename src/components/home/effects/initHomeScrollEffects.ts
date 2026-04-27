import type { HomeHeroElements } from './getHomeHeroElements';
import { initHeroKnowMoreInteractionEffects } from './initHeroKnowMoreInteractionEffects';
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
  initHeroKnowMoreInteractionEffects({
    knowMoreButton: homeHeroElements.knowMoreButton,
    secondPanel: homeHeroElements.secondPanel,
    heroTransitionRoot: homeHeroElements.heroTransitionRoot,
  });

  const thirdPanel = document.querySelector<HTMLElement>('[data-third-panel]');
  const scrollSpacer = document.querySelector<HTMLElement>('[data-landing-scroll-spacer]');

  const fourthPanel = document.querySelector<HTMLElement>('[data-fourth-panel]');
  const fourthScrollSpacer = document.querySelector<HTMLElement>('[data-landing-scroll-spacer-4]');
  const fifthPanel = document.querySelector<HTMLElement>('[data-fifth-panel]');
  const fifthScrollSpacer = document.querySelector<HTMLElement>('[data-landing-scroll-spacer-5]');
  const sixthPanel = document.querySelector<HTMLElement>('[data-sixth-panel]');
  const sixthScrollSpacer = document.querySelector<HTMLElement>('[data-landing-scroll-spacer-6]');

  if (thirdPanel && scrollSpacer) {
    initAllPanelTransitions({
      elements: homeHeroElements,
      thirdPanel,
      scrollSpacer,
      fourthPanel,
      fourthScrollSpacer,
      fifthPanel,
      fifthScrollSpacer,
      sixthPanel,
      sixthScrollSpacer,
      prefersReducedMotion,
      splitTextAvailable,
    });
  }

  gsap.utils.toArray<Element>('[data-reveal]').forEach((section, index) => {
    revealSection(section, index);
  });
};
