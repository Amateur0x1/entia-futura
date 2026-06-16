import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';

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
 *   2. The body paragraphs are typed out one-by-one (typewriter effect),
 *      mirroring the second panel's reveal style.
 */
export const setupOverviewPanelReveal = ({
  prefersReducedMotion,
  overviewPanel,
  overviewDivider,
  overviewLines,
  timeline,
  startAt = 0,
}: SetupOverviewPanelRevealArgs) => {
  gsap.registerPlugin(TextPlugin);

  if (!(overviewPanel instanceof HTMLElement)) {
    return;
  }

  // Reduced-motion: show everything immediately, no animation.
  if (prefersReducedMotion) {
    if (overviewDivider) gsap.set(overviewDivider, { scaleX: 1, autoAlpha: 1 });
    if (overviewLines.length > 0) gsap.set(overviewLines, { autoAlpha: 1 });
    return;
  }

  // Store original text, then clear for typewriter.
  const lineTexts = overviewLines.map((el) => el.textContent ?? '');
  overviewLines.forEach((el) => { el.textContent = ''; });

  // Initial hidden states.
  if (overviewDivider) {
    gsap.set(overviewDivider, { scaleX: 0, transformOrigin: 'left center', autoAlpha: 1 });
  }
  if (overviewLines.length > 0) {
    gsap.set(overviewLines, { autoAlpha: 1 });
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

  // Typewriter reveal — each line typed out sequentially.
  let offset = startAt + 0.2;
  overviewLines.forEach((el, i) => {
    const text = lineTexts[i] ?? '';
    if (!text) return;
    const duration = text.length * 0.018;
    tl.to(
      el,
      {
        duration,
        text: { value: text, delimiter: '' },
        ease: 'none',
      },
      offset,
    );
    offset += duration + 0.12;
  });
};
