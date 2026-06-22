import gsap from 'gsap';

import type { HomeHeroElements } from './getHomeHeroElements';

interface InitHeroVideoEffectsOptions {
  heroVideoShell: HTMLElement | null;
  scrollVideo: HTMLVideoElement | null;
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

export const initHeroVideoEffects = ({
  heroVideoShell,
  scrollVideo,
  heroVideoLoading,
}: InitHeroVideoEffectsOptions) => {
  if (!heroVideoShell || !scrollVideo) {
    return;
  }

  const initializeHeroVideo = () => {
    gsap.set(scrollVideo, {
      autoAlpha: 1,
      currentTime: 0,
    });

    hideHeroVideoLoading(heroVideoLoading);
  };

  // When scroll video fails to load, fall back: hide loader.
  const initializeHeroVideoOnError = () => {
    gsap.set(scrollVideo, { autoAlpha: 0 });
    hideHeroVideoLoading(heroVideoLoading);
  };

  // scrollVideo.error means the error event already fired before initHomeEffects ran —
  // fall back immediately without waiting for a listener that will never fire.
  if (scrollVideo.error) {
    initializeHeroVideoOnError();
  } else if (scrollVideo.readyState >= 1) {
    initializeHeroVideo();
  } else {
    scrollVideo.addEventListener('loadedmetadata', initializeHeroVideo, { once: true });
    scrollVideo.addEventListener('error', initializeHeroVideoOnError, { once: true });
  }

  if (scrollVideo.error || scrollVideo.readyState >= 3) {
    hideHeroVideoLoading(heroVideoLoading);
  } else {
    scrollVideo.addEventListener('canplaythrough', () => hideHeroVideoLoading(heroVideoLoading), { once: true });
    scrollVideo.addEventListener('loadeddata', () => hideHeroVideoLoading(heroVideoLoading), { once: true });
    scrollVideo.addEventListener('error', () => hideHeroVideoLoading(heroVideoLoading), { once: true });
  }
};

/**
 * Adds video currentTime scrub tweens to heroTimeline.
 *
 * The video plays from 0 → videoDuration across timeline positions [0, videoPlaybackEnd].
 * videoPlaybackEnd should equal heroPanelExitStart so the video finishes exactly when
 * the panel-push transition begins — regardless of heroTimeline's total duration.
 */
const attachVideoScrubToTimeline = ({
  scrollVideo,
  heroTimeline,
  videoPlaybackEnd,
}: {
  scrollVideo: HTMLVideoElement;
  heroTimeline: gsap.core.Timeline;
  videoPlaybackEnd: number;
}) => {
  const targetDuration = Math.max(scrollVideo.duration - 0.04, 0);

  gsap.set(scrollVideo, { autoAlpha: 1 });

  // Drive currentTime from 0 → targetDuration across the full video slot.
  heroTimeline.to(
    scrollVideo,
    { currentTime: targetDuration, duration: videoPlaybackEnd },
    0,
  );
};

export const addHeroVideoTransitionSegment = ({
  elements,
  heroTimeline,
  videoPlaybackEnd,
}: AddHeroVideoTransitionSegmentOptions) => {
  const { heroVideoShell, scrollVideo } = elements;

  if (!heroVideoShell || !scrollVideo) {
    return;
  }

  const attach = () => {
    const dur = scrollVideo.duration;
    if (!dur || !isFinite(dur) || dur <= 0) return;

    attachVideoScrubToTimeline({
      scrollVideo,
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

  // On error: skip scroll-video scrub entirely — GSAP panel transitions
  // still initialise correctly (no video currentTime tween).
  const attachOnError = () => {
    if (attached) return;
    attached = true;
    gsap.set(scrollVideo, { autoAlpha: 0 });
    requestAnimationFrame(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__gsapScrollTriggerRefresh?.();
    });
  };

  // If error already fired before addHeroVideoTransitionSegment was called, handle immediately.
  if (scrollVideo.error) {
    attachOnError();
    return;
  }

  scrollVideo.addEventListener('loadedmetadata', attachOnce, { once: true });
  scrollVideo.addEventListener('durationchange', attachOnce, { once: true });
  scrollVideo.addEventListener('error', attachOnError, { once: true });
};
