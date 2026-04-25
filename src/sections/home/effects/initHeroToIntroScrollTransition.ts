import gsap from 'gsap';

import { addHeroMediaDriftSegment } from './addHeroMediaDriftSegment';
import { addNextPanelPreviewTransition } from './addNextPanelPreviewTransition';
import type { HomeHeroElements } from './getHomeHeroElements';
import { addHeroVideoTransitionSegment } from './heroVideoEffects';

interface InitHeroToIntroScrollTransitionOptions {
  elements: HomeHeroElements;
  prefersReducedMotion: boolean;
  shapeGridCells: SVGRectElement[];
  splitTextAvailable: boolean;
}

export const HERO_TO_INTRO_TIMING = {
  videoPlaybackStart: 0,
  videoPlaybackDuration: 1.38,
  previewDelayAfterVideoEnd: 0.54,
} as const;

export const initHeroToIntroScrollTransition = ({
  elements,
  prefersReducedMotion,
  shapeGridCells,
  splitTextAvailable,
}: InitHeroToIntroScrollTransitionOptions) => {
  const { heroTransitionRoot, heroVideoShell, nextPanel, scrollVideo } = elements;
  if (!heroTransitionRoot) {
    return;
  }

  let initialized = false;

  const createScrollTimeline = () => {
    if (initialized) {
      return;
    }

    initialized = true;

    const playbackStretch = 3;
    const fallbackDistance = (window.innerWidth <= 720 ? 1400 : 2400) * playbackStretch;
    const videoPlaybackEnd =
      HERO_TO_INTRO_TIMING.videoPlaybackStart + HERO_TO_INTRO_TIMING.videoPlaybackDuration;
    const previewStartAt = videoPlaybackEnd + HERO_TO_INTRO_TIMING.previewDelayAfterVideoEnd;

    const heroTimeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: heroTransitionRoot,
        start: 'top top',
        endTrigger: nextPanel ?? heroTransitionRoot,
        end: nextPanel ? 'top top' : `+=${fallbackDistance}`,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
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

    if (!prefersReducedMotion) {
      addNextPanelPreviewTransition({
        elements,
        heroTimeline,
        notes: elements.signalCards,
        previewStartAt,
        shapeGridCells,
        splitTextAvailable,
      });
    }
  };

  if (heroVideoShell && scrollVideo && scrollVideo.readyState < 1) {
    scrollVideo.addEventListener('loadedmetadata', createScrollTimeline, { once: true });
  } else {
    createScrollTimeline();
  }
};
