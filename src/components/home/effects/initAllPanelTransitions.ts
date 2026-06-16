import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

import { addHeroMediaDriftSegment } from './addHeroMediaDriftSegment';
import type { HomeHeroElements } from './getHomeHeroElements';
import { addHeroVideoTransitionSegment } from './heroVideoEffects';
import {
  PANEL_TRANSITION_RADIUS,
  addPanelPushTransitionSegment,
  createTransitionShade,
  getPanelFakeScrollDistance,
} from './panelPushTransition';
import { setupOverviewPanelReveal } from './setupOverviewPanelReveal';
import { setupSecondPanelReveal } from './setupSecondPanelReveal';
import { setupThirdPanelReveal } from './setupThirdPanelReveal';

// ---------------------------------------------------------------------------
// Timing constants (desktop scroll distance for the 1→2 transition)
// ---------------------------------------------------------------------------
export const HERO_TO_INTRO_TIMING = {
  videoPlaybackStart: 0,
  videoPlaybackDuration: 4.1,
  // After scroll-video ends, loop-video holds for this many timeline units
  // before the panel-push begins. During this window the bottom-centered
  // slogan reveals per-char, holds, then fades. The Institute Overview is now
  // a standalone panel (HomeOverviewPanel), so only the slogan plays here.
  // Lower value = shorter scroll distance for the slogan act.
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
  overviewScrollSpacer: HTMLElement | null;
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
  overviewScrollSpacer,
  thirdPanel,
  scrollSpacer,
  fourthPanel,
  fourthScrollSpacer,
}: Pick<
  InitAllPanelTransitionsOptions,
  | 'elements'
  | 'overviewScrollSpacer'
  | 'thirdPanel'
  | 'scrollSpacer'
  | 'fourthPanel'
  | 'fourthScrollSpacer'
