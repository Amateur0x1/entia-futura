import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

interface SetupOverviewPanelRevealArgs {
  prefersReducedMotion: boolean;
  overviewPanel: HTMLElement | null;
  overviewDivider: HTMLElement | null;
  overviewLines: HTMLElement[];
  timeline?: gsap.core.Timeline;
  startAt?: number;
}

/**
 * Reveals the standalone Institute Overview panel:
 *   1. The thin divider scales in from the left.
 *   2. Each paragraph is split into lines and revealed with a masked
 *      slide-up (yPercent: 100 → 0) — scrub-driven, same as second panel.
 */
export const setupOverviewPanelReveal = ({
  prefersReducedMotion,
  overviewPanel,
  overviewDivider,
  overviewLines,
  timeline,
  startAt = 0,
}: SetupOverviewPanelRevealArgs) => {
  gsap.registerPlugin(SplitText);

  if (!(overviewPanel instanceof HTMLElement)) {
    return;
  }

  // Reduced-motion: show everything immediately, no animation.
  if (prefersReducedMotion) {
    if (overviewDivider) gsap.set(overviewDivider, { scaleX: 1, autoAlpha: 1 });
    if (overviewLines.length > 0) gsap.set(overviewLines, { autoAlpha: 1 });
    return;
  }

  // Initial hidden states.
  if (overviewDivider) {
    gsap.set(overviewDivider, { scaleX: 0, transformOrigin: 'left center', autoAlpha: 1 });
  }
  if (overviewLines.length > 0) {
    gsap.set(overviewLines, { autoAlpha: 1 });
  }

  // Split each paragraph into lines with mask (clip) for the slide-up reveal.
  const allSplitLines: Element[] = [];
  overviewLines.forEach((el) => {
    const split = SplitText.create(el, {
      type: 'lines',
      linesClass: 'split-line',
      mask: 'lines',
    });
    allSplitLines.push(...split.lines);
  });

  // Set initial state: lines hidden below their mask.
  gsap.set(allSplitLines, { yPercent: 100, opacity: 0 });

  const tl =
    timeline ??
    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: overviewPanel,
        start: 'top 72%',
        once: true,
      },
    });

  // Divider reveal.
  if (overviewDivider) {
    tl.to(
      overviewDivider,
      { scaleX: 1, duration: 0.5, ease: 'power2.out' },
      startAt,
    );
  }

  // Lines slide-up reveal (scrub-driven, part of the timeline).
  tl.to(
    allSplitLines,
    {
      yPercent: 0,
      opacity: 1,
      duration: 0.6,
      ease: 'expo.out',
      stagger: 0.1,
    },
    startAt + 0.2,
  );
};
