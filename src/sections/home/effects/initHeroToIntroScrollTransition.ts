import gsap from 'gsap';

import { addHeroMediaDriftSegment } from './addHeroMediaDriftSegment';
import type { HomeHeroElements } from './getHomeHeroElements';
import { addHeroVideoTransitionSegment } from './heroVideoEffects';

interface InitHeroToIntroScrollTransitionOptions {
  elements: HomeHeroElements;
}

export const HERO_TO_INTRO_TIMING = {
  videoPlaybackStart: 0,
  videoPlaybackDuration: 1.38,
} as const;

export const initHeroToIntroScrollTransition = ({
  elements,
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

    const heroTimeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: heroTransitionRoot,
        start: 'top top',
        endTrigger: nextPanel,
        end: 'top top',
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onLeave: () => {
          gsap.set(heroTransitionRoot, { autoAlpha: 0, visibility: 'hidden' });
        },
        onEnterBack: () => {
          gsap.set(heroTransitionRoot, { autoAlpha: 1, visibility: 'visible' });
        },
        onLeaveBack: () => {
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

  };

  if (heroVideoShell && scrollVideo && scrollVideo.readyState < 1) {
    scrollVideo.addEventListener('loadedmetadata', createScrollTimeline, { once: true });
  } else {
    createScrollTimeline();
  }
};
