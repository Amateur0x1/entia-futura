import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { addHeroMediaDriftSegment } from './addHeroMediaDriftSegment';
import type { HomeHeroElements } from './getHomeHeroElements';
import { addHeroVideoTransitionSegment } from './heroVideoEffects';
import {
  PANEL_TRANSITION_RADIUS,
  addPanelPushTransitionSegment,
  createTransitionShade,
  getPanelFakeScrollDistance,
} from './panelPushTransition';
import { setupSecondPanelReveal } from './setupSecondPanelReveal';
import { setupThirdPanelReveal } from './setupThirdPanelReveal';

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
  fourthPanel: HTMLElement | null;
  fourthScrollSpacer: HTMLElement | null;
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
  fourthPanel,
  fourthScrollSpacer,
}: Pick<
  InitAllPanelTransitionsOptions,
  | 'elements'
  | 'thirdPanel'
  | 'scrollSpacer'
  | 'fourthPanel'
  | 'fourthScrollSpacer'
>) => {
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

  const secondPanelKnowMoreRM = elements.secondPanelKnowMore;

  // 2→3: swap panels
  gsap.timeline({
    scrollTrigger: {
      trigger: scrollSpacer,
      start: 'top -56%',
      end: 'top -92%',
      toggleActions: 'play none reverse reverse',
      onEnter: () => { secondPanelKnowMoreRM?.classList.remove('is-visible'); },
      onLeaveBack: () => { secondPanelKnowMoreRM?.classList.add('is-visible'); },
    },
  })
    .to(secondPanel, { autoAlpha: 0, visibility: 'hidden', pointerEvents: 'none', duration: 0.01, ease: 'none' })
    .to(thirdPanel, { autoAlpha: 1, visibility: 'visible', pointerEvents: 'auto', duration: 0.01, ease: 'none' }, 0);

  // Reduced-motion: show third panel content immediately — no animation.
  setupThirdPanelReveal({
    prefersReducedMotion: true,
    thirdPanel,
    timeline: gsap.timeline(),
    startAt: 0,
  });

  // Know More button — show immediately in reduced-motion, bind click.
  if (secondPanelKnowMoreRM) {
    secondPanelKnowMoreRM.classList.add('is-visible');
    secondPanelKnowMoreRM.addEventListener('click', () => {
      const target = scrollSpacer.offsetTop + scrollSpacer.offsetHeight;
      window.scrollTo({ top: target, behavior: 'smooth' });
    });
  }

  // 3→4: simple fade swap for reduced-motion
  if (fourthPanel && fourthScrollSpacer) {
    gsap.timeline({
      scrollTrigger: {
        trigger: fourthScrollSpacer,
        start: 'top -56%',
        end: 'top -92%',
        toggleActions: 'play none reverse reverse',
      },
    })
      .to(thirdPanel, { autoAlpha: 0, visibility: 'hidden', pointerEvents: 'none', duration: 0.01, ease: 'none' })
      .to(fourthPanel, { autoAlpha: 1, visibility: 'visible', pointerEvents: 'auto', duration: 0.01, ease: 'none' }, 0);
  }
};

