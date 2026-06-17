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
  const directionsPanel = document.querySelector<HTMLElement>('[data-directions-panel]');
  const membersPanel = document.querySelector<HTMLElement>('[data-members-panel]');
  const fourthPanel = document.querySelector<HTMLElement>('[data-fourth-panel]');

  initAllPanelTransitions({
    elements: homeHeroElements,
    directionsPanel,
    membersPanel,
    fourthPanel,
    prefersReducedMotion,
    splitTextAvailable,
  });

  gsap.utils.toArray<Element>('[data-reveal]').forEach((section, index) => {
    revealSection(section, index);
  });
};
