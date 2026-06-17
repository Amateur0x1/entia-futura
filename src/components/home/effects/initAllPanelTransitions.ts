import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

import { addHeroMediaDriftSegment } from './addHeroMediaDriftSegment';
import type { HomeHeroElements } from './getHomeHeroElements';
import { addHeroVideoTransitionSegment } from './heroVideoEffects';
import { setupOverviewPanelReveal } from './setupOverviewPanelReveal';
import { setupSecondPanelReveal } from './setupSecondPanelReveal';
import { setupThirdPanelReveal } from './setupThirdPanelReveal';
import { initMembersCarousel } from './initMembersCarousel';

// ---------------------------------------------------------------------------
// Timing constants (desktop scroll distance for the hero video scrub)
// ---------------------------------------------------------------------------
export const HERO_TO_INTRO_TIMING = {
  videoPlaybackStart: 0,
  videoPlaybackDuration: 4.1,
  loopVideoHoldDuration: 2.6,
  panelRevealDelayAfterVideoEnd: 0.4,
  transitionScrollDistanceDesktop: 3600,
  transitionScrollDistanceMobile: 2500,
  heroHideAtProgress: 0.985,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface InitAllPanelTransitionsOptions {
  elements: HomeHeroElements;
  thirdPanel: HTMLElement;
  membersPanel: HTMLElement | null;
  fourthPanel: HTMLElement | null;
  prefersReducedMotion: boolean;
  splitTextAvailable: boolean;
}

// ---------------------------------------------------------------------------
// Reduced-motion variants (immediate show, no animation)
// ---------------------------------------------------------------------------
const initReducedMotionTransitions = ({
  elements,
  thirdPanel,
  membersPanel,
  fourthPanel,
}: Pick<InitAllPanelTransitionsOptions, 'elements' | 'thirdPanel' | 'membersPanel' | 'fourthPanel'>) => {
  const { overviewPanel, secondPanel } = elements;

  // Show slogan immediately.
  const sloganStage = elements.heroTransitionRoot?.querySelector<HTMLElement>('[data-hero-slogan]');
  const sloganQuote = elements.heroTransitionRoot?.querySelector<HTMLElement>('[data-overview-quote]');
  if (sloganStage) {
    gsap.set(sloganStage, { opacity: 1 });
    if (sloganQuote) gsap.set(sloganQuote, { opacity: 1 });
  }

  if (overviewPanel) {
    setupOverviewPanelReveal({
      prefersReducedMotion: true,
      overviewPanel,
      overviewDivider: elements.overviewPanelDivider,
      overviewLines: elements.overviewPanelLines,
    });
  }

  if (secondPanel) gsap.set(secondPanel, { autoAlpha: 1 });

  setupThirdPanelReveal({
    prefersReducedMotion: true,
    thirdPanel,
    timeline: gsap.timeline(),
    startAt: 0,
  });

  if (membersPanel) gsap.set(membersPanel, { autoAlpha: 1 });
  if (fourthPanel) gsap.set(fourthPanel, { autoAlpha: 1 });
};

// ---------------------------------------------------------------------------
// Full animation (scrub-driven reveals in normal document flow)
//
// Each panel gets its own scrub-driven ScrollTrigger timeline so that the
// panel fade-in AND its inner content reveal (SplitText lines, dividers,
// cards) are all locked to scroll progress — exactly as they were in the
// old push-transition system, just without the push.
// ---------------------------------------------------------------------------
const initFullTransitions = ({
  elements,
  thirdPanel,
  membersPanel,
  fourthPanel,
  splitTextAvailable,
}: Omit<InitAllPanelTransitionsOptions, 'prefersReducedMotion'>) => {
  const {
    heroTransitionRoot,
    heroVideoShell,
    overviewPanel,
    secondPanel,
    scrollVideo,
  } = elements;

  if (!heroTransitionRoot || !secondPanel) return;

  // ── Hero video scrub (kept as-is — the hero is still pinned) ────────────
  const createHeroTimeline = () => {
    const heroTimeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: heroTransitionRoot,
        start: 'top top',
        end: () => `+=${Math.round(heroTimeline.totalDuration() * window.innerHeight)}`,
        pin: true,
        pinSpacing: true,
        scrub: 0.35,
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

    const videoPlaybackEnd =
      HERO_TO_INTRO_TIMING.videoPlaybackStart +
      HERO_TO_INTRO_TIMING.videoPlaybackDuration;

    const loopHoldStart = videoPlaybackEnd + HERO_TO_INTRO_TIMING.panelRevealDelayAfterVideoEnd;
    const loopHoldEnd = loopHoldStart + HERO_TO_INTRO_TIMING.loopVideoHoldDuration;

    // ── Slogan reveal during loop-video hold ──────────────────────────────
    const sloganStage = heroTransitionRoot.querySelector<HTMLElement>('[data-hero-slogan]');
    const sloganQuote = heroTransitionRoot.querySelector<HTMLElement>('[data-overview-quote]');

    const sloganRevealAt = loopHoldStart;

    if (sloganStage) {
      const signalCardsFadeOutAt = loopHoldStart - 0.3;
      heroTimeline.to(
        elements.signalCards,
        { autoAlpha: 0, y: -38, duration: 0.28, stagger: 0.02 },
        signalCardsFadeOutAt,
      );
    } else {
      heroTimeline.to(
        elements.signalCards,
        { autoAlpha: 0, y: -58, duration: 0.32, stagger: 0.02 },
        loopHoldEnd,
      );
    }

    if (sloganStage) {
      gsap.registerPlugin(SplitText);
      const sloganText = sloganQuote?.querySelector<HTMLElement>('.hero-slogan__text');
      if (sloganQuote) gsap.set(sloganQuote, { opacity: 1 });

      let split: SplitText | null = null;
      if (sloganText) {
        split = new SplitText(sloganText, { type: 'chars' });
        gsap.set(split.chars, { opacity: 0, y: 20, filter: 'blur(4px)' });
      }

      const earlyRevealAt = sloganRevealAt - 0.6;
      heroTimeline.to(sloganStage, { opacity: 1, duration: 0.3, ease: 'none' }, earlyRevealAt);

      if (sloganText && split) {
        const charCount = split.chars.length;
        const revealBudget = 1.2;
        const perCharDuration = revealBudget / (charCount + 1);
        heroTimeline.to(
          split.chars,
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: perCharDuration,
            stagger: perCharDuration,
            ease: 'power2.out',
          },
          earlyRevealAt + 0.1,
        );
      }
    }

    addHeroVideoTransitionSegment({ elements, heroTimeline, videoPlaybackEnd });

    gsap.ticker.add(function refreshHero() {
      ScrollTrigger.refresh();
      gsap.ticker.remove(refreshHero);
    });
  };

  if (heroVideoShell && scrollVideo && scrollVideo.readyState < 1 && !scrollVideo.error) {
    let timelineCreated = false;
    const initOnce = () => {
      if (timelineCreated) return;
      timelineCreated = true;
      createHeroTimeline();
    };
    scrollVideo.addEventListener('loadedmetadata', initOnce, { once: true });
    scrollVideo.addEventListener('error', initOnce, { once: true });
  } else {
    createHeroTimeline();
  }

  // ── Overview panel: scrub-driven reveal ─────────────────────────────────
  if (overviewPanel) {
    // Hide panel initially.
    gsap.set(overviewPanel, { autoAlpha: 0, y: 48 });

    const overviewTl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: overviewPanel,
        start: 'top 150%',
        end: 'bottom 10%',
        scrub: 0.4,
      },
    });

    // Phase 1: panel fades in.
    overviewTl.to(overviewPanel, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0);

    // Phase 2: content reveals (divider + SplitText lines), starting midway
    // through the panel fade-in so they overlap slightly.
    setupOverviewPanelReveal({
      prefersReducedMotion: false,
      overviewPanel,
      overviewDivider: elements.overviewPanelDivider,
      overviewLines: elements.overviewPanelLines,
      timeline: overviewTl,
      startAt: 0.15,
    });
  }

  // ── Second panel: scrub-driven reveal ───────────────────────────────────
  gsap.set(secondPanel, { autoAlpha: 0, y: 48 });

  const secondTl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: secondPanel,
      start: 'top 150%',
      end: 'bottom 10%',
      scrub: 0.4,
    },
  });

  // Phase 1: panel fades in.
  secondTl.to(secondPanel, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0);

  // Phase 2: content reveals.
  setupSecondPanelReveal({
    prefersReducedMotion: false,
    splitTextAvailable,
    secondPanel,
    secondPanelLabel: elements.secondPanelLabel,
    secondPanelHeading: elements.secondPanelHeading,
    secondPanelDivider: elements.secondPanelDivider,
    secondPanelBody: elements.secondPanelBody,
    secondPanelParagraphs: elements.secondPanelParagraphs,
    
    timeline: secondTl,
    startAt: 0.15,
  });

  // ── Third panel: scrub-driven reveal ────────────────────────────────────
  gsap.set(thirdPanel, { autoAlpha: 0, y: 48 });

  const thirdTl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: thirdPanel,
      start: 'top 150%',
      end: 'bottom 10%',
      scrub: 0.4,
    },
  });

  // Phase 1: panel fades in.
  thirdTl.to(thirdPanel, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0);

  // Phase 2: content reveals.
  setupThirdPanelReveal({
    prefersReducedMotion: false,
    thirdPanel,
    timeline: thirdTl,
    startAt: 0.15,
  });

  // ── Members panel: independent pinned carousel ─────────────────────────
  // The members panel uses its own pinned ScrollTrigger (similar to the hero)
  // so cards get enough scroll distance for the fly-across animation.
  if (membersPanel) {
    initMembersCarousel(membersPanel);
  }

  // ── Fourth panel: scrub-driven reveal ───────────────────────────────────
  if (fourthPanel) {
    gsap.set(fourthPanel, { autoAlpha: 0, y: 48 });

    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: fourthPanel,
        start: 'top 88%',
        end: 'top 30%',
        scrub: 0.4,
      },
    }).to(fourthPanel, { autoAlpha: 1, y: 0, duration: 1, ease: 'power2.out' }, 0);
  }
};

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------
export const initAllPanelTransitions = ({
  elements,
  thirdPanel,
  membersPanel,
  fourthPanel,
  prefersReducedMotion,
  splitTextAvailable,
}: InitAllPanelTransitionsOptions) => {
  if (prefersReducedMotion) {
    initReducedMotionTransitions({ elements, thirdPanel, membersPanel, fourthPanel });
    return;
  }

  initFullTransitions({ elements, thirdPanel, membersPanel, fourthPanel, splitTextAvailable });
};
