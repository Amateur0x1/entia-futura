import gsap from 'gsap';

import type { HomeHeroTransitionElements } from './getHomeCalibrationElements';

interface InitHeroVideoEffectsOptions {
  heroVideoShell: HTMLElement | null;
  scrollVideo: HTMLVideoElement | null;
  loopVideo: HTMLVideoElement | null;
  heroVideoLoading: HTMLElement | null;
}

interface AddHeroVideoTransitionSegmentOptions {
  elements: HomeHeroTransitionElements;
  heroTimeline: gsap.core.Timeline;
}

export const hideHeroVideoLoading = (heroVideoLoading: HTMLElement | null) => {
  if (!heroVideoLoading) {
    return;
  }

  heroVideoLoading.classList.add('is-hidden');
};

export const startLoopVideo = (loopVideo: HTMLVideoElement | null) => {
  if (!loopVideo) {
    return;
  }

  const playAttempt = loopVideo.play();
  if (playAttempt && typeof playAttempt.catch === 'function') {
    playAttempt.catch(() => {});
  }
};

export const initHeroVideoEffects = ({
  heroVideoShell,
  scrollVideo,
  loopVideo,
  heroVideoLoading,
}: InitHeroVideoEffectsOptions) => {
  if (!heroVideoShell || !scrollVideo || !loopVideo) {
    return;
  }

  const initializeHeroVideos = () => {
    gsap.set(loopVideo, { autoAlpha: 0 });
    gsap.set(scrollVideo, {
      autoAlpha: 1,
      currentTime: 0,
    });

    startLoopVideo(loopVideo);
    hideHeroVideoLoading(heroVideoLoading);
  };

  if (scrollVideo.readyState >= 1) {
    initializeHeroVideos();
  } else {
    scrollVideo.addEventListener('loadedmetadata', initializeHeroVideos, { once: true });
  }

  if (scrollVideo.readyState >= 3) {
    hideHeroVideoLoading(heroVideoLoading);
  } else {
    scrollVideo.addEventListener('canplaythrough', () => hideHeroVideoLoading(heroVideoLoading), { once: true });
    scrollVideo.addEventListener('loadeddata', () => hideHeroVideoLoading(heroVideoLoading), { once: true });
  }

  if (loopVideo.readyState >= 2) {
    startLoopVideo(loopVideo);
  } else {
    loopVideo.addEventListener('canplay', () => startLoopVideo(loopVideo), { once: true });
  }
};

export const addHeroVideoTransitionSegment = ({
  elements,
  heroTimeline,
}: AddHeroVideoTransitionSegmentOptions) => {
  const { heroVideoShell, loopVideo, scrollVideo } = elements;
  const videoPlaybackStart = 0;
  const videoPlaybackDuration = 1.38;
  const videoPlaybackEnd = videoPlaybackStart + videoPlaybackDuration;

  if (!heroVideoShell || !scrollVideo || !loopVideo) {
    return;
  }

  const targetDuration = Math.max(scrollVideo.duration - 0.04, 0);
  if (targetDuration <= 0) {
    return;
  }

  gsap.set(loopVideo, { autoAlpha: 0 });

  heroTimeline
    .to(
      scrollVideo,
      {
        currentTime: targetDuration,
        duration: videoPlaybackDuration,
      },
      videoPlaybackStart,
    )
    .to(
      loopVideo,
      {
        autoAlpha: 1,
        duration: 0.32,
      },
      videoPlaybackEnd - 0.24,
    )
    .to(
      scrollVideo,
      {
        autoAlpha: 0.16,
        duration: 0.22,
      },
      videoPlaybackEnd - 0.18,
    );
};
