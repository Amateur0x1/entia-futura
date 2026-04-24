import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import type { HomeCalibrationElements } from './getHomeCalibrationElements';
import { addNextPreviewTransition } from './addNextPreviewTransition';
import { setupNextPanelReveal } from './setupNextPanelReveal';

interface InitCalibrationSectionEffectsOptions {
  elements: HomeCalibrationElements;
  prefersReducedMotion: boolean;
  splitTextAvailable: boolean;
  shapeGridCells: SVGRectElement[];
}

const getHeaderOffset = () => {
  const pageShell = document.querySelector('.page-shell');
  const siteHeader = document.querySelector('.site-header');
  const shellPaddingTop =
    pageShell instanceof HTMLElement
      ? parseFloat(window.getComputedStyle(pageShell).paddingTop) || 0
      : 0;
  const headerStyles = siteHeader instanceof HTMLElement ? window.getComputedStyle(siteHeader) : null;
  const headerIsVisible =
    siteHeader instanceof HTMLElement &&
    headerStyles !== null &&
    headerStyles.display !== 'none' &&
    headerStyles.visibility !== 'hidden';
  const headerHeight = headerIsVisible ? siteHeader.getBoundingClientRect().height : 0;
  const headerMarginBottom = headerIsVisible ? parseFloat(headerStyles.marginBottom) || 0 : 0;

  return Math.max(shellPaddingTop + headerHeight + headerMarginBottom, 0);
};

export const initCalibrationSectionEffects = ({
  elements,
  prefersReducedMotion,
  splitTextAvailable,
  shapeGridCells,
}: InitCalibrationSectionEffectsOptions) => {
  const {
    calibrationFrame,
    calibrationRoot,
    heroVideoShell,
    knowMoreButton,
    loopVideo,
    nextPanel,
    nextPanelBody,
    nextPanelDivider,
    nextPanelHeading,
    nextPanelLabel,
    nextPanelParagraphs,
    nextPreview,
    nextPreviewDivider,
    nextPreviewInner,
    primaryVisual,
    scrollVideo,
    shapeOverlay,
    signalCards,
  } = elements;

  if (!calibrationRoot || !calibrationFrame || !primaryVisual) {
    return;
  }

  const notes = signalCards;

  gsap.set(primaryVisual, {
    transformOrigin: '50% 50%',
  });

  if (!prefersReducedMotion && nextPreviewInner) {
    gsap.set(nextPreviewInner, {
      autoAlpha: 0,
      y: 48,
    });
  }

  if (!prefersReducedMotion) {
    if (nextPanelDivider) {
      gsap.set(nextPanelDivider, {
        autoAlpha: 0,
        scaleX: 0,
        transformOrigin: 'left center',
      });
    }

    if (nextPreviewDivider) {
      gsap.set(nextPreviewDivider, {
        autoAlpha: 0,
        scaleX: 0,
        transformOrigin: 'left center',
      });
    }
  }

  if (nextPreview) {
    gsap.set(nextPreview, {
      autoAlpha: 0,
    });
  }

  if (shapeOverlay) {
    gsap.set(shapeOverlay, {
      autoAlpha: 0,
    });
  }

  const introTimeline = gsap.timeline({
    defaults: {
      ease: 'power3.out',
    },
  });

  introTimeline
    .fromTo(
      primaryVisual,
      {
        autoAlpha: 0,
        y: 16,
      },
      {
        autoAlpha: 1,
        y: 0,
        duration: 1.05,
      },
    )
    .fromTo(
      notes,
      {
        autoAlpha: 0,
        y: 34,
      },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.08,
      },
      '-=0.42',
    );

  let calibrationScrollInitialized = false;

  const setupCalibrationScroll = () => {
    if (calibrationScrollInitialized) {
      return;
    }

    calibrationScrollInitialized = true;

    const media = gsap.matchMedia();

    media.add('(min-width: 0px)', () => {
      const headerOffset = getHeaderOffset();
      const playbackStretch = 3;
      const fallbackDistance = (window.innerWidth <= 720 ? 1400 : 2400) * playbackStretch;
      const videoPlaybackStart = 0;
      const videoPlaybackDuration = 1.38;
      const videoPlaybackEnd = videoPlaybackStart + videoPlaybackDuration;
      const transitionStartAtVideoEnd = videoPlaybackEnd - 0.04;

      const heroTimeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: calibrationRoot,
          start: `top top+=${Math.round(headerOffset)}`,
          endTrigger: nextPanel ?? calibrationRoot,
          end: nextPanel ? `top top+=${Math.round(headerOffset)}` : `+=${fallbackDistance}`,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      let knowMoreTrigger: ScrollTrigger | null = null;
      if (knowMoreButton && nextPanel) {
        knowMoreTrigger = ScrollTrigger.create({
          trigger: nextPanel,
          start: 'top 92%',
          end: 'bottom top',
          onEnter: () => {
            gsap.to(knowMoreButton, {
              autoAlpha: 0,
              y: 10,
              duration: 0.24,
              ease: 'power2.out',
              pointerEvents: 'none',
            });
          },
          onLeaveBack: () => {
            gsap.to(knowMoreButton, {
              autoAlpha: 1,
              y: 0,
              duration: 0.24,
              ease: 'power2.out',
              pointerEvents: 'auto',
            });
          },
        });
      }

      heroTimeline
        .to(
          primaryVisual,
          {
            yPercent: -2,
            scale: 1.03,
            duration: 1.2,
          },
          0,
        )
        .to(
          notes,
          {
            y: -42,
            autoAlpha: (index: number) => (index === notes.length - 1 ? 1 : 0.52),
            duration: 0.7,
            stagger: 0.03,
          },
          0.08,
        );

      if (heroVideoShell && scrollVideo && loopVideo) {
        const targetDuration = Math.max(scrollVideo.duration - 0.04, 0);

        if (targetDuration > 0) {
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
        }
      }

      if (!prefersReducedMotion) {
        addNextPreviewTransition({
          elements,
          heroTimeline,
          notes,
          shapeGridCells,
          splitTextAvailable,
          transitionStartAtVideoEnd,
        });
      }

      return () => {
        heroTimeline.kill();
        knowMoreTrigger?.kill();
      };
    });
  };

  if (heroVideoShell && scrollVideo && scrollVideo.readyState < 1) {
    scrollVideo.addEventListener('loadedmetadata', setupCalibrationScroll, { once: true });
  } else {
    setupCalibrationScroll();
  }

  setupNextPanelReveal({
    prefersReducedMotion,
    splitTextAvailable,
    nextPanel,
    nextPanelLabel,
    nextPanelHeading,
    nextPanelDivider,
    nextPanelBody,
    nextPanelParagraphs,
  });
};