>) => {
  const { heroTransitionRoot, overviewPanel, secondPanel } = elements;
  if (!heroTransitionRoot || !secondPanel) return;

  // Reduced-motion: show the slogan immediately (no animation).
  const sloganStageRM = heroTransitionRoot.querySelector<HTMLElement>('[data-hero-slogan]');
  const sloganQuoteRM = heroTransitionRoot.querySelector<HTMLElement>('[data-overview-quote]');

  if (sloganStageRM) {
    gsap.set(sloganStageRM, { opacity: 1 });
    if (sloganQuoteRM) gsap.set(sloganQuoteRM, { opacity: 1 });
  }

  // Reduced-motion: reveal the overview panel content immediately (no animation).
  if (overviewPanel) {
    setupOverviewPanelReveal({
      prefersReducedMotion: true,
      overviewPanel,
      overviewDivider: elements.overviewPanelDivider,
      overviewLines: elements.overviewPanelLines,
    });
  }

  // 1→2: fade in the overview panel when hero scrolls out. If the overview
  // panel is missing, fall back to fading in the second panel directly.
  const firstIncomingRM = overviewPanel ?? secondPanel;
  gsap.timeline({
    scrollTrigger: {
      trigger: heroTransitionRoot,
      start: 'top -80%',
      end: 'top -95%',
      toggleActions: 'play none reverse reverse',
    },
  })
    .fromTo(
      firstIncomingRM,
      { autoAlpha: 0, y: 22, filter: 'blur(8px)', pointerEvents: 'none' },
      { autoAlpha: 1, y: 0, filter: 'blur(0px)', visibility: 'visible', pointerEvents: 'auto', duration: 0.42, ease: 'power3.out' },
    );

  // overview→2: swap overview panel for the second panel.
  if (overviewPanel && overviewScrollSpacer) {
    gsap.timeline({
      scrollTrigger: {
        trigger: overviewScrollSpacer,
        start: 'top -56%',
        end: 'top -92%',
        toggleActions: 'play none reverse reverse',
      },
    })
      .to(overviewPanel, { autoAlpha: 0, visibility: 'hidden', pointerEvents: 'none', duration: 0.01, ease: 'none' })
      .fromTo(
        secondPanel,
        { autoAlpha: 0, y: 22, filter: 'blur(8px)', pointerEvents: 'none' },
        { autoAlpha: 1, y: 0, filter: 'blur(0px)', visibility: 'visible', pointerEvents: 'auto', duration: 0.42, ease: 'power3.out' },
        0,
      );
  }

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

  // Reduced-motion: show third panel content immediately — no animation.
  setupThirdPanelReveal({
    prefersReducedMotion: true,
    thirdPanel,
    timeline: gsap.timeline(),
    startAt: 0,
  });

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
  overviewScrollSpacer,
  thirdPanel,
  scrollSpacer,
  fourthPanel,
  fourthScrollSpacer,
  splitTextAvailable,
}: Omit<InitAllPanelTransitionsOptions, 'prefersReducedMotion'>) => {
  const {
    heroTransitionFrame,
    heroTransitionRoot,
    heroVideoShell,
    overviewPanel,
    overviewPanelInner,
    secondPanel,
    secondPanelInner,
    scrollVideo,
  } = elements;

  if (!heroTransitionRoot || !secondPanel) return;

  // The overview panel sits between hero and second panel. If it (or its
  // driving spacer) is missing, the hero pushes straight to the second panel.
  const heroIncomingPanel = overviewPanel ?? secondPanel;
  const hasOverviewStage = Boolean(overviewPanel && overviewScrollSpacer);

  // ── shared layers ──────────────────────────────────────────────────────────
  const heroShade = createTransitionShade('data-hero-panel-transition-shade', heroTransitionRoot);
  const overviewShade = overviewPanel
    ? createTransitionShade('data-overview-panel-transition-shade', overviewPanel)
    : null;
  const secondShade = createTransitionShade('data-second-panel-transition-shade', secondPanel);
  const thirdShade = createTransitionShade('data-third-panel-transition-shade', thirdPanel);

  gsap.set([heroShade, overviewShade, secondShade, thirdShade].filter(Boolean), { opacity: 0 });

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

  // Set panel 4 and the overview panel to their initial hidden-below state
  for (const p of [overviewPanel, fourthPanel]) {
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

  if (overviewPanelInner) {
    gsap.set(overviewPanelInner, { y: 0, willChange: 'transform' });
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

    // videoPlaybackEnd is the point at which the scroll-video finishes.
    // After that we hold on the loop-video for loopVideoHoldDuration units
    // while showing the Institute Overview overlay.
    // The panel-push starts at heroPanelExitStart (after the hold).
    const videoPlaybackEnd =
      HERO_TO_INTRO_TIMING.videoPlaybackStart +
      HERO_TO_INTRO_TIMING.videoPlaybackDuration;

    const loopHoldStart = videoPlaybackEnd + HERO_TO_INTRO_TIMING.panelRevealDelayAfterVideoEnd;
    const loopHoldEnd = loopHoldStart + HERO_TO_INTRO_TIMING.loopVideoHoldDuration;

    const heroPanelExitStart = loopHoldEnd;
    const heroPanelPushDuration = 1.6;

    // ── Single-act reveal during loop-video hold: the slogan ──────────────
    //   The bottom-centered slogan reveals per-char, then stays visible until
    //   the incoming panel push naturally covers it.
    const sloganStage = heroTransitionRoot.querySelector<HTMLElement>('[data-hero-slogan]');
    const sloganQuote = heroTransitionRoot.querySelector<HTMLElement>('[data-overview-quote]');

    const sloganRevealAt = loopHoldStart;

    if (sloganStage) {
      // Signal cards fade out early so they don't overlap the slogan.
      const signalCardsFadeOutAt = loopHoldStart - 0.3;
      heroTimeline.to(
        elements.signalCards,
        { autoAlpha: 0, y: -38, duration: 0.28, stagger: 0.02 },
        signalCardsFadeOutAt,
      );
    } else {
      // Fallback: no slogan present — just clear the signal cards before the push.
      heroTimeline.to(
        elements.signalCards,
        { autoAlpha: 0, y: -58, duration: 0.32, stagger: 0.02 },
        heroPanelExitStart,
      );
    }

    // ── Slogan reveal (ScrambleText decryption effect) ─────────────────────
    // The scramble animation is TIME-BASED (not scrub-driven). We use an
    // onStart callback on a tiny scrub placeholder to fire an independent
    // gsap.to() that auto-plays regardless of further scroll activity.
    if (sloganStage) {
      gsap.registerPlugin(ScrambleTextPlugin);

      const sloganText = sloganQuote?.querySelector<HTMLElement>('.hero-slogan__text');
      const originalText = sloganText?.textContent ?? '';

      if (sloganQuote) {
        gsap.set(sloganQuote, { opacity: 1 });
      }
      // Clear the text — ScrambleText will type it in from empty.
      if (sloganText) {
        sloganText.textContent = '';
      }

      // Fade the slogan stage in (still scrub-driven — quick opacity reveal).
      heroTimeline.to(sloganStage, { opacity: 1, duration: 0.4, ease: 'power2.out' }, sloganRevealAt);

      // Fire the time-based scramble each time the scrub enters this point.
      // On reverse (scroll back up past the trigger), clear the text so the
      // next forward pass replays the animation from scratch.
      let scrambleTween: gsap.core.Tween | null = null;
      if (sloganText && originalText) {
        heroTimeline.to(
          sloganText,
          {
            // A zero-visual-change placeholder so we can hook onStart/onReverseComplete.
            duration: 0.01,
            opacity: 1,
            onStart: () => {
              // Kill any in-flight scramble and replay from empty.
              if (scrambleTween) scrambleTween.kill();
              sloganText.textContent = '';
              scrambleTween = gsap.to(sloganText, {
                duration: 1,
                scrambleText: {
                  text: originalText,
                  chars: 'upperAndLowerCase',
                  revealDelay: 0.2,
                  tweenLength: false,
                },
                ease: 'power2.inOut',
                overwrite: 'auto',
              });
            },
            onReverseComplete: () => {
              // Scrolled back before this point — reset text so next entry replays.
              if (scrambleTween) {
                scrambleTween.kill();
                scrambleTween = null;
              }
              sloganText.textContent = '';
            },
          },
          sloganRevealAt + 0.12,
        );
      }

    }

    // Hero pushes up to the standalone overview panel (or directly to the
    // second panel if the overview panel is absent).
    addPanelPushTransitionSegment({
      duration: heroPanelPushDuration,
      incomingPanel: heroIncomingPanel,
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

    // Reveal the overview panel content (divider + lines) right after the push.
    if (overviewPanel) {
      setupOverviewPanelReveal({
        prefersReducedMotion: false,
        overviewPanel,
        overviewDivider: elements.overviewPanelDivider,
        overviewLines: elements.overviewPanelLines,
        timeline: heroTimeline,
        startAt: heroPanelExitStart + heroPanelPushDuration + 0.16,
      });
    } else {
      // No overview panel — reveal the second panel directly (legacy fallback).
      setupSecondPanelReveal({
        prefersReducedMotion: false,
        splitTextAvailable,
        secondPanel,
        secondPanelLabel: elements.secondPanelLabel,
        secondPanelHeading: elements.secondPanelHeading,
        secondPanelDivider: elements.secondPanelDivider,
        secondPanelBody: elements.secondPanelBody,
        secondPanelParagraphs: elements.secondPanelParagraphs,
        secondPanelCards: elements.secondPanelCards,
        timeline: heroTimeline,
        startAt: heroPanelExitStart + heroPanelPushDuration + 0.16,
      });
    }

    // Video scrub: scroll-video plays until videoPlaybackEnd (NOT heroPanelExitStart).
    // The loop-video cross-fade already happens inside addHeroVideoTransitionSegment
    // near the end of the video slot. After videoPlaybackEnd the loop-video is
    // fully visible and loops freely during the loopVideoHoldDuration window.
    addHeroVideoTransitionSegment({
      elements,
      heroTimeline,
      videoPlaybackEnd,
    });

    gsap.ticker.add(function refreshHero() {
      ScrollTrigger.refresh();
      gsap.ticker.remove(refreshHero);
    });
  };

  // If error already fired before this code runs, scrollVideo.readyState stays 0
  // but the 'error' event will never fire again — detect via scrollVideo.error.
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

  // ── overview→2 scrub timeline ─────────────────────────────────────────────
  // A genuinely separate screen sitting between the hero and the second panel.
  // Mirrors the 2→3 secondTimeline exactly: optional inner scroll on the
  // overview panel, then a panel-push that shrinks the overview away and lifts
  // the second panel in, followed by the second panel's content reveal.
  if (hasOverviewStage && overviewPanel && overviewScrollSpacer) {
    const overviewFakeScrollDistance = overviewPanelInner
      ? getPanelFakeScrollDistance(overviewPanel, overviewPanelInner)
      : 0;
    const overviewFakeScrollDuration =
      overviewFakeScrollDistance > 1
        ? Math.min(Math.max(overviewFakeScrollDistance / window.innerHeight, 0.45), 1.55)
        : 0;
    const overviewPushStart = overviewFakeScrollDuration;
    const overviewPushDuration = 1.6;

    let overviewPanelResetCall: gsap.core.Tween | null = null;
    let secondPanelRevealScrollExtra = Math.round(window.innerHeight * 1.5);

    const overviewTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: overviewScrollSpacer,
        start: 'top top',
        end: () =>
          `+=${Math.round(
            window.innerHeight +
              (overviewPanelInner ? getPanelFakeScrollDistance(overviewPanel, overviewPanelInner) : 0) +
              secondPanelRevealScrollExtra,
          )}`,
        invalidateOnRefresh: true,
        scrub: 0.35,
        onEnter: () => {
          overviewPanelResetCall?.kill();
          overviewPanelResetCall = null;
          gsap.set(secondPanel, {
            opacity: 0,
            visibility: 'visible',
            pointerEvents: 'none',
            yPercent: 100,
            y: 0,
            scale: 1,
            zIndex: 38,
          });
          gsap.set(overviewPanel, { autoAlpha: 1, visibility: 'visible', pointerEvents: 'auto', zIndex: 36 });
        },
        onEnterBack: () => {
          overviewPanelResetCall?.kill();
          overviewPanelResetCall = null;
          gsap.set(secondPanel, {
            visibility: 'visible',
            pointerEvents: 'none',
            zIndex: 38,
          });
          gsap.set(overviewPanel, { visibility: 'visible', pointerEvents: 'auto', zIndex: 36 });
        },
        onLeave: () => {
          gsap.set(secondPanel, { pointerEvents: 'auto', zIndex: 36 });
          gsap.set(overviewPanel, { pointerEvents: 'none', zIndex: 30 });
        },
        onLeaveBack: () => {
          gsap.set(secondPanel, {
            opacity: 0,
            visibility: 'visible',
            pointerEvents: 'none',
            yPercent: 100,
            y: 0,
            zIndex: 30,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          });
          gsap.set(overviewPanel, { pointerEvents: 'auto', zIndex: 36 });
          if (overviewShade) gsap.set(overviewShade, { opacity: 0 });
          overviewPanelResetCall = gsap.delayedCall(0.75, () => {
            gsap.set(overviewPanel, {
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
            if (overviewShade) gsap.set(overviewShade, { opacity: 0 });
          });
        },
      },
    });

    if (overviewFakeScrollDistance > 1 && overviewPanelInner) {
      overviewTimeline.to(
        overviewPanelInner,
        {
          y: () => -getPanelFakeScrollDistance(overviewPanel, overviewPanelInner),
          duration: overviewFakeScrollDuration,
          ease: 'none',
        },
        0,
      );
    }

    addPanelPushTransitionSegment({
      duration: overviewPushDuration,
      incomingPanel: secondPanel,
      liftDistance: () => 0,
      outgoingPanel: overviewPanel,
      outgoingScale: 0.72,
      shade: overviewShade,
      shadeOpacity: 0.58,
      startAt: overviewPushStart,
      timeline: overviewTimeline,
    });

    // Reveal the second panel content right after the push completes.
    const secondPanelRevealStart = overviewPushStart + overviewPushDuration + 0.2;
    setupSecondPanelReveal({
      prefersReducedMotion: false,
      splitTextAvailable,
      secondPanel,
      secondPanelLabel: elements.secondPanelLabel,
      secondPanelHeading: elements.secondPanelHeading,
      secondPanelDivider: elements.secondPanelDivider,
      secondPanelBody: elements.secondPanelBody,
      secondPanelParagraphs: elements.secondPanelParagraphs,
      secondPanelCards: elements.secondPanelCards,
      timeline: overviewTimeline,
      startAt: secondPanelRevealStart,
    });

    // Calibrate the driving spacer height — same pattern as 2→3.
    {
      const vh = window.innerHeight;
      const totalDuration = overviewTimeline.totalDuration();
      const totalScrollPixels = Math.ceil(totalDuration * vh);
      const basePixels =
        vh + (overviewPanelInner ? getPanelFakeScrollDistance(overviewPanel, overviewPanelInner) : 0);
      secondPanelRevealScrollExtra = Math.max(0, totalScrollPixels - basePixels);

      const neededSvh = Math.ceil((totalScrollPixels / vh) * 100) + 160;
      overviewScrollSpacer.style.height = `${neededSvh}svh`;

      gsap.ticker.add(function refreshOverview() {
        ScrollTrigger.refresh();
        gsap.ticker.remove(refreshOverview);
      });
    }
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
      },
      onLeaveBack: () => {
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

  // ── 3→4 scrub timeline ────────────────────────────────────────────────────
  // Mirrors the 2→3 secondTimeline exactly: same scrub, same push segment,
  // same spacer calibration pattern.
  if (fourthPanel && fourthScrollSpacer) {
    const thirdPanelInner = thirdPanel.querySelector<HTMLElement>('.landing-third-panel__inner');
    const thirdFakeScrollDistance = getPanelFakeScrollDistance(thirdPanel, thirdPanelInner);
    const thirdFakeScrollDuration =
      thirdFakeScrollDistance > 1 ? Math.min(Math.max(thirdFakeScrollDistance / window.innerHeight, 0.45), 1.55) : 0;
    const fourthPanelPushDuration = 1.6;
    const fourthPanelPushStart = thirdFakeScrollDuration;

    let fourthPanelResetCall: gsap.core.Tween | null = null;

    const fourthTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: fourthScrollSpacer,
        start: 'top top',
        end: () => `+=${Math.round(window.innerHeight + getPanelFakeScrollDistance(thirdPanel, thirdPanelInner) + Math.round(window.innerHeight * 0.5))}`,
        invalidateOnRefresh: true,
        scrub: 0.35,
        onEnter: () => {
          fourthPanelResetCall?.kill();
          fourthPanelResetCall = null;
          gsap.set(fourthPanel, {
            opacity: 0,
            visibility: 'visible',
            pointerEvents: 'none',
            yPercent: 100,
            y: 0,
            scale: 1,
            zIndex: 38,
          });
          gsap.set(thirdPanel, { autoAlpha: 1, visibility: 'visible', pointerEvents: 'auto', zIndex: 36 });
        },
        onEnterBack: () => {
          fourthPanelResetCall?.kill();
          fourthPanelResetCall = null;
          gsap.set(fourthPanel, {
            visibility: 'visible',
            pointerEvents: 'none',
            zIndex: 38,
          });
          gsap.set(thirdPanel, { visibility: 'visible', pointerEvents: 'auto', zIndex: 36 });
        },
        onLeave: () => {
          gsap.set(fourthPanel, { pointerEvents: 'auto', zIndex: 36 });
          gsap.set(thirdPanel, { pointerEvents: 'none', zIndex: 30 });
        },
        onLeaveBack: () => {
          gsap.set(fourthPanel, {
            opacity: 0,
            visibility: 'visible',
            pointerEvents: 'none',
            yPercent: 100,
            y: 0,
            zIndex: 30,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          });
          gsap.set(thirdPanel, { pointerEvents: 'auto', zIndex: 36 });
          gsap.set(thirdShade, { opacity: 0 });
          fourthPanelResetCall = gsap.delayedCall(0.75, () => {
            gsap.set(thirdPanel, {
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
            gsap.set(thirdShade, { opacity: 0 });
          });
        },
      },
    });

    // Fake scroll: slide third panel content up before the push.
    if (thirdFakeScrollDistance > 1 && thirdPanelInner) {
      gsap.set(thirdPanelInner, { y: 0, willChange: 'transform' });
      fourthTimeline.to(
        thirdPanelInner,
        { y: () => -getPanelFakeScrollDistance(thirdPanel, thirdPanelInner), duration: thirdFakeScrollDuration, ease: 'none' },
        0,
      );
    }

    addPanelPushTransitionSegment({
      duration: fourthPanelPushDuration,
      incomingPanel: fourthPanel,
      liftDistance: () => 0,
      outgoingPanel: thirdPanel,
      outgoingScale: 0.72,
      shade: thirdShade,
      shadeOpacity: 0.58,
      startAt: fourthPanelPushStart,
      timeline: fourthTimeline,
    });

    // Calibrate spacer height — same pattern as 2→3
    {
      const vh = window.innerHeight;
      const totalScrollPixels = Math.ceil(fourthTimeline.totalDuration() * vh);
      const neededSvh = Math.ceil((totalScrollPixels / vh) * 100) + 160;
      fourthScrollSpacer.style.height = `${neededSvh}svh`;

      gsap.ticker.add(function refreshFourth() {
        ScrollTrigger.refresh();
        gsap.ticker.remove(refreshFourth);
      });
    }
  }

};

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------
export const initAllPanelTransitions = ({
  elements,
  overviewScrollSpacer,
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
      overviewScrollSpacer,
      thirdPanel,
      scrollSpacer,
      fourthPanel,
      fourthScrollSpacer,
    });
    return;
  }

  initFullTransitions({
    elements,
    overviewScrollSpacer,
    thirdPanel,
    scrollSpacer,
    fourthPanel,
    fourthScrollSpacer,
    splitTextAvailable,
  });
};
