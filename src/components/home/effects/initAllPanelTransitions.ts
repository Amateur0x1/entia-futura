import gsap from 'gsap';

import { addHeroMediaDriftSegment } from './addHeroMediaDriftSegment';
import type { HomeHeroElements } from './getHomeHeroElements';
import { addHeroVideoTransitionSegment } from './heroVideoEffects';
import {
  addPanelPushTransitionSegment,
  createTransitionShade,
  getPanelFakeScrollDistance,
} from './panelPushTransition';
import { setupSecondPanelReveal } from './setupSecondPanelReveal';

// ---------------------------------------------------------------------------
// Timing constants (desktop scroll distance for the 1→2 transition)
// ---------------------------------------------------------------------------
export const HERO_TO_INTRO_TIMING = {
  videoPlaybackStart: 0,
  videoPlaybackDuration: 4.1,
  panelRevealDelayAfterVideoEnd: 0.52,
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
  scrollSpacer: HTMLElement;
  prefersReducedMotion: boolean;
  splitTextAvailable: boolean;
}

// ---------------------------------------------------------------------------
// Reduced-motion variants (simple show/hide, no scrub)
// ---------------------------------------------------------------------------
const initReducedMotionTransitions = ({
  elements,
  thirdPanel,
  scrollSpacer,
}: Pick<InitAllPanelTransitionsOptions, 'elements' | 'thirdPanel' | 'scrollSpacer'>) => {
  const { heroTransitionRoot, secondPanel } = elements;
  if (!heroTransitionRoot || !secondPanel) return;

  // 1→2: fade in secondPanel when hero scrolls out
  gsap.timeline({
    scrollTrigger: {
      trigger: heroTransitionRoot,
      start: 'top -80%',
      end: 'top -95%',
      toggleActions: 'play none reverse reverse',
    },
  })
    .fromTo(
      secondPanel,
      { autoAlpha: 0, y: 22, filter: 'blur(8px)', pointerEvents: 'none' },
      { autoAlpha: 1, y: 0, filter: 'blur(0px)', visibility: 'visible', pointerEvents: 'auto', duration: 0.42, ease: 'power3.out' },
    );

  // 2→3: swap panels
  gsap.timeline({
    scrollTrigger: {
      trigger: scrollSpacer,
      start: 'top -56%',
      end: 'top -92%',
      toggleActions: 'play none reverse reverse',
    },
  })
    .to(secondPanel, { autoAlpha: 0, visibility: 'hidden', pointerEvents: 'none', duration: 0.01, ease: 'none' })
    .to(thirdPanel, { autoAlpha: 1, visibility: 'visible', pointerEvents: 'auto', duration: 0.01, ease: 'none' }, 0);
};

