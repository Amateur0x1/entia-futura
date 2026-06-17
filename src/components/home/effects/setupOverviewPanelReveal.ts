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

// ---------------------------------------------------------------------------
// Scatter → order: each character starts at a random position/rotation and
// animates back to its natural layout position.
// ---------------------------------------------------------------------------

/** Generate a random number in [-range, range]. */
const rand = (range: number) => (Math.random() - 0.5) * 2 * range;

/**
 * Reveals the standalone Institute Overview panel:
 *   1. The thin divider scales in from the left.
 *   2. Each paragraph is split into individual characters that start
 *      scattered and animate back to their natural positions.
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

  // Split each paragraph into individual characters for the scatter effect.
  const allChars: Element[] = [];
  overviewLines.forEach((el) => {
    const split = SplitText.create(el, {
      type: 'chars',
    });
    allChars.push(...split.chars);
  });

  // Set initial state: each char at a random scattered position.
  allChars.forEach((char) => {
    gsap.set(char, {
      x: rand(120),
      y: rand(80),
      rotation: rand(45),
      scale: 0.3 + Math.random() * 0.3,
      opacity: 0,
    });
  });

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

  // Characters scatter → order reveal (scrub-driven, part of the timeline).
  tl.to(
    allChars,
    {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      opacity: 1,
      duration: 0.3,
      ease: 'power3.out',
      stagger: {
        each: 0.002,
        from: 'start',
      },
    },
    startAt + 0.15,
  );
};
