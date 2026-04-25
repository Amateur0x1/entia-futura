import gsap from 'gsap';

import type { HomeHeroElements } from './getHomeHeroElements';

interface InitHomeHeroStageEffectsOptions {
  elements: HomeHeroElements;
  prefersReducedMotion: boolean;
}

const applyHomeHeroInitialStates = ({
  elements,
  prefersReducedMotion,
}: {
  elements: HomeHeroElements;
  prefersReducedMotion: boolean;
}) => {
  const { nextPanel, nextPanelDivider, primaryVisual, shapeOverlay } = elements;

  if (!primaryVisual) {
    return;
  }

  gsap.set(primaryVisual, {
    transformOrigin: '50% 50%',
  });

  if (!prefersReducedMotion) {
    if (nextPanel) {
      gsap.set(nextPanel, {
        autoAlpha: 0,
        y: 36,
        visibility: 'hidden',
      });
    }

    if (nextPanelDivider) {
      gsap.set(nextPanelDivider, {
        autoAlpha: 0,
        scaleX: 0,
        transformOrigin: 'left center',
      });
    }

    if (shapeOverlay) {
      gsap.set(shapeOverlay, {
        autoAlpha: 0,
        visibility: 'hidden',
      });
    }
  }

};

const createHomeHeroEntranceTimeline = (primaryVisual: HTMLElement, notes: HTMLElement[]) => {
  const introTimeline = gsap.timeline({
    defaults: {
      ease: 'power3.out',
    },
  });

  introTimeline
    .fromTo(
      primaryVisual,
      {
        autoAlpha: 0,
        y: 16,
      },
      {
        autoAlpha: 1,
        y: 0,
        duration: 1.05,
      },
    )
    .fromTo(
      notes,
      {
        autoAlpha: 0,
        y: 34,
      },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.08,
      },
      '-=0.42',
    );
};

export const initHomeHeroStageEffects = ({
  elements,
  prefersReducedMotion,
}: InitHomeHeroStageEffectsOptions) => {
  const {
    heroTransitionFrame,
    heroTransitionRoot,
    nextPanelDivider,
    primaryVisual,
    signalCards,
  } = elements;

  if (!heroTransitionRoot || !heroTransitionFrame || !primaryVisual) {
    return;
  }

  const notes = signalCards;

  applyHomeHeroInitialStates({
    elements,
    prefersReducedMotion,
  });
  createHomeHeroEntranceTimeline(primaryVisual, notes);
};