// ---------------------------------------------------------------------------
// Full animation (scrub-based)
// ---------------------------------------------------------------------------
const initFullTransitions = ({
  elements,
  thirdPanel,
  scrollSpacer,
  splitTextAvailable,
}: Omit<InitAllPanelTransitionsOptions, 'prefersReducedMotion'>) => {
  const {
    heroTransitionFrame,
    heroTransitionRoot,
    heroVideoShell,
    secondPanel,
    secondPanelInner,
    scrollVideo,
  } = elements;

  if (!heroTransitionRoot || !secondPanel) return;

  // ── shared layers ──────────────────────────────────────────────────────────
  const heroShade = createTransitionShade('data-hero-panel-transition-shade');
  const secondShade = createTransitionShade('data-second-panel-transition-shade');

  gsap.set([heroShade, secondShade], { opacity: 0 });

  // ── initial states ─────────────────────────────────────────────────────────
  // Use the full section as the outgoing panel so the entire element (including
  // its background) is scaled — this lets the body polka-dot background show
  // through during the 1→2 push transition instead of a solid colour fill.
  const outgoingHeroPanel = heroTransitionRoot;

  // Set thirdPanel to its incoming (hidden) state for the 2→3 transition.
  // We only call setPanelTransitionInitialState for the outgoing sides here;
  // secondPanel's incoming state (opacity:0, yPercent:100) is set explicitly
  // below so it isn't accidentally overwritten by the secondPanel-as-outgoing call.
  gsap.set(thirdPanel, {
    opacity: 0,
    yPercent: 100,
    y: 0,
    filter: 'blur(0px)',
    transformOrigin: '50% 50%',
    visibility: 'visible',
    pointerEvents: 'none',
    zIndex: 38,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  });
  // secondPanel is outgoing for 2→3 — full visible/reset state.
  gsap.set(secondPanel, {
    autoAlpha: 1,
    scale: 1,
    y: 0,
    yPercent: 0,
    filter: 'blur(0px)',
    transformOrigin: '50% 50%',
    zIndex: 36,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  });
  // outgoingHeroPanel is outgoing for 1→2.
  gsap.set(outgoingHeroPanel, {
    autoAlpha: 1,
    scale: 1,
    y: 0,
    yPercent: 0,
    filter: 'blur(0px)',
    transformOrigin: '50% 50%',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  });
  // secondPanel is ALSO incoming for 1→2 — this must come LAST so it wins.
  // opacity:0 + yPercent:100 hides it below the viewport until the 1→2 transition.
  gsap.set(secondPanel, {
    opacity: 0,
    yPercent: 100,
    y: 0,
    filter: 'blur(0px)',
    transformOrigin: '50% 50%',
    visibility: 'visible',
    pointerEvents: 'none',
    zIndex: 38,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  });

  gsap.set(secondPanelInner, { y: 0, willChange: 'transform' });

  // ── 1→2 scrub timeline ────────────────────────────────────────────────────
  const createHeroTimeline = () => {
    const transitionScrollDistance =
      window.innerWidth <= 720
        ? HERO_TO_INTRO_TIMING.transitionScrollDistanceMobile
        : HERO_TO_INTRO_TIMING.transitionScrollDistanceDesktop;

    const heroTimeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        // heroTransitionRoot is now a top-level sibling in <main> (not nested inside
        // .landing-system), so GSAP pin can safely fixed-position it without collapsing
        // a parent container.
        trigger: heroTransitionRoot,
        start: 'top top',
        end: `+=${transitionScrollDistance}`,
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

    const heroPanelExitStart =
      HERO_TO_INTRO_TIMING.videoPlaybackStart +
      HERO_TO_INTRO_TIMING.videoPlaybackDuration +
      HERO_TO_INTRO_TIMING.panelRevealDelayAfterVideoEnd;
    const heroPanelPushDuration = 1.6;
    const panelTextRevealStart = heroPanelExitStart + heroPanelPushDuration + 0.16;

    heroTimeline.to(
      elements.signalCards,
      { autoAlpha: 0, y: -58, duration: 0.32, stagger: 0.02 },
      heroPanelExitStart,
    );

    addPanelPushTransitionSegment({
      duration: heroPanelPushDuration,
      incomingPanel: secondPanel,
      liftDistance: () => 0,
      outgoingPanel: outgoingHeroPanel,
      outgoingScale: 0.72,
      shade: heroShade,
      shadeOpacity: 0.58,
      startAt: heroPanelExitStart,
      timeline: heroTimeline,
    });

    // No need to manually hide heroTransitionRoot — GSAP pin unpin handles it.

    setupSecondPanelReveal({
      prefersReducedMotion: false,
      splitTextAvailable,
      secondPanel,
      secondPanelLabel: elements.secondPanelLabel,
      secondPanelHeading: elements.secondPanelHeading,
      secondPanelDivider: elements.secondPanelDivider,
      secondPanelBody: elements.secondPanelBody,
      secondPanelParagraphs: elements.secondPanelParagraphs,
      timeline: heroTimeline,
      startAt: panelTextRevealStart,
    });

    // Add the video scrub LAST, after all other tweens have been added to heroTimeline.
    // We pass heroPanelExitStart as videoPlaybackEnd: the video currentTime tween spans
    // timeline positions [0, heroPanelExitStart], which is exactly the same slot as the
    // panel-push and text-reveal tweens that start at heroPanelExitStart.
    // This means the video always fills 100% of "its" scroll region, regardless of
    // how long heroTimeline.totalDuration() turns out to be.
    addHeroVideoTransitionSegment({
      elements,
      heroTimeline,
      videoPlaybackEnd: heroPanelExitStart,
    });
  };

  // By the time this runs, loader:done has already fired, so video metadata
  // should be available. If readyState is still < 1 for any reason, wait for
  // the event (no forced timeout — the loader gate is the timeout).
  if (heroVideoShell && scrollVideo && scrollVideo.readyState < 1) {
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

  // ── 2→3 scrub timeline ────────────────────────────────────────────────────
  const fakeScrollDistance = getPanelFakeScrollDistance(secondPanel, secondPanelInner);
  const fakeScrollDuration =
    fakeScrollDistance > 1 ? Math.min(Math.max(fakeScrollDistance / window.innerHeight, 0.45), 1.55) : 0;
  const panelPushStart = fakeScrollDuration;
  const panelPushDuration = 1.6;

  const secondTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: scrollSpacer,
      start: 'top -52%',
      end: () => `+=${Math.round(window.innerHeight + getPanelFakeScrollDistance(secondPanel, secondPanelInner))}`,
      scrub: 0.6,
      invalidateOnRefresh: true,
      onEnter: () => {
        // Reset panels to their pre-transition state so the scrub timeline starts
        // from a clean slate. Do NOT touch backplate/shade here — their opacity
        // is driven entirely by the scrub timeline to avoid any jump-frame flash.
        gsap.set(thirdPanel, {
          opacity: 0,
          visibility: 'visible',
          pointerEvents: 'none',
          yPercent: 100,
          y: 0,
          scale: 1,
          zIndex: 38,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        });
        gsap.set(secondPanel, { autoAlpha: 1, visibility: 'visible', pointerEvents: 'auto', zIndex: 36 });
      },
      onEnterBack: () => {
        // Same rationale: scrub controls backplate/shade.
        gsap.set(thirdPanel, {
          opacity: 0,
          visibility: 'visible',
          pointerEvents: 'none',
          yPercent: 100,
          y: 0,
          scale: 1,
          zIndex: 38,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        });
        gsap.set(secondPanel, { autoAlpha: 1, visibility: 'visible', pointerEvents: 'auto', zIndex: 36 });
      },
      onLeave: () => {
        // Transition complete: thirdPanel is now the active screen.
        // Drop secondPanel below thirdPanel so it can't bleed through if opacity briefly non-zero.
        gsap.set(thirdPanel, { pointerEvents: 'auto', zIndex: 36 });
        gsap.set(secondPanel, {
          autoAlpha: 0,
          pointerEvents: 'none',
          zIndex: 30,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        });
          gsap.set(secondShade, { opacity: 0 });
      },
      onLeaveBack: () => {
        // Scrolled back above the 2→3 zone: secondPanel is active, thirdPanel goes back below.
        gsap.set(thirdPanel, {
          opacity: 0,
          visibility: 'visible',
          pointerEvents: 'none',
          yPercent: 100,
          y: 0,
          zIndex: 30,   // below secondPanel
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        });
        gsap.set(secondPanel, {
          autoAlpha: 1,
          visibility: 'visible',
          pointerEvents: 'auto',
          scale: 1,
          y: 0,
          yPercent: 0,
          zIndex: 36,   // active layer
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        });
        gsap.set(secondShade, { opacity: 0 });
      },
    },
  });

  if (fakeScrollDistance > 1 && secondPanelInner) {
    secondTimeline.to(
      secondPanelInner,
      { y: () => -getPanelFakeScrollDistance(secondPanel, secondPanelInner), duration: fakeScrollDuration, ease: 'none' },
      0,
    );
  }

  addPanelPushTransitionSegment({
    duration: panelPushDuration,
    incomingPanel: thirdPanel,
    liftDistance: () => 0,
    outgoingPanel: secondPanel,
    outgoingScale: 0.72,
    shade: secondShade,
    shadeOpacity: 0.58,
    startAt: panelPushStart,
    timeline: secondTimeline,
  });
};

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------
export const initAllPanelTransitions = ({
  elements,
  thirdPanel,
  scrollSpacer,
  prefersReducedMotion,
  splitTextAvailable,
}: InitAllPanelTransitionsOptions) => {
  if (prefersReducedMotion) {
    initReducedMotionTransitions({ elements, thirdPanel, scrollSpacer });
    return;
  }

  initFullTransitions({ elements, thirdPanel, scrollSpacer, splitTextAvailable });
};
