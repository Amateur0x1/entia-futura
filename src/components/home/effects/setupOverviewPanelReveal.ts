import gsap from 'gsap';

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
 *   1. The thin divider scales in from the center.
 *   2. The body paragraphs fade-and-lift in, staggered one after another.
 *
 * Mirrors setupSecondPanelReveal's pattern but tailored to the centered
 * overview layout (no typewriter — a calmer fade/lift reads better here).
 */
export const setupOverviewPanelReveal = ({
  prefersReducedMotion,
  overviewPanel,
  overviewDivider,
  overviewLines,
  timeline,
  startAt = 0,
}: SetupOverviewPanelRevealArgs) => {
  if (!(overviewPanel instanceof HTMLElement)) {
    return;
  }

  // Reduced-motion: show everything immediately, no animation.
  if (prefersReducedMotion) {
    if (overviewDivider) gsap.set(overviewDivider, { scaleX: 1, autoAlpha: 1 });
    if (overviewLines.length > 0) gsap.set(overviewLines, { autoAlpha: 1, y: 0 });
    return;
  }

  // Initial hidden states.
  if (overviewDivider) {
    gsap.set(overviewDivider, { scaleX: 0, transformOrigin: 'center center', autoAlpha: 1 });
  }
  if (overviewLines.length > 0) {
    gsap.set(overviewLines, { autoAlpha: 0, y: 16 });
  }

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

  // Lines fade-and-lift in, staggered.
  if (overviewLines.length > 0) {
    tl.to(
      overviewLines,
      { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.24 },
      startAt + 0.18,
    );
  }
};
