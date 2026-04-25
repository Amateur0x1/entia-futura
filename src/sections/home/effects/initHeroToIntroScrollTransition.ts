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
  videoPlaybackDuration: 1.38,
  panelRevealDelayAfterVideoEnd: 0.18,
  transitionScrollDistance: 2400,
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

    const heroTimeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: heroTransitionRoot,
        start: 'top top',
        end: `+=${HERO_TO_INTRO_TIMING.transitionScrollDistance}`,
        scrub: 1,
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
    const panelRevealStart = curtainStart + curtainDuration * 0.58;

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
            scaleY: 1.05,
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
        .to(
          elements.shapeOverlay,
          {
            autoAlpha: 0,
            visibility: 'hidden',
            duration: 0.12,
            ease: 'none',
          },
          curtainStart + curtainDuration * 0.84,
        )
        .to(
          nextPanel,
          {
            autoAlpha: 1,
            y: 0,
            visibility: 'visible',
            duration: 0.46,
            ease: 'power3.out',
          },
          panelRevealStart,
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