// ---------------------------------------------------------------------------
// Full animation (scrub-based)
// ---------------------------------------------------------------------------
const initFullTransitions = ({
  elements,
  thirdPanel,
  scrollSpacer,
  fourthPanel,
  fourthScrollSpacer,
  splitTextAvailable,
}: Omit<InitAllPanelTransitionsOptions, 'prefersReducedMotion'>) => {
  const secondPanelKnowMore = elements.secondPanelKnowMore;
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
  const heroShade = createTransitionShade('data-hero-panel-transition-shade', heroTransitionRoot);
  const secondShade = createTransitionShade('data-second-panel-transition-shade', secondPanel);
  const thirdShade = createTransitionShade('data-third-panel-transition-shade', thirdPanel);

  gsap.set([heroShade, secondShade, thirdShade], { opacity: 0 });

  // Optionally create shades for 4th and 5th panels if they exist
  // Shade for 3rd panel (outgoing in 3→4)
  const fourthShade = fourthPanel
    ? createTransitionShade('data-fourth-panel-transition-shade', fourthPanel)
    : null;
  if (fourthShade) gsap.set(fourthShade, { opacity: 0 });

  // ── initial states ─────────────────────────────────────────────────────────
  const outgoingHeroPanel = heroTransitionRoot;

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

  // Set panel 4 to its initial hidden-below state
  for (const p of [fourthPanel]) {
    if (!p) continue;
    gsap.set(p, {
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
  }

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
        onLeaveBack: () => {
          if (heroTransitionFrame) {
            gsap.set(heroTransitionFrame, { borderTopLeftRadius: 0, borderTopRightRadius: 0 });
          }
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

    if (heroTransitionFrame) {
      gsap.set(heroTransitionFrame, { borderTopLeftRadius: 0, borderTopRightRadius: 0 });
      heroTimeline.fromTo(
        heroTransitionFrame,
        { immediateRender: false, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
        { borderTopLeftRadius: PANEL_TRANSITION_RADIUS, borderTopRightRadius: PANEL_TRANSITION_RADIUS, duration: heroPanelPushDuration, ease: 'none' },
        heroPanelExitStart,
      );
    }

    setupSecondPanelReveal({
      prefersReducedMotion: false,
      splitTextAvailable,
      secondPanel,
      secondPanelLabel: elements.secondPanelLabel,
      secondPanelHeading: elements.secondPanelHeading,
      secondPanelDivider: elements.secondPanelDivider,
      secondPanelBody: elements.secondPanelBody,
      secondPanelParagraphs: elements.secondPanelParagraphs,
      secondPanelKnowMore: elements.secondPanelKnowMore,
      timeline: heroTimeline,
      startAt: panelTextRevealStart,
    });

    addHeroVideoTransitionSegment({
      elements,
      heroTimeline,
      videoPlaybackEnd: heroPanelExitStart,
    });

    gsap.ticker.add(function refreshHero() {
      ScrollTrigger.refresh();
      gsap.ticker.remove(refreshHero);
    });
  };

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

  let secondPanelResetCall: gsap.core.Tween | null = null;
  let thirdPanelRevealScrollExtra = Math.round(window.innerHeight * 1.5);

  const secondTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: scrollSpacer,
      start: 'top top',
      end: () => `+=${Math.round(window.innerHeight + getPanelFakeScrollDistance(secondPanel, secondPanelInner) + thirdPanelRevealScrollExtra)}`,
      invalidateOnRefresh: true,
      scrub: 0.35,
      onEnter: () => {
        secondPanelResetCall?.kill();
        secondPanelResetCall = null;
        secondPanelKnowMore?.classList.remove('is-visible');
        gsap.set(thirdPanel, {
          opacity: 0,
          visibility: 'visible',
          pointerEvents: 'none',
          yPercent: 100,
          y: 0,
          scale: 1,
          zIndex: 38,
        });
        gsap.set(secondPanel, { autoAlpha: 1, visibility: 'visible', pointerEvents: 'auto', zIndex: 36 });
      },
      onEnterBack: () => {
        secondPanelResetCall?.kill();
        secondPanelResetCall = null;
        gsap.set(thirdPanel, {
          visibility: 'visible',
          pointerEvents: 'none',
          zIndex: 38,
        });
        gsap.set(secondPanel, { visibility: 'visible', pointerEvents: 'auto', zIndex: 36 });
      },
      onLeave: () => {
        gsap.set(thirdPanel, { pointerEvents: 'auto', zIndex: 36 });
        gsap.set(secondPanel, { pointerEvents: 'none', zIndex: 30 });
        secondPanelKnowMore?.classList.remove('is-visible');
      },
      onLeaveBack: () => {
        secondPanelKnowMore?.classList.add('is-visible');
        gsap.set(thirdPanel, {
          opacity: 0,
          visibility: 'visible',
          pointerEvents: 'none',
          yPercent: 100,
          y: 0,
          zIndex: 30,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        });
        gsap.set(secondPanel, { pointerEvents: 'auto', zIndex: 36 });
        gsap.set(secondShade, { opacity: 0 });
        secondPanelResetCall = gsap.delayedCall(0.75, () => {
          gsap.set(secondPanel, {
            autoAlpha: 1,
            visibility: 'visible',
            scale: 1,
            y: 0,
            yPercent: 0,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          });
          gsap.set(secondShade, { opacity: 0 });
        });
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

  const thirdPanelRevealStart = panelPushStart + panelPushDuration + 0.2;
  setupThirdPanelReveal({
    prefersReducedMotion: false,
    thirdPanel,
    timeline: secondTimeline,
    startAt: thirdPanelRevealStart,
  });

  {
    const vh = window.innerHeight;
    const totalDuration = secondTimeline.totalDuration();
    const totalScrollPixels = Math.ceil(totalDuration * vh);
    const basePixels = vh + getPanelFakeScrollDistance(secondPanel, secondPanelInner);
    thirdPanelRevealScrollExtra = Math.max(0, totalScrollPixels - basePixels);

    const neededSvh = Math.ceil((totalScrollPixels / vh) * 100) + 160;
    scrollSpacer.style.height = `${neededSvh}svh`;

    gsap.ticker.add(function refresh() {
      ScrollTrigger.refresh();
      gsap.ticker.remove(refresh);
    });
  }

  if (elements.secondPanelKnowMore) {
    elements.secondPanelKnowMore.addEventListener('click', () => {
      const target = scrollSpacer.offsetTop + scrollSpacer.offsetHeight;
      const startY = window.scrollY;
      const distance = Math.max(target - startY, 0);
      if (distance < 4) return;

      const DURATION = 6000;
      const startTime = performance.now();
      const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      const step = (now: number) => {
        const raw = Math.min((now - startTime) / DURATION, 1);
        window.scrollTo({ top: startY + distance * easeInOut(raw) });
        if (raw < 1) window.requestAnimationFrame(step);
      };

      window.requestAnimationFrame(step);
    });
  }

  // ── Helper: build one "N→N+1" scrub push timeline ─────────────────────────
  /**
   * Creates a scrub-based push transition between two adjacent fixed panels,
   * following the exact same pattern as the 2→3 secondTimeline above.
   *
   * @param outgoingPanel  - The panel currently visible (will scale-shrink)
   * @param incomingPanel  - The panel that slides up from below
   * @param outgoingShade  - Dark overlay sitting inside outgoingPanel
   * @param spacerEl       - The scroll-spacer that acts as the ScrollTrigger trigger
   * @param outgoingZIndex - Starting z-index for the outgoing panel at rest
   */
  const buildPushTimeline = (
    outgoingPanel: HTMLElement,
    incomingPanel: HTMLElement,
    outgoingShade: HTMLElement,
    spacerEl: HTMLElement,
    outgoingZIndex: number,
  ) => {
    const PUSH_DURATION = 1.6;
    const PUSH_START = 0;

    // Tracks a pending delayed-call that resets outgoingPanel after onLeaveBack.
    let resetCall: gsap.core.Tween | null = null;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: spacerEl,
        start: 'top top',
        end: () => `+=${Math.round(window.innerHeight * (PUSH_START + PUSH_DURATION + 0.4))}`,
        invalidateOnRefresh: true,
        scrub: 0.35,
        onEnter: () => {
          resetCall?.kill();
          resetCall = null;
          // Reset panels to their pre-transition state on forward entry
          gsap.set(incomingPanel, {
            opacity: 0,
            visibility: 'visible',
            pointerEvents: 'none',
            yPercent: 100,
            y: 0,
            scale: 1,
            zIndex: outgoingZIndex + 2,
          });
          gsap.set(outgoingPanel, {
            autoAlpha: 1,
            visibility: 'visible',
            pointerEvents: 'auto',
            zIndex: outgoingZIndex,
          });
        },
        onEnterBack: () => {
          resetCall?.kill();
          resetCall = null;
          // Re-entering from below: restore z-index; scrub owns visual props
          gsap.set(incomingPanel, {
            visibility: 'visible',
            pointerEvents: 'none',
            zIndex: outgoingZIndex + 2,
          });
          gsap.set(outgoingPanel, {
            visibility: 'visible',
            pointerEvents: 'auto',
            zIndex: outgoingZIndex,
          });
        },
        onLeave: () => {
          // Transition complete: incomingPanel is the active screen
          gsap.set(incomingPanel, { pointerEvents: 'auto', zIndex: outgoingZIndex });
          gsap.set(outgoingPanel, { pointerEvents: 'none', zIndex: outgoingZIndex - 6 });
        },
        onLeaveBack: () => {
          // Scrolled back above this zone: outgoingPanel is active again
          gsap.set(incomingPanel, {
            opacity: 0,
            visibility: 'visible',
            pointerEvents: 'none',
            yPercent: 100,
            y: 0,
            zIndex: outgoingZIndex - 6,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          });
          gsap.set(outgoingPanel, { pointerEvents: 'auto', zIndex: outgoingZIndex });
          gsap.set(outgoingShade, { opacity: 0 });
          // Defer full reset until scrub easing settles (scrub: 0.35 + buffer)
          resetCall = gsap.delayedCall(0.75, () => {
            gsap.set(outgoingPanel, {
              autoAlpha: 1,
              visibility: 'visible',
              scale: 1,
              y: 0,
              yPercent: 0,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            });
            gsap.set(outgoingShade, { opacity: 0 });
          });
        },
      },
    });

    addPanelPushTransitionSegment({
      duration: PUSH_DURATION,
      incomingPanel,
      liftDistance: () => 0,
      outgoingPanel,
      outgoingScale: 0.72,
      shade: outgoingShade,
      shadeOpacity: 0.58,
      startAt: PUSH_START,
      timeline: tl,
    });

    // Calibrate spacer height so 1 timeline-unit == 1 vh of scroll distance.
    // Use +160 buffer (matching the 2→3 spacer logic) so there is always
    // enough runway after the animation completes before the next trigger fires.
    const vh = window.innerHeight;
    const totalScrollPixels = Math.ceil(tl.totalDuration() * vh);
    const neededSvh = Math.ceil((totalScrollPixels / vh) * 100) + 160;
    spacerEl.style.height = `${neededSvh}svh`;

    gsap.ticker.add(function refreshLater() {
      ScrollTrigger.refresh();
      gsap.ticker.remove(refreshLater);
    });

    return tl;
  };

  // ── 3→4 scrub timeline ────────────────────────────────────────────────────
  if (fourthPanel && fourthScrollSpacer && fourthShade) {
    buildPushTimeline(
      thirdPanel,
      fourthPanel,
      thirdShade,
      fourthScrollSpacer,
      36,
    );
  }

};

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------
export const initAllPanelTransitions = ({
  elements,
  thirdPanel,
  scrollSpacer,
  fourthPanel,
  fourthScrollSpacer,
  prefersReducedMotion,
  splitTextAvailable,
}: InitAllPanelTransitionsOptions) => {
  if (prefersReducedMotion) {
    initReducedMotionTransitions({
      elements,
      thirdPanel,
      scrollSpacer,
      fourthPanel,
      fourthScrollSpacer,
    });
    return;
  }

  initFullTransitions({
    elements,
    thirdPanel,
    scrollSpacer,
    fourthPanel,
    fourthScrollSpacer,
    splitTextAvailable,
  });
};
