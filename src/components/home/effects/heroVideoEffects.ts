import gsap from 'gsap';

import type { HomeHeroElements } from './getHomeHeroElements';

interface InitHeroVideoEffectsOptions {
  heroVideoShell: HTMLElement | null;
  scrollVideo: HTMLVideoElement | null;
  loopVideo: HTMLVideoElement | null;
  heroVideoLoading: HTMLElement | null;
}

interface AddHeroVideoTransitionSegmentOptions {
  elements: HomeHeroElements;
  heroTimeline: gsap.core.Timeline;
  /** Timeline position at which video playback ends and panel-push begins. */
  videoPlaybackEnd: number;
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

/**
 * Adds video currentTime scrub tweens to heroTimeline.
 *
 * The video plays from 0 → videoDuration across timeline positions [0, videoPlaybackEnd].
 * videoPlaybackEnd should equal heroPanelExitStart so the video finishes exactly when
 * the panel-push transition begins — regardless of heroTimeline's total duration.
 *
 * Cross-fade to loopVideo happens in the last 8% of the video slot.
 */
const attachVideoScrubToTimeline = ({
  scrollVideo,
  loopVideo,
  heroTimeline,
  videoPlaybackEnd,
}: {
  scrollVideo: HTMLVideoElement;
  loopVideo: HTMLVideoElement;
  heroTimeline: gsap.core.Timeline;
  videoPlaybackEnd: number;
}) => {
  const targetDuration = Math.max(scrollVideo.duration - 0.04, 0);
  const crossFadeAt = videoPlaybackEnd * 0.92; // cross-fade starts at 92% of video slot

  gsap.set(loopVideo, { autoAlpha: 0 });
  gsap.set(scrollVideo, { autoAlpha: 1 });

  // Drive currentTime from 0 → targetDuration across the full video slot.
  heroTimeline.to(
    scrollVideo,
    { currentTime: targetDuration, duration: videoPlaybackEnd },
    0,
  );

  // Cross-fade: loopVideo fades in, scrollVideo fades out, over the last 8%.
  const fadeDuration = videoPlaybackEnd - crossFadeAt;
  heroTimeline
    .to(loopVideo, { autoAlpha: 1, duration: fadeDuration }, crossFadeAt)
    .to(scrollVideo, { autoAlpha: 0.16, duration: fadeDuration * 0.8 }, crossFadeAt + fadeDuration * 0.1);
};

export const addHeroVideoTransitionSegment = ({
  elements,
  heroTimeline,
  videoPlaybackEnd,
}: AddHeroVideoTransitionSegmentOptions) => {
  const { heroVideoShell, loopVideo, scrollVideo } = elements;

  if (!heroVideoShell || !scrollVideo || !loopVideo) {
    return;
  }

  const attach = () => {
    const dur = scrollVideo.duration;
    if (!dur || !isFinite(dur) || dur <= 0) return;

    attachVideoScrubToTimeline({
      scrollVideo,
      loopVideo,
      heroTimeline,
      videoPlaybackEnd,
    });
  };

  // If metadata is already available, attach immediately.
  if (isFinite(scrollVideo.duration) && scrollVideo.duration > 0) {
    attach();
    return;
  }

  // Otherwise wait for metadata (loader:done gate ensures it arrives quickly).
  let attached = false;
  const attachOnce = () => {
    if (attached) return;
    attached = true;
    attach();
    // Refresh ScrollTrigger so the newly-added tweens are measured correctly.
    requestAnimationFrame(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__gsapScrollTriggerRefresh?.();
    });
  };

  scrollVideo.addEventListener('loadedmetadata', attachOnce, { once: true });
  scrollVideo.addEventListener('durationchange', attachOnce, { once: true });
};
