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
  const { secondPanelDivider, primaryVisual } = elements;

  if (!primaryVisual) {
    return;
  }

  gsap.set(primaryVisual, {
    transformOrigin: '50% 0%',
  });

  if (!prefersReducedMotion) {
  // secondPanel initial state is now set by setPanelTransitionInitialState
  // inside initAllPanelTransitions — no need to set it here.

    if (secondPanelDivider) {
      gsap.set(secondPanelDivider, {
        autoAlpha: 0,
        scaleX: 0,
        transformOrigin: 'left center',
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
    secondPanelDivider,
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
