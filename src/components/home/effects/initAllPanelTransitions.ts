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
  // Shades are positioned *inside* their respective outgoing panels (absolute)
  // so they only darken the outgoing panel — not the incoming panel sliding up.
  const heroShade = createTransitionShade('data-hero-panel-transition-shade', heroTransitionRoot);
  const secondShade = createTransitionShade('data-second-panel-transition-shade', secondPanel);

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
    const heroTimeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        // heroTransitionRoot is now a top-level sibling in <main> (not nested inside
        // .landing-system), so GSAP pin can safely fixed-position it without collapsing
        // a parent container.
        trigger: heroTransitionRoot,
        start: 'top top',
        end: () => `+=${Math.round(heroTimeline.totalDuration() * window.innerHeight)}`,
        pin: true,
        pinSpacing: true,
        scrub: 0.35,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onLeaveBack: () => {
          // Scrub fully reversed past start: reset frame radius so it's clean
          // if the user scrolls forward again.
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

    // heroTransitionFrame is the actual full-screen visual container (100vh, overflow:hidden).
    // Drive its border-radius separately so the rounded-corner clip is visible.
    // No .set() at the end — scrub reversal would hit it and flash the corners away.
    // immediateRender:false prevents the "from" state from snapping in on reverse scrub.
    if (heroTransitionFrame) {
      gsap.set(heroTransitionFrame, { borderTopLeftRadius: 0, borderTopRightRadius: 0 });
      heroTimeline.fromTo(
        heroTransitionFrame,
        { immediateRender: false, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
        { borderTopLeftRadius: PANEL_TRANSITION_RADIUS, borderTopRightRadius: PANEL_TRANSITION_RADIUS, duration: heroPanelPushDuration, ease: 'none' },
        heroPanelExitStart,
      );
    }

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
      secondPanelKnowMore: elements.secondPanelKnowMore,
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

    // Refresh ScrollTrigger on the next tick so the dynamic end() re-evaluates
    // after all tweens (including the video tween) have been added.
    gsap.ticker.add(function refreshHero() {
      ScrollTrigger.refresh();
      gsap.ticker.remove(refreshHero);
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

  // Tracks a pending delayed-call that resets secondPanel after onLeaveBack.
  // Cancelled if the user re-enters the 2→3 zone before the delay fires.
  let secondPanelResetCall: gsap.core.Tween | null = null;

  // Extra scroll distance for third-panel content reveal (typewriter + cards).
  // Starts as a reasonable default; dynamically updated after tweens are added
  // so ScrollTrigger.end() can return the precise pixel count.
  let thirdPanelRevealScrollExtra = Math.round(window.innerHeight * 1.5);

  const secondTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: scrollSpacer,
      start: 'top top',
      end: () => `+=${Math.round(window.innerHeight + getPanelFakeScrollDistance(secondPanel, secondPanelInner) + thirdPanelRevealScrollExtra)}`,
      invalidateOnRefresh: true,
      scrub: 0.35,
      onEnter: () => {
        // Cancel any pending post-LeaveBack reset so it doesn't fire mid-transition.
        secondPanelResetCall?.kill();
        secondPanelResetCall = null;
        // Hide second panel know more when 2→3 push begins.
        secondPanelKnowMore?.classList.remove('is-visible');
        // Reset panels to their pre-transition state so the scrub timeline starts
        // from a clean slate. Do NOT touch backplate/shade here — their opacity
        // is driven entirely by the scrub timeline to avoid any jump-frame flash.
        // Do NOT reset borderRadius here — the scrub timeline sets it on thirdPanel
        // as it slides in; overriding here would kill the rounded-corner effect.
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
        // Re-entering the 2→3 zone from below (scrolling back up from 3rd screen).
        // Cancel any pending post-LeaveBack reset — scrub is now back in control.
        secondPanelResetCall?.kill();
        secondPanelResetCall = null;
        // Restore z-index and pointer-events so the scrub timeline can drive the panels.
        // Do NOT touch opacity/autoAlpha/scale/y — scrub owns those values entirely.
        // Forcing any visual property here causes a 1-frame pop before scrub catches up,
        // which is exactly the flash seen when scrolling back quickly from screen 3.
        gsap.set(thirdPanel, {
          visibility: 'visible',
          pointerEvents: 'none',
          zIndex: 38,
        });
        gsap.set(secondPanel, { visibility: 'visible', pointerEvents: 'auto', zIndex: 36 });
      },
      onLeave: () => {
        // Transition complete: thirdPanel is now the active screen.
        // Only update pointer-events and z-index — do NOT touch autoAlpha/opacity
        // on secondPanel or secondShade. The scrub timeline drives those values; forcing
        // them here causes a 1-frame flash when the user quickly scrolls back and
        // onEnterBack fires before scrub can re-apply its own values.
        gsap.set(thirdPanel, { pointerEvents: 'auto', zIndex: 36 });
        gsap.set(secondPanel, { pointerEvents: 'none', zIndex: 30 });
        // Third panel is now active — hide the know-more button.
        secondPanelKnowMore?.classList.remove('is-visible');
      },
      onLeaveBack: () => {
        // Scrolled back above the 2→3 zone: secondPanel is active, thirdPanel goes back below.
        // Restore second panel know more button.
        secondPanelKnowMore?.classList.add('is-visible');
        // thirdPanel is safe to reset immediately — it's the incoming panel (not driven by scrub
        // at this point, scrub was reversing it back to yPercent:100).
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
        // secondPanel is the outgoing panel being driven by scrub (scrub: 0.6 lag).
        // Immediately overriding scale/y here causes a 1-frame snap before scrub finishes
        // easing back to progress=0. Defer the full reset until scrub has settled.
        gsap.set(secondPanel, { pointerEvents: 'auto', zIndex: 36 });
        gsap.set(secondShade, { opacity: 0 });
        // After the scrub easing window (scrub: 0.6s + small buffer), hard-reset secondPanel
        // to its fully-visible resting state so it's clean for the next forward pass.
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

  // Third panel content reveal — 挂到 secondTimeline 上，push 完成后自动 scrub 出来
  const thirdPanelRevealStart = panelPushStart + panelPushDuration + 0.2;
  setupThirdPanelReveal({
    prefersReducedMotion: false,
    thirdPanel,
    timeline: secondTimeline,
    startAt: thirdPanelRevealStart,
  });

  // ── Dynamic scroll-runway calibration ─────────────────────────────────────
  // We want every 1 unit of timeline time to consume exactly 1 × window.innerHeight
  // pixels of scroll distance. This gives a consistent, predictable scrub speed:
  //   totalScrollPixels = totalDuration × vh
  //
  // The `end` callback already reads thirdPanelRevealScrollExtra from the closure,
  // so we update it here (before ScrollTrigger has finalised its geometry) and then
  // call ScrollTrigger.refresh() on the next tick so it re-evaluates end().
  {
    const vh = window.innerHeight;
    const totalDuration = secondTimeline.totalDuration();
    // Total pixels the ScrollTrigger range must span for the scrub to complete.
    const totalScrollPixels = Math.ceil(totalDuration * vh);
    // basePixels is what `end` already contributes without thirdPanelRevealScrollExtra.
    const basePixels = vh + getPanelFakeScrollDistance(secondPanel, secondPanelInner);
    // Extra pixels needed on top of basePixels (clamped to 0 minimum).
    thirdPanelRevealScrollExtra = Math.max(0, totalScrollPixels - basePixels);

    // scrollSpacer must be tall enough that the entire secondTimeline pixel range
    // [start … end] falls within the spacer's scroll extent.
    // start fires at 'top top', i.e. when spacer top reaches the viewport top.
    // We add a generous 100 vh buffer so the spacer never runs out before end.
    const neededSvh = Math.ceil((totalScrollPixels / vh) * 100) + 160;
    scrollSpacer.style.height = `${neededSvh}svh`;

    // Refresh on the next GSAP tick so ScrollTrigger picks up the new end() value
    // and the updated spacer height before it finalises scroll positions.
    gsap.ticker.add(function refresh() {
      ScrollTrigger.refresh();
      gsap.ticker.remove(refresh);
    });
  }

  // Know More button click — scrolls to bottom at a fixed, unhurried pace.
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
