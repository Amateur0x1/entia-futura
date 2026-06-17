import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

interface SetupThirdPanelRevealArgs {
  prefersReducedMotion: boolean;
  thirdPanel: HTMLElement | null;
  timeline: gsap.core.Timeline;
  startAt: number;
}

// ---------------------------------------------------------------------------
// Scatter → order: each character starts at a random position/rotation and
// animates back to its natural layout position.
// ---------------------------------------------------------------------------

/** Generate a random number in [-range, range]. */
const rand = (range: number) => (Math.random() - 0.5) * 2 * range;

export const setupThirdPanelReveal = ({
  prefersReducedMotion,
  thirdPanel,
  timeline,
  startAt,
}: SetupThirdPanelRevealArgs) => {
  if (!(thirdPanel instanceof HTMLElement)) return;

  gsap.registerPlugin(SplitText);

  const intro   = thirdPanel.querySelector<HTMLElement>('[data-tp-intro]');
  const divider = thirdPanel.querySelector<HTMLElement>('[data-tp-divider]');

  if (!intro) return;

  if (prefersReducedMotion) {
    gsap.set([intro, divider], { autoAlpha: 1, y: 0, scaleX: 1 });
    return;
  }

  // ── Split intro into individual characters for scatter effect ──
  const split = SplitText.create(intro, {
    type: 'chars',
  });
  const introChars = split.chars;

  // ── Initial hidden state: scattered ──
  introChars.forEach((char: Element) => {
    gsap.set(char, {
      x: rand(120),
      y: rand(80),
      rotation: rand(45),
      scale: 0.3 + Math.random() * 0.3,
      opacity: 0,
    });
  });
  gsap.set(intro, { autoAlpha: 1 });
  if (divider) gsap.set(divider, { autoAlpha: 0, scaleX: 0, transformOrigin: 'left center' });

  // ── Scrub-driven reveal (part of the timeline) ──
  // Divider
  if (divider) {
    timeline.to(
      divider,
      { autoAlpha: 1, scaleX: 1, duration: 0.5, ease: 'power2.out' },
      startAt,
    );
  }

  // Characters scatter → order
  timeline.to(
    introChars,
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
    startAt + 0.2,
  );

};
