import gsap from 'gsap';

import { addHeroMediaDriftSegment } from './addHeroMediaDriftSegment';
import type { HomeHeroElements } from './getHomeHeroElements';
import { addHeroVideoTransitionSegment } from './heroVideoEffects';
import { setupNextPanelReveal } from './setupNextPanelReveal';
import {
  getShapeDelay,
  getShapeDuration,
  getShapeScaleX,
  getShapeScaleY,
  getShapeTransformOrigin,
} from './shapeOverlayGrid';

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
  transitionScrollDistanceDesktop: 3000,
  transitionScrollDistanceMobile: 2100,
  heroHideAtProgress: 0.985,
} as const;

export const initHeroToIntroScrollTransition = ({
  elements,
  prefersReducedMotion,
  shapeGridCells,
  splitTextAvailable,
}: InitHeroToIntroScrollTransitionOptions) => {
  const { heroTransitionRoot, heroVideoShell, nextPanel, scrollVideo } = elements;
  if (!heroTransitionRoot || !nextPanel) {
    return;
  }

  let initialized = false;

  const createScrollTimeline = () => {
    if (initialized) {
      return;
    }

    initialized = true;

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
            gsap.set(heroTransitionRoot, { autoAlpha: 0, visibility: 'hidden' });
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

    const curtainStart =
      HERO_TO_INTRO_TIMING.videoPlaybackStart +
      HERO_TO_INTRO_TIMING.videoPlaybackDuration +
      HERO_TO_INTRO_TIMING.panelRevealDelayAfterVideoEnd;
    const curtainDuration = 1.08;
    const curtainOpenStart = curtainStart + curtainDuration + 0.02;
    const curtainOpenDuration = 0.46;
    const panelRevealStart = curtainOpenStart - 0.02;

    if (!prefersReducedMotion && elements.shapeOverlay && shapeGridCells.length > 0) {
      gsap.set(shapeGridCells, {
        autoAlpha: 1,
        scaleX: (_index: number, target: Element) => getShapeScaleX(target),
        scaleY: (_index: number, target: Element) => getShapeScaleY(target),
        transformOrigin: (_index: number, target: Element) => getShapeTransformOrigin(target),
      });

      heroTimeline
        .set(
          elements.shapeOverlay,
          {
            autoAlpha: 1,
            visibility: 'visible',
          },
          curtainStart,
        )
        .fromTo(
          shapeGridCells,
          {
            scaleX: (_index: number, target: Element) => getShapeScaleX(target),
            scaleY: (_index: number, target: Element) => getShapeScaleY(target),
          },
          {
            scaleX: 1,
            scaleY: 1,
            duration: (_index: number, target: Element) => getShapeDuration(target, curtainDuration * 0.72),
            delay: (_index: number, target: Element) => getShapeDelay(target, curtainDuration * 0.28),
            ease: 'power2.out',
          },
          curtainStart,
        )
        .to(
          elements.signalCards,
          {
            autoAlpha: 0,
            y: -58,
            duration: 0.32,
            stagger: 0.02,
          },
          curtainStart + 0.08,
        )
        .set(
          heroTransitionRoot,
          {
            autoAlpha: 0,
            visibility: 'hidden',
          },
          curtainOpenStart - 0.01,
        )
        .set(
          nextPanel,
          {
            autoAlpha: 1,
            y: 0,
            visibility: 'visible',
          },
          panelRevealStart,
        )
        .to(
          shapeGridCells,
          {
            scaleX: (_index: number, target: Element) => getShapeScaleX(target),
            scaleY: (_index: number, target: Element) => getShapeScaleY(target),
            duration: curtainOpenDuration * 0.86,
            delay: 0,
            ease: 'power2.in',
          },
          curtainOpenStart,
        )
        .to(
          elements.shapeOverlay,
          {
            autoAlpha: 0,
            visibility: 'hidden',
            duration: 0.12,
            ease: 'none',
          },
          curtainOpenStart + curtainOpenDuration * 0.9,
        );
    } else if (!prefersReducedMotion) {
      heroTimeline.to(
        nextPanel,
        {
          autoAlpha: 1,
          y: 0,
          visibility: 'visible',
          duration: 0.42,
          ease: 'power3.out',
        },
        curtainStart + 0.12,
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
      startAt: panelRevealStart + 0.02,
    });
  };

  if (heroVideoShell && scrollVideo && scrollVideo.readyState < 1) {
    scrollVideo.addEventListener('loadedmetadata', createScrollTimeline, { once: true });
  } else {
    createScrollTimeline();
  }
};
