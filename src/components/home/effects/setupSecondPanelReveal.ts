import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

interface SetupSecondPanelRevealArgs {
  prefersReducedMotion: boolean;
  splitTextAvailable: boolean;
  secondPanel: Element | null;
  secondPanelLabel: Element | null | undefined;
  secondPanelHeading: Element | null | undefined;
  secondPanelDivider: Element | null | undefined;
  secondPanelBody: Element | null | undefined;
  secondPanelParagraphs: HTMLElement[];
  timeline?: gsap.core.Timeline;
  startAt?: number;
}

// ---------------------------------------------------------------------------
// Scatter → order: each character starts at a random position/rotation and
// animates back to its natural layout position.
// ---------------------------------------------------------------------------

/** Generate a random number in [-range, range]. */
const rand = (range: number) => (Math.random() - 0.5) * 2 * range;

export const setupSecondPanelReveal = ({
  prefersReducedMotion,
  secondPanel,
  secondPanelLabel,
  secondPanelHeading,
  secondPanelDivider,
  secondPanelBody,
  secondPanelParagraphs,
  timeline,
  startAt = 0,
}: SetupSecondPanelRevealArgs) => {
  gsap.registerPlugin(SplitText);

  if (
    prefersReducedMotion ||
    !(secondPanel instanceof HTMLElement) ||
    !(secondPanelHeading instanceof HTMLElement) ||
    !(secondPanelDivider instanceof HTMLElement) ||
    !(secondPanelBody instanceof HTMLElement)
  ) {
    return;
  }

  // Hide only divider and body until reveal; label and heading stay visible.
  gsap.set(secondPanelBody, { autoAlpha: 1 });
  gsap.set(secondPanelDivider, { autoAlpha: 0, scaleX: 0, transformOrigin: 'left center' });

  // Split each paragraph into individual characters for the scatter effect.
  const allChars: Element[] = [];
  secondPanelParagraphs.forEach((p) => {
    const split = SplitText.create(p, {
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
        trigger: secondPanel,
        start: 'top 72%',
        once: true,
      },
    });

  // Divider reveal
  tl.to(
    secondPanelDivider,
    { autoAlpha: 1, scaleX: 1, duration: 0.5, ease: 'power2.out' },
    startAt,
  );

  // Characters scatter → order reveal (scrub-driven, part of the timeline).
  // Each char animates from its random position back to natural layout.
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
