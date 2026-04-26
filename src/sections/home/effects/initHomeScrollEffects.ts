import gsap from 'gsap';

import type { HomeHeroElements } from './getHomeHeroElements';
import { initHeroKnowMoreInteractionEffects } from './initHeroKnowMoreInteractionEffects';
import { initHeroToIntroScrollTransition } from './initHeroToIntroScrollTransition';
import {
  addPanelPushTransitionSegment,
  createTransitionBackplate,
  createTransitionShade,
  getPanelFakeScrollDistance,
  PANEL_TRANSITION_RADIUS,
  setPanelTransitionInitialState,
} from './panelPushTransition';
import { revealSection } from './revealSection';

interface InitHomeScrollEffectsOptions {
  homeHeroElements: HomeHeroElements;
  prefersReducedMotion: boolean;
  shapeGridCells: SVGRectElement[];
  splitTextAvailable: boolean;
}

const createPanelSlideTransition = ({
  nextPanel,
  nextPanelInner,
  thirdPanel,
  scrollSpacer,
  prefersReducedMotion,
}: {
  nextPanel: HTMLElement;
  nextPanelInner: HTMLElement | null;
  thirdPanel: HTMLElement;
  scrollSpacer: HTMLElement;
  prefersReducedMotion: boolean;
}) => {
  const transitionBackplate = createTransitionBackplate('data-second-panel-transition-backplate');
  const transitionShade = createTransitionShade('data-second-panel-transition-shade');

  setPanelTransitionInitialState({
    incomingPanel: thirdPanel,
    outgoingPanel: nextPanel,
  });
  gsap.set(nextPanelInner, {
    y: 0,
    willChange: 'transform',
  });
  gsap.set([transitionBackplate, transitionShade], { autoAlpha: 0 });

  if (prefersReducedMotion) {
    gsap.timeline({
      scrollTrigger: {
        trigger: scrollSpacer,
        start: 'top -56%',
        end: 'top -92%',
        toggleActions: 'play none reverse reverse',
      },
    })
      .to(nextPanel, {
        autoAlpha: 0,
        visibility: 'hidden',
        pointerEvents: 'none',
        duration: 0.01,
        ease: 'none',
      })
      .to(
        thirdPanel,
        {
          autoAlpha: 1,
          visibility: 'visible',
          pointerEvents: 'auto',
          duration: 0.01,
          ease: 'none',
        },
        0,
      );
    return;
  }

  const fakeScrollDistance = getPanelFakeScrollDistance(nextPanel, nextPanelInner);
  const fakeScrollDuration =
    fakeScrollDistance > 1 ? Math.min(Math.max(fakeScrollDistance / window.innerHeight, 0.45), 1.55) : 0;
  const panelPushStart = fakeScrollDuration;
  const panelPushDuration = 1.08;
  const outgoingLiftDistance = () => 0;

  const panelTransitionTimeline = gsap.timeline({
    defaults: {
      overwrite: 'auto',
    },
    scrollTrigger: {
      trigger: scrollSpacer,
      start: 'top -52%',
      end: () => `+=${Math.round(window.innerHeight + getPanelFakeScrollDistance(nextPanel, nextPanelInner))}`,
      scrub: 0.36,
      invalidateOnRefresh: true,
      toggleActions: 'play none reverse reverse',
      onEnter: () => {
        gsap.set(transitionBackplate, { autoAlpha: 1, visibility: 'visible', zIndex: 35 });
        gsap.set(thirdPanel, {
          visibility: 'visible',
          pointerEvents: 'none',
          zIndex: 38,
          borderTopLeftRadius: PANEL_TRANSITION_RADIUS,
          borderTopRightRadius: PANEL_TRANSITION_RADIUS,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        });
        gsap.set(transitionShade, { visibility: 'visible', zIndex: 37 });
        gsap.set(nextPanel, { zIndex: 36 });
      },
      onEnterBack: () => {
        gsap.set(transitionBackplate, { autoAlpha: 1, visibility: 'visible', zIndex: 35 });
        gsap.set(thirdPanel, {
          autoAlpha: 1,
          visibility: 'visible',
          pointerEvents: 'none',
          zIndex: 38,
        });
        gsap.set(transitionShade, { visibility: 'visible', zIndex: 37 });
        gsap.set(nextPanel, { autoAlpha: 1, visibility: 'visible', pointerEvents: 'auto', zIndex: 36 });
      },
      onLeave: () => {
        gsap.set(thirdPanel, { pointerEvents: 'auto', zIndex: 35 });
        gsap.set(nextPanel, {
          autoAlpha: 0,
          visibility: 'hidden',
          pointerEvents: 'none',
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        });
        gsap.set([transitionBackplate, transitionShade], { autoAlpha: 0, visibility: 'hidden' });
      },
      onLeaveBack: () => {
        gsap.set(thirdPanel, {
          autoAlpha: 0,
          yPercent: 100,
          visibility: 'hidden',
          pointerEvents: 'none',
          zIndex: 38,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        });
        gsap.set([transitionBackplate, transitionShade], { autoAlpha: 0, visibility: 'hidden' });
      },
    },
  });

  if (fakeScrollDistance > 1 && nextPanelInner) {
    panelTransitionTimeline.to(
      nextPanelInner,
      {
        y: () => -getPanelFakeScrollDistance(nextPanel, nextPanelInner),
        duration: fakeScrollDuration,
        ease: 'none',
      },
      0,
    );
  }

  addPanelPushTransitionSegment({
    backplate: transitionBackplate,
    duration: panelPushDuration,
    incomingPanel: thirdPanel,
    liftDistance: outgoingLiftDistance,
    outgoingPanel: nextPanel,
    outgoingScale: 0.72,
    shade: transitionShade,
    shadeOpacity: 0.58,
    startAt: panelPushStart,
    timeline: panelTransitionTimeline,
  });
};

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
  if (thirdPanel && scrollSpacer && homeHeroElements.nextPanel) {
    const nextPanel = homeHeroElements.nextPanel;
    const nextPanelInner = homeHeroElements.nextPanelInner;

    createPanelSlideTransition({
      nextPanel,
      nextPanelInner,
      thirdPanel,
      scrollSpacer,
      prefersReducedMotion,
    });
  }

  gsap.utils.toArray<Element>('[data-reveal]').forEach((section, index) => {
    revealSection(section, index);
  });
};
