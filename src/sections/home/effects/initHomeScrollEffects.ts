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
    heroTransitionRoot: homeHeroElements.heroTransitionRoot,
  });

  initHeroToIntroScrollTransition({
    elements: homeHeroElements,
    prefersReducedMotion,
    shapeGridCells,
    splitTextAvailable,
  });

  const thirdPanel = document.querySelector<HTMLElement>('[data-third-panel]');
  const scrollSpacer = document.querySelector<HTMLElement>('[data-landing-scroll-spacer]');
  if (thirdPanel && scrollSpacer) {
    const nextPanel = homeHeroElements.nextPanel;

    gsap.set(thirdPanel, {
      autoAlpha: 0,
      y: 22,
      filter: 'blur(8px)',
      visibility: 'hidden',
      pointerEvents: 'none',
    });

    gsap.timeline({
      scrollTrigger: {
        trigger: scrollSpacer,
        start: 'top -56%',
        end: 'top -92%',
        toggleActions: 'play none none reverse',
      },
    })
      .to(
        nextPanel,
        {
          autoAlpha: 0,
          y: 18,
          filter: 'blur(6px)',
          visibility: 'hidden',
          pointerEvents: 'none',
          duration: prefersReducedMotion ? 0.01 : 0.28,
          ease: 'power2.out',
        },
        0,
      )
      .to(
        thirdPanel,
        {
          autoAlpha: 1,
          y: 0,
          filter: 'blur(0px)',
          visibility: 'visible',
          pointerEvents: 'auto',
          duration: prefersReducedMotion ? 0.01 : 0.72,
          ease: prefersReducedMotion ? 'none' : 'power3.out',
        },
        0,
      );
  }

  gsap.utils.toArray<Element>('[data-reveal]').forEach((section, index) => {
    revealSection(section, index);
  });
};
