import gsap from 'gsap';

import { addHeroMediaDriftSegment } from './addHeroMediaDriftSegment';
import type { HomeHeroElements } from './getHomeHeroElements';
import { addHeroVideoTransitionSegment } from './heroVideoEffects';
import {
  addPanelPushTransitionSegment,
  createTransitionBackplate,
  createTransitionShade,
  getPanelFakeScrollDistance,
  PANEL_TRANSITION_RADIUS,
  setPanelTransitionInitialState,
} from './panelPushTransition';
import { setupNextPanelReveal } from './setupNextPanelReveal';

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
  const { heroTransitionRoot, nextPanel } = elements;
  if (!heroTransitionRoot || !nextPanel) return;

  // 1→2: fade in nextPanel when hero scrolls out
  gsap.timeline({
    scrollTrigger: {
      trigger: heroTransitionRoot,
      start: 'top -80%',
      end: 'top -95%',
      toggleActions: 'play none reverse reverse',
    },
  })
    .fromTo(
      nextPanel,
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
    .to(nextPanel, { autoAlpha: 0, visibility: 'hidden', pointerEvents: 'none', duration: 0.01, ease: 'none' })
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
    nextPanel,
    nextPanelInner,
    scrollVideo,
  } = elements;

  if (!heroTransitionRoot || !nextPanel) return;

  // ── shared layers ──────────────────────────────────────────────────────────
  const heroBackplate = createTransitionBackplate('data-hero-panel-transition-backplate');
  const heroShade = createTransitionShade('data-hero-panel-transition-shade');
  const secondBackplate = createTransitionBackplate('data-second-panel-transition-backplate');
  const secondShade = createTransitionShade('data-second-panel-transition-shade');

  gsap.set([heroBackplate, heroShade, secondBackplate, secondShade], { autoAlpha: 0 });

  // ── initial states ─────────────────────────────────────────────────────────
  const outgoingHeroPanel = heroTransitionFrame ?? heroTransitionRoot;

  // 1→2: hero panel is outgoing, nextPanel is incoming
  setPanelTransitionInitialState({ incomingPanel: nextPanel, outgoingPanel: outgoingHeroPanel });
  // 2→3: nextPanel is outgoing, thirdPanel is incoming
  // This call runs after the one above, so it overwrites nextPanel's state
  // to "outgoing" (autoAlpha:1, visible, yPercent:0) — the correct default.
  setPanelTransitionInitialState({ incomingPanel: thirdPanel, outgoingPanel: nextPanel });

  gsap.set(nextPanelInner, { y: 0, willChange: 'transform' });

  // ── 1→2 scrub timeline ────────────────────────────────────────────────────
  const createHeroTimeline = () => {
    const transitionScrollDistance =
      window.innerWidth <= 720
        ? HERO_TO_INTRO_TIMING.transitionScrollDistanceMobile
        : HERO_TO_INTRO_TIMING.transitionScrollDistanceDesktop;

    const heroTimeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: heroTransitionRoot,
        start: 'top top',
        end: `+=${transitionScrollDistance}`,
        scrub: 0.35,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: ({ progress }) => {
          // Mirror the hero root's visibility to the frame's animated state.
          // We only touch `visibility` (not opacity/autoAlpha) so we don't
          // interfere with the timeline's own fade tweens.
          const hidden = progress >= HERO_TO_INTRO_TIMING.heroHideAtProgress;
          gsap.set(heroTransitionRoot, { visibility: hidden ? 'hidden' : 'visible' });
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
      backplate: heroBackplate,
      duration: heroPanelPushDuration,
      incomingPanel: nextPanel,
      liftDistance: () => 0,
      outgoingPanel: outgoingHeroPanel,
      outgoingScale: 0.72,
      shade: heroShade,
      shadeOpacity: 0.58,
      startAt: heroPanelExitStart,
      timeline: heroTimeline,
    });

    heroTimeline.set(heroTransitionRoot, { visibility: 'hidden' }, heroPanelExitStart + heroPanelPushDuration);

    setupNextPanelReveal({
      prefersReducedMotion: false,
      splitTextAvailable,
      nextPanel,
      nextPanelLabel: elements.nextPanelLabel,
      nextPanelHeading: elements.nextPanelHeading,
      nextPanelDivider: elements.nextPanelDivider,
      nextPanelBody: elements.nextPanelBody,
      nextPanelParagraphs: elements.nextPanelParagraphs,
      timeline: heroTimeline,
      startAt: panelTextRevealStart,
    });
  };

  // Defer hero timeline until video metadata is ready (same as before)
  if (heroVideoShell && scrollVideo && scrollVideo.readyState < 1) {
    scrollVideo.addEventListener('loadedmetadata', createHeroTimeline, { once: true });
  } else {
    createHeroTimeline();
  }

  // ── 2→3 scrub timeline ────────────────────────────────────────────────────
  const fakeScrollDistance = getPanelFakeScrollDistance(nextPanel, nextPanelInner);
  const fakeScrollDuration =
    fakeScrollDistance > 1 ? Math.min(Math.max(fakeScrollDistance / window.innerHeight, 0.45), 1.55) : 0;
  const panelPushStart = fakeScrollDuration;
  const panelPushDuration = 1.6;

  const secondTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: scrollSpacer,
      start: 'top -52%',
      end: () => `+=${Math.round(window.innerHeight + getPanelFakeScrollDistance(nextPanel, nextPanelInner))}`,
      scrub: 0.6,
      invalidateOnRefresh: true,
      onEnter: () => {
        // Only ensure panels are in the correct initial state before scrub starts.
        // DO NOT show backplate/shade here — they must stay in sync with the
        // scrub timeline to avoid a one-frame background colour flash on fast scrolls.
        gsap.set(thirdPanel, {
          autoAlpha: 0,
          visibility: 'hidden',
          pointerEvents: 'none',
          yPercent: 100,
          zIndex: 38,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        });
        gsap.set(nextPanel, { autoAlpha: 1, visibility: 'visible', pointerEvents: 'auto', zIndex: 36 });
      },
      onEnterBack: () => {
        // Same rationale: let the scrub timeline control backplate/shade.
        gsap.set(nextPanel, { autoAlpha: 1, visibility: 'visible', pointerEvents: 'auto', zIndex: 36 });
      },
      onLeave: () => {
        gsap.set(thirdPanel, { pointerEvents: 'auto', zIndex: 35 });
        gsap.set(nextPanel, {
          autoAlpha: 0,
          visibility: 'hidden',
          pointerEvents: 'none',
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        });
        gsap.set([secondBackplate, secondShade], { autoAlpha: 0, visibility: 'hidden' });
      },
      onLeaveBack: () => {
        gsap.set(thirdPanel, {
          autoAlpha: 0,
          yPercent: 100,
          visibility: 'hidden',
          pointerEvents: 'none',
          zIndex: 38,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        });
        gsap.set(nextPanel, {
          autoAlpha: 1,
          visibility: 'visible',
          pointerEvents: 'auto',
          scale: 1,
          y: 0,
          yPercent: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        });
        gsap.set([secondBackplate, secondShade], { autoAlpha: 0, visibility: 'hidden' });
      },
    },
  });

  if (fakeScrollDistance > 1 && nextPanelInner) {
    secondTimeline.to(
      nextPanelInner,
      { y: () => -getPanelFakeScrollDistance(nextPanel, nextPanelInner), duration: fakeScrollDuration, ease: 'none' },
      0,
    );
  }

  addPanelPushTransitionSegment({
    backplate: secondBackplate,
    duration: panelPushDuration,
    incomingPanel: thirdPanel,
    liftDistance: () => 0,
    outgoingPanel: nextPanel,
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
