import gsap from 'gsap';

import { addHeroMediaDriftSegment } from './addHeroMediaDriftSegment';
import type { HomeHeroElements } from './getHomeHeroElements';
import { addHeroVideoTransitionSegment } from './heroVideoEffects';
import {
  addPanelPushTransitionSegment,
  createTransitionBackplate,
  createTransitionShade,
  setPanelTransitionInitialState,
} from './panelPushTransition';
import { setupNextPanelReveal } from './setupNextPanelReveal';

interface InitHeroToIntroScrollTransitionOptions {
  elements: HomeHeroElements;
  prefersReducedMotion: boolean;
  shapeGridCells: SVGRectElement[];
  splitTextAvailable: boolean;
}

export const HERO_TO_INTRO_TIMING = {
  videoPlaybackStart: 0,
  videoPlaybackDuration: 4.1,
  panelRevealDelayAfterVideoEnd: 0.52,
  transitionScrollDistanceDesktop: 3600,
  transitionScrollDistanceMobile: 2500,
  heroHideAtProgress: 0.985,
} as const;

export const initHeroToIntroScrollTransition = ({
  elements,
  prefersReducedMotion,
  splitTextAvailable,
}: InitHeroToIntroScrollTransitionOptions) => {
  const { heroTransitionFrame, heroTransitionRoot, heroVideoShell, nextPanel, scrollVideo } = elements;
  if (!heroTransitionRoot || !nextPanel) {
    return;
  }

  let initialized = false;

  const createScrollTimeline = () => {
    if (initialized) {
      return;
    }

    initialized = true;

    const outgoingHeroPanel = heroTransitionFrame ?? heroTransitionRoot;

    setPanelTransitionInitialState({
      incomingPanel: nextPanel,
      outgoingPanel: outgoingHeroPanel,
    });
    const transitionBackplate = createTransitionBackplate('data-hero-panel-transition-backplate');
    const transitionShade = createTransitionShade('data-hero-panel-transition-shade');
    gsap.set([transitionBackplate, transitionShade], { autoAlpha: 0 });

    const transitionScrollDistance =
      window.innerWidth <= 720
        ? HERO_TO_INTRO_TIMING.transitionScrollDistanceMobile
        : HERO_TO_INTRO_TIMING.transitionScrollDistanceDesktop;

    const heroTimeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: heroTransitionRoot,
        start: 'top top',
        end: `+=${transitionScrollDistance}`,
        scrub: 0.35,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: ({ progress }) => {
          if (progress >= HERO_TO_INTRO_TIMING.heroHideAtProgress) {
            gsap.set(heroTransitionRoot, { visibility: 'hidden' });
            return;
          }

          gsap.set(heroTransitionRoot, { autoAlpha: 1, visibility: 'visible' });
        },
      },
    });

    if (elements.primaryVisual) {
      addHeroMediaDriftSegment({
        heroTimeline,
        notes: elements.signalCards,
        primaryVisual: elements.primaryVisual,
      });
    }

    addHeroVideoTransitionSegment({
      elements,
      heroTimeline,
      videoPlaybackDuration: HERO_TO_INTRO_TIMING.videoPlaybackDuration,
      videoPlaybackStart: HERO_TO_INTRO_TIMING.videoPlaybackStart,
    });

    const heroPanelExitStart =
      HERO_TO_INTRO_TIMING.videoPlaybackStart +
      HERO_TO_INTRO_TIMING.videoPlaybackDuration +
      HERO_TO_INTRO_TIMING.panelRevealDelayAfterVideoEnd;
    const heroPanelPushDuration = 1.08;
    const outgoingHeroLiftDistance = () => 0;
    const panelTextRevealStart = heroPanelExitStart + heroPanelPushDuration + 0.16;

    if (!prefersReducedMotion) {
      heroTimeline
        .to(
          elements.signalCards,
          {
            autoAlpha: 0,
            y: -58,
            duration: 0.32,
            stagger: 0.02,
          },
          heroPanelExitStart,
        );

      addPanelPushTransitionSegment({
        backplate: transitionBackplate,
        duration: heroPanelPushDuration,
        incomingPanel: nextPanel,
        liftDistance: outgoingHeroLiftDistance,
        outgoingPanel: outgoingHeroPanel,
        outgoingScale: 0.72,
        shade: transitionShade,
        shadeOpacity: 0.58,
        startAt: heroPanelExitStart,
        timeline: heroTimeline,
      });

      heroTimeline.set(
        heroTransitionRoot,
        {
          visibility: 'hidden',
        },
        heroPanelExitStart + heroPanelPushDuration,
      );
    } else {
      heroTimeline.fromTo(
        nextPanel,
        {
          autoAlpha: 0,
          y: 22,
          filter: 'blur(8px)',
          pointerEvents: 'none',
        },
        {
          autoAlpha: 1,
          y: 0,
          filter: 'blur(0px)',
          visibility: 'visible',
          pointerEvents: 'auto',
          duration: 0.42,
          ease: 'power3.out',
        },
        heroPanelExitStart,
      );
    }

    setupNextPanelReveal({
      prefersReducedMotion,
      splitTextAvailable,
      nextPanel,
      nextPanelLabel: elements.nextPanelLabel,
      nextPanelHeading: elements.nextPanelHeading,
      nextPanelDivider: elements.nextPanelDivider,
      nextPanelBody: elements.nextPanelBody,
      nextPanelParagraphs: elements.nextPanelParagraphs,
      timeline: heroTimeline,
      startAt: panelTextRevealStart,
    });
  };

  if (heroVideoShell && scrollVideo && scrollVideo.readyState < 1) {
    scrollVideo.addEventListener('loadedmetadata', createScrollTimeline, { once: true });
  } else {
    createScrollTimeline();
  }
};
