import gsap from 'gsap';

interface InitHeroVideoEffectsOptions {
  heroVideoShell: HTMLElement | null;
  scrollVideo: HTMLVideoElement | null;
  loopVideo: HTMLVideoElement | null;
  heroVideoLoading: HTMLElement | null;
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

const syncScrollFrame = (scrollVideo: HTMLVideoElement) => {
  if (!('requestVideoFrameCallback' in scrollVideo)) {
    return;
  }

  const callback = () => {
    scrollVideo.requestVideoFrameCallback(callback);
  };

  scrollVideo.requestVideoFrameCallback(callback);
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
    syncScrollFrame(scrollVideo);
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
