import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

import { addHeroMediaDriftSegment } from './addHeroMediaDriftSegment';
import type { HomeHeroElements } from './getHomeHeroElements';
import { addHeroVideoTransitionSegment } from './heroVideoEffects';
import { setupOverviewPanelReveal } from './setupOverviewPanelReveal';
import { setupSecondPanelReveal } from './setupSecondPanelReveal';
import { initDirectionsCarousel } from './initDirectionsCarousel';
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
  directionsPanel: HTMLElement | null;
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
  directionsPanel,
  membersPanel,
  fourthPanel,
}: Pick<InitAllPanelTransitionsOptions, 'elements' | 'directionsPanel' | 'membersPanel' | 'fourthPanel'>) => {
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
  if (directionsPanel) gsap.set(directionsPanel, { autoAlpha: 1 });

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
  directionsPanel,
  membersPanel,
  fourthPanel,
  splitTextAvailable,
}: Omit<InitAllPanelTransitionsOptions, 'prefersReducedMotion'>) => {
  const {
    heroTransitionRoot,
    heroVideoShell,
    overviewPanel,
    scrollVideo,
  } = elements;

  if (!heroTransitionRoot) return;

  // ── Hero video scrub (kept as-is — the hero is still pinned) ────────────
  //
  // CRITICAL: The hero's pinned ScrollTrigger MUST be created synchronously
  // and BEFORE any other ScrollTrigger on the page. GSAP measures pinSpacing
  // based on creation order; if the hero pin is deferred (e.g. waiting for
  // video metadata), all downstream triggers get wrong start/end positions,
  // causing the page to appear stuck / black after the hero.
  //
  // Strategy: always create the pinned timeline immediately with all
  // non-video segments. The video scrub segment is added later (by
  // addHeroVideoTransitionSegment) when metadata arrives, followed by a
  // ScrollTrigger.refresh() to re-measure.
  // ─────────────────────────────────────────────────────────────────────────

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

  // Video scrub segment — added immediately if metadata is available,
  // otherwise deferred (addHeroVideoTransitionSegment handles both cases
  // and calls ScrollTrigger.refresh() when the deferred path resolves).
  addHeroVideoTransitionSegment({ elements, heroTimeline, videoPlaybackEnd });

  // Schedule a single refresh on the next tick so GSAP can measure the
  // hero pin-spacer before downstream triggers are evaluated.
  gsap.ticker.add(function refreshHero() {
    ScrollTrigger.refresh();
    gsap.ticker.remove(refreshHero);
  });

  // ── Overview panel: scrub-driven reveal ─────────────────────────────────
  if (overviewPanel) {
    // Hide panel initially.
    gsap.set(overviewPanel, { autoAlpha: 0, y: 48 });

    const overviewTl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: overviewPanel,
        start: 'top 110%',       // begin when panel top is ~10% below viewport bottom
        end: 'top -12%',         // finish over ~1.22 screens of scroll distance
        scrub: 0.4,
      },
    });

    // Phase 1: panel fades in.
    overviewTl.to(overviewPanel, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power2.out' }, 0);

    // Phase 2: content reveals (divider + SplitText lines), starting early
    // so the scatter→order animation completes quickly.
    setupOverviewPanelReveal({
      prefersReducedMotion: false,
      overviewPanel,
      overviewDivider: elements.overviewPanelDivider,
      overviewLines: elements.overviewPanelLines,
      timeline: overviewTl,
      startAt: 0.22,
    });
  }

  // ── Mission panel: scrub-driven reveal (between Overview and Directions) ──
  // Label + divider fade in first, then items slide from screen right → centre.
  const missionPanel = document.querySelector<HTMLElement>('[data-mission-panel]');
  if (missionPanel) {
    gsap.set(missionPanel, { autoAlpha: 0 });

    const missionLabel = missionPanel.querySelector<HTMLElement>('[data-mission-label]');
    const missionDivider = missionPanel.querySelector<HTMLElement>('[data-mission-divider]');
    const missionHeadings = gsap.utils.toArray<HTMLElement>('[data-mission-heading]', missionPanel);
    const missionBodies = gsap.utils.toArray<HTMLElement>('[data-mission-body]', missionPanel);

    // Hide label + divider initially
    if (missionLabel) gsap.set(missionLabel, { autoAlpha: 0, y: 16 });
    if (missionDivider) gsap.set(missionDivider, { scaleX: 0, transformOrigin: 'center', autoAlpha: 1 });

    // Headings: fade in only (no position shift)
    missionHeadings.forEach((h) => gsap.set(h, { autoAlpha: 0 }));
    // Body paragraphs: start off-screen to the right
    missionBodies.forEach((b) => gsap.set(b, { autoAlpha: 0, xPercent: 80 }));

    const missionTl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: missionPanel,
        start: 'top 110%',
        end: 'top -12%',
        scrub: 0.4,
      },
    });

    // Phase 1: panel fades in (background visible)
    missionTl.to(missionPanel, { autoAlpha: 1, duration: 0.15, ease: 'power2.out' }, 0);

    // Phase 2: label appears
    if (missionLabel) {
      missionTl.to(missionLabel, { autoAlpha: 1, y: 0, duration: 0.15, ease: 'power2.out' }, 0.04);
    }

    // Phase 3: divider scales in
    if (missionDivider) {
      missionTl.to(missionDivider, { scaleX: 1, duration: 0.2, ease: 'power2.out' }, 0.08);
    }

    // Phase 4: headings fade in (stay in place)
    missionTl.to(missionHeadings, {
      autoAlpha: 1,
      duration: 0.2,
      ease: 'power2.out',
      stagger: 0.1,
    }, 0.12);

    // Phase 5: body text slides from right → centre
    missionTl.to(missionBodies, {
      autoAlpha: 1,
      xPercent: 0,
      duration: 0.35,
      ease: 'power3.out',
      stagger: 0.12,
    }, 0.16);
  }

  // ── Second panel: scrub-driven reveal (optional — panel may not exist) ──
  if (elements.secondPanel) {
    const secondPanel = elements.secondPanel;
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
  }

  // ── Directions panel: pinned carousel ──────────────────────────────────
  // Created HERE (after SecondPanel, before Members) to respect GSAP's
  // top-to-bottom ScrollTrigger creation order for correct pinSpacing.
  if (directionsPanel) {
    initDirectionsCarousel(directionsPanel);
  }

  // ── Members panel: independent pinned carousel ─────────────────────────
  // The members panel uses its own pinned ScrollTrigger (similar to the hero)
  // so cards get enough scroll distance for the fly-across animation.
  if (membersPanel) {
    initMembersCarousel(membersPanel);
  }

  // ── Fourth panel: scrub-driven reveal ───────────────────────────────────
  if (fourthPanel) {
    gsap.set(fourthPanel, { autoAlpha: 0, y: 48 });

    const fourthTl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: fourthPanel,
        start: 'top 88%',
        end: 'top 10%',
        scrub: 0.4,
      },
    });

    // Phase 1: panel fades in
    fourthTl.to(fourthPanel, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0);

    // Phase 2: closing quote — SplitText character reveal (mirrors hero slogan)
    const closingQuote = fourthPanel.querySelector<HTMLElement>('[data-fp-closing-quote]');
    const closingText = fourthPanel.querySelector<HTMLElement>('[data-fp-closing-text]');
    const closingOrnament = fourthPanel.querySelector<HTMLElement>('.fp-closing-quote__ornament');

    if (closingQuote && closingText) {
      gsap.set(closingQuote, { opacity: 0 });
      if (closingOrnament) gsap.set(closingOrnament, { opacity: 0 });

      gsap.registerPlugin(SplitText);
      const split = new SplitText(closingText, { type: 'chars' });
      gsap.set(split.chars, { opacity: 0, y: 20, filter: 'blur(4px)' });

      // Fade in the container
      fourthTl.to(closingQuote, { opacity: 1, duration: 0.15, ease: 'none' }, 0.35);

      // Stagger character reveal
      const charCount = split.chars.length;
      const revealBudget = 0.45;
      const perCharDuration = revealBudget / (charCount + 1);

      fourthTl.to(
        split.chars,
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: perCharDuration,
          stagger: perCharDuration,
          ease: 'power2.out',
        },
        0.4,
      );

      // Ornament lines fade in after text
      if (closingOrnament) {
        fourthTl.to(closingOrnament, { opacity: 0.8, duration: 0.15, ease: 'power2.out' }, 0.75);
      }
    }
  }
};

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------
export const initAllPanelTransitions = ({
  elements,
  directionsPanel,
  membersPanel,
  fourthPanel,
  prefersReducedMotion,
  splitTextAvailable,
}: InitAllPanelTransitionsOptions) => {
  if (prefersReducedMotion) {
    initReducedMotionTransitions({ elements, directionsPanel, membersPanel, fourthPanel });
    return;
  }

  initFullTransitions({ elements, directionsPanel, membersPanel, fourthPanel, splitTextAvailable });
};
